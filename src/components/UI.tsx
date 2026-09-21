import { View, Text, StyleSheet, ViewStyle } from "react-native";
import { colors, radius } from "../theme/colors";

// -------- Card --------
export function Card({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: ViewStyle;
}) {
  return <View style={[styles.card, style]}>{children}</View>;
}

// -------- SectionTitle --------
export function SectionTitle({
  icon,
  title,
  subtitle,
}: {
  icon?: React.ReactNode;
  title: string;
  subtitle?: string;
}) {
  return (
    <View style={styles.sectionTitleRow}>
      {icon}
      <View style={{ flex: 1 }}>
        <Text style={styles.sectionTitle}>{title}</Text>
        {subtitle ? (
          <Text style={styles.sectionSubtitle}>{subtitle}</Text>
        ) : null}
      </View>
    </View>
  );
}

// -------- IconBadge --------
const badgeColorMap: Record<string, { bg: string; fg: string }> = {
  purple: { bg: colors.accentSoft, fg: colors.accent },
  blue: { bg: colors.blueSoft, fg: colors.blue },
  green: { bg: colors.successSoft, fg: colors.success },
  orange: { bg: colors.warningSoft, fg: colors.warning },
};

export function IconBadge({
  children,
  color = "purple",
  size = 34,
}: {
  children: React.ReactNode;
  color?: "purple" | "blue" | "green" | "orange";
  size?: number;
}) {
  const c = badgeColorMap[color];
  return (
    <View
      style={[
        styles.iconBadge,
        {
          backgroundColor: c.bg,
          width: size,
          height: size,
          borderRadius: size * 0.3,
        },
      ]}
    >
      {children}
    </View>
  );
}

export function iconColor(color: "purple" | "blue" | "green" | "orange") {
  return badgeColorMap[color].fg;
}

// -------- Badge (pill) --------
export function Badge({
  label,
  color = "purple",
}: {
  label: string;
  color?: "purple" | "blue" | "green" | "orange";
}) {
  const c = badgeColorMap[color];
  return (
    <View style={[styles.badge, { backgroundColor: c.bg }]}>
      <Text style={[styles.badgeText, { color: c.fg }]}>{label}</Text>
    </View>
  );
}

// -------- StatCard --------
export function StatCard({
  icon,
  color,
  label,
  value,
  delta,
}: {
  icon: React.ReactNode;
  color: "purple" | "blue" | "green" | "orange";
  label: string;
  value: string;
  delta?: string;
}) {
  return (
    <Card style={styles.statCard}>
      <IconBadge color={color}>{icon}</IconBadge>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
      {delta ? <Text style={styles.statDelta}>{delta}</Text> : null}
    </Card>
  );
}

// -------- EmptyState --------
export function EmptyState({ text }: { text: string }) {
  return (
    <View style={styles.emptyState}>
      <Text style={styles.emptyStateText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    marginBottom: 14,
  },
  sectionTitleRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 10,
    marginBottom: 12,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "700",
    textAlign: "right",
  },
  sectionSubtitle: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: 2,
    textAlign: "right",
  },
  iconBadge: {
    alignItems: "center",
    justifyContent: "center",
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.full,
    alignSelf: "flex-start",
  },
  badgeText: {
    fontSize: 11,
    fontWeight: "600",
  },
  statCard: {
    flex: 1,
    minWidth: "45%",
    gap: 8,
  },
  statLabel: {
    color: colors.textMuted,
    fontSize: 12,
    textAlign: "right",
  },
  statValue: {
    color: colors.text,
    fontSize: 20,
    fontWeight: "700",
    textAlign: "right",
  },
  statDelta: {
    color: colors.textSecondary,
    fontSize: 11,
    textAlign: "right",
  },
  emptyState: {
    padding: 20,
    alignItems: "center",
  },
  emptyStateText: {
    color: colors.textMuted,
    fontSize: 13,
    textAlign: "center",
    lineHeight: 20,
  },
});
