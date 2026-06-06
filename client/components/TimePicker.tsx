import React, { useState } from "react";
import { View, StyleSheet, Pressable, Modal, ScrollView } from "react-native";
import { Feather } from "@expo/vector-icons";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";

interface TimePickerProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  minValue?: number;
  maxValue?: number;
}

export function TimePicker({
  label,
  value,
  onChange,
  minValue = 0,
  maxValue = 23,
}: TimePickerProps) {
  const { theme } = useTheme();
  const [isModalVisible, setIsModalVisible] = useState(false);

  const formatHour = (hour: number) => {
    const period = hour >= 12 ? "PM" : "AM";
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return `${displayHour}:00 ${period}`;
  };

  const hours = Array.from(
    { length: maxValue - minValue + 1 },
    (_, i) => minValue + i,
  );

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
          {label}
        </ThemedText>
        <View style={styles.valueContainer}>
          <ThemedText type="body" style={{ color: theme.primary }}>
            {formatHour(value)}
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
              <ThemedText type="h3">{label}</ThemedText>
              <Pressable onPress={() => setIsModalVisible(false)} hitSlop={12}>
                <Feather name="x" size={24} color={theme.text} />
              </Pressable>
            </View>
            <ScrollView style={styles.scrollView}>
              {hours.map((hour) => (
                <Pressable
                  key={hour}
                  onPress={() => {
                    onChange(hour);
                    setIsModalVisible(false);
                  }}
                  style={({ pressed }) => [
                    styles.option,
                    {
                      backgroundColor:
                        hour === value
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
                      hour === value && {
                        color: theme.primary,
                        fontWeight: "600",
                      },
                    ]}
                  >
                    {formatHour(hour)}
                  </ThemedText>
                  {hour === value ? (
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
    maxHeight: 400,
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
