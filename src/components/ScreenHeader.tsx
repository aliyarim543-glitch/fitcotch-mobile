import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { LogOut } from "lucide-react-native";
import { NotificationBell } from "./NotificationBell";
import { colors } from "../theme/colors";
import { useAuth } from "../context/AuthContext";
import type { AppNotification } from "../types";

export function ScreenHeader({
  title,
  subtitle,
  onNotificationPress,
}: {
  title: string;
  subtitle?: string;
  onNotificationPress?: (n: AppNotification) => void;
}) {
  const { logout } = useAuth();

  return (
    <View style={styles.row}>
      <View style={{ flex: 1 }}>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>

      <View style={styles.actions}>
        <NotificationBell onNotificationPress={onNotificationPress} />
        <TouchableOpacity onPress={logout} style={styles.logoutBtn}>
          <LogOut size={18} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row-reverse",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
  },
  title: {
    color: colors.text,
    fontSize: 20,
    fontWeight: "800",
    textAlign: "right",
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: 12.5,
    marginTop: 2,
    textAlign: "right",
  },
  actions: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 8,
  },
  logoutBtn: {
    padding: 6,
  },
});
