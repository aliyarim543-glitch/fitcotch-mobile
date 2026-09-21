import { useCallback, useState } from "react";
import { View, Text, ScrollView, StyleSheet, Alert, RefreshControl } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import api from "../../api/client";
import { colors } from "../../theme/colors";
import { Card, EmptyState } from "../../components/UI";
import { Button } from "../../components/Button";
import { FormField } from "../../components/FormField";
import { ScreenHeader } from "../../components/ScreenHeader";

type Coupon = {
  _id: string;
  code: string;
  discountPercent?: number;
  discountFixedToman?: number;
  isActive: boolean;
  usageCount?: number;
  maxUsage?: number;
};

export default function TrainerCouponsScreen() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [code, setCode] = useState("");
  const [percent, setPercent] = useState("");
  const [fixed, setFixed] = useState("");
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const { data } = await api.get("/coupons/my-coupons");
      setCoupons(data.coupons || []);
    } catch {
      setCoupons([]);
    } finally {
      setLoaded(true);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  async function create() {
    if (!code.trim()) {
      Alert.alert("خطا", "کد را وارد کن");
      return;
    }
    setSaving(true);
    try {
      await api.post("/coupons", {
        code: code.trim().toUpperCase(),
        discountPercent: percent ? Number(percent) : undefined,
        discountFixedToman: fixed ? Number(fixed) : undefined,
        minOrderAmountToman: 0,
      });
      setCode("");
      setPercent("");
      setFixed("");
      await load();
    } catch (e: any) {
      Alert.alert("خطا", e?.response?.data?.message || "ساخت ناموفق");
    } finally {
      setSaving(false);
    }
  }

  async function toggle(c: Coupon) {
    await api.put(`/coupons/${c._id}`, { isActive: !c.isActive });
    load();
  }

  function remove(c: Coupon) {
    Alert.alert("حذف", `کد ${c.code} حذف شود؟`, [
      { text: "انصراف", style: "cancel" },
      {
        text: "حذف",
        style: "destructive",
        onPress: async () => {
          await api.delete(`/coupons/${c._id}`);
          load();
        },
      },
    ]);
  }

  return (
    <ScrollView style={styles.screen}>
      <ScreenHeader title="کدهای تخفیف" subtitle="مدیریت کوپن فروشگاه" />
      <View style={styles.body}>
        <Card>
          <FormField label="کد" value={code} onChangeText={setCode} autoCapitalize="characters" />
          <FormField label="درصد تخفیف" value={percent} onChangeText={setPercent} keyboardType="numeric" />
          <FormField label="تخفیف ثابت (تومان)" value={fixed} onChangeText={setFixed} keyboardType="numeric" />
          <Button title={saving ? "..." : "ساخت کد"} onPress={create} loading={saving} fullWidth />
        </Card>
        {!loaded ? (
          <EmptyState text="..." />
        ) : coupons.length === 0 ? (
          <EmptyState text="کدی نیست" />
        ) : (
          coupons.map((c) => (
            <Card key={c._id}>
              <Text style={styles.title}>{c.code}</Text>
              <Text style={styles.meta}>
                {c.discountPercent ? `${c.discountPercent}% ` : ""}
                {c.discountFixedToman
                  ? `${Number(c.discountFixedToman).toLocaleString("fa-IR")} ت `
                  : ""}
                · {c.isActive ? "فعال" : "غیرفعال"}
              </Text>
              <View style={styles.row}>
                <Button
                  title={c.isActive ? "غیرفعال" : "فعال"}
                  variant="secondary"
                  onPress={() => toggle(c)}
                />
                <Button title="حذف" variant="danger" onPress={() => remove(c)} />
              </View>
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
  meta: { color: colors.textMuted, fontSize: 12, textAlign: "right", marginVertical: 6 },
  row: { flexDirection: "row-reverse", gap: 8 },
});
