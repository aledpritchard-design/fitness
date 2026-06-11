import React, { useState } from "react";
import {
  View,
  StyleSheet,
  SafeAreaView,
  Pressable,
  Platform,
} from "react-native";

import { ThemedText } from "@/components/ThemedText";
import { Button } from "@/components/Button";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";
import { markOnboardingSeen } from "@/lib/storage";
import {
  requestNotificationPermissions,
  getNotificationPermissionStatus,
} from "@/lib/notifications";

interface OnboardingScreenProps {
  onComplete: () => void;
}

const STEPS = [
  {
    title: "Activity snacks",
    body: "Short, achievable movements throughout the day. A few reps here, a quick stretch there — it all adds up.",
  },
  {
    title: "Your daily plan",
    body: "Each day you get a fresh set of activities. Tap any card to tick it off. Aim for all of them, or as many as you can.",
  },
  {
    title: "Stay on track",
    body: "Allow reminders and Activity Snacks will nudge you at a pace you choose — so you never forget to move.",
  },
] as const;

export default function OnboardingScreen({ onComplete }: OnboardingScreenProps) {
  const { theme } = useTheme();
  const [step, setStep] = useState(0);

  const isLast = step === STEPS.length - 1;

  const finish = async () => {
    await markOnboardingSeen();
    onComplete();
  };

  const handleNext = () => {
    if (isLast) {
      finish();
    } else {
      setStep((s) => s + 1);
    }
  };

  const handleSkip = () => {
    finish();
  };

  const handleAllowReminders = async () => {
    const status = await getNotificationPermissionStatus();
    if (status === "undetermined" && Platform.OS !== "web") {
      await requestNotificationPermissions();
    }
    finish();
  };

  const current = STEPS[step];

  return (
    <SafeAreaView
      style={[styles.root, { backgroundColor: theme.backgroundRoot }]}
    >
      <View style={styles.skipRow}>
        {!isLast ? (
          <Pressable
            onPress={handleSkip}
            hitSlop={12}
            accessibilityLabel="Skip onboarding"
          >
            <ThemedText type="small" style={{ color: theme.textSecondary }}>
              Skip
            </ThemedText>
          </Pressable>
        ) : (
          <View />
        )}
      </View>

      <View style={styles.content}>
        <ThemedText type="h1" style={styles.title}>
          {current.title}
        </ThemedText>
        <ThemedText
          type="body"
          style={[styles.body, { color: theme.textSecondary }]}
        >
          {current.body}
        </ThemedText>
      </View>

      <View style={styles.footer}>
        <View style={styles.dots}>
          {STEPS.map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                {
                  backgroundColor:
                    i === step ? theme.primary : theme.border,
                  width: i === step ? 20 : 8,
                },
              ]}
            />
          ))}
        </View>

        {isLast ? (
          <>
            <Button onPress={handleAllowReminders} style={styles.button}>
              Allow reminders
            </Button>
            <Pressable
              onPress={finish}
              style={styles.secondaryAction}
              hitSlop={12}
              accessibilityLabel="Skip reminders and continue"
            >
              <ThemedText type="small" style={{ color: theme.textSecondary }}>
                Maybe later
              </ThemedText>
            </Pressable>
          </>
        ) : (
          <Button onPress={handleNext} style={styles.button}>
            Next
          </Button>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
  },
  skipRow: {
    alignItems: "flex-end",
    paddingTop: Spacing.md,
    minHeight: 36,
    justifyContent: "center",
  },
  content: {
    flex: 1,
    justifyContent: "center",
    gap: Spacing.lg,
  },
  title: {
    marginBottom: Spacing.xs,
  },
  body: {
    lineHeight: 26,
  },
  footer: {
    paddingBottom: Spacing["2xl"],
    gap: Spacing.md,
  },
  dots: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  dot: {
    height: 8,
    borderRadius: BorderRadius.full,
  },
  button: {
    width: "100%",
  },
  secondaryAction: {
    alignItems: "center",
    paddingVertical: Spacing.sm,
  },
});
