import { useCallback, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Alert,
  RefreshControl,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { Dumbbell, Send, Archive, Trash2, Download } from "lucide-react-native";
import api, { downloadAuthedFile } from "../../api/client";
import { colors, radius } from "../../theme/colors";
import { Card, Badge, IconBadge, iconColor, EmptyState } from "../../components/UI";
import { Button } from "../../components/Button";
import { ScreenHeader } from "../../components/ScreenHeader";
import type { TrainerPlanSummary } from "../../types";

const STATUS_LABELS: Record<string, string> = {
  draft: "پیش‌نویس",
  published: "منتشرشده",
  archived: "بایگانی‌شده",
};

const STATUS_BADGE: Record<string, "blue" | "green" | "purple"> = {
  draft: "blue",
  published: "green",
  archived: "purple",
};

const SOURCE_LABELS: Record<string, string> = {
  ai: "هوش مصنوعی",
  ai_reviewed_by_trainer: "هوش مصنوعی (بازبینی‌شده)",
  manual_builder: "سازنده‌ی دستی",
  trainer: "مربی",
};

type FilterStatus = "all" | "draft" | "published" | "archived";

export default function TrainerProgramsScreen() {
  const [plans, setPlans] = useState<TrainerPlanSummary[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterStatus>("all");

  const load = useCallback(async () => {
    try {
      const { data } = await api.get("/workouts/trainer/all");
      setPlans(data.plans || []);
    } catch {
      // نادیده گرفتن خطا
    } finally {
      setLoaded(true);
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

  async function changeStatus(id: string, status: "published" | "archived") {
    setBusyId(id);
    try {
      await api.put(`/workouts/${id}/status`, { status });
      await load();
    } catch (err: any) {
      Alert.alert("خطا", err?.response?.data?.message || "عملیات ناموفق بود");
    } finally {
      setBusyId(null);
    }
  }

  function confirmSend(plan: TrainerPlanSummary) {
    Alert.alert(
      "ارسال برنامه",
      `برنامه‌ی «${plan.title}» برای ${plan.traineeName} منتشر بشه؟ همین الان یک اعلان براش ارسال میشه.`,
      [
        { text: "انصراف", style: "cancel" },
        {
          text: "ارسال",
          onPress: () => changeStatus(plan._id, "published"),
        },
      ]
    );
  }

  function confirmDelete(plan: TrainerPlanSummary) {
    Alert.alert(
      "حذف برنامه",
      `برنامه‌ی «${plan.title}» برای همیشه حذف بشه؟`,
      [
        { text: "انصراف", style: "cancel" },
        {
          text: "حذف",
          style: "destructive",
          onPress: async () => {
            setBusyId(plan._id);
            try {
              await api.delete(`/workouts/${plan._id}`);
              await load();
            } catch (err: any) {
              Alert.alert(
                "خطا",
                err?.response?.data?.message || "حذف ناموفق بود"
              );
            } finally {
              setBusyId(null);
            }
          },
        },
      ]
    );
  }

  const filteredPlans = plans.filter(
    (p) => filter === "all" || p.status === filter
  );

  const counts = {
    all: plans.length,
    draft: plans.filter((p) => p.status === "draft").length,
    published: plans.filter((p) => p.status === "published").length,
    archived: plans.filter((p) => p.status === "archived").length,
  };

  const FILTERS: { key: FilterStatus; label: string }[] = [
    { key: "all", label: `همه (${counts.all})` },
    { key: "draft", label: `پیش‌نویس (${counts.draft})` },
    { key: "published", label: `منتشرشده (${counts.published})` },
    { key: "archived", label: `بایگانی (${counts.archived})` },
  ];

  return (
    <ScrollView
      style={styles.screen}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <ScreenHeader
        title="برنامه‌های تمرینی"
        subtitle="برنامه‌هایی که تو وب ساختی، از اینجا برای شاگرد بفرست"
      />

      <View style={styles.body}>
        <View style={styles.filterRow}>
          {FILTERS.map((f) => (
            <Button
              key={f.key}
              title={f.label}
              variant={filter === f.key ? "primary" : "secondary"}
              onPress={() => setFilter(f.key)}
              style={styles.filterBtn}
            />
          ))}
        </View>

        <Card>
          {!loaded ? (
            <EmptyState text="در حال بارگذاری..." />
          ) : filteredPlans.length === 0 ? (
            <EmptyState text="برنامه‌ای با این وضعیت پیدا نشد. برنامه‌های جدید رو از پنل وب بساز، همین‌جا نمایش داده میشن." />
          ) : (
            <View style={{ gap: 12 }}>
              {filteredPlans.map((plan) => (
                <View key={plan._id} style={styles.planRow}>
                  <View style={styles.planHead}>
                    <IconBadge color="blue">
                      <Dumbbell size={16} color={iconColor("blue")} />
                    </IconBadge>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.planTitle}>{plan.title}</Text>
                      <Text style={styles.planMeta}>
                        شاگرد: {plan.traineeName} · {plan.durationWeeks} هفته
                      </Text>
                    </View>
                    <Badge
                      label={STATUS_LABELS[plan.status] || plan.status}
                      color={STATUS_BADGE[plan.status] || "blue"}
                    />
                  </View>

                  <Text style={styles.planSource}>
                    منبع: {SOURCE_LABELS[plan.source] || plan.source}
                  </Text>

                  <View style={styles.actionsRow}>
                    {plan.status === "draft" && (
                      <Button
                        title="ارسال به شاگرد"
                        icon={<Send size={14} color="#fff" />}
                        onPress={() => confirmSend(plan)}
                        loading={busyId === plan._id}
                        variant="success"
                        style={{ flex: 1 }}
                      />
                    )}

                    {plan.status === "published" && (
                      <Button
                        title="بایگانی"
                        icon={<Archive size={14} color="#fff" />}
                        onPress={() => changeStatus(plan._id, "archived")}
                        loading={busyId === plan._id}
                        variant="secondary"
                        style={{ flex: 1 }}
                      />
                    )}

                    <Button
                      title="دانلود"
                      icon={<Download size={14} color="#fff" />}
                      onPress={() =>
                        downloadAuthedFile(
                          `/workouts/${plan._id}/pdf`,
                          `${plan.title}.pdf`
                        )
                      }
                      variant="info"
                      style={{ flex: 1 }}
                    />

                    <Button
                      title=""
                      icon={<Trash2 size={14} color="#fff" />}
                      onPress={() => confirmDelete(plan)}
                      variant="danger"
                      style={styles.deleteBtn}
                    />
                  </View>
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
  filterRow: {
    flexDirection: "row-reverse",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 14,
  },
  filterBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  planRow: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.md,
    padding: 12,
    gap: 8,
  },
  planHead: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 10,
  },
  planTitle: {
    color: colors.text,
    fontSize: 13.5,
    fontWeight: "700",
    textAlign: "right",
  },
  planMeta: {
    color: colors.textMuted,
    fontSize: 11.5,
    textAlign: "right",
    marginTop: 2,
  },
  planSource: {
    color: colors.textMuted,
    fontSize: 11,
    textAlign: "right",
  },
  actionsRow: {
    flexDirection: "row-reverse",
    gap: 8,
  },
  deleteBtn: {
    width: 42,
    paddingHorizontal: 0,
  },
});
