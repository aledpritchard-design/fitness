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

export async function scheduleHourlyNotifications(
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

    const now = new Date();
    const currentHour = now.getHours();
    const { notificationStartHour, notificationEndHour } = settings;

    for (
      let hour = Math.max(currentHour + 1, notificationStartHour);
      hour <= notificationEndHour;
      hour++
    ) {
      const randomActivity =
        incompleteActivities[
          Math.floor(Math.random() * incompleteActivities.length)
        ];

      const triggerDate = new Date();
      triggerDate.setHours(hour, 0, 0, 0);

      if (triggerDate <= now) continue;

      await Notifications.scheduleNotificationAsync({
        content: {
          title: "Time for a snack!",
          body: `${randomActivity.activity.name} - ${randomActivity.activity.defaultRepsOrTime}`,
          data: { activityId: randomActivity.activityId },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: triggerDate,
        },
      });
    }

    await addDebugLog("info", "Hourly notifications scheduled", {
      count: Math.max(
        0,
        notificationEndHour -
          Math.max(currentHour + 1, notificationStartHour) +
          1,
      ),
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
