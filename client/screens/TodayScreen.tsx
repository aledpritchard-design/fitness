import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  StyleSheet,
  FlatList,
  Pressable,
  RefreshControl,
  Modal,
  ScrollView,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Platform } from "react-native";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Button } from "@/components/Button";
import { ProgressBar } from "@/components/ProgressBar";
import { ActivityCard } from "@/components/ActivityCard";
import { EmptyState } from "@/components/EmptyState";
import { DebugPanel } from "@/components/DebugPanel";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";
import {
  getDailyPlan,
  saveDailyPlan,
  updateActivityCompletion,
  getSettings,
  getCachedActivities,
  getTodayDateString,
  clearTodayPlan,
  cacheActivities,
  addDebugLog,
} from "@/lib/storage";
import { generateDailyPlan } from "@/lib/planGenerator";
import {
  scheduleHourlyNotifications,
  scheduleCompletionNotification,
  requestNotificationPermissions,
} from "@/lib/notifications";
import { getApiUrl } from "@/lib/query-client";
import type { DailyPlan, DailyPlanActivity, Activity } from "../../shared/types";

export default function TodayScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const { theme } = useTheme();

  const [plan, setPlan] = useState<DailyPlan | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [debugVisible, setDebugVisible] = useState(false);
  const [selectedActivity, setSelectedActivity] =
    useState<DailyPlanActivity | null>(null);

  const today = getTodayDateString();

  const loadData = useCallback(async () => {
    try {
      const [cachedActivities, todayPlan] = await Promise.all([
        getCachedActivities(),
        getDailyPlan(today),
      ]);

      if (cachedActivities.length === 0) {
        await fetchActivitiesFromServer();
      } else {
        setActivities(cachedActivities);
      }

      setPlan(todayPlan);
    } catch (error) {
      console.error("Failed to load data:", error);
      await addDebugLog("error", "Failed to load data", {
        error: String(error),
      });
    } finally {
      setLoading(false);
    }
  }, [today]);

  const fetchActivitiesFromServer = async () => {
    try {
      const baseUrl = getApiUrl();
      const response = await fetch(new URL("/api/activities", baseUrl).href);
      if (response.ok) {
        const data = await response.json();
        setActivities(data.activities);
        await cacheActivities(data.activities, data.catalogueVersion);
        await addDebugLog("info", "Activities fetched from server", {
          count: data.activities.length,
          version: data.catalogueVersion,
        });
      }
    } catch (error) {
      console.error("Failed to fetch activities:", error);
      await addDebugLog("error", "Failed to fetch activities", {
        error: String(error),
      });
    }
  };

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchActivitiesFromServer();
    await loadData();
    setRefreshing(false);
  };

  const handleGeneratePlan = async () => {
    if (activities.length === 0) {
      await fetchActivitiesFromServer();
      const cached = await getCachedActivities();
      if (cached.length === 0) return;
      setActivities(cached);
    }

    setGenerating(true);
    try {
      const settings = await getSettings();
      const newPlan = generateDailyPlan(activities, today, settings.difficulty);
      await saveDailyPlan(newPlan);
      setPlan(newPlan);

      if (settings.notificationsEnabled) {
        const hasPermission = await requestNotificationPermissions();
        if (hasPermission) {
          await scheduleHourlyNotifications(newPlan.activities, settings);
        }
      }

      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (error) {
      console.error("Failed to generate plan:", error);
      await addDebugLog("error", "Failed to generate plan", {
        error: String(error),
      });
    } finally {
      setGenerating(false);
    }
  };

  const handleToggleActivity = async (
    activityId: string,
    completed: boolean,
  ) => {
    const updatedPlan = await updateActivityCompletion(
      today,
      activityId,
      completed,
    );
    if (updatedPlan) {
      setPlan(updatedPlan);

      const allCompleted = updatedPlan.activities.every((a) => a.completed);
      if (allCompleted) {
        await scheduleCompletionNotification();
      } else {
        const settings = await getSettings();
        if (settings.notificationsEnabled) {
          await scheduleHourlyNotifications(updatedPlan.activities, settings);
        }
      }
    }
  };

  const handleResetToday = async () => {
    await clearTodayPlan(today);
    setPlan(null);
    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    }
  };

  const completedCount = plan?.activities.filter((a) => a.completed).length ?? 0;
  const totalCount = plan?.activities.length ?? 0;
  const completionPercentage =
    totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const [debugMode, setDebugMode] = useState(false);

  useEffect(() => {
    getSettings().then((s) => setDebugMode(s.debugMode));
  }, []);

  const renderItem = ({ item }: { item: DailyPlanActivity }) => (
    <ActivityCard
      item={item}
      onToggle={handleToggleActivity}
      onInfo={setSelectedActivity}
    />
  );

  const renderEmptyState = () => (
    <EmptyState
      image={require("../../assets/images/empty-today.png")}
      title="No snacks yet"
      message="Generate your activity snacks for today and start moving!"
    />
  );

  const renderHeader = () => (
    <View style={styles.header}>
      <View
        style={[
          styles.progressCard,
          { backgroundColor: theme.backgroundDefault, borderColor: theme.border },
        ]}
      >
        <View style={styles.progressHeader}>
          <ThemedText type="small" style={{ color: theme.textSecondary }}>
            Daily Completion
          </ThemedText>
          <ThemedText
            type="h1"
            style={[styles.percentage, { color: theme.primary }]}
          >
            {completionPercentage}%
          </ThemedText>
        </View>
        <ProgressBar progress={completionPercentage} height={8} />
        <ThemedText
          type="small"
          style={[styles.progressSubtext, { color: theme.textSecondary }]}
        >
          {completedCount} of {totalCount} activities completed
        </ThemedText>
      </View>

      {plan && plan.activities.length > 0 ? (
        <ThemedText type="h3" style={styles.sectionTitle}>
          Today's Snacks
        </ThemedText>
      ) : null}
    </View>
  );

  const renderFooter = () => {
    if (!plan) {
      return (
        <View style={styles.footer}>
          <Button onPress={handleGeneratePlan} disabled={generating}>
            {generating ? "Generating..." : "Generate Today's Plan"}
          </Button>
        </View>
      );
    }

    if (debugMode) {
      return (
        <View style={styles.footer}>
          <Button
            onPress={handleResetToday}
            style={{ backgroundColor: theme.destructive }}
          >
            Reset Today (Debug)
          </Button>
        </View>
      );
    }

    return null;
  };

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
    <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
      <FlatList
        data={plan?.activities ?? []}
        renderItem={renderItem}
        keyExtractor={(item) => item.activityId}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmptyState}
        ListFooterComponent={renderFooter}
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
      />

      <Modal
        visible={selectedActivity !== null}
        animationType="slide"
        transparent
        onRequestClose={() => setSelectedActivity(null)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setSelectedActivity(null)}
        >
          <ThemedView style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <ThemedText type="h2">
                {selectedActivity?.activity.name}
              </ThemedText>
              <Pressable
                onPress={() => setSelectedActivity(null)}
                hitSlop={12}
              >
                <Feather name="x" size={24} color={theme.text} />
              </Pressable>
            </View>

            <ScrollView style={styles.modalBody}>
              <View style={styles.modalSection}>
                <ThemedText type="h4" style={styles.modalSectionTitle}>
                  Instructions
                </ThemedText>
                <ThemedText type="body">
                  {selectedActivity?.activity.instructions}
                </ThemedText>
              </View>

              {selectedActivity?.activity.contraindications ? (
                <View
                  style={[
                    styles.warningBox,
                    { backgroundColor: theme.destructive + "15" },
                  ]}
                >
                  <View style={styles.warningHeader}>
                    <Feather
                      name="alert-triangle"
                      size={18}
                      color={theme.destructive}
                    />
                    <ThemedText
                      type="h4"
                      style={[
                        styles.warningTitle,
                        { color: theme.destructive },
                      ]}
                    >
                      Safety Note
                    </ThemedText>
                  </View>
                  <ThemedText type="body">
                    {selectedActivity?.activity.contraindications}
                  </ThemedText>
                </View>
              ) : null}

              <View style={styles.metaInfo}>
                <View style={styles.metaRow}>
                  <ThemedText
                    type="small"
                    style={{ color: theme.textSecondary }}
                  >
                    Category
                  </ThemedText>
                  <ThemedText type="body" style={{ textTransform: "capitalize" }}>
                    {selectedActivity?.activity.category}
                  </ThemedText>
                </View>
                <View style={styles.metaRow}>
                  <ThemedText
                    type="small"
                    style={{ color: theme.textSecondary }}
                  >
                    Intensity
                  </ThemedText>
                  <ThemedText type="body">
                    {selectedActivity?.activity.intensity}/5
                  </ThemedText>
                </View>
                <View style={styles.metaRow}>
                  <ThemedText
                    type="small"
                    style={{ color: theme.textSecondary }}
                  >
                    Equipment
                  </ThemedText>
                  <ThemedText type="body" style={{ textTransform: "capitalize" }}>
                    {selectedActivity?.activity.equipment}
                  </ThemedText>
                </View>
              </View>
            </ScrollView>
          </ThemedView>
        </Pressable>
      </Modal>

      <DebugPanel visible={debugVisible} onClose={() => setDebugVisible(false)} />
    </View>
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
  header: {
    marginBottom: Spacing.md,
  },
  progressCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    marginBottom: Spacing.lg,
  },
  progressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginBottom: Spacing.md,
  },
  percentage: {
    fontSize: 36,
    lineHeight: 40,
  },
  progressSubtext: {
    marginTop: Spacing.sm,
  },
  sectionTitle: {
    marginTop: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  footer: {
    paddingTop: Spacing.lg,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.1)",
  },
  modalBody: {
    padding: Spacing.lg,
  },
  modalSection: {
    marginBottom: Spacing.lg,
  },
  modalSectionTitle: {
    marginBottom: Spacing.sm,
  },
  warningBox: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.lg,
  },
  warningHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.sm,
    gap: Spacing.sm,
  },
  warningTitle: {
    fontWeight: "600",
  },
  metaInfo: {
    gap: Spacing.sm,
  },
  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
});
