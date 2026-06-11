jest.mock("expo-notifications", () => ({
  setNotificationHandler: jest.fn(),
  getPermissionsAsync: jest.fn(),
  requestPermissionsAsync: jest.fn(),
  cancelAllScheduledNotificationsAsync: jest.fn(),
  scheduleNotificationAsync: jest.fn(),
  SchedulableTriggerInputTypes: { CALENDAR: "calendar" },
}));

jest.mock("@react-native-async-storage/async-storage", () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
}));

import { deriveNotificationHours } from "../notifications";

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
