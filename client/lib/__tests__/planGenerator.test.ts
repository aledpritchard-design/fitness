import { generateDailyPlan } from "../planGenerator";
import type { Activity } from "../../../shared/types";

jest.mock("../storage", () => ({
  addDebugLog: jest.fn().mockResolvedValue(undefined),
}));

function makeActivity(
  id: string,
  category: Activity["category"],
  intensity: number,
): Activity {
  return {
    id,
    name: `Activity ${id}`,
    category,
    intensity,
    defaultRepsOrTime: "30s",
    instructions: "",
    contraindications: "",
    equipment: "",
    tags: [],
  };
}

function makeMultiCatCatalogue(perCategory: number, intensity = 3): Activity[] {
  const categories: Activity["category"][] = [
    "strength",
    "mobility",
    "cardio",
    "posture",
  ];
  return categories.flatMap((cat, ci) =>
    Array.from({ length: perCategory }, (_, i) =>
      makeActivity(`${ci * perCategory + i + 1}`, cat, intensity),
    ),
  );
}

describe("generateDailyPlan", () => {
  describe("difficulty budgets", () => {
    it("Easy: totalDifficulty is within 12 ±2", () => {
      const activities = makeMultiCatCatalogue(3);
      const plan = generateDailyPlan(activities, "2026-01-01", "easy");
      expect(plan.totalDifficulty).toBeGreaterThanOrEqual(10);
      expect(plan.totalDifficulty).toBeLessThanOrEqual(14);
    });

    it("Medium: totalDifficulty is within 18 ±2", () => {
      const activities = makeMultiCatCatalogue(3);
      const plan = generateDailyPlan(activities, "2026-01-01", "medium");
      expect(plan.totalDifficulty).toBeGreaterThanOrEqual(16);
      expect(plan.totalDifficulty).toBeLessThanOrEqual(20);
    });

    it("Hard: totalDifficulty is within 24 ±2", () => {
      const activities = makeMultiCatCatalogue(3);
      const plan = generateDailyPlan(activities, "2026-01-01", "hard");
      expect(plan.totalDifficulty).toBeGreaterThanOrEqual(22);
      expect(plan.totalDifficulty).toBeLessThanOrEqual(26);
    });

    it("defaults to easy budget when no difficulty is given", () => {
      const activities = makeMultiCatCatalogue(3);
      const plan = generateDailyPlan(activities, "2026-01-01");
      expect(plan.totalDifficulty).toBeGreaterThanOrEqual(10);
      expect(plan.totalDifficulty).toBeLessThanOrEqual(14);
    });
  });

  describe("category variety", () => {
    it("includes at least one activity from each available category", () => {
      const activities = makeMultiCatCatalogue(3);
      const plan = generateDailyPlan(activities, "2026-01-01", "easy");
      const cats = new Set(plan.activities.map((a) => a.activity.category));
      expect(cats.has("strength")).toBe(true);
      expect(cats.has("mobility")).toBe(true);
      expect(cats.has("cardio")).toBe(true);
      expect(cats.has("posture")).toBe(true);
    });
  });

  describe("no duplicates", () => {
    it("never selects the same activity twice", () => {
      const activities = makeMultiCatCatalogue(3);
      const plan = generateDailyPlan(activities, "2026-01-01", "hard");
      const ids = plan.activities.map((a) => a.activityId);
      expect(new Set(ids).size).toBe(ids.length);
    });
  });

  describe("edge cases", () => {
    it("handles an empty catalogue without throwing and returns an empty plan", () => {
      expect(() => generateDailyPlan([], "2026-01-01", "easy")).not.toThrow();
      const plan = generateDailyPlan([], "2026-01-01", "easy");
      expect(plan.activities).toHaveLength(0);
      expect(plan.totalDifficulty).toBe(0);
    });

    it("handles a single-activity catalogue without throwing", () => {
      const activities = [makeActivity("1", "strength", 3)];
      expect(() =>
        generateDailyPlan(activities, "2026-01-01", "easy"),
      ).not.toThrow();
      const plan = generateDailyPlan(activities, "2026-01-01", "easy");
      expect(plan.activities).toHaveLength(1);
    });

    it("handles a catalogue with activities in only one category", () => {
      const activities = [
        makeActivity("1", "strength", 3),
        makeActivity("2", "strength", 3),
        makeActivity("3", "strength", 3),
      ];
      const plan = generateDailyPlan(activities, "2026-01-01", "easy");
      expect(plan.activities.length).toBeGreaterThanOrEqual(1);
      plan.activities.forEach((a) =>
        expect(a.activity.category).toBe("strength"),
      );
    });
  });
});
