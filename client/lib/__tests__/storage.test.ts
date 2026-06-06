import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  getTodayDateString,
  getWeekDates,
  getDailyPlan,
  saveDailyPlan,
  getWeeklyHistory,
} from "../storage";
import type { Activity, DailyPlan } from "../../../shared/types";

jest.mock("@react-native-async-storage/async-storage", () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
}));

// ── helpers ───────────────────────────────────────────────────────────────────

function makeActivity(id: string): Activity {
  return {
    id,
    name: `Activity ${id}`,
    category: "strength",
    intensity: 3,
    defaultRepsOrTime: "30s",
    instructions: "",
    contraindications: "",
    equipment: "",
    tags: [],
  };
}

function makePlan(
  date: string,
  totalActivities: number,
  completedCount: number,
): DailyPlan {
  return {
    date,
    activities: Array.from({ length: totalActivities }, (_, i) => ({
      activityId: `act-${i}`,
      activity: makeActivity(`act-${i}`),
      completed: i < completedCount,
    })),
    totalDifficulty: totalActivities * 3,
    createdAt: new Date().toISOString(),
  };
}

// ── stateful AsyncStorage mock ─────────────────────────────────────────────────

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

// ── getTodayDateString ────────────────────────────────────────────────────────

describe("getTodayDateString", () => {
  it("returns a string in YYYY-MM-DD format", () => {
    expect(getTodayDateString()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

// ── getWeekDates ──────────────────────────────────────────────────────────────

describe("getWeekDates", () => {
  it("returns exactly 7 dates", () => {
    expect(getWeekDates()).toHaveLength(7);
  });

  it("first date is a Monday", () => {
    const dates = getWeekDates();
    // YYYY-MM-DD strings are parsed as UTC midnight per spec
    expect(new Date(dates[0]).getUTCDay()).toBe(1);
  });

  it("last date is a Sunday", () => {
    const dates = getWeekDates();
    expect(new Date(dates[6]).getUTCDay()).toBe(0);
  });

  it("all dates are in YYYY-MM-DD format", () => {
    getWeekDates().forEach((d) => {
      expect(d).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });
  });

  it("dates are consecutive (each 1 day after the previous)", () => {
    const dates = getWeekDates();
    for (let i = 1; i < 7; i++) {
      const prev = new Date(dates[i - 1]).getTime();
      const curr = new Date(dates[i]).getTime();
      expect(curr - prev).toBe(86_400_000);
    }
  });
});

// ── completion percentage maths ───────────────────────────────────────────────

describe("completion percentage maths", () => {
  it("records 0% when no activities are completed", async () => {
    await saveDailyPlan(makePlan("2026-01-01", 4, 0));
    const [entry] = await getWeeklyHistory();
    expect(entry.completionPercentage).toBe(0);
  });

  it("records 50% when half of activities are completed", async () => {
    await saveDailyPlan(makePlan("2026-01-01", 4, 2));
    const [entry] = await getWeeklyHistory();
    expect(entry.completionPercentage).toBe(50);
  });

  it("records 100% when all activities are completed", async () => {
    await saveDailyPlan(makePlan("2026-01-01", 4, 4));
    const [entry] = await getWeeklyHistory();
    expect(entry.completionPercentage).toBe(100);
  });

  it("rounds to the nearest integer (1/3 → 33)", async () => {
    await saveDailyPlan(makePlan("2026-01-01", 3, 1));
    const [entry] = await getWeeklyHistory();
    expect(entry.completionPercentage).toBe(33);
  });
});

// ── weekly history ────────────────────────────────────────────────────────────

describe("weekly history", () => {
  it("starts empty when nothing is stored", async () => {
    await expect(getWeeklyHistory()).resolves.toEqual([]);
  });

  it("updates an existing entry when the same date is saved again", async () => {
    await saveDailyPlan(makePlan("2026-01-01", 4, 0)); // 0%
    await saveDailyPlan(makePlan("2026-01-01", 4, 2)); // 50%
    const history = await getWeeklyHistory();
    const entries = history.filter((h) => h.date === "2026-01-01");
    expect(entries).toHaveLength(1);
    expect(entries[0].completionPercentage).toBe(50);
  });

  it("sorts history newest-first", async () => {
    await saveDailyPlan(makePlan("2026-01-01", 2, 0));
    await saveDailyPlan(makePlan("2026-01-03", 2, 0));
    await saveDailyPlan(makePlan("2026-01-02", 2, 0));
    const history = await getWeeklyHistory();
    expect(history[0].date).toBe("2026-01-03");
    expect(history[1].date).toBe("2026-01-02");
    expect(history[2].date).toBe("2026-01-01");
  });

  it("returns [] when stored data is corrupt JSON", async () => {
    store["weekly_history"] = "not-valid-json";
    await expect(getWeeklyHistory()).resolves.toEqual([]);
  });
});

// ── getDailyPlan ──────────────────────────────────────────────────────────────

describe("getDailyPlan", () => {
  it("returns null when no plan is stored for the date", async () => {
    await expect(getDailyPlan("2026-01-01")).resolves.toBeNull();
  });

  it("returns the stored plan", async () => {
    const plan = makePlan("2026-01-01", 4, 2);
    await saveDailyPlan(plan);
    const fetched = await getDailyPlan("2026-01-01");
    expect(fetched?.date).toBe("2026-01-01");
    expect(fetched?.activities).toHaveLength(4);
  });

  it("returns null when stored data is corrupt JSON", async () => {
    store["daily_plan_2026-01-01"] = "not-valid-json";
    await expect(getDailyPlan("2026-01-01")).resolves.toBeNull();
  });
});
