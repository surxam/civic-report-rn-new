import type { ComponentProps } from "react";
import { TouchableOpacity, Text, ActivityIndicator, StyleSheet, type StyleProp, type ViewStyle } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, radius, spacing } from "../theme/colors";

type IoniconName = ComponentProps<typeof Ionicons>["name"];
type ButtonVariant = "primary" | "secondary" | "outline" | "ghost";

const VARIANTS: Record<ButtonVariant, { bg: string; fg: string; border: string }> = {
  primary: { bg: colors.primary, fg: colors.text, border: "transparent" },
  secondary: { bg: colors.primaryBright, fg: "#08292d", border: "transparent" },
  outline: { bg: "transparent", fg: colors.text, border: colors.line },
  ghost: { bg: "transparent", fg: colors.primaryBright, border: "transparent" },
};

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  icon?: IoniconName;
  disabled?: boolean;
  loading?: boolean;
  full?: boolean;
  style?: StyleProp<ViewStyle>;
}

export default function Button({
  title,
  onPress,
  variant = "primary",
  icon,
  disabled = false,
  loading = false,
  full = false,
  style,
}: ButtonProps) {
  const v = VARIANTS[variant] || VARIANTS.primary;
  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      disabled={disabled || loading}
      style={[
        styles.base,
        { backgroundColor: v.bg, borderColor: v.border, borderWidth: v.border === "transparent" ? 0 : 1 },
        full && styles.full,
        (disabled || loading) && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={v.fg} />
      ) : (
        <>
          <Text style={[styles.text, { color: v.fg }]}>{title}</Text>
          {icon && <Ionicons name={icon} size={16} color={v.fg} />}
        </>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
    paddingVertical: 13,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.pill,
  },
  full: { width: "100%" },
  disabled: { opacity: 0.5 },
  text: { fontWeight: "600", fontSize: 15 },
});
