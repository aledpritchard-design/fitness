import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  calculateStreakFromHistory,
  getMilestoneRecords,
  checkAndUnlockMilestones,
} from "../storage";
import type { WeeklyHistory } from "../../../shared/types";

jest.mock("@react-native-async-storage/async-storage", () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
}));

// ── stateful AsyncStorage mock ────────────────────────────────────────────────

let store: Record<string, string> = {};

beforeEach(() => {
  store = {};
  (AsyncStorage.getItem as jest.Mock).mockImplementation((key: string) =>
    Promise.resolve(store[key] ?? null),
  );
  (AsyncStorage.setItem as jest.Mock).mockImplementation(
    (key: string, value: string) => {
      store[key] = value;
      return Promise.resolve();
    },
  );
  (AsyncStorage.removeItem as jest.Mock).mockImplementation((key: string) => {
    delete store[key];
    return Promise.resolve();
  });
});

// ── helpers ───────────────────────────────────────────────────────────────────

const TODAY = "2026-06-13";

function offset(base: string, days: number): string {
  const d = new Date(base + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().split("T")[0];
}

function h(date: string, pct: number): WeeklyHistory {
  const completedActivities = Math.round((4 * pct) / 100);
  return {
    date,
    completionPercentage: pct,
    totalActivities: 4,
    completedActivities,
  };
}

// ── calculateStreakFromHistory ────────────────────────────────────────────────

describe("calculateStreakFromHistory", () => {
  it("returns 0/0 for empty history", () => {
    expect(calculateStreakFromHistory([], TODAY)).toEqual({
      currentStreak: 0,
      bestStreak: 0,
    });
  });

  it("single perfect day today → streak 1", () => {
    expect(calculateStreakFromHistory([h(TODAY, 100)], TODAY)).toEqual({
      currentStreak: 1,
      bestStreak: 1,
    });
  });

  it("single perfect day yesterday → current streak 1 (still active)", () => {
    expect(
      calculateStreakFromHistory([h(offset(TODAY, -1), 100)], TODAY),
    ).toEqual({ currentStreak: 1, bestStreak: 1 });
  });

  it("perfect day two days ago → current streak 0 (broken)", () => {
    expect(
      calculateStreakFromHistory([h(offset(TODAY, -2), 100)], TODAY),
    ).toEqual({ currentStreak: 0, bestStreak: 1 });
  });

  it("3 consecutive perfect days ending today → streak 3", () => {
    const history = [
      h(offset(TODAY, -2), 100),
      h(offset(TODAY, -1), 100),
      h(TODAY, 100),
    ];
    expect(calculateStreakFromHistory(history, TODAY)).toEqual({
      currentStreak: 3,
      bestStreak: 3,
    });
  });

  it("gap in the middle resets current streak", () => {
    // day-3 and then day-1/today; day-2 missing breaks the run
    const history = [
      h(offset(TODAY, -3), 100),
      h(offset(TODAY, -1), 100),
      h(TODAY, 100),
    ];
    const result = calculateStreakFromHistory(history, TODAY);
    expect(result.currentStreak).toBe(2); // today + yesterday
    expect(result.bestStreak).toBe(2); // second run (2) beats first run (1)
  });

  it("non-100% day does not count toward streak", () => {
    const history = [
      h(offset(TODAY, -2), 100),
      h(offset(TODAY, -1), 75), // incomplete
      h(TODAY, 100),
    ];
    const result = calculateStreakFromHistory(history, TODAY);
    expect(result.currentStreak).toBe(1); // only today
  });

  it("best streak tracks the longest run in history", () => {
    // run of 3 earlier, then gap, then run of 2 ending today
    const history = [
      h(offset(TODAY, -6), 100),
      h(offset(TODAY, -5), 100),
      h(offset(TODAY, -4), 100),
      // gap at -3 and -2
      h(offset(TODAY, -1), 100),
      h(TODAY, 100),
    ];
    const result = calculateStreakFromHistory(history, TODAY);
    expect(result.bestStreak).toBe(3);
    expect(result.currentStreak).toBe(2);
  });

  it("history with no perfect days → 0/0", () => {
    const history = [
      h(offset(TODAY, -2), 50),
      h(offset(TODAY, -1), 75),
      h(TODAY, 80),
    ];
    expect(calculateStreakFromHistory(history, TODAY)).toEqual({
      currentStreak: 0,
      bestStreak: 0,
    });
  });
});

// ── checkAndUnlockMilestones ──────────────────────────────────────────────────

describe("checkAndUnlockMilestones", () => {
  it("does not unlock any milestone when streak is below all thresholds", async () => {
    const unlocked = await checkAndUnlockMilestones(5);
    expect(unlocked).toHaveLength(0);
    const records = await getMilestoneRecords();
    expect(records).toHaveLength(0);
  });

  it("unlocks the 7-day milestone when streak reaches 7", async () => {
    const unlocked = await checkAndUnlockMilestones(7);
    expect(unlocked).toContain("streak-7");
    const records = await getMilestoneRecords();
    expect(records.some((r) => r.id === "streak-7")).toBe(true);
  });

  it("does not unlock a milestone a second time (fires once only)", async () => {
    await checkAndUnlockMilestones(7);
    const second = await checkAndUnlockMilestones(7);
    expect(second).toHaveLength(0);
    const records = await getMilestoneRecords();
    expect(records.filter((r) => r.id === "streak-7")).toHaveLength(1);
  });

  it("unlocks 30-day milestone and 7-day together on first call at 30", async () => {
    const unlocked = await checkAndUnlockMilestones(30);
    expect(unlocked).toContain("streak-7");
    expect(unlocked).toContain("streak-30");
  });

  it("unlocks only 30-day milestone when 7-day was already unlocked", async () => {
    await checkAndUnlockMilestones(7);
    const unlocked = await checkAndUnlockMilestones(30);
    expect(unlocked).toEqual(["streak-30"]);
  });

  it("records the unlockedAt timestamp", async () => {
    const before = new Date().toISOString();
    await checkAndUnlockMilestones(7);
    const after = new Date().toISOString();
    const records = await getMilestoneRecords();
    const m = records.find((r) => r.id === "streak-7");
    expect(m).toBeDefined();
    expect(m!.unlockedAt >= before).toBe(true);
    expect(m!.unlockedAt <= after).toBe(true);
  });
});
