import { useCallback, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Image,
  Alert,
  RefreshControl,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import * as ImagePicker from "expo-image-picker";
import { TrendingUp, Camera, Trash2 } from "lucide-react-native";
import api from "../../api/client";
import { colors, radius } from "../../theme/colors";
import { Card, IconBadge, iconColor } from "../../components/UI";
import { Button } from "../../components/Button";
import { FormField } from "../../components/FormField";
import { ScreenHeader } from "../../components/ScreenHeader";
import type { ProgressLog, ProgressPhoto } from "../../types";

const ANGLE_LABELS: Record<string, string> = {
  front: "روبه‌رو",
  side: "بغل",
  back: "پشت",
};

export default function TraineeProgressScreen() {
  const [logs, setLogs] = useState<ProgressLog[]>([]);
  const [photos, setPhotos] = useState<ProgressPhoto[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const [weightKg, setWeightKg] = useState("");
  const [bodyFatPercent, setBodyFatPercent] = useState("");
  const [notes, setNotes] = useState("");
  const [savingLog, setSavingLog] = useState(false);
  const [logStatus, setLogStatus] = useState("");

  const [uploading, setUploading] = useState(false);

  const load = useCallback(async () => {
    try {
      const [logsRes, photosRes] = await Promise.all([
        api.get("/progress").catch(() => ({ data: { logs: [] } })),
        api.get("/progress-photos").catch(() => ({ data: { photos: [] } })),
      ]);
      setLogs(logsRes.data.logs || []);
      setPhotos(photosRes.data.photos || []);
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

  async function submitLog() {
    setSavingLog(true);
    setLogStatus("");
    try {
      const payload: any = { notes: notes || undefined };
      if (weightKg) payload.weightKg = Number(weightKg);
      if (bodyFatPercent) payload.bodyFatPercent = Number(bodyFatPercent);

      await api.post("/progress", payload);
      setLogStatus("ثبت شد ✅");
      setWeightKg("");
      setBodyFatPercent("");
      setNotes("");
      load();
    } catch (err: any) {
      setLogStatus(err?.response?.data?.message || "خطا در ثبت");
    } finally {
      setSavingLog(false);
    }
  }

  async function pickAndUploadPhoto() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("دسترسی لازم است", "برای آپلود عکس به گالری دسترسی بده.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
      base64: true,
    });

    if (result.canceled || !result.assets?.[0]?.base64) return;

    setUploading(true);
    try {
      const asset = result.assets[0];
      const mime = asset.mimeType || "image/jpeg";
      const imageUrl = `data:${mime};base64,${asset.base64}`;

      await api.post("/progress-photos", {
        imageUrl,
        angle: "front",
      });
      load();
    } catch (err: any) {
      Alert.alert("خطا", err?.response?.data?.message || "آپلود عکس ناموفق بود");
    } finally {
      setUploading(false);
    }
  }

  async function deletePhoto(id: string) {
    Alert.alert("حذف عکس", "این عکس حذف بشه؟", [
      { text: "انصراف", style: "cancel" },
      {
        text: "حذف",
        style: "destructive",
        onPress: async () => {
          await api.delete(`/progress-photos/${id}`);
          load();
        },
      },
    ]);
  }

  const maxWeight = Math.max(1, ...logs.map((l) => l.weightKg || 0));

  return (
    <ScrollView
      style={styles.screen}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <ScreenHeader title="پیشرفت من" subtitle="وزن، اندازه‌گیری و عکس‌ها" />

      <View style={styles.body}>
        <Card>
          <View style={styles.sectionHead}>
            <IconBadge color="purple">
              <TrendingUp size={18} color={iconColor("purple")} />
            </IconBadge>
            <Text style={styles.cardTitle}>ثبت وزن جدید</Text>
          </View>

          <FormField
            label="وزن (کیلوگرم)"
            keyboardType="decimal-pad"
            value={weightKg}
            onChangeText={setWeightKg}
          />
          <FormField
            label="درصد چربی بدن (اختیاری)"
            keyboardType="decimal-pad"
            value={bodyFatPercent}
            onChangeText={setBodyFatPercent}
          />
          <FormField
            label="یادداشت (اختیاری)"
            value={notes}
            onChangeText={setNotes}
          />
          <Button
            title={savingLog ? "در حال ثبت..." : "ثبت رکورد جدید"}
            onPress={submitLog}
            loading={savingLog}
            fullWidth
          />
          {logStatus ? <Text style={styles.status}>{logStatus}</Text> : null}

          {logs.length > 1 && (
            <View style={styles.sparkline}>
              {logs.slice(-14).map((l, i) => (
                <View
                  key={i}
                  style={[
                    styles.sparkBar,
                    {
                      height: Math.max(
                        6,
                        ((l.weightKg || 0) / maxWeight) * 70
                      ),
                    },
                  ]}
                />
              ))}
            </View>
          )}

          {logs.length > 0 && (
            <View style={styles.table}>
              {[...logs]
                .reverse()
                .slice(0, 6)
                .map((log, i) => (
                  <View key={log._id || i} style={styles.tableRow}>
                    <Text style={styles.tableDate}>
                      {new Date(log.date).toLocaleDateString("fa-IR")}
                    </Text>
                    <Text style={styles.tableValue}>
                      {log.weightKg != null ? `${log.weightKg} kg` : "—"}
                    </Text>
                  </View>
                ))}
            </View>
          )}
        </Card>

        <Card>
          <View style={styles.sectionHead}>
            <IconBadge color="blue">
              <Camera size={18} color={iconColor("blue")} />
            </IconBadge>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle}>عکس‌های پیشرفت من</Text>
              <Text style={styles.cardSubtitle}>
                هر ماه یک عکس آپلود کن تا روند پیشرفتت مشخص باشد
              </Text>
            </View>
          </View>

          <Button
            title={uploading ? "در حال آپلود..." : "آپلود عکس جدید"}
            onPress={pickAndUploadPhoto}
            loading={uploading}
            fullWidth
            style={{ marginBottom: 14 }}
          />

          <View style={styles.photoGrid}>
            {photos.map((p) => (
              <View key={p._id} style={styles.photoCard}>
                {p.imageUrl ? (
                  <Image source={{ uri: p.imageUrl }} style={styles.photoImg} />
                ) : null}
                <Text style={styles.photoMeta}>
                  {new Date(p.date).toLocaleDateString("fa-IR")} —{" "}
                  {ANGLE_LABELS[p.angle] || p.angle}
                </Text>
                <Button
                  title="حذف"
                  variant="danger"
                  icon={<Trash2 size={13} color="#fff" />}
                  onPress={() => deletePhoto(p._id)}
                  style={{ marginTop: 6, paddingVertical: 6 }}
                />
              </View>
            ))}
          </View>
        </Card>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  body: { padding: 16, paddingTop: 0 },
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
  cardSubtitle: {
    color: colors.textMuted,
    fontSize: 12,
    textAlign: "right",
    marginTop: 2,
  },
  status: {
    color: colors.textSecondary,
    fontSize: 12.5,
    textAlign: "center",
    marginTop: 10,
  },
  sparkline: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 4,
    height: 80,
    marginTop: 18,
    marginBottom: 4,
  },
  sparkBar: {
    flex: 1,
    backgroundColor: colors.accent,
    borderRadius: 3,
  },
  table: {
    marginTop: 14,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  tableRow: {
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tableDate: {
    color: colors.textMuted,
    fontSize: 12,
  },
  tableValue: {
    color: colors.text,
    fontSize: 12.5,
    fontWeight: "600",
  },
  photoGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  photoCard: {
    width: "47%",
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.md,
    padding: 8,
  },
  photoImg: {
    width: "100%",
    aspectRatio: 3 / 4,
    borderRadius: radius.sm,
    marginBottom: 6,
  },
  photoMeta: {
    color: colors.textMuted,
    fontSize: 10.5,
    textAlign: "right",
  },
});
