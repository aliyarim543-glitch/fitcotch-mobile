import { useCallback, useState } from "react";
import { View, Text, ScrollView, StyleSheet, RefreshControl } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import api from "../../api/client";
import { colors } from "../../theme/colors";
import { Card, EmptyState } from "../../components/UI";
import { ScreenHeader } from "../../components/ScreenHeader";

const STATUS: Record<string, string> = {
  pending_payment: "در انتظار پرداخت",
  paid: "پرداخت‌شده",
  preparing: "آماده‌سازی",
  shipped: "ارسال‌شده",
  delivered: "تحویل‌شده",
  payment_failed: "ناموفق",
  cancelled: "لغو",
};

export default function TraineeOrdersScreen() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const { data } = await api.get("/orders/mine");
      setOrders(data.orders || []);
    } catch {
      setOrders([]);
    } finally {
      setLoaded(true);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  return (
    <ScrollView
      style={styles.screen}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={async () => {
            setRefreshing(true);
            await load();
            setRefreshing(false);
          }}
        />
      }
    >
      <ScreenHeader title="سفارش‌های من" subtitle="مکمل و خریدها" />
      <View style={styles.body}>
        {!loaded ? (
          <EmptyState text="..." />
        ) : orders.length === 0 ? (
          <EmptyState text="سفارشی ندارید" />
        ) : (
          orders.map((o) => (
            <Card key={o._id}>
              <Text style={styles.title}>
                {STATUS[o.status] || o.status} ·{" "}
                {Number(o.totalToman).toLocaleString("fa-IR")} ت
              </Text>
              <Text style={styles.meta}>
                {new Date(o.createdAt).toLocaleDateString("fa-IR")}
              </Text>
              {(o.items || []).map((it: any, i: number) => (
                <Text key={i} style={styles.item}>
                  {it.name} × {it.quantity}
                </Text>
              ))}
            </Card>
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  body: { padding: 16, gap: 10 },
  title: { color: colors.text, fontWeight: "800", textAlign: "right" },
  meta: { color: colors.textMuted, fontSize: 12, textAlign: "right", marginTop: 4 },
  item: { color: colors.textSecondary, fontSize: 13, textAlign: "right", marginTop: 4 },
});
