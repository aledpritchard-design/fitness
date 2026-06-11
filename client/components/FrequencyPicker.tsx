import React, { useState } from "react";
import { View, StyleSheet, Pressable, Modal, ScrollView } from "react-native";
import { Feather } from "@expo/vector-icons";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";
import type { AppSettings } from "../../shared/types";

type Frequency = AppSettings["frequency"];

const FREQUENCY_OPTIONS: { value: Frequency; label: string }[] = [
  { value: "hourly", label: "Every hour" },
  { value: "every-2h", label: "Every 2 hours" },
  { value: "every-3h", label: "Every 3 hours" },
];

interface FrequencyPickerProps {
  value: Frequency;
  onChange: (value: Frequency) => void;
}

export function FrequencyPicker({ value, onChange }: FrequencyPickerProps) {
  const { theme } = useTheme();
  const [isModalVisible, setIsModalVisible] = useState(false);

  const selectedLabel =
    FREQUENCY_OPTIONS.find((o) => o.value === value)?.label ?? "Every hour";

  return (
    <>
      <Pressable
        onPress={() => setIsModalVisible(true)}
        style={({ pressed }) => [
          styles.container,
          {
            backgroundColor: theme.backgroundDefault,
            borderColor: theme.border,
            opacity: pressed ? 0.7 : 1,
          },
        ]}
      >
        <ThemedText type="body" style={styles.label}>
          Frequency
        </ThemedText>
        <View style={styles.valueContainer}>
          <ThemedText type="body" style={{ color: theme.primary }}>
            {selectedLabel}
          </ThemedText>
          <Feather
            name="chevron-down"
            size={20}
            color={theme.textSecondary}
            style={{ marginLeft: Spacing.xs }}
          />
        </View>
      </Pressable>

      <Modal
        visible={isModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsModalVisible(false)}
      >
        <Pressable
          style={styles.overlay}
          onPress={() => setIsModalVisible(false)}
        >
          <ThemedView style={styles.modal}>
            <View style={styles.modalHeader}>
              <ThemedText type="h3">Frequency</ThemedText>
              <Pressable onPress={() => setIsModalVisible(false)} hitSlop={12}>
                <Feather name="x" size={24} color={theme.text} />
              </Pressable>
            </View>
            <ScrollView style={styles.scrollView}>
              {FREQUENCY_OPTIONS.map((option) => (
                <Pressable
                  key={option.value}
                  onPress={() => {
                    onChange(option.value);
                    setIsModalVisible(false);
                  }}
                  style={({ pressed }) => [
                    styles.option,
                    {
                      backgroundColor:
                        option.value === value
                          ? theme.primary + "20"
                          : pressed
                            ? theme.backgroundSecondary
                            : "transparent",
                    },
                  ]}
                >
                  <ThemedText
                    type="body"
                    style={[
                      option.value === value && {
                        color: theme.primary,
                        fontWeight: "600",
                      },
                    ]}
                  >
                    {option.label}
                  </ThemedText>
                  {option.value === value ? (
                    <Feather name="check" size={20} color={theme.primary} />
                  ) : null}
                </Pressable>
              ))}
            </ScrollView>
          </ThemedView>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    marginBottom: Spacing.sm,
  },
  label: {
    flex: 1,
  },
  valueContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.lg,
  },
  modal: {
    width: "100%",
    maxWidth: 320,
    borderRadius: BorderRadius.lg,
    overflow: "hidden",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.1)",
  },
  scrollView: {
    maxHeight: 300,
  },
  option: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: Spacing.md,
  },
});
