import React, { useState, useEffect, useCallback } from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import MainTabNavigator from "@/navigation/MainTabNavigator";
import OnboardingScreen from "@/screens/OnboardingScreen";
import { useScreenOptions } from "@/hooks/useScreenOptions";
import { hasSeenOnboarding } from "@/lib/storage";

export type RootStackParamList = {
  Onboarding: undefined;
  Main: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootStackNavigator() {
  const screenOptions = useScreenOptions();
  const [checked, setChecked] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    hasSeenOnboarding().then((seen) => {
      setShowOnboarding(!seen);
      setChecked(true);
    });
  }, []);

  const handleOnboardingComplete = useCallback(() => {
    setShowOnboarding(false);
  }, []);

  if (!checked) return null;

  return (
    <Stack.Navigator screenOptions={screenOptions}>
      {showOnboarding && (
        <Stack.Screen
          name="Onboarding"
          options={{ headerShown: false, gestureEnabled: false }}
        >
          {() => <OnboardingScreen onComplete={handleOnboardingComplete} />}
        </Stack.Screen>
      )}
      <Stack.Screen
        name="Main"
        component={MainTabNavigator}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
}
