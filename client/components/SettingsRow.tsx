import React from "react";
import { View, StyleSheet, Switch, Pressable } from "react-native";
import { Feather } from "@expo/vector-icons";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";

interface SettingsRowToggleProps {
  type: "toggle";
  label: string;
  value: boolean;
  onChange: (value: boolean) => void;
  disabled?: boolean;
}

interface SettingsRowButtonProps {
  type: "button";
  label: string;
  onPress: () => void;
  destructive?: boolean;
  disabled?: boolean;
}

interface SettingsRowValueProps {
  type: "value";
  label: string;
  value: string;
  onPress?: () => void;
}

type SettingsRowProps =
  | SettingsRowToggleProps
  | SettingsRowButtonProps
  | SettingsRowValueProps;

export function SettingsRow(props: SettingsRowProps) {
  const { theme } = useTheme();

  if (props.type === "toggle") {
    return (
      <View
        style={[
          styles.container,
          {
            backgroundColor: theme.backgroundDefault,
            borderColor: theme.border,
          },
        ]}
      >
        <ThemedText type="body" style={styles.label}>
          {props.label}
        </ThemedText>
        <Switch
          value={props.value}
          onValueChange={props.onChange}
          trackColor={{ false: theme.backgroundSecondary, true: theme.primary }}
          thumbColor="#FFFFFF"
          disabled={props.disabled}
        />
      </View>
    );
  }

  if (props.type === "button") {
    return (
      <Pressable
        onPress={props.onPress}
        disabled={props.disabled}
        style={({ pressed }) => [
          styles.container,
          {
            backgroundColor: theme.backgroundDefault,
            borderColor: theme.border,
            opacity: pressed ? 0.7 : props.disabled ? 0.5 : 1,
          },
        ]}
      >
        <ThemedText
          type="body"
          style={[
            styles.label,
            props.destructive && { color: theme.destructive },
          ]}
        >
          {props.label}
        </ThemedText>
        <Feather
          name="chevron-right"
          size={20}
          color={props.destructive ? theme.destructive : theme.textSecondary}
        />
      </Pressable>
    );
  }

  return (
    <Pressable
      onPress={props.onPress}
      disabled={!props.onPress}
      style={({ pressed }) => [
        styles.container,
        {
          backgroundColor: theme.backgroundDefault,
          borderColor: theme.border,
          opacity: pressed && props.onPress ? 0.7 : 1,
        },
      ]}
    >
      <ThemedText type="body" style={styles.label}>
        {props.label}
      </ThemedText>
      <View style={styles.valueContainer}>
        <ThemedText type="body" style={{ color: theme.textSecondary }}>
          {props.value}
        </ThemedText>
        {props.onPress ? (
          <Feather
            name="chevron-right"
            size={20}
            color={theme.textSecondary}
            style={{ marginLeft: Spacing.xs }}
          />
        ) : null}
      </View>
    </Pressable>
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
});
