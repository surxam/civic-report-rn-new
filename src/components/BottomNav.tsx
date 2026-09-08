import type { ComponentProps } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, spacing } from "../theme/colors";
import type { RootStackParamList } from "../types";

type TabRoute = "Categories" | "History" | "Profile";
type IoniconName = ComponentProps<typeof Ionicons>["name"];

interface NavItem {
  route: TabRoute;
  icon: IoniconName;
  label: string;
}

const ITEMS: NavItem[] = [
  { route: "Categories", icon: "megaphone-outline", label: "Signaler" },
  { route: "History", icon: "time-outline", label: "Historique" },
  { route: "Profile", icon: "person-outline", label: "Profil" },
];

interface BottomNavProps {
  active?: keyof RootStackParamList;
  onNavigate: (route: TabRoute) => void;
}

/**
 * Footer réutilisable (bottom-nav) — équivalent de la fonction navigation() dans app.js.
 * "active" reçoit le nom de route courant pour surligner l'onglet actif.
 */
export default function BottomNav({ active, onNavigate }: BottomNavProps) {
  return (
    <View style={styles.nav}>
      {ITEMS.map((item) => {
        const isActive = active === item.route;
        return (
          <TouchableOpacity
            key={item.route}
            style={styles.item}
            onPress={() => onNavigate(item.route)}
            accessibilityLabel={item.label}
          >
            <Ionicons name={item.icon} size={20} color={isActive ? colors.primaryBright : colors.muted} />
            <Text style={[styles.label, isActive && styles.labelActive]}>{item.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  nav: {
    flexDirection: "row",
    backgroundColor: colors.surface,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.line,
    paddingVertical: spacing.xs,
    paddingBottom: spacing.sm,
  },
  item: { flex: 1, alignItems: "center", gap: 3 },
  label: { fontSize: 11, color: colors.muted },
  labelActive: { color: colors.primaryBright, fontWeight: "600" },
});
