import React from "react";
import { View, StyleSheet } from "react-native";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";
import type { WeeklyHistory } from "../../shared/types";

interface WeeklyGridProps {
  weekDates: string[];
  history: WeeklyHistory[];
}

const DAY_NAMES = ["M", "T", "W", "T", "F", "S", "S"];
const DAY_FULL_NAMES = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

export function WeeklyGrid({ weekDates, history }: WeeklyGridProps) {
  const { theme } = useTheme();

  const getHistoryForDate = (date: string): WeeklyHistory | null => {
    return history.find((h) => h.date === date) ?? null;
  };

  const getCircleStyle = (percentage: number) => {
    if (percentage === 100) {
      return { backgroundColor: theme.success, borderColor: theme.success };
    } else if (percentage > 0) {
      return {
        backgroundColor: theme.primary + "30",
        borderColor: theme.primary,
      };
    }
    return {
      backgroundColor: theme.backgroundSecondary,
      borderColor: theme.border,
    };
  };

  const today = new Date().toISOString().split("T")[0];

  return (
    <View style={styles.container}>
      {weekDates.map((date, index) => {
        const historyEntry = getHistoryForDate(date);
        const percentage = historyEntry?.completionPercentage ?? 0;
        const isToday = date === today;
        const isFuture = date > today;
        const circleStyle = getCircleStyle(percentage);

        const dayLabel = DAY_FULL_NAMES[index];
        const statusLabel = isFuture
          ? "no data yet"
          : percentage === 100
            ? "complete"
            : percentage > 0
              ? `${percentage}% done`
              : "no activity";
        const todayLabel = isToday ? ", today" : "";

        return (
          <View
            key={date}
            style={styles.dayContainer}
            accessible={true}
            accessibilityLabel={`${dayLabel}${todayLabel}: ${statusLabel}`}
          >
            <ThemedText
              type="small"
              style={[
                styles.dayName,
                { color: isToday ? theme.primary : theme.textSecondary },
              ]}
              importantForAccessibility="no"
            >
              {DAY_NAMES[index]}
            </ThemedText>
            <View
              style={[
                styles.circle,
                circleStyle,
                isToday && { borderColor: theme.primary, borderWidth: 2 },
                isFuture && { opacity: 0.4 },
              ]}
            >
              <ThemedText
                type="body"
                style={[
                  styles.percentage,
                  {
                    color:
                      percentage === 100
                        ? "#FFFFFF"
                        : percentage > 0
                          ? theme.primary
                          : theme.textSecondary,
                  },
                ]}
                adjustsFontSizeToFit
                minimumFontScale={0.6}
                numberOfLines={1}
                importantForAccessibility="no"
              >
                {isFuture ? "-" : percentage > 0 ? `${percentage}` : "0"}
              </ThemedText>
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.xs,
  },
  dayContainer: {
    alignItems: "center",
    gap: Spacing.sm,
  },
  dayName: {
    fontWeight: "600",
    fontSize: 12,
  },
  circle: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.full,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  percentage: {
    fontSize: 13,
    fontWeight: "600",
  },
});
