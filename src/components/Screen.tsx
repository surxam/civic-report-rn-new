import type { ReactNode } from "react";
import { View, ScrollView, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Header from "./Header";
import BottomNav from "./BottomNav";
import { colors } from "../theme/colors";
import type { AppNavigation, RootStackParamList } from "../types";

interface ScreenProps {
  navigation: AppNavigation;
  activeTab?: keyof RootStackParamList;
  back?: boolean;
  tools?: boolean;
  scroll?: boolean;
  children: ReactNode;
}

/**
 * Layout commun à tous les écrans connectés : Header + contenu scrollable + BottomNav.
 * Regroupe la répétition qu'on avait dans chaque render*() de app.js
 * (header() + section + navigation()).
 */
export default function Screen({
  navigation,
  activeTab,
  back = false,
  tools = false,
  scroll = true,
  children,
}: ScreenProps) {
  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <Header
        navigation={navigation}
        back={back}
        onBack={() => navigation.goBack()}
        tools={tools}
        onProfilePress={() => navigation.navigate("Profile")}
      />
      {scroll ? (
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          {children}
        </ScrollView>
      ) : (
        <View style={styles.scrollContent}>{children}</View>
      )}
      <BottomNav active={activeTab} onNavigate={(route) => navigation.navigate(route)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  scrollContent: { flexGrow: 1, padding: 20, paddingBottom: 32 },
});
