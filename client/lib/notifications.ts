import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import type { DailyPlanActivity, AppSettings } from "../../shared/types";
import { addDebugLog } from "./storage";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

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
  for (let hour = startHour; hour <= endHour && hours.length < MAX_SLOTS; hour += step) {
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
    const hours = deriveNotificationHours(notificationStartHour, notificationEndHour, frequency);

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
