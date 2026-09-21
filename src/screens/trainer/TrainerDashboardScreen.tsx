import { useCallback, useState } from "react";
import { View, Text, ScrollView, StyleSheet, RefreshControl } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { Users, Dumbbell, TrendingUp, Calendar } from "lucide-react-native";
import api from "../../api/client";
import { useAuth } from "../../context/AuthContext";
import { colors } from "../../theme/colors";
import { Card, StatCard, IconBadge, iconColor, EmptyState } from "../../components/UI";
import { ScreenHeader } from "../../components/ScreenHeader";
import type { TrainerSummary } from "../../types";

interface UpcomingAppointment {
  _id: string;
  title: string;
  startAt: string;
  traineeName?: string;
}

export default function TrainerDashboardScreen({ navigation }: any) {
  const { user } = useAuth();
  const [summary, setSummary] = useState<TrainerSummary | null>(null);
  const [appointments, setAppointments] = useState<UpcomingAppointment[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const summaryRes = await api
        .get("/workouts/trainer/summary")
        .catch(() => ({ data: null }));
      setSummary(summaryRes.data);

      const now = new Date();
      const from = new Date(now);
      from.setHours(0, 0, 0, 0);
      const to = new Date(now);
      to.setDate(to.getDate() + 7);
      to.setHours(23, 59, 59, 999);

      const apptRes = await api
        .get(
          `/appointments?from=${encodeURIComponent(
            from.toISOString()
          )}&to=${encodeURIComponent(to.toISOString())}`
        )
        .catch(() => ({ data: { appointments: [] } }));

      const upcoming = (apptRes.data?.appointments || [])
        .filter(
          (a: any) =>
            new Date(a.startAt).getTime() >= Date.now() &&
            a.status !== "cancelled" &&
            a.status !== "completed"
        )
        .sort(
          (a: any, b: any) =>
            new Date(a.startAt).getTime() - new Date(b.startAt).getTime()
        )
        .slice(0, 5)
        .map((a: any) => ({
          _id: a._id,
          title: a.title,
          startAt: a.startAt,
          traineeName:
            typeof a.trainee === "object" ? a.trainee?.user?.name : undefined,
        }));

      setAppointments(upcoming);
    } catch {
      // نادیده گرفتن خطا
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  async function onRefresh() {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }

  return (
    <ScrollView
      style={styles.screen}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <ScreenHeader
        title={`سلام ${user?.name ?? ""} 👋`}
        subtitle="خلاصه‌ی وضعیت باشگاهت"
      />

      <View style={styles.body}>
        <View style={styles.statGrid}>
          <StatCard
            icon={<Users size={20} color={iconColor("purple")} />}
            color="purple"
            label="شاگردان"
            value={summary ? String(summary.totalClients) : "—"}
          />
          <StatCard
            icon={<Dumbbell size={20} color={iconColor("blue")} />}
            color="blue"
            label="برنامه‌های فعال"
            value={summary ? String(summary.activePrograms) : "—"}
          />
          <StatCard
            icon={<TrendingUp size={20} color={iconColor("green")} />}
            color="green"
            label="کل برنامه‌ها"
            value={summary ? String(summary.totalPrograms) : "—"}
          />
        </View>

        <Card>
          <View style={styles.sectionHead}>
            <IconBadge color="orange">
              <Calendar size={18} color={iconColor("orange")} />
            </IconBadge>
            <Text style={styles.cardTitle}>قرارهای این هفته</Text>
          </View>

          {appointments.length === 0 ? (
            <EmptyState text="قرار ملاقاتی برای این هفته ثبت نشده." />
          ) : (
            <View style={{ gap: 10 }}>
              {appointments.map((a) => (
                <View key={a._id} style={styles.apptRow}>
                  <Text style={styles.apptTitle}>{a.title}</Text>
                  <Text style={styles.apptTime}>
                    {new Date(a.startAt).toLocaleString("fa-IR", {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </Card>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  body: { padding: 16, paddingTop: 0 },
  statGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 14,
  },
  sectionHead: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 10,
    marginBottom: 14,
  },
  cardTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "700",
    textAlign: "right",
  },
  apptRow: {
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    backgroundColor: colors.surfaceAlt,
    borderRadius: 10,
    padding: 10,
  },
  apptTitle: {
    color: colors.text,
    fontSize: 12.5,
    fontWeight: "600",
  },
  apptTime: {
    color: colors.textMuted,
    fontSize: 11.5,
  },
});
