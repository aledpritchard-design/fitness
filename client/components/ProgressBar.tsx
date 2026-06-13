import React, { useEffect } from "react";
import { View, StyleSheet } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useReducedMotion,
  withTiming,
  Easing,
} from "react-native-reanimated";

import { useTheme } from "@/hooks/useTheme";
import { BorderRadius } from "@/constants/theme";

interface ProgressBarProps {
  progress: number;
  height?: number;
}

export function ProgressBar({ progress, height = 8 }: ProgressBarProps) {
  const { theme } = useTheme();
  const reducedMotion = useReducedMotion();
  const animatedWidth = useSharedValue(0);

  useEffect(() => {
    const target = Math.min(Math.max(progress, 0), 100);
    if (reducedMotion) {
      animatedWidth.value = target;
    } else {
      animatedWidth.value = withTiming(target, {
        duration: 500,
        easing: Easing.out(Easing.cubic),
      });
    }
  }, [progress, animatedWidth, reducedMotion]);

  const animatedStyle = useAnimatedStyle(() => ({
    width: `${animatedWidth.value}%`,
  }));

  return (
    <View
      accessible={true}
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: 100, now: progress }}
      accessibilityLabel={`${progress}% complete`}
      style={[
        styles.container,
        { height, backgroundColor: theme.backgroundSecondary },
      ]}
    >
      <Animated.View
        style={[
          styles.fill,
          { backgroundColor: theme.primary, height },
          animatedStyle,
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    borderRadius: BorderRadius.full,
    overflow: "hidden",
  },
  fill: {
    borderRadius: BorderRadius.full,
  },
});
