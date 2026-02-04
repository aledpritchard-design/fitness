import React, { useState, useEffect, useCallback } from "react";
import { View, StyleSheet, ScrollView, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Platform } from "react-native";

import { ThemedText } from "@/components/ThemedText";
import { SettingsRow } from "@/components/SettingsRow";
import { TimePicker } from "@/components/TimePicker";
import { DebugPanel } from "@/components/DebugPanel";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";
import {
  getSettings,
  saveSettings,
  cacheActivities,
  addDebugLog,
  getDebugLogs,
  getCatalogueVersion,
} from "@/lib/storage";
import {
  requestNotificationPermissions,
  cancelAllNotifications,
} from "@/lib/notifications";
import { getApiUrl } from "@/lib/query-client";
import type { AppSettings } from "../../shared/types";
import { DEFAULT_SETTINGS } from "../../shared/types";

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const { theme } = useTheme();

  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [refreshingCatalogue, setRefreshingCatalogue] = useState(false);
  const [debugVisible, setDebugVisible] = useState(false);

  const loadSettings = useCallback(async () => {
    try {
      const data = await getSettings();
      setSettings(data);
    } catch (error) {
      console.error("Failed to load settings:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const updateSetting = async <K extends keyof AppSettings>(
    key: K,
    value: AppSettings[K],
  ) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    await saveSettings(newSettings);

    if (key === "notificationsEnabled" && value === true) {
      const hasPermission = await requestNotificationPermissions();
      if (!hasPermission) {
        const revertedSettings = { ...newSettings, notificationsEnabled: false };
        setSettings(revertedSettings);
        await saveSettings(revertedSettings);
      }
    }

    if (key === "notificationsEnabled" && value === false) {
      await cancelAllNotifications();
    }

    if (Platform.OS !== "web") {
      Haptics.selectionAsync();
    }
  };

  const handleRefreshCatalogue = async () => {
    setRefreshingCatalogue(true);
    try {
      const baseUrl = getApiUrl();
      const response = await fetch(new URL("/api/activities", baseUrl).href);
      if (response.ok) {
        const data = await response.json();
        await cacheActivities(data.activities, data.catalogueVersion);
        await addDebugLog("info", "Catalogue refreshed", {
          count: data.activities.length,
          version: data.catalogueVersion,
        });
        if (Platform.OS !== "web") {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
      }
    } catch (error) {
      console.error("Failed to refresh catalogue:", error);
      await addDebugLog("error", "Failed to refresh catalogue", {
        error: String(error),
      });
    } finally {
      setRefreshingCatalogue(false);
    }
  };

  const handleSendDebugReport = async () => {
    try {
      const [logs, catalogueVersion] = await Promise.all([
        getDebugLogs(),
        getCatalogueVersion(),
      ]);

      const report = {
        appVersion: "1.0.0",
        catalogueVersion,
        settings,
        recentLogs: logs.slice(0, 50),
        timestamp: new Date().toISOString(),
      };

      const baseUrl = getApiUrl();
      await fetch(new URL("/api/log", baseUrl).href, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(report),
      });

      await addDebugLog("info", "Debug report sent");
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (error) {
      console.error("Failed to send debug report:", error);
      await addDebugLog("error", "Failed to send debug report", {
        error: String(error),
      });
    }
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
    <ScrollView
      style={[styles.container, { backgroundColor: theme.backgroundRoot }]}
      contentContainerStyle={{
        paddingTop: headerHeight + Spacing.lg,
        paddingBottom: tabBarHeight + Spacing.xl,
        paddingHorizontal: Spacing.lg,
      }}
      scrollIndicatorInsets={{ bottom: insets.bottom }}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.section}>
        <ThemedText type="h3" style={styles.sectionTitle}>
          Notifications
        </ThemedText>
        <SettingsRow
          type="toggle"
          label="Enable Notifications"
          value={settings.notificationsEnabled}
          onChange={(value) => updateSetting("notificationsEnabled", value)}
        />
        <TimePicker
          label="Start Time"
          value={settings.notificationStartHour}
          onChange={(value) => updateSetting("notificationStartHour", value)}
          minValue={5}
          maxValue={settings.notificationEndHour - 1}
        />
        <TimePicker
          label="End Time"
          value={settings.notificationEndHour}
          onChange={(value) => updateSetting("notificationEndHour", value)}
          minValue={settings.notificationStartHour + 1}
          maxValue={23}
        />
        <SettingsRow type="value" label="Frequency" value="Hourly" />
      </View>

      <View style={styles.section}>
        <ThemedText type="h3" style={styles.sectionTitle}>
          Difficulty
        </ThemedText>
        <View style={styles.difficultyContainer}>
          {(["easy", "medium", "hard"] as const).map((level) => (
            <Pressable
              key={level}
              onPress={() => {
                if (level === "easy") {
                  updateSetting("difficulty", level);
                }
              }}
              style={({ pressed }) => [
                styles.difficultyButton,
                {
                  backgroundColor:
                    settings.difficulty === level
                      ? theme.primary
                      : theme.backgroundDefault,
                  borderColor:
                    settings.difficulty === level ? theme.primary : theme.border,
                  opacity:
                    level !== "easy" ? 0.5 : pressed ? 0.8 : 1,
                },
              ]}
              disabled={level !== "easy"}
            >
              <ThemedText
                type="body"
                style={{
                  color:
                    settings.difficulty === level ? "#FFFFFF" : theme.text,
                  fontWeight: "600",
                  textTransform: "capitalize",
                }}
              >
                {level}
              </ThemedText>
              {level !== "easy" ? (
                <ThemedText
                  type="small"
                  style={{ color: theme.textSecondary, marginTop: 2 }}
                >
                  Coming soon
                </ThemedText>
              ) : null}
            </Pressable>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <ThemedText type="h3" style={styles.sectionTitle}>
          Data
        </ThemedText>
        <SettingsRow
          type="button"
          label={refreshingCatalogue ? "Refreshing..." : "Refresh Activity Catalogue"}
          onPress={handleRefreshCatalogue}
          disabled={refreshingCatalogue}
        />
        <SettingsRow
          type="button"
          label="Send Debug Report"
          onPress={handleSendDebugReport}
        />
      </View>

      <View style={styles.section}>
        <ThemedText type="h3" style={styles.sectionTitle}>
          Developer
        </ThemedText>
        <SettingsRow
          type="toggle"
          label="Debug Mode"
          value={settings.debugMode}
          onChange={(value) => updateSetting("debugMode", value)}
        />
        <SettingsRow
          type="button"
          label="View Debug Logs"
          onPress={() => setDebugVisible(true)}
        />
      </View>

      <View
        style={[
          styles.disclaimer,
          { backgroundColor: theme.backgroundDefault },
        ]}
      >
        <Feather
          name="alert-circle"
          size={16}
          color={theme.textSecondary}
          style={{ marginRight: Spacing.sm }}
        />
        <ThemedText
          type="small"
          style={[styles.disclaimerText, { color: theme.textSecondary }]}
        >
          This app is not medical advice. Consult a healthcare professional if you
          have injuries or health concerns. Stop any exercise if you feel pain.
        </ThemedText>
      </View>

      <DebugPanel visible={debugVisible} onClose={() => setDebugVisible(false)} />
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
  section: {
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    marginBottom: Spacing.md,
  },
  difficultyContainer: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  difficultyButton: {
    flex: 1,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    alignItems: "center",
  },
  disclaimer: {
    flexDirection: "row",
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.lg,
  },
  disclaimerText: {
    flex: 1,
    lineHeight: 18,
  },
});
