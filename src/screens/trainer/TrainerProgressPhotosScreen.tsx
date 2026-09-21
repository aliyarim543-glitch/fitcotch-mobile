import { useCallback, useState } from "react";
import { View, Text, ScrollView, StyleSheet, Image, Alert } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import api from "../../api/client";
import { colors } from "../../theme/colors";
import { Card, EmptyState } from "../../components/UI";
import { Button } from "../../components/Button";
import { ScreenHeader } from "../../components/ScreenHeader";
import { API_BASE_URL } from "../../api/client";

export default function TrainerProgressPhotosScreen() {
  const [photos, setPhotos] = useState<any[]>([]);
  const [loaded, setLoaded] = useState(false);

  const load = useCallback(async () => {
    try {
      const { data } = await api.get("/progress-photos");
      setPhotos(data.photos || data || []);
    } catch {
      setPhotos([]);
    } finally {
      setLoaded(true);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  function remove(id: string) {
    Alert.alert("حذف", "عکس حذف شود؟", [
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

  const origin = API_BASE_URL.replace(/\/api\/?$/, "");

  return (
    <ScrollView style={styles.screen}>
      <ScreenHeader title="عکس‌های پیشرفت" subtitle="گالری شاگردان" />
      <View style={styles.body}>
        {!loaded ? (
          <EmptyState text="..." />
        ) : photos.length === 0 ? (
          <EmptyState text="عکسی ثبت نشده" />
        ) : (
          photos.map((ph) => (
            <Card key={ph._id}>
              {ph.url || ph.imageUrl ? (
                <Image
                  source={{
                    uri: /^https?:/.test(ph.url || ph.imageUrl)
                      ? ph.url || ph.imageUrl
                      : `${origin}${ph.url || ph.imageUrl}`,
                  }}
                  style={styles.img}
                  resizeMode="cover"
                />
              ) : null}
              <Text style={styles.meta}>
                {ph.traineeName || ph.label || "عکس"} ·{" "}
                {ph.createdAt
                  ? new Date(ph.createdAt).toLocaleDateString("fa-IR")
                  : ""}
              </Text>
              <Button title="حذف" variant="danger" onPress={() => remove(ph._id)} />
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
  img: { width: "100%", height: 180, borderRadius: 12, marginBottom: 8 },
  meta: { color: colors.textMuted, fontSize: 12, textAlign: "right", marginBottom: 8 },
});
