import { useEffect, useRef } from "react";
import { AppState, AppStateStatus } from "react-native";
import { getTodayDateString } from "@/lib/storage";
import {
  requestNotificationPermissions,
  getNotificationPermissionStatus,
} from "@/lib/notifications";

interface UseNotificationsOptions {
  /**
   * Called when the app comes to the foreground on a new calendar day.
   * The caller should reload and regenerate the daily plan.
   */
  onNewDay: () => void;
}

/**
 * Manages notification permissions and detects day rollovers.
 *
 * Requests permission on mount. On each foreground resume, checks whether
 * the date has changed and calls onNewDay() if so — triggering a plan
 * regeneration in the calling screen with minimal coupling.
 */
export function useNotifications({ onNewDay }: UseNotificationsOptions): void {
  const lastKnownDate = useRef(getTodayDateString());
  const appState = useRef<AppStateStatus>(AppState.currentState);

  // Request permissions once on mount (non-blocking).
  useEffect(() => {
    if (AppState.currentState === "active") {
      requestNotificationPermissions().catch(() => {
        // Permission denied — app stays fully usable without notifications.
      });
    }

    const subscription = AppState.addEventListener(
      "change",
      async (nextState) => {
        if (appState.current !== "active" && nextState === "active") {
          const today = getTodayDateString();
          if (today !== lastKnownDate.current) {
            lastKnownDate.current = today;
            onNewDay();
          }

          // Re-request permission if previously denied — offers re-enable path.
          const status = await getNotificationPermissionStatus();
          if (status === "undetermined") {
            await requestNotificationPermissions().catch(() => {});
          }
        }
        appState.current = nextState;
      },
    );

    return () => subscription.remove();
  }, [onNewDay]);
}
