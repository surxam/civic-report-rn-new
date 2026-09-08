import { View, Text, Image, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, radius, spacing } from "../theme/colors";
import { STATUS_LABELS, STATUS_COLORS } from "../constants/categories";
import type { Report } from "../types";

interface ReportCardProps {
  report: Report;
}

export default function ReportCard({ report }: ReportCardProps) {
  const statusTint = colors[STATUS_COLORS[report.status]] || colors.muted;
  return (
    <View style={styles.card}>
      <View style={styles.statusRow}>
        <Text style={styles.reference}>ID {report.reference || report.id}</Text>
        <View style={[styles.badge, { backgroundColor: statusTint + "26", borderColor: statusTint }]}>
          <Text style={[styles.badgeText, { color: statusTint }]}>{STATUS_LABELS[report.status]}</Text>
        </View>
      </View>

      <Text style={styles.title}>{report.title}</Text>

      {report.image_url ? (
        <Image source={{ uri: report.image_url }} style={styles.photo} />
      ) : report.status === "pending" ? (
        <View style={styles.placeholder}>
          <Ionicons name="image-outline" size={22} color={colors.subtle} />
        </View>
      ) : null}

      <Text style={styles.description} numberOfLines={3}>
        {report.description || report.type_label}
      </Text>

      {report.rejection_reason ? <Text style={styles.rejection}>{report.rejection_reason}</Text> : null}

      {report.video_url ? (
        <View style={styles.videoBadge}>
          <Ionicons name="videocam" size={13} color={colors.primaryBright} />
          <Text style={styles.videoBadgeText}>Vidéo jointe</Text>
        </View>
      ) : null}

      <View style={styles.meta}>
        <Ionicons name="location-outline" size={14} color={colors.muted} />
        <Text style={styles.metaText} numberOfLines={1}>
          {report.address}
        </Text>
        <Text style={styles.metaDot}>•</Text>
        <Ionicons name="calendar-outline" size={14} color={colors.muted} />
        <Text style={styles.metaText}>{report.date}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.line,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  statusRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 6 },
  reference: { color: colors.subtle, fontSize: 12 },
  badge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: radius.pill, borderWidth: 1 },
  badgeText: { fontSize: 11, fontWeight: "700", textTransform: "uppercase" },
  title: { color: colors.text, fontWeight: "700", fontSize: 16, marginBottom: 8 },
  photo: { width: "100%", height: 140, borderRadius: radius.sm, marginBottom: 8, backgroundColor: colors.surface2 },
  placeholder: {
    width: "100%",
    height: 90,
    borderRadius: radius.sm,
    marginBottom: 8,
    backgroundColor: colors.surface2,
    alignItems: "center",
    justifyContent: "center",
  },
  description: { color: colors.muted, fontSize: 13.5, lineHeight: 19, marginBottom: 8 },
  rejection: { color: colors.danger, fontSize: 12.5, marginBottom: 8 },
  videoBadge: { flexDirection: "row", alignItems: "center", gap: 4, marginBottom: 8 },
  videoBadgeText: { color: colors.primaryBright, fontSize: 12, fontWeight: "600" },
  meta: { flexDirection: "row", alignItems: "center", gap: 4 },
  metaText: { color: colors.muted, fontSize: 12, flexShrink: 1 },
  metaDot: { color: colors.subtle, marginHorizontal: 2 },
});
