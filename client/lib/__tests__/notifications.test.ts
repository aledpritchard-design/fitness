import * as Notifications from "expo-notifications";
import {
  deriveNotificationHours,
  setupReminderCategory,
  scheduleSnoozeNotification,
  REMINDER_CATEGORY_ID,
  SNOOZE_ACTION_ID,
  SNOOZE_MINUTES,
} from "../notifications";

jest.mock("expo-notifications", () => ({
  setNotificationHandler: jest.fn(),
  getPermissionsAsync: jest.fn(),
  requestPermissionsAsync: jest.fn(),
  cancelAllScheduledNotificationsAsync: jest.fn(),
  cancelScheduledNotificationAsync: jest.fn().mockResolvedValue(undefined),
  scheduleNotificationAsync: jest.fn().mockResolvedValue("notif-id"),
  setNotificationCategoryAsync: jest.fn().mockResolvedValue(undefined),
  SchedulableTriggerInputTypes: {
    CALENDAR: "calendar",
    TIME_INTERVAL: "timeInterval",
  },
}));

const mockGetItem = jest.fn();
jest.mock("@react-native-async-storage/async-storage", () => ({
  getItem: (...args: unknown[]) => mockGetItem(...args),
  setItem: jest.fn(),
  removeItem: jest.fn(),
}));

describe("deriveNotificationHours", () => {
  describe("hourly frequency", () => {
    it("returns one hour per hour in the window", () => {
      expect(deriveNotificationHours(8, 20, "hourly")).toEqual([
        8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20,
      ]);
    });

    it("includes the end hour", () => {
      const hours = deriveNotificationHours(8, 10, "hourly");
      expect(hours).toEqual([8, 9, 10]);
    });

    it("handles a single-hour window", () => {
      expect(deriveNotificationHours(12, 12, "hourly")).toEqual([12]);
    });

    it("caps at 16 slots", () => {
      const hours = deriveNotificationHours(0, 23, "hourly");
      expect(hours.length).toBe(16);
      expect(hours[0]).toBe(0);
      expect(hours[15]).toBe(15);
    });
  });

  describe("every-2h frequency", () => {
    it("returns one trigger every 2 hours", () => {
      expect(deriveNotificationHours(8, 20, "every-2h")).toEqual([
        8, 10, 12, 14, 16, 18, 20,
      ]);
    });

    it("includes the end hour when it falls on a step boundary", () => {
      const hours = deriveNotificationHours(8, 12, "every-2h");
      expect(hours).toEqual([8, 10, 12]);
    });

    it("excludes the end hour when it does not fall on a step boundary", () => {
      const hours = deriveNotificationHours(8, 11, "every-2h");
      expect(hours).toEqual([8, 10]);
    });

    it("stays under the iOS 16-slot cap", () => {
      const hours = deriveNotificationHours(0, 23, "every-2h");
      expect(hours.length).toBeLessThanOrEqual(16);
    });
  });

  describe("every-3h frequency", () => {
    it("returns one trigger every 3 hours", () => {
      expect(deriveNotificationHours(8, 20, "every-3h")).toEqual([
        8, 11, 14, 17, 20,
      ]);
    });

    it("handles a window that does not divide evenly", () => {
      const hours = deriveNotificationHours(8, 19, "every-3h");
      expect(hours).toEqual([8, 11, 14, 17]);
    });

    it("handles a single-slot window", () => {
      expect(deriveNotificationHours(9, 9, "every-3h")).toEqual([9]);
    });

    it("stays under the iOS 16-slot cap", () => {
      const hours = deriveNotificationHours(0, 23, "every-3h");
      expect(hours.length).toBeLessThanOrEqual(16);
    });
  });
});

describe("setupReminderCategory", () => {
  it("registers the REMINDER category with a snooze action", async () => {
    await setupReminderCategory();
    expect(Notifications.setNotificationCategoryAsync).toHaveBeenCalledWith(
      REMINDER_CATEGORY_ID,
      expect.arrayContaining([
        expect.objectContaining({ identifier: SNOOZE_ACTION_ID }),
      ]),
    );
  });
});

describe("scheduleSnoozeNotification", () => {
  const makeNotification = (
    overrides: Record<string, unknown> = {},
  ): Notifications.Notification =>
    ({
      request: {
        identifier: "test-notif",
        content: {
          title: "Time for a snack!",
          body: "Push-ups - 10 reps",
          data: { activityId: "push-ups" },
          ...overrides,
        },
        trigger: { type: "calendar", repeats: true, hour: 10, minute: 0 },
      },
      date: Date.now() / 1000,
    }) as unknown as Notifications.Notification;

  beforeEach(() => {
    jest.clearAllMocks();
    // Default: notificationsEnabled, window 08:00–20:00, hourly
    mockGetItem.mockResolvedValue(
      JSON.stringify({
        notificationsEnabled: true,
        notificationStartHour: 8,
        notificationEndHour: 20,
        frequency: "hourly",
        difficulty: "easy",
        debugMode: false,
      }),
    );
  });

  it("schedules a one-shot notification after SNOOZE_MINUTES", async () => {
    const now = new Date();
    // Set time to well within window so snooze doesn't fall outside
    jest
      .spyOn(Date, "now")
      .mockReturnValue(
        new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate(),
          9,
          0,
          0,
        ).getTime(),
      );

    await scheduleSnoozeNotification(makeNotification());

    expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledWith(
      expect.objectContaining({
        identifier: "snooze-reminder",
        trigger: expect.objectContaining({
          type: "timeInterval",
          seconds: SNOOZE_MINUTES * 60,
          repeats: false,
        }),
        content: expect.objectContaining({
          categoryIdentifier: REMINDER_CATEGORY_ID,
        }),
      }),
    );
    jest.spyOn(Date, "now").mockRestore();
  });

  it("drops the snooze when it would fire after the window end", async () => {
    // Snooze at 19:50 → fires at 20:05, past the 20:00 window end
    jest
      .spyOn(Date, "now")
      .mockReturnValue(new Date(2024, 0, 1, 19, 50, 0).getTime());

    await scheduleSnoozeNotification(makeNotification());

    expect(Notifications.scheduleNotificationAsync).not.toHaveBeenCalled();
    jest.spyOn(Date, "now").mockRestore();
  });

  it("does not schedule when notifications are disabled", async () => {
    mockGetItem.mockResolvedValue(
      JSON.stringify({ notificationsEnabled: false, notificationEndHour: 20 }),
    );

    await scheduleSnoozeNotification(makeNotification());

    expect(Notifications.scheduleNotificationAsync).not.toHaveBeenCalled();
  });
});
