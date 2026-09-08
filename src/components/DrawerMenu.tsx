import { useEffect, useRef } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Animated,
  StyleSheet,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, radius, spacing } from "../theme/colors";
import { selectDisplayName, selectInitials, selectProfile, signOut } from "../store/authSlice";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import type { AppNavigation } from "../types";

const PANEL_WIDTH = Math.min(300, Dimensions.get("window").width * 0.82);

interface DrawerMenuProps {
  visible: boolean;
  onClose: () => void;
  navigation: AppNavigation;
}

/**
 * Menu tiroir ouvert depuis le bouton "hamburger" du Header.
 * Regroupe le raccourci profil + les entrées de navigation rapide (Tableau de bord,
 * Mes rapports, Réglages) et la déconnexion.
 */
export default function DrawerMenu({ visible, onClose, navigation }: DrawerMenuProps) {
  const dispatch = useAppDispatch();
  const displayName = useAppSelector(selectDisplayName);
  const initials = useAppSelector(selectInitials);
  const profile = useAppSelector(selectProfile);
  const translateX = useRef(new Animated.Value(-PANEL_WIDTH)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(translateX, {
        toValue: visible ? 0 : -PANEL_WIDTH,
        duration: 240,
        useNativeDriver: true,
      }),
      Animated.timing(backdropOpacity, {
        toValue: visible ? 1 : 0,
        duration: 240,
        useNativeDriver: true,
      }),
    ]).start();
  }, [visible, translateX, backdropOpacity]);

  const memberSince = profile?.created_at ? new Date(profile.created_at).getFullYear() : new Date().getFullYear();

  const goTo = (screen: Parameters<AppNavigation["navigate"]>[0]) => {
    onClose();
    navigation.navigate(screen);
  };

  const onLogout = () => {
    onClose();
    dispatch(signOut());
  };

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose} statusBarTranslucent>
      <View style={styles.root}>
        <TouchableWithoutFeedback onPress={onClose}>
          <Animated.View style={[styles.backdrop, { opacity: backdropOpacity }]} />
        </TouchableWithoutFeedback>

        <Animated.View style={[styles.panel, { width: PANEL_WIDTH, transform: [{ translateX }] }]}>
          <View style={styles.profileRow}>
            <View style={styles.avatar}>
              <View style={styles.avatarSplit} />
              <Text style={styles.avatarText}>{initials}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.name} numberOfLines={1}>
                {displayName}
              </Text>
              <Text style={styles.role}>Citoyen reporter</Text>
              <Text style={styles.since}>Membre depuis {memberSince}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.menu}>
            <TouchableOpacity style={styles.pillItem} onPress={() => goTo("Categories")}>
              <Ionicons name="grid-outline" size={18} color={colors.text} />
              <Text style={styles.pillLabel}>Tableau de bord</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.pillItem} onPress={() => goTo("History")}>
              <Ionicons name="time-outline" size={18} color={colors.text} />
              <Text style={styles.pillLabel}>Mes rapports</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.plainItem} onPress={() => goTo("Profile")}>
              <Ionicons name="settings-outline" size={18} color={colors.muted} />
              <Text style={styles.plainLabel}>Réglages</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.spacer} />

          <TouchableOpacity style={styles.logoutItem} onPress={onLogout}>
            <Ionicons name="log-out-outline" size={18} color={colors.text} />
            <Text style={styles.logoutLabel}>Déconnexion</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, flexDirection: "row" },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.55)" },
  panel: {
    height: "100%",
    backgroundColor: colors.bg,
    paddingTop: 56,
    paddingHorizontal: spacing.lg,
    borderRightWidth: StyleSheet.hairlineWidth,
    borderRightColor: colors.line,
  },
  profileRow: { flexDirection: "row", alignItems: "center", gap: spacing.md, marginBottom: spacing.lg },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: radius.pill,
    backgroundColor: colors.primaryBright,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  avatarSplit: {
    position: "absolute",
    width: 90,
    height: 90,
    backgroundColor: "#6b4636",
    top: -30,
    left: -34,
    transform: [{ rotate: "45deg" }],
  },
  avatarText: { color: colors.text, fontWeight: "800", fontSize: 18 },
  name: { color: colors.text, fontWeight: "800", fontSize: 17 },
  role: { color: colors.muted, fontSize: 13, marginTop: 2 },
  since: { color: colors.muted, fontSize: 13, marginTop: 1 },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: colors.line, marginBottom: spacing.lg },
  menu: { gap: spacing.sm },
  pillItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: 14,
    paddingHorizontal: spacing.md,
  },
  pillLabel: { color: colors.text, fontWeight: "700", fontSize: 14.5 },
  plainItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingVertical: 12,
    paddingHorizontal: spacing.md,
  },
  plainLabel: { color: colors.muted, fontWeight: "600", fontSize: 14.5 },
  spacer: { flex: 1, minHeight: spacing.xl },
  logoutItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    backgroundColor: colors.red,
    borderRadius: radius.md,
    paddingVertical: 14,
    marginBottom: spacing.xl,
  },
  logoutLabel: { color: colors.text, fontWeight: "700", fontSize: 15 },
});
