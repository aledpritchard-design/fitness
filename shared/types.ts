export interface Activity {
  id: string;
  name: string;
  category: "strength" | "mobility" | "cardio" | "posture";
  defaultRepsOrTime: string;
  instructions: string;
  contraindications: string;
  equipment: string;
  intensity: number;
  tags: string[];
}

export interface DailyPlanActivity {
  activityId: string;
  activity: Activity;
  completed: boolean;
  completedAt?: string;
}

export interface DailyPlan {
  date: string;
  activities: DailyPlanActivity[];
  totalDifficulty: number;
  createdAt: string;
}

export interface WeeklyHistory {
  date: string;
  completionPercentage: number;
  totalActivities: number;
  completedActivities: number;
}

export interface AppSettings {
  notificationsEnabled: boolean;
  notificationStartHour: number;
  notificationEndHour: number;
  frequency: "hourly" | "every-2h" | "every-3h";
  difficulty: "easy" | "medium" | "hard";
  debugMode: boolean;
}

export interface DebugLog {
  timestamp: string;
  level: "info" | "warn" | "error";
  message: string;
  data?: Record<string, unknown>;
}

export interface CatalogueResponse {
  activities: Activity[];
  catalogueVersion: string;
}

export const DEFAULT_SETTINGS: AppSettings = {
  notificationsEnabled: true,
  notificationStartHour: 8,
  notificationEndHour: 20,
  frequency: "hourly",
  difficulty: "easy",
  debugMode: false,
};
