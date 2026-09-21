import { useCallback, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Alert,
  RefreshControl,
  TouchableOpacity,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { Package, ChevronDown, Trash2 } from "lucide-react-native";
import api from "../../api/client";
import { colors, radius } from "../../theme/colors";
import { Card, Badge, EmptyState } from "../../components/UI";
import { Button } from "../../components/Button";
import { ScreenHeader } from "../../components/ScreenHeader";
import type { StoreOrder } from "../../types";

const STATUS_LABELS: Record<string, string> = {
  pending_payment: "در انتظار پرداخت",
  paid: "پرداخت‌شده",
  preparing: "آماده‌سازی",
  shipped: "ارسال‌شده",
  delivered: "تحویل‌شده",
  payment_failed: "پرداخت ناموفق",
  cancelled: "لغو‌شده",
};

const NEXT: Record<string, { label: string; status: string }> = {
  paid: { label: "شروع آماده‌سازی", status: "preparing" },
  preparing: { label: "ثبت ارسال", status: "shipped" },
  shipped: { label: "تحویل شد", status: "delivered" },
};

function traineeName(order: StoreOrder): string {
  if (typeof order.trainee === "object" && order.trainee) {
    return order.trainee.name || "شاگرد";
  }
  return "شاگرد";
}

export default function TrainerOrdersScreen() {
  const [orders, setOrders] = useState<StoreOrder[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [openIds, setOpenIds] = useState<Record<string, boolean>>({});

  const load = useCallback(async () => {
    try {
      const { data } = await api.get("/orders/store");
      setOrders(data.orders || []);
    } catch {
      setOrders([]);
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

  async function updateStatus(id: string, status: string) {
    setBusyId(id);
    try {
      await api.put(`/orders/${id}/status`, { status });
      await load();
    } catch (err: any) {
      Alert.alert("خطا", err?.response?.data?.message || "ناموفق");
    } finally {
      setBusyId(null);
    }
  }

  function remove(order: StoreOrder) {
    Alert.alert("حذف سفارش", "این سفارش حذف شود؟", [
      { text: "انصراف", style: "cancel" },
      {
        text: "حذف",
        style: "destructive",
        onPress: async () => {
          setBusyId(order._id);
          try {
            await api.delete(`/orders/${order._id}`);
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
        title="سفارش‌های فروشگاه"
        subtitle="مدیریت سفارش مکمل شاگردان"
      />
      <View style={styles.body}>
        {!loaded ? (
          <EmptyState text="در حال بارگذاری..." />
        ) : orders.length === 0 ? (
          <Card>
            <EmptyState text="هنوز سفارشی نیست." />
          </Card>
        ) : (
          orders.map((o) => {
            const open = !!openIds[o._id];
            const next = NEXT[o.status];
            return (
              <Card key={o._id} style={{ padding: 0, overflow: "hidden" }}>
                <TouchableOpacity
                  style={styles.head}
                  onPress={() =>
                    setOpenIds((p) => ({ ...p, [o._id]: !p[o._id] }))
                  }
                >
                  <View style={{ flex: 1 }}>
                    <Text style={styles.title}>{traineeName(o)}</Text>
                    <Text style={styles.meta}>
                      {STATUS_LABELS[o.status] || o.status} ·{" "}
                      {Number(o.totalToman).toLocaleString("fa-IR")} ت ·{" "}
                      {new Date(o.createdAt).toLocaleDateString("fa-IR")}
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
                  <View style={styles.inner}>
                    {o.items?.map((item, i) => (
                      <Text key={i} style={styles.item}>
                        {item.name} × {item.quantity}
                      </Text>
                    ))}
                    <Text style={styles.addr}>آدرس: {o.shippingAddress}</Text>
                    <View style={styles.actions}>
                      {next && (
                        <Button
                          title={busyId === o._id ? "..." : next.label}
                          onPress={() => updateStatus(o._id, next.status)}
                          disabled={busyId === o._id}
                        />
                      )}
                      <Button
                        title="حذف"
                        variant="danger"
                        icon={<Trash2 size={14} color="#fff" />}
                        onPress={() => remove(o)}
                        disabled={busyId === o._id}
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
    gap: 8,
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
  inner: {
    paddingHorizontal: 14,
    paddingBottom: 14,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 10,
    gap: 6,
  },
  item: { color: colors.textSecondary, fontSize: 13, textAlign: "right" },
  addr: { color: colors.textMuted, fontSize: 12, textAlign: "right" },
  actions: { flexDirection: "row-reverse", flexWrap: "wrap", gap: 8, marginTop: 8 },
});
