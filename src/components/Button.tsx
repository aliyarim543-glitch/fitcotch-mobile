import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
} from "react-native";
import { colors, radius } from "../theme/colors";

type Variant = "primary" | "secondary" | "info" | "success" | "danger";

const variantColors: Record<Variant, { bg: string; fg: string }> = {
  primary: { bg: colors.accent, fg: "#ffffff" },
  secondary: { bg: colors.surfaceAlt, fg: colors.text },
  info: { bg: colors.blue, fg: "#ffffff" },
  success: { bg: colors.success, fg: "#ffffff" },
  danger: { bg: colors.danger, fg: "#ffffff" },
};

export function Button({
  title,
  onPress,
  variant = "primary",
  disabled,
  loading,
  icon,
  style,
  fullWidth,
}: {
  title: string;
  onPress: () => void;
  variant?: Variant;
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  style?: ViewStyle;
  fullWidth?: boolean;
}) {
  const c = variantColors[variant];

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
      style={[
        styles.base,
        { backgroundColor: c.bg, opacity: disabled ? 0.5 : 1 },
        fullWidth ? { width: "100%" } : null,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={c.fg} />
      ) : (
        <>
          {icon}
          <Text style={[styles.text, { color: c.fg }]}>{title}</Text>
        </>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: radius.md,
  },
  text: {
    fontSize: 14,
    fontWeight: "700",
  },
});
