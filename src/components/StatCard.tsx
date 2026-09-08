import { View, Text, StyleSheet } from "react-native";
import { colors, radius, spacing } from "../theme/colors";

interface StatCardProps {
  value: number | string;
  label: string;
}

export default function StatCard({ value, label }: StatCardProps) {
  return (
    <View style={styles.card}>
      <Text style={styles.value}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.line,
    paddingVertical: spacing.md,
    alignItems: "center",
    gap: 4,
  },
  value: { color: colors.text, fontWeight: "800", fontSize: 22 },
  label: { color: colors.muted, fontSize: 11.5, textAlign: "center" },
});
