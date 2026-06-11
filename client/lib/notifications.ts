import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import type { DailyPlanActivity, AppSettings } from "../../shared/types";
import { addDebugLog, getSettings } from "./storage";

export const REMINDER_CATEGORY_ID = "REMINDER";
export const SNOOZE_ACTION_ID = "snooze";
export const SNOOZE_MINUTES = 15;
const SNOOZE_NOTIFICATION_ID = "snooze-reminder";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

/**
 * Register the REMINDER notification category with a "Snooze 15 min" action.
 * Must be called before scheduling any reminder notifications so iOS shows the
 * action button. Safe to call on every app launch.
 */
export async function setupReminderCategory(): Promise<void> {
  if (Platform.OS === "web") return;
  try {
    await Notifications.setNotificationCategoryAsync(REMINDER_CATEGORY_ID, [
      {
        identifier: SNOOZE_ACTION_ID,
        buttonTitle: "Snooze 15 min",
        options: { isDestructive: false, isAuthenticationRequired: false },
      },
    ]);
  } catch (error) {
    await addDebugLog("error", "Failed to set up reminder category", {
      error: String(error),
    });
  }
}

/**
 * Schedule a one-shot snooze notification based on an existing reminder.
 * Uses a fixed identifier (SNOOZE_NOTIFICATION_ID) so a second snooze tap
 * overwrites the pending one — no duplicate or orphaned notifications.
 * Drops silently if the snooze time would fall outside the notification window.
 */
export async function scheduleSnoozeNotification(
  notification: Notifications.Notification,
): Promise<void> {
  if (Platform.OS === "web") return;
  try {
    const settings = await getSettings();
    if (!settings.notificationsEnabled) return;

    const snoozeTime = new Date(Date.now() + SNOOZE_MINUTES * 60 * 1000);
    if (snoozeTime.getHours() >= settings.notificationEndHour) {
      await addDebugLog("info", "Snooze skipped — outside notification window");
      return;
    }

    // Cancel any existing pending snooze before scheduling to avoid duplicates.
    await Notifications.cancelScheduledNotificationAsync(
      SNOOZE_NOTIFICATION_ID,
    ).catch(() => {});

    await Notifications.scheduleNotificationAsync({
      identifier: SNOOZE_NOTIFICATION_ID,
      content: {
        title: notification.request.content.title,
        body: notification.request.content.body,
        data: notification.request.content.data ?? {},
        categoryIdentifier: REMINDER_CATEGORY_ID,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: SNOOZE_MINUTES * 60,
        repeats: false,
      },
    });

    await addDebugLog("info", "Snooze scheduled", {
      delayMinutes: SNOOZE_MINUTES,
    });
  } catch (error) {
    await addDebugLog("error", "Failed to schedule snooze", {
      error: String(error),
    });
  }
}

export async function requestNotificationPermissions(): Promise<boolean> {
  try {
    if (Platform.OS === "web") {
      return false;
    }

    const { status: existingStatus } =
      await Notifications.getPermissionsAsync();

    if (existingStatus === "granted") {
      return true;
    }

    const { status } = await Notifications.requestPermissionsAsync();
    await addDebugLog("info", "Notification permission requested", { status });
    return status === "granted";
  } catch (error) {
    await addDebugLog("error", "Failed to request notification permissions", {
      error: String(error),
    });
    return false;
  }
}

export async function getNotificationPermissionStatus(): Promise<
  "granted" | "denied" | "undetermined"
> {
  try {
    if (Platform.OS === "web") return "denied";
    const { status } = await Notifications.getPermissionsAsync();
    return status as "granted" | "denied" | "undetermined";
  } catch {
    return "denied";
  }
}

const FREQUENCY_STEP: Record<AppSettings["frequency"], number> = {
  hourly: 1,
  "every-2h": 2,
  "every-3h": 3,
};

/**
 * Derive the trigger hours for the given window and frequency.
 * Capped at 16 to stay well under the iOS 64-notification limit.
 */
export function deriveNotificationHours(
  startHour: number,
  endHour: number,
  frequency: AppSettings["frequency"],
): number[] {
  const step = FREQUENCY_STEP[frequency];
  const MAX_SLOTS = 16;
  const hours: number[] = [];
  for (
    let hour = startHour;
    hour <= endHour && hours.length < MAX_SLOTS;
    hour += step
  ) {
    hours.push(hour);
  }
  return hours;
}

/**
 * Schedule repeating daily notifications across the notification window.
 * Uses CALENDAR triggers with repeats:true so reminders fire every day
 * at each scheduled hour in the window, even when the app is closed.
 *
 * Total triggers = deriveNotificationHours(...).length, capped at 16 —
 * well under the iOS pending-notification limit of 64.
 */
export async function scheduleNotifications(
  activities: DailyPlanActivity[],
  settings: AppSettings,
): Promise<void> {
  try {
    if (Platform.OS === "web" || !settings.notificationsEnabled) {
      return;
    }

    await Notifications.cancelAllScheduledNotificationsAsync();

    const incompleteActivities = activities.filter((a) => !a.completed);

    if (incompleteActivities.length === 0) {
      await addDebugLog(
        "info",
        "All activities completed, no notifications scheduled",
      );
      return;
    }

    const { notificationStartHour, notificationEndHour, frequency } = settings;
    const hours = deriveNotificationHours(
      notificationStartHour,
      notificationEndHour,
      frequency,
    );

    for (const hour of hours) {
      const randomActivity =
        incompleteActivities[
          Math.floor(Math.random() * incompleteActivities.length)
        ];

      await Notifications.scheduleNotificationAsync({
        content: {
          title: "Time for a snack!",
          body: `${randomActivity.activity.name} - ${randomActivity.activity.defaultRepsOrTime}`,
          data: { activityId: randomActivity.activityId },
          categoryIdentifier: REMINDER_CATEGORY_ID,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
          repeats: true,
          hour,
          minute: 0,
        },
      });
    }

    await addDebugLog("info", "Repeating daily notifications scheduled", {
      count: hours.length,
      frequency,
      window: `${notificationStartHour}:00–${notificationEndHour}:00`,
    });
  } catch (error) {
    await addDebugLog("error", "Failed to schedule notifications", {
      error: String(error),
    });
  }
}

export async function scheduleCompletionNotification(): Promise<void> {
  try {
    if (Platform.OS === "web") return;

    await Notifications.scheduleNotificationAsync({
      content: {
        title: "Amazing work!",
        body: "You've cleared all of today's activity snacks!",
      },
      trigger: null,
    });
  } catch (error) {
    console.error("Failed to send completion notification:", error);
  }
}

export async function cancelAllNotifications(): Promise<void> {
  try {
    if (Platform.OS === "web") return;
    await Notifications.cancelAllScheduledNotificationsAsync();
    await addDebugLog("info", "All notifications cancelled");
  } catch (error) {
    console.error("Failed to cancel notifications:", error);
  }
}
