import { TouchableOpacity, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, categoryColors, radius, spacing } from "../theme/colors";
import type { Category } from "../types";

interface CategoryCardProps {
  category: Category;
  selected: boolean;
  onPress: () => void;
}

export default function CategoryCard({ category, selected, onPress }: CategoryCardProps) {
  const tint = categoryColors[category.color] || colors.primaryBright;
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.card, selected && { borderColor: tint, backgroundColor: colors.surface2 }]}
      accessibilityState={{ selected }}
    >
      <Ionicons name={category.icon as any} size={26} color={tint} style={styles.icon} />
      <Text style={styles.label}>{category.label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    width: "48%",
    aspectRatio: 1.35,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  icon: { marginBottom: 2 },
  label: { color: colors.text, fontWeight: "600", fontSize: 13.5 },
});
