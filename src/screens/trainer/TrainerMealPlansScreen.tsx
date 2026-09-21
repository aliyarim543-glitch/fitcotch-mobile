import { useCallback, useState } from "react";
import { View, Text, ScrollView, StyleSheet, RefreshControl, Alert } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import api, { downloadAuthedFile } from "../../api/client";
import { colors } from "../../theme/colors";
import { Card, EmptyState, Badge } from "../../components/UI";
import { Button } from "../../components/Button";
import { ScreenHeader } from "../../components/ScreenHeader";

type Plan = {
  _id: string;
  title: string;
  status: string;
  traineeName?: string;
  dailyCalorieTarget?: number;
  updatedAt?: string;
};

const STATUS: Record<string, string> = {
  draft: "پیش‌نویس",
  published: "منتشرشده",
  archived: "آرشیو",
};

export default function TrainerMealPlansScreen() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const { data } = await api.get("/meal-plans/trainer/all");
      setPlans(data.plans || data.mealPlans || []);
    } catch {
      setPlans([]);
    } finally {
      setLoaded(true);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  async function setStatus(id: string, status: string) {
    try {
      await api.put(`/meal-plans/${id}/status`, { status });
      await load();
    } catch (e: any) {
      Alert.alert("خطا", e?.response?.data?.message || "ناموفق");
    }
  }

  return (
    <ScrollView
      style={styles.screen}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await load(); setRefreshing(false); }} />}
    >
      <ScreenHeader title="برنامه‌های غذایی" subtitle="لیست برنامه‌های تغذیه شاگردان" />
      <View style={styles.body}>
        {!loaded ? <EmptyState text="در حال بارگذاری..." /> : plans.length === 0 ? (
          <Card><EmptyState text="برنامه غذایی ثبت نشده. از وب‌اپ بساز." /></Card>
        ) : plans.map((p) => (
          <Card key={p._id}>
            <Text style={styles.title}>{p.title}</Text>
            <Text style={styles.meta}>
              {p.traineeName || "شاگرد"} · {STATUS[p.status] || p.status}
              {p.dailyCalorieTarget ? ` · ${p.dailyCalorieTarget} کالری` : ""}
            </Text>
            <View style={styles.row}>
              {p.status !== "published" && (
                <Button title="انتشار" onPress={() => setStatus(p._id, "published")} />
              )}
              {p.status === "published" && (
                <Button title="آرشیو" variant="secondary" onPress={() => setStatus(p._id, "archived")} />
              )}
              <Button
                title="PDF"
                variant="secondary"
                onPress={() => downloadAuthedFile(`/meal-plans/${p._id}/pdf`, `${p.title}.pdf`)}
              />
            </View>
          </Card>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  body: { padding: 16, gap: 10 },
  title: { color: colors.text, fontWeight: "800", textAlign: "right", fontSize: 14 },
  meta: { color: colors.textMuted, fontSize: 12, textAlign: "right", marginTop: 4, marginBottom: 10 },
  row: { flexDirection: "row-reverse", flexWrap: "wrap", gap: 8 },
});
