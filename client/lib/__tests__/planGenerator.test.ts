import { generateDailyPlan } from "../planGenerator";

jest.mock("../storage", () => ({
  addDebugLog: jest.fn().mockResolvedValue(undefined),
}));

const makeActivity = (
  id: string,
  category: "strength" | "mobility" | "cardio" | "posture",
  intensity: number,
) => ({
  id,
  name: `Activity ${id}`,
  category,
  intensity,
  defaultRepsOrTime: "30s",
  instructions: "",
  contraindications: "",
  equipment: "",
  tags: [],
});

describe("generateDailyPlan", () => {
  it("returns a plan within the Easy difficulty budget (12 ±2)", () => {
    const activities = [
      makeActivity("1", "strength", 3),
      makeActivity("2", "mobility", 3),
      makeActivity("3", "cardio", 3),
      makeActivity("4", "posture", 3),
    ];

    const plan = generateDailyPlan(activities, "2026-01-01", "easy");

    expect(plan.totalDifficulty).toBeGreaterThanOrEqual(10);
    expect(plan.totalDifficulty).toBeLessThanOrEqual(14);
  });
});
