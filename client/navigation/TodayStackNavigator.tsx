import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Image, StyleSheet, View } from "react-native";

import TodayScreen from "@/screens/TodayScreen";
import { ThemedText } from "@/components/ThemedText";
import { useScreenOptions } from "@/hooks/useScreenOptions";
import { Spacing } from "@/constants/theme";

export type TodayStackParamList = {
  Today: undefined;
};

const Stack = createNativeStackNavigator<TodayStackParamList>();

function TodayHeaderTitle() {
  return (
    <View style={styles.headerContainer}>
      <Image
        source={require("../../assets/images/icon.png")}
        style={styles.icon}
        resizeMode="contain"
      />
      <ThemedText style={styles.title}>Activity Snacks</ThemedText>
    </View>
  );
}

export default function TodayStackNavigator() {
  const screenOptions = useScreenOptions();

  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen
        name="Today"
        component={TodayScreen}
        options={{
          headerTitle: () => <TodayHeaderTitle />,
        }}
      />
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  icon: {
    width: 28,
    height: 28,
    marginRight: Spacing.sm,
  },
  title: {
    fontSize: 17,
    fontWeight: "600",
  },
});
