import AsyncStorage from "@react-native-async-storage/async-storage";
import type {
  DailyPlan,
  WeeklyHistory,
  AppSettings,
  DebugLog,
  Activity,
} from "../../shared/types";
import { DEFAULT_SETTINGS } from "../../shared/types";

const STORAGE_KEYS = {
  DAILY_PLAN: "daily_plan",
  WEEKLY_HISTORY: "weekly_history",
  SETTINGS: "settings",
  DEBUG_LOGS: "debug_logs",
  ACTIVITIES_CACHE: "activities_cache",
  CATALOGUE_VERSION: "catalogue_version",
  SCHEMA_VERSION: "schema_version",
} as const;

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const CURRENT_SCHEMA_VERSION = 1;
const MAX_DEBUG_LOGS = 200;

export async function getDailyPlan(date: string): Promise<DailyPlan | null> {
  try {
    const key = `${STORAGE_KEYS.DAILY_PLAN}_${date}`;
    const data = await AsyncStorage.getItem(key);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error("Failed to get daily plan:", error);
    return null;
  }
}

export async function saveDailyPlan(plan: DailyPlan): Promise<void> {
  try {
    const key = `${STORAGE_KEYS.DAILY_PLAN}_${plan.date}`;
    await AsyncStorage.setItem(key, JSON.stringify(plan));
    await updateWeeklyHistory(plan);
  } catch (error) {
    console.error("Failed to save daily plan:", error);
  }
}

export async function updateActivityCompletion(
  date: string,
  activityId: string,
  completed: boolean,
): Promise<DailyPlan | null> {
  try {
    const plan = await getDailyPlan(date);
    if (!plan) return null;

    const updatedActivities = plan.activities.map((item) =>
      item.activityId === activityId
        ? {
            ...item,
            completed,
            completedAt: completed ? new Date().toISOString() : undefined,
          }
        : item,
    );

    const updatedPlan: DailyPlan = {
      ...plan,
      activities: updatedActivities,
    };

    await saveDailyPlan(updatedPlan);
    return updatedPlan;
  } catch (error) {
    console.error("Failed to update activity completion:", error);
    return null;
  }
}

async function updateWeeklyHistory(plan: DailyPlan): Promise<void> {
  try {
    const history = await getWeeklyHistory();
    const completedCount = plan.activities.filter((a) => a.completed).length;
    const totalCount = plan.activities.length;
    const percentage =
      totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

    const entry: WeeklyHistory = {
      date: plan.date,
      completionPercentage: percentage,
      totalActivities: totalCount,
      completedActivities: completedCount,
    };

    const existingIndex = history.findIndex((h) => h.date === plan.date);
    if (existingIndex >= 0) {
      history[existingIndex] = entry;
    } else {
      history.push(entry);
    }

    const sortedHistory = history
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 30);

    await AsyncStorage.setItem(
      STORAGE_KEYS.WEEKLY_HISTORY,
      JSON.stringify(sortedHistory),
    );
  } catch (error) {
    console.error("Failed to update weekly history:", error);
  }
}

export async function getWeeklyHistory(): Promise<WeeklyHistory[]> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.WEEKLY_HISTORY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error("Failed to get weekly history:", error);
    return [];
  }
}

export async function getSettings(): Promise<AppSettings> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.SETTINGS);
    return data
      ? { ...DEFAULT_SETTINGS, ...JSON.parse(data) }
      : DEFAULT_SETTINGS;
  } catch (error) {
    console.error("Failed to get settings:", error);
    return DEFAULT_SETTINGS;
  }
}

export async function saveSettings(settings: AppSettings): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  } catch (error) {
    console.error("Failed to save settings:", error);
  }
}

export async function addDebugLog(
  level: DebugLog["level"],
  message: string,
  data?: Record<string, unknown>,
): Promise<void> {
  try {
    const logs = await getDebugLogs();
    const newLog: DebugLog = {
      timestamp: new Date().toISOString(),
      level,
      message,
      data,
    };

    logs.unshift(newLog);
    const trimmedLogs = logs.slice(0, MAX_DEBUG_LOGS);

    await AsyncStorage.setItem(
      STORAGE_KEYS.DEBUG_LOGS,
      JSON.stringify(trimmedLogs),
    );
  } catch (error) {
    console.error("Failed to add debug log:", error);
  }
}

export async function getDebugLogs(): Promise<DebugLog[]> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.DEBUG_LOGS);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error("Failed to get debug logs:", error);
    return [];
  }
}

export async function cacheActivities(
  activities: Activity[],
  version: string,
): Promise<void> {
  try {
    await AsyncStorage.setItem(
      STORAGE_KEYS.ACTIVITIES_CACHE,
      JSON.stringify(activities),
    );
    await AsyncStorage.setItem(STORAGE_KEYS.CATALOGUE_VERSION, version);
  } catch (error) {
    console.error("Failed to cache activities:", error);
  }
}

export async function getCachedActivities(): Promise<Activity[]> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.ACTIVITIES_CACHE);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error("Failed to get cached activities:", error);
    return [];
  }
}

export async function getCatalogueVersion(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(STORAGE_KEYS.CATALOGUE_VERSION);
  } catch (error) {
    console.error("Failed to get catalogue version:", error);
    return null;
  }
}

export async function clearTodayPlan(date: string): Promise<void> {
  try {
    const key = `${STORAGE_KEYS.DAILY_PLAN}_${date}`;
    await AsyncStorage.removeItem(key);
  } catch (error) {
    console.error("Failed to clear today plan:", error);
  }
}

export function getTodayDateString(): string {
  return new Date().toISOString().split("T")[0];
}

export function getWeekDates(): string[] {
  const today = new Date();
  const dayOfWeek = today.getDay();
  const monday = new Date(today);
  monday.setDate(today.getDate() - ((dayOfWeek + 6) % 7));

  const dates: string[] = [];
  for (let i = 0; i < 7; i++) {
    const date = new Date(monday);
    date.setDate(monday.getDate() + i);
    dates.push(date.toISOString().split("T")[0]);
  }
  return dates;
}
