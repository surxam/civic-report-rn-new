import { View, Text, TextInput, StyleSheet, type StyleProp, type TextStyle, type ViewStyle, type TextInputProps } from "react-native";
import { colors, radius, spacing } from "../theme/colors";

interface FormFieldProps extends TextInputProps {
  label?: string;
  style?: StyleProp<ViewStyle>;
  inputStyle?: StyleProp<TextStyle>;
}

export default function FormField({ label, style, inputStyle, ...inputProps }: FormFieldProps) {
  return (
    <View style={[styles.field, style]}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <TextInput placeholderTextColor={colors.subtle} style={[styles.input, inputStyle]} {...inputProps} />
    </View>
  );
}

const styles = StyleSheet.create({
  field: { marginBottom: spacing.md },
  label: { color: colors.text, fontWeight: "600", fontSize: 13.5, marginBottom: 6 },
  input: {
    backgroundColor: colors.surface,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.line,
    color: colors.text,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    fontSize: 14.5,
  },
});
