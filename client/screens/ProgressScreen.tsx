import React, { useState, useEffect, useCallback } from "react";
import { View, StyleSheet, ScrollView, RefreshControl } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";

import { ThemedText } from "@/components/ThemedText";
import { WeeklyGrid } from "@/components/WeeklyGrid";
import { EmptyState } from "@/components/EmptyState";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";
import {
  getWeeklyHistory,
  getWeekDates,
  getStreakData,
  getMilestoneRecords,
  MILESTONES,
} from "@/lib/storage";
import type {
  WeeklyHistory,
  StreakData,
  MilestoneRecord,
} from "../../shared/types";

export default function ProgressScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const { theme } = useTheme();

  const [history, setHistory] = useState<WeeklyHistory[]>([]);
  const [streakData, setStreakData] = useState<StreakData>({
    currentStreak: 0,
    bestStreak: 0,
  });
  const [milestoneRecords, setMilestoneRecords] = useState<MilestoneRecord[]>(
    [],
  );
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const weekDates = getWeekDates();

  const loadHistory = useCallback(async () => {
    try {
      const [data, streak, milestones] = await Promise.all([
        getWeeklyHistory(),
        getStreakData(),
        getMilestoneRecords(),
      ]);
      setHistory(data);
      setStreakData(streak);
      setMilestoneRecords(milestones);
    } catch (error) {
      console.error("Failed to load history:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadHistory();
    setRefreshing(false);
  };

  const thisWeekHistory = history.filter((h) => weekDates.includes(h.date));
  const perfectDays = thisWeekHistory.filter(
    (h) => h.completionPercentage === 100,
  ).length;

  const hasAnyHistory = history.length > 0;

  if (loading) {
    return (
      <View
        style={[
          styles.loadingContainer,
          { backgroundColor: theme.backgroundRoot },
        ]}
      >
        <ThemedText type="body" style={{ color: theme.textSecondary }}>
          Loading...
        </ThemedText>
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.backgroundRoot }]}
      contentContainerStyle={{
        paddingTop: headerHeight + Spacing.lg,
        paddingBottom: tabBarHeight + Spacing.xl,
        paddingHorizontal: Spacing.lg,
        flexGrow: 1,
      }}
      scrollIndicatorInsets={{ bottom: insets.bottom }}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
      }
      showsVerticalScrollIndicator={false}
    >
      {hasAnyHistory ? (
        <>
          <View
            style={[
              styles.summaryCard,
              {
                backgroundColor: theme.backgroundDefault,
                borderColor: theme.border,
              },
            ]}
          >
            <ThemedText type="small" style={{ color: theme.textSecondary }}>
              This Week
            </ThemedText>
            <View style={styles.summaryContent}>
              <ThemedText
                type="h1"
                style={[styles.bigNumber, { color: theme.success }]}
              >
                {perfectDays}
              </ThemedText>
              <ThemedText type="h3" style={{ color: theme.textSecondary }}>
                / 7 days at 100%
              </ThemedText>
            </View>
            <ThemedText type="small" style={{ color: theme.textSecondary }}>
              {perfectDays === 7
                ? "Perfect week! Amazing work!"
                : perfectDays >= 5
                  ? "Great progress! Keep it up!"
                  : perfectDays >= 3
                    ? "Good start! You can do more!"
                    : "Every movement counts!"}
            </ThemedText>
          </View>

          <View
            style={[
              styles.streakCard,
              {
                backgroundColor: theme.backgroundDefault,
                borderColor: theme.border,
              },
            ]}
          >
            <ThemedText type="small" style={{ color: theme.textSecondary }}>
              Streak
            </ThemedText>
            <View style={styles.streakContent}>
              <ThemedText
                type="h1"
                style={[styles.bigNumber, { color: theme.primary }]}
              >
                {streakData.currentStreak}
              </ThemedText>
              <ThemedText type="h3" style={{ color: theme.textSecondary }}>
                {streakData.currentStreak === 1 ? " day" : " days"}
              </ThemedText>
            </View>
            <ThemedText type="small" style={{ color: theme.textSecondary }}>
              Best: {streakData.bestStreak}{" "}
              {streakData.bestStreak === 1 ? "day" : "days"}
            </ThemedText>
          </View>

          <View style={styles.section}>
            <ThemedText type="h3" style={styles.sectionTitle}>
              Weekly Overview
            </ThemedText>
            <View
              style={[
                styles.gridCard,
                {
                  backgroundColor: theme.backgroundDefault,
                  borderColor: theme.border,
                },
              ]}
            >
              <WeeklyGrid weekDates={weekDates} history={history} />
            </View>
          </View>

          {milestoneRecords.length > 0 && (
            <View style={styles.section}>
              <ThemedText type="h3" style={styles.sectionTitle}>
                Milestones
              </ThemedText>
              {MILESTONES.filter((m) =>
                milestoneRecords.some((r) => r.id === m.id),
              ).map((m) => {
                const record = milestoneRecords.find((r) => r.id === m.id)!;
                return (
                  <View
                    key={m.id}
                    style={[
                      styles.milestoneRow,
                      {
                        backgroundColor: theme.backgroundDefault,
                        borderColor: theme.border,
                      },
                    ]}
                  >
                    <ThemedText type="body">{m.label}</ThemedText>
                    <ThemedText
                      type="small"
                      style={{ color: theme.textSecondary }}
                    >
                      {new Date(record.unlockedAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </ThemedText>
                  </View>
                );
              })}
            </View>
          )}

          <View style={styles.section}>
            <ThemedText type="h3" style={styles.sectionTitle}>
              Recent Activity
            </ThemedText>
            {history.slice(0, 7).map((entry) => (
              <View
                key={entry.date}
                style={[
                  styles.historyRow,
                  {
                    backgroundColor: theme.backgroundDefault,
                    borderColor: theme.border,
                  },
                ]}
              >
                <View>
                  <ThemedText type="body">
                    {new Date(entry.date).toLocaleDateString("en-US", {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                    })}
                  </ThemedText>
                  <ThemedText
                    type="small"
                    style={{ color: theme.textSecondary }}
                  >
                    {entry.completedActivities} of {entry.totalActivities}{" "}
                    activities
                  </ThemedText>
                </View>
                <View
                  style={[
                    styles.percentageBadge,
                    {
                      backgroundColor:
                        entry.completionPercentage === 100
                          ? theme.success
                          : entry.completionPercentage > 50
                            ? theme.primary
                            : theme.backgroundSecondary,
                    },
                  ]}
                >
                  <ThemedText
                    type="body"
                    style={{
                      color:
                        entry.completionPercentage > 50
                          ? "#FFFFFF"
                          : theme.text,
                      fontWeight: "600",
                    }}
                  >
                    {entry.completionPercentage}%
                  </ThemedText>
                </View>
              </View>
            ))}
          </View>
        </>
      ) : (
        <EmptyState
          image={require("../../assets/images/empty-progress.png")}
          title="No progress yet"
          message="Complete your first activity snacks to start tracking your progress!"
        />
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  summaryCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    marginBottom: Spacing.lg,
  },
  summaryContent: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: Spacing.sm,
    marginVertical: Spacing.sm,
  },
  streakCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    marginBottom: Spacing.lg,
  },
  streakContent: {
    flexDirection: "row",
    alignItems: "baseline",
    marginVertical: Spacing.sm,
  },
  milestoneRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    marginBottom: Spacing.sm,
  },
  bigNumber: {
    fontSize: 48,
    lineHeight: 52,
  },
  section: {
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    marginBottom: Spacing.md,
  },
  gridCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
  },
  historyRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    marginBottom: Spacing.sm,
  },
  percentageBadge: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
});
