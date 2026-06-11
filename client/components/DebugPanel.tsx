import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  Modal,
  ScrollView,
  Pressable,
  Text,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import Constants from "expo-constants";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, Fonts } from "@/constants/theme";
import {
  getDebugLogs,
  getCatalogueVersion,
  resetOnboarding,
} from "@/lib/storage";
import type { DebugLog } from "../../shared/types";

interface DebugPanelProps {
  visible: boolean;
  onClose: () => void;
}

export function DebugPanel({ visible, onClose }: DebugPanelProps) {
  const { theme } = useTheme();
  const [logs, setLogs] = useState<DebugLog[]>([]);
  const [catalogueVersion, setCatalogueVersion] = useState<string | null>(null);
  const [onboardingResetDone, setOnboardingResetDone] = useState(false);

  useEffect(() => {
    if (visible) {
      loadDebugInfo();
    }
  }, [visible]);

  const loadDebugInfo = async () => {
    const [logsData, version] = await Promise.all([
      getDebugLogs(),
      getCatalogueVersion(),
    ]);
    setLogs(logsData);
    setCatalogueVersion(version);
  };

  const appVersion = Constants.expoConfig?.version ?? "1.0.0";

  const getLevelColor = (level: DebugLog["level"]) => {
    switch (level) {
      case "error":
        return theme.destructive;
      case "warn":
        return "#FFA000";
      default:
        return theme.textSecondary;
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <ThemedView style={styles.container}>
          <View style={styles.header}>
            <ThemedText type="h2">Debug Panel</ThemedText>
            <Pressable onPress={onClose} hitSlop={12}>
              <Feather name="x" size={24} color={theme.text} />
            </Pressable>
          </View>

          <ScrollView style={styles.content}>
            <View style={styles.section}>
              <ThemedText type="h4" style={styles.sectionTitle}>
                App Info
              </ThemedText>
              <View
                style={[
                  styles.infoCard,
                  { backgroundColor: theme.backgroundDefault },
                ]}
              >
                <View style={styles.infoRow}>
                  <ThemedText
                    type="small"
                    style={{ color: theme.textSecondary }}
                  >
                    App Version
                  </ThemedText>
                  <ThemedText type="body">{appVersion}</ThemedText>
                </View>
                <View style={styles.infoRow}>
                  <ThemedText
                    type="small"
                    style={{ color: theme.textSecondary }}
                  >
                    Catalogue Version
                  </ThemedText>
                  <ThemedText type="body">
                    {catalogueVersion ?? "Not loaded"}
                  </ThemedText>
                </View>
              </View>
            </View>

            <View style={styles.section}>
              <ThemedText type="h4" style={styles.sectionTitle}>
                Actions
              </ThemedText>
              <Pressable
                onPress={async () => {
                  await resetOnboarding();
                  setOnboardingResetDone(true);
                }}
                style={[
                  styles.actionButton,
                  { backgroundColor: theme.backgroundDefault },
                ]}
              >
                <ThemedText type="small">
                  {onboardingResetDone
                    ? "Onboarding reset — restart app to see it"
                    : "Reset onboarding"}
                </ThemedText>
              </Pressable>
            </View>

            <View style={styles.section}>
              <ThemedText type="h4" style={styles.sectionTitle}>
                Recent Logs ({logs.length})
              </ThemedText>
              <View
                style={[
                  styles.logsContainer,
                  { backgroundColor: theme.backgroundDefault },
                ]}
              >
                {logs.length === 0 ? (
                  <ThemedText
                    type="small"
                    style={{ color: theme.textSecondary, padding: Spacing.md }}
                  >
                    No logs yet
                  </ThemedText>
                ) : (
                  logs.slice(0, 50).map((log, index) => (
                    <View
                      key={`${log.timestamp}-${index}`}
                      style={[
                        styles.logEntry,
                        index < logs.length - 1 && {
                          borderBottomWidth: 1,
                          borderBottomColor: theme.border,
                        },
                      ]}
                    >
                      <View style={styles.logHeader}>
                        <Text
                          style={[
                            styles.logLevel,
                            { color: getLevelColor(log.level) },
                          ]}
                        >
                          [{log.level.toUpperCase()}]
                        </Text>
                        <Text
                          style={[
                            styles.logTime,
                            { color: theme.textSecondary },
                          ]}
                        >
                          {formatTimestamp(log.timestamp)}
                        </Text>
                      </View>
                      <Text style={[styles.logMessage, { color: theme.text }]}>
                        {log.message}
                      </Text>
                      {log.data ? (
                        <Text
                          style={[
                            styles.logData,
                            { color: theme.textSecondary },
                          ]}
                        >
                          {JSON.stringify(log.data, null, 2)}
                        </Text>
                      ) : null}
                    </View>
                  ))
                )}
              </View>
            </View>
          </ScrollView>
        </ThemedView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  container: {
    height: "90%",
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.1)",
  },
  content: {
    flex: 1,
    padding: Spacing.lg,
  },
  section: {
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    marginBottom: Spacing.sm,
  },
  infoCard: {
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
  },
  actionButton: {
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: Spacing.xs,
  },
  logsContainer: {
    borderRadius: BorderRadius.md,
    overflow: "hidden",
  },
  logEntry: {
    padding: Spacing.sm,
  },
  logHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: Spacing.xs,
  },
  logLevel: {
    fontSize: 10,
    fontWeight: "700",
    fontFamily: Fonts?.mono || "monospace",
  },
  logTime: {
    fontSize: 10,
    fontFamily: Fonts?.mono || "monospace",
  },
  logMessage: {
    fontSize: 12,
    lineHeight: 16,
  },
  logData: {
    fontSize: 10,
    lineHeight: 14,
    marginTop: Spacing.xs,
    fontFamily: Fonts?.mono || "monospace",
  },
});
