import type {
  Activity,
  DailyPlan,
  DailyPlanActivity,
} from "../../shared/types";
import { addDebugLog } from "./storage";

const DAILY_TARGET_EASY = 12;
const DAILY_TARGET_MEDIUM = 18;
const DAILY_TARGET_HARD = 24;
const TOLERANCE = 2;

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export function generateDailyPlan(
  activities: Activity[],
  date: string,
  difficulty: "easy" | "medium" | "hard" = "easy",
): DailyPlan {
  const targetDifficulty =
    difficulty === "easy"
      ? DAILY_TARGET_EASY
      : difficulty === "medium"
        ? DAILY_TARGET_MEDIUM
        : DAILY_TARGET_HARD;

  const categories: Activity["category"][] = [
    "strength",
    "mobility",
    "cardio",
    "posture",
  ];
  const selectedActivities: DailyPlanActivity[] = [];
  let currentDifficulty = 0;

  const activitiesByCategory = categories.reduce(
    (acc, category) => {
      acc[category] = shuffleArray(
        activities.filter((a) => a.category === category),
      );
      return acc;
    },
    {} as Record<Activity["category"], Activity[]>,
  );

  for (const category of categories) {
    const categoryActivities = activitiesByCategory[category];
    if (
      categoryActivities.length > 0 &&
      currentDifficulty < targetDifficulty - TOLERANCE
    ) {
      const activity = categoryActivities[0];
      selectedActivities.push({
        activityId: activity.id,
        activity,
        completed: false,
      });
      currentDifficulty += activity.intensity;
      activitiesByCategory[category] = categoryActivities.slice(1);
    }
  }

  const remainingActivities = shuffleArray(
    Object.values(activitiesByCategory).flat(),
  );

  for (const activity of remainingActivities) {
    if (currentDifficulty >= targetDifficulty - TOLERANCE) break;
    if (selectedActivities.some((s) => s.activityId === activity.id)) continue;

    if (
      currentDifficulty + activity.intensity <=
      targetDifficulty + TOLERANCE
    ) {
      selectedActivities.push({
        activityId: activity.id,
        activity,
        completed: false,
      });
      currentDifficulty += activity.intensity;
    }
  }

  const plan: DailyPlan = {
    date,
    activities: selectedActivities,
    totalDifficulty: currentDifficulty,
    createdAt: new Date().toISOString(),
  };

  addDebugLog("info", "Daily plan generated", {
    date,
    difficulty,
    targetDifficulty,
    actualDifficulty: currentDifficulty,
    activityCount: selectedActivities.length,
    activities: selectedActivities.map((a) => a.activity.name),
  });

  return plan;
}
