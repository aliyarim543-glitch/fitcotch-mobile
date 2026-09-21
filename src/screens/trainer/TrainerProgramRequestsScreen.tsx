import { useCallback, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { ChevronDown, Trash2, Package } from "lucide-react-native";
import api from "../../api/client";
import { colors, radius } from "../../theme/colors";
import { Card, EmptyState } from "../../components/UI";
import { Button } from "../../components/Button";
import { ScreenHeader } from "../../components/ScreenHeader";

const STATUS_LABELS: Record<string, string> = {
  pending_payment: "در انتظار پرداخت",
  paid: "پرداخت‌شده",
  assigned: "واگذارشده",
  in_progress: "در حال ساخت",
  completed: "تکمیل‌شده",
  cancelled: "لغو‌شده",
};

const TYPE_LABELS: Record<string, string> = {
  workout: "تمرین",
  meal: "تغذیه",
  workout_meal: "تمرین + تغذیه",
};

type Req = {
  _id: string;
  type: string;
  status: string;
  priceToman: number;
  notes?: string;
  trainee: { _id: string; name: string } | string;
};

export default function TrainerProgramRequestsScreen() {
  const [requests, setRequests] = useState<Req[]>([]);
  const [openIds, setOpenIds] = useState<Record<string, boolean>>({});
  const [loaded, setLoaded] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const { data } = await api.get("/program-requests/trainer");
      setRequests(data.requests || []);
    } catch {
      setRequests([]);
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

  function nameOf(r: Req) {
    return typeof r.trainee === "object" ? r.trainee.name : "شاگرد";
  }

  async function start(r: Req) {
    setBusyId(r._id);
    try {
      await api.put(`/program-requests/${r._id}/start`);
      await load();
    } catch (err: any) {
      Alert.alert("خطا", err?.response?.data?.message || "شروع ناموفق");
    } finally {
      setBusyId(null);
    }
  }

  function remove(r: Req) {
    Alert.alert("حذف", `درخواست «${nameOf(r)}» حذف شود؟`, [
      { text: "انصراف", style: "cancel" },
      {
        text: "حذف",
        style: "destructive",
        onPress: async () => {
          setBusyId(r._id);
          try {
            await api.delete(`/program-requests/${r._id}`);
            await load();
          } catch (err: any) {
            Alert.alert(
              "خطا",
              err?.response?.data?.message || "حذف ناموفق"
            );
          } finally {
            setBusyId(null);
          }
        },
      },
    ]);
  }

  return (
    <ScrollView
      style={styles.screen}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <ScreenHeader
        title="درخواست‌های خرید"
        subtitle="پکیج‌های تمرینی/تغذیه خریداری‌شده"
      />
      <View style={styles.body}>
        {!loaded ? (
          <EmptyState text="در حال بارگذاری..." />
        ) : requests.length === 0 ? (
          <Card>
            <EmptyState text="هنوز درخواستی نیست." />
          </Card>
        ) : (
          requests.map((r) => {
            const open = !!openIds[r._id];
            return (
              <Card key={r._id} style={{ padding: 0, overflow: "hidden" }}>
                <TouchableOpacity
                  style={styles.head}
                  onPress={() =>
                    setOpenIds((p) => ({ ...p, [r._id]: !p[r._id] }))
                  }
                >
                  <View style={{ flex: 1 }}>
                    <Text style={styles.title}>{nameOf(r)}</Text>
                    <Text style={styles.meta}>
                      {TYPE_LABELS[r.type] || r.type} ·{" "}
                      {STATUS_LABELS[r.status] || r.status} ·{" "}
                      {Number(r.priceToman).toLocaleString("fa-IR")} ت
                    </Text>
                  </View>
                  <ChevronDown
                    size={18}
                    color={colors.textMuted}
                    style={{
                      transform: [{ rotate: open ? "180deg" : "0deg" }],
                    }}
                  />
                </TouchableOpacity>
                {open && (
                  <View style={styles.bodyInner}>
                    {r.notes ? (
                      <Text style={styles.notes}>یادداشت: {r.notes}</Text>
                    ) : null}
                    <View style={styles.actions}>
                      {r.status === "paid" && (
                        <Button
                          title={
                            busyId === r._id ? "..." : "شروع ساخت برنامه"
                          }
                          onPress={() => start(r)}
                          disabled={busyId === r._id}
                        />
                      )}
                      <Button
                        title="حذف"
                        variant="danger"
                        icon={<Trash2 size={14} color="#fff" />}
                        onPress={() => remove(r)}
                        disabled={busyId === r._id}
                      />
                    </View>
                  </View>
                )}
              </Card>
            );
          })
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  body: { padding: 16, gap: 10 },
  head: {
    flexDirection: "row-reverse",
    alignItems: "center",
    padding: 14,
    gap: 10,
  },
  title: {
    color: colors.text,
    fontWeight: "800",
    fontSize: 14,
    textAlign: "right",
  },
  meta: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: 4,
    textAlign: "right",
  },
  bodyInner: {
    paddingHorizontal: 14,
    paddingBottom: 14,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 12,
    gap: 10,
  },
  notes: { color: colors.textSecondary, fontSize: 12.5, textAlign: "right" },
  actions: { flexDirection: "row-reverse", flexWrap: "wrap", gap: 8 },
});
