import { View, Text, TextInput, StyleSheet, TextInputProps } from "react-native";
import { colors, radius } from "../theme/colors";

export function FormField({
  label,
  ...props
}: TextInputProps & { label: string }) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        placeholderTextColor={colors.textMuted}
        style={styles.input}
        {...props}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: 14,
  },
  label: {
    color: colors.textSecondary,
    fontSize: 12.5,
    marginBottom: 6,
    textAlign: "right",
  },
  input: {
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: colors.text,
    fontSize: 14,
    textAlign: "right",
  },
});
