import { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, spacing, radius } from "../theme/colors";
import { selectInitials } from "../store/authSlice";
import { useAppSelector } from "../store/hooks";
import DrawerMenu from "./DrawerMenu";
import type { AppNavigation } from "../types";

interface HeaderProps {
  navigation: AppNavigation;
  back?: boolean;
  onBack?: () => void;
  tools?: boolean;
  onProfilePress?: () => void;
}

/**
 * Header réutilisable (topbar) — équivalent de la fonction header() dans app.js.
 * Props :
 *  - navigation: nécessaire pour que le menu tiroir (hamburger) puisse naviguer
 *  - back: affiche une flèche retour au lieu du logo/menu
 *  - onBack: callback du bouton retour
 *  - tools: affiche recherche/filtre (utilisé sur l'historique)
 *  - onProfilePress: callback de l'avatar
 */
export default function Header({ navigation, back = false, onBack, tools = false, onProfilePress }: HeaderProps) {
  const initials = useAppSelector(selectInitials);
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <View style={styles.header}>
      <View style={styles.left}>
        {back ? (
          <TouchableOpacity onPress={onBack} style={styles.iconBtn} accessibilityLabel="Retour">
            <Ionicons name="arrow-back" size={20} color={colors.text} />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity onPress={() => setMenuOpen(true)} style={styles.iconBtn} accessibilityLabel="Ouvrir le menu">
            <Ionicons name="menu" size={20} color={colors.text} />
          </TouchableOpacity>
        )}
        <View style={styles.brand}>
          <View style={styles.brandMark}>
            <Ionicons name="document-text-outline" size={16} color={colors.primaryBright} />
          </View>
          <Text style={styles.brandText}>Civic Report</Text>
        </View>
      </View>

      <View style={styles.right}>
  
        <TouchableOpacity style={styles.avatar} onPress={onProfilePress} accessibilityLabel="Ouvrir le profil">
          <Text style={styles.avatarText}>{initials}</Text>
        </TouchableOpacity>
      </View>

      <DrawerMenu visible={menuOpen} onClose={() => setMenuOpen(false)} navigation={navigation} />
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.bg,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.line,
  },
  left: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  right: { flexDirection: "row", alignItems: "center", gap: spacing.xs },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: radius.sm,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surface,
  },
  brand: { flexDirection: "row", alignItems: "center", gap: 8 },
  brandMark: {
    width: 26,
    height: 26,
    borderRadius: radius.sm,
    backgroundColor: colors.surface2,
    alignItems: "center",
    justifyContent: "center",
  },
  brandText: { color: colors.text, fontWeight: "600", fontSize: 15 },
  avatar: {
    width: 34,
    height: 34,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { color: colors.text, fontWeight: "700", fontSize: 12 },
});
