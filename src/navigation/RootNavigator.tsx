import { NavigationContainer, DarkTheme, type Theme } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { View, ActivityIndicator } from "react-native";
import { selectSession, selectAuthLoading } from "../store/authSlice";
import { useAppSelector } from "../store/hooks";
import { colors } from "../theme/colors";
import type { RootStackParamList } from "../types";

import LoginScreen from "../screens/LoginScreen";
import CategoriesScreen from "../screens/CategoriesScreen";
import MediaChoiceScreen from "../screens/MediaChoiceScreen";
import ReportFormScreen from "../screens/ReportFormScreen";
import HistoryScreen from "../screens/HistoryScreen";
import ProfileScreen from "../screens/ProfileScreen";

const Stack = createNativeStackNavigator<RootStackParamList>();

const navTheme: Theme = {
  ...DarkTheme,
  colors: { ...DarkTheme.colors, background: colors.bg, card: colors.bg, border: colors.line },
};

export default function RootNavigator() {
  const session = useAppSelector(selectSession);
  const loading = useAppSelector(selectAuthLoading);

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator color={colors.primaryBright} />
      </View>
    );
  }

  return (
    <NavigationContainer theme={navTheme}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!session ? (
          <Stack.Screen name="Login" component={LoginScreen} />
        ) : (
          <>
            <Stack.Screen name="Categories" component={CategoriesScreen} />
            <Stack.Screen name="MediaChoice" component={MediaChoiceScreen} />
            <Stack.Screen name="ReportForm" component={ReportFormScreen} />
            <Stack.Screen name="History" component={HistoryScreen} />
            <Stack.Screen name="Profile" component={ProfileScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
