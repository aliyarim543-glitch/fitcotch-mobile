import { View, ActivityIndicator } from "react-native";
import {
  NavigationContainer,
  DarkTheme,
} from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useAuth } from "../context/AuthContext";
import { colors } from "../theme/colors";
import PhoneAuthScreen from "../screens/auth/PhoneAuthScreen";
import TraineeTabs from "./TraineeTabs";
import TrainerTabs from "./TrainerTabs";
import ComingSoonScreen from "../screens/trainer/ComingSoonScreen";

const Stack = createNativeStackNavigator();

const navTheme = {
  ...DarkTheme,
  dark: true,
  colors: {
    ...DarkTheme.colors,
    primary: colors.accent,
    background: colors.bg,
    card: colors.surface,
    text: colors.text,
    border: colors.border,
    notification: colors.danger,
  },
};

export default function RootNavigator() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: colors.bg,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  return (
    <NavigationContainer theme={navTheme}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!user ? (
          <Stack.Screen name="Auth" component={PhoneAuthScreen} />
        ) : user.role === "trainer" || user.role === "admin" ? (
          <Stack.Screen name="TrainerTabs" component={TrainerTabs} />
        ) : (
          <Stack.Screen name="TraineeTabs" component={TraineeTabs} />
        )}
        <Stack.Screen
          name="ComingSoon"
          component={ComingSoonScreen}
          options={{ presentation: "modal" }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}