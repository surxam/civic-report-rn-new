import { useEffect, useCallback } from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Screen from "../components/Screen";
import StatCard from "../components/StatCard";
import Button from "../components/Button";
import { selectDisplayName, selectInitials, selectUser, signOut } from "../store/authSlice";
import { fetchReports, selectReports, selectReportCountByStatus } from "../store/reportsSlice";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { colors, radius, spacing } from "../theme/colors";
import type { ScreenProps } from "../types";

export default function ProfileScreen({ navigation }: ScreenProps<"Profile">) {
  const dispatch = useAppDispatch();
  const displayName = useAppSelector(selectDisplayName);
  const initials = useAppSelector(selectInitials);
  const user = useAppSelector(selectUser);
  const reports = useAppSelector(selectReports);
  const acceptedCount = useAppSelector(selectReportCountByStatus("accepted"));
  const pendingCount = useAppSelector(selectReportCountByStatus("pending"));

  const load = useCallback(() => dispatch(fetchReports()), [dispatch]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <Screen navigation={navigation} activeTab="Profile">
      <Text style={styles.title}>Mon profil</Text>
      <Text style={styles.subtitle}>Vos informations et l'activité de vos signalements.</Text>

      <View style={styles.profileCard}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.name}>{displayName}</Text>
          <Text style={styles.email}>{user?.email}</Text>
          <Text style={styles.memberSince}>Citoyen reporter · membre depuis juillet 2026</Text>
        </View>
      </View>

      <View style={styles.statsGrid}>
        <StatCard value={reports.length} label="Rapports envoyés" />
        <StatCard value={acceptedCount} label="Pris en charge" />
        <StatCard value={pendingCount} label="En attente" />
      </View>

      <View style={styles.successPanel}>
        <Ionicons name="shield-checkmark-outline" size={22} color={colors.primaryBright} />
        <View style={{ flex: 1 }}>
          <Text style={styles.successTitle}>Votre contribution compte</Text>
          <Text style={styles.successBody}>
            Chaque signalement aide les équipes municipales à améliorer votre cadre de vie.
          </Text>
        </View>
      </View>

      <Button
        title="Déconnexion"
        icon="log-out-outline"
        variant="outline"
        full
        onPress={() => dispatch(signOut())}
        style={{ marginTop: spacing.lg }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { color: colors.text, fontSize: 21, fontWeight: "800" },
  subtitle: { color: colors.muted, fontSize: 13, marginTop: 2, marginBottom: spacing.lg },
  profileCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.line,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { color: colors.text, fontWeight: "800", fontSize: 18 },
  name: { color: colors.text, fontWeight: "700", fontSize: 16 },
  email: { color: colors.muted, fontSize: 13 },
  memberSince: { color: colors.subtle, fontSize: 12, marginTop: 4 },
  statsGrid: { flexDirection: "row", gap: spacing.sm, marginBottom: spacing.md },
  successPanel: {
    flexDirection: "row",
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.line,
    padding: spacing.lg,
    alignItems: "flex-start",
  },
  successTitle: { color: colors.text, fontWeight: "700", fontSize: 14, marginBottom: 4 },
  successBody: { color: colors.muted, fontSize: 12.5, lineHeight: 18 },
});
