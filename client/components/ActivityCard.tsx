import React from "react";
import { View, StyleSheet, Pressable, Platform } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useReducedMotion,
  withSpring,
  withSequence,
  WithSpringConfig,
} from "react-native-reanimated";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";
import type { DailyPlanActivity } from "../../shared/types";

interface ActivityCardProps {
  item: DailyPlanActivity;
  onToggle: (activityId: string, completed: boolean) => void;
  onInfo: (item: DailyPlanActivity) => void;
}

// Tight spring for card press — no overshoot so it feels planted
const cardPressSpring: WithSpringConfig = {
  damping: 15,
  mass: 0.3,
  stiffness: 150,
  overshootClamping: true,
};

// Lively spring for the checkbox pop — small overshoot makes completion feel earned
const checkBounceSpring: WithSpringConfig = {
  damping: 10,
  mass: 0.2,
  stiffness: 200,
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function ActivityCard({ item, onToggle, onInfo }: ActivityCardProps) {
  const { theme } = useTheme();
  const reducedMotion = useReducedMotion();
  const scale = useSharedValue(1);
  const checkScale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const checkAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: checkScale.value }],
  }));

  const handlePressIn = () => {
    if (!reducedMotion) scale.value = withSpring(0.97, cardPressSpring);
  };

  const handlePressOut = () => {
    if (!reducedMotion) scale.value = withSpring(1, cardPressSpring);
  };

  const handleToggle = () => {
    const newCompleted = !item.completed;
    if (newCompleted && Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    if (!reducedMotion) {
      checkScale.value = withSequence(
        withSpring(1.4, checkBounceSpring),
        withSpring(1, checkBounceSpring),
      );
    }
    onToggle(item.activityId, newCompleted);
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "strength":
        return "#FF6B35";
      case "mobility":
        return "#00C853";
      case "cardio":
        return "#FF5252";
      case "posture":
        return "#7C4DFF";
      default:
        return theme.textSecondary;
    }
  };

  return (
    <AnimatedPressable
      onPress={handleToggle}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[
        styles.container,
        {
          backgroundColor: theme.backgroundDefault,
          borderColor: theme.border,
          opacity: item.completed ? 0.7 : 1,
        },
        animatedStyle,
      ]}
      accessibilityRole="checkbox"
      accessibilityLabel={`${item.activity.name}, ${item.activity.defaultRepsOrTime}`}
      accessibilityState={{ checked: item.completed }}
      testID={`activity-card-${item.activityId}`}
    >
      <View style={styles.leftSection}>
        <Animated.View
          style={[
            styles.checkbox,
            {
              borderColor: item.completed ? theme.success : theme.border,
              backgroundColor: item.completed ? theme.success : "transparent",
            },
            checkAnimatedStyle,
          ]}
        >
          {item.completed ? (
            <Feather name="check" size={14} color="#FFFFFF" />
          ) : null}
        </Animated.View>
      </View>

      <View style={styles.content}>
        <View style={styles.titleRow}>
          <ThemedText
            type="h4"
            style={[styles.title, item.completed && styles.completedText]}
          >
            {item.activity.name}
          </ThemedText>
        </View>
        <View style={styles.metaRow}>
          <View
            style={[
              styles.categoryBadge,
              {
                backgroundColor:
                  getCategoryColor(item.activity.category) + "20",
              },
            ]}
          >
            <ThemedText
              type="small"
              style={[
                styles.categoryText,
                { color: getCategoryColor(item.activity.category) },
              ]}
            >
              {item.activity.category}
            </ThemedText>
          </View>
          <ThemedText type="small" style={{ color: theme.textSecondary }}>
            {item.activity.defaultRepsOrTime}
          </ThemedText>
        </View>
      </View>

      <Pressable
        onPress={() => onInfo(item)}
        style={({ pressed }) => [
          styles.infoButton,
          { opacity: pressed ? 0.5 : 1 },
        ]}
        hitSlop={12}
        testID={`info-button-${item.activityId}`}
      >
        <Feather name="info" size={18} color={theme.textSecondary} />
      </Pressable>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    marginBottom: Spacing.sm,
  },
  leftSection: {
    marginRight: Spacing.md,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: BorderRadius.full,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    flex: 1,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.xs,
  },
  title: {
    flex: 1,
  },
  completedText: {
    textDecorationLine: "line-through",
    opacity: 0.6,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  categoryBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.xs,
  },
  categoryText: {
    fontSize: 11,
    fontWeight: "600",
    textTransform: "uppercase",
  },
  infoButton: {
    padding: Spacing.xs,
  },
});
