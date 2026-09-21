import { useCallback, useState } from "react";
import { View, Text, ScrollView, StyleSheet, Alert } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import api from "../../api/client";
import { useAuth } from "../../context/AuthContext";
import { colors } from "../../theme/colors";
import { Card, EmptyState } from "../../components/UI";
import { Button } from "../../components/Button";
import { FormField } from "../../components/FormField";
import { ScreenHeader } from "../../components/ScreenHeader";

const PRESETS = [
  { key: "classic_white", label: "سفید کلاسیک" },
  { key: "black_gold", label: "مشکی طلایی" },
  { key: "navy_sport", label: "سرمه‌ای ورزشی" },
  { key: "modern_gray", label: "خاکستری مدرن" },
  { key: "energy_green", label: "سبز انرژی" },
  { key: "power_red", label: "قرمز قدرت" },
];

export default function TrainerSettingsScreen() {
  const { user, updateUser } = useAuth();
  const [gymName, setGymName] = useState("");
  const [instagram, setInstagram] = useState("");
  const [website, setWebsite] = useState("");
  const [address, setAddress] = useState("");
  const [preset, setPreset] = useState("black_gold");
  const [saving, setSaving] = useState(false);

  useFocusEffect(
    useCallback(() => {
      api.get("/branding/mine").then((r) => {
        const b = r.data.branding || {};
        setGymName(b.gymName || "");
        setInstagram(b.instagram || "");
        setWebsite(b.website || "");
        setAddress(b.address || "");
        setPreset(b.theme?.preset || "black_gold");
      }).catch(() => {});
    }, [])
  );

  async function save() {
    setSaving(true);
    try {
      const { data } = await api.put("/branding/mine", {
        gymName,
        instagram,
        website,
        address,
        theme: { preset },
      });
      if (data.branding && user) {
        updateUser({ branding: data.branding });
      }
      Alert.alert("ذخیره شد", "برندینگ به‌روز شد");
    } catch (e: any) {
      Alert.alert("خطا", e?.response?.data?.message || "ذخیره ناموفق");
    } finally {
      setSaving(false);
    }
  }

  return (
    <ScrollView style={styles.screen}>
      <ScreenHeader title="تنظیمات و برندینگ" subtitle="نام باشگاه و تم" />
      <View style={styles.body}>
        <Card>
          <FormField label="نام باشگاه" value={gymName} onChangeText={setGymName} />
          <FormField label="اینستاگرام" value={instagram} onChangeText={setInstagram} />
          <FormField label="وب‌سایت" value={website} onChangeText={setWebsite} />
          <FormField label="آدرس" value={address} onChangeText={setAddress} />
          <Text style={styles.label}>تم رنگی</Text>
          <View style={styles.presets}>
            {PRESETS.map((p) => (
              <Button
                key={p.key}
                title={p.label}
                variant={preset === p.key ? "primary" : "secondary"}
                onPress={() => setPreset(p.key)}
              />
            ))}
          </View>
          <Button
            title={saving ? "..." : "ذخیره"}
            onPress={save}
            loading={saving}
            fullWidth
            style={{ marginTop: 12 }}
          />
        </Card>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  body: { padding: 16 },
  label: {
    color: colors.textSecondary,
    fontSize: 12.5,
    textAlign: "right",
    marginBottom: 8,
    marginTop: 4,
  },
  presets: { gap: 8 },
});
