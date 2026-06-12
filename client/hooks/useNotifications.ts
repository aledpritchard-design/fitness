import { useEffect, useRef, useState, useCallback } from "react";
import { AppState, AppStateStatus, Linking, Platform } from "react-native";
import * as Notifications from "expo-notifications";
import { getTodayDateString } from "@/lib/storage";
import {
  requestNotificationPermissions,
  getNotificationPermissionStatus,
  setupReminderCategory,
  scheduleSnoozeNotification,
  SNOOZE_ACTION_ID,
} from "@/lib/notifications";

type PermissionStatus = "granted" | "denied" | "undetermined";

interface UseNotificationsOptions {
  /**
   * Called when the app comes to the foreground on a new calendar day.
   * The caller should reload and regenerate the daily plan.
   */
  onNewDay: () => void;
}

interface UseNotificationsResult {
  /** Latest known OS notification permission status (null until first checked). */
  permissionStatus: PermissionStatus | null;
  /**
   * Opens the OS Settings screen for this app, so a user who previously denied
   * notifications can switch them back on. No-op on web.
   */
  openSettings: () => void;
}

/**
 * Manages notification permissions and detects day rollovers.
 *
 * Requests permission on mount. On each foreground resume, checks whether the
 * date has changed and calls onNewDay() if so — triggering a plan regeneration
 * in the calling screen with minimal coupling.
 *
 * Exposes the current permission status and an openSettings() action so the UI
 * can offer a re-enable path when permission is denied: on iOS the system never
 * re-prompts after a denial, so the only route back is the OS Settings screen.
 */
export function useNotifications({
  onNewDay,
}: UseNotificationsOptions): UseNotificationsResult {
  const lastKnownDate = useRef(getTodayDateString());
  const appState = useRef<AppStateStatus>(AppState.currentState);
  const [permissionStatus, setPermissionStatus] =
    useState<PermissionStatus | null>(null);

  const openSettings = useCallback(() => {
    if (Platform.OS === "web") return;
    Linking.openURL("app-settings:").catch(() => {
      // Best-effort: if Settings can't be opened the app stays fully usable.
    });
  }, []);

  useEffect(() => {
    let cancelled = false;

    const syncStatus = async () => {
      const status = await getNotificationPermissionStatus();
      if (!cancelled) setPermissionStatus(status);
    };

    // Request permission and set up the reminder category once on mount.
    // Also process any snooze action that fired while the app was killed:
    // iOS launches the app in the background to handle the action; we pick up
    // the response via getLastNotificationResponseAsync() before the listener
    // is active. A freshness check (< 2 min) prevents re-processing stale
    // responses when the user re-opens the app normally later.
    const init = async () => {
      if (AppState.currentState === "active") {
        await requestNotificationPermissions().catch(() => {
          // Permission denied — app stays fully usable without notifications.
        });
      }
      await syncStatus();
      await setupReminderCategory();

      if (Platform.OS !== "web") {
        const pending = await Notifications.getLastNotificationResponseAsync();
        const isSnooze = pending?.actionIdentifier === SNOOZE_ACTION_ID;
        const isFresh =
          pending &&
          Date.now() - pending.notification.date * 1000 < 2 * 60 * 1000;
        if (isSnooze && isFresh) {
          await scheduleSnoozeNotification(pending.notification);
        }
      }
    };
    init();

    const subscription = AppState.addEventListener(
      "change",
      async (nextState) => {
        if (appState.current !== "active" && nextState === "active") {
          const today = getTodayDateString();
          if (today !== lastKnownDate.current) {
            lastKnownDate.current = today;
            onNewDay();
          }

          // Re-request only while still undetermined; once denied, iOS will not
          // show the dialog again — the re-enable path is openSettings().
          const status = await getNotificationPermissionStatus();
          if (status === "undetermined") {
            await requestNotificationPermissions().catch(() => {});
          }
          // Refresh exposed status — also picks up a re-enable made in Settings.
          await syncStatus();
        }
        appState.current = nextState;
      },
    );

    // Foreground and background snooze action handler.
    // Fires when the user taps "Snooze 15 min" while the app is visible or
    // backgrounded. The killed-state path is handled above via
    // getLastNotificationResponseAsync().
    const responseSubscription =
      Platform.OS !== "web"
        ? Notifications.addNotificationResponseReceivedListener(
            async (response) => {
              if (response.actionIdentifier === SNOOZE_ACTION_ID) {
                await scheduleSnoozeNotification(response.notification);
              }
            },
          )
        : null;

    return () => {
      cancelled = true;
      subscription.remove();
      responseSubscription?.remove();
    };
  }, [onNewDay]);

  return { permissionStatus, openSettings };
}
