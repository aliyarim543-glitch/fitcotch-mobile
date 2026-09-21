import { useCallback, useState } from "react";
import { View, Text, ScrollView, StyleSheet } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import api from "../../api/client";
import { colors } from "../../theme/colors";
import { Card, EmptyState } from "../../components/UI";
import { ScreenHeader } from "../../components/ScreenHeader";

export default function TrainerMeasurementsScreen() {
  const [trainees, setTrainees] = useState<any[]>([]);
  const [loaded, setLoaded] = useState(false);

  useFocusEffect(
    useCallback(() => {
      api
        .get("/trainees/my-trainees")
        .then((r) => setTrainees(r.data.trainees || []))
        .catch(() => setTrainees([]))
        .finally(() => setLoaded(true));
    }, [])
  );

  return (
    <ScrollView style={styles.screen}>
      <ScreenHeader
        title="اندازه‌گیری‌ها"
        subtitle="پروفایل و وزن ثبت‌شده شاگردان"
      />
      <View style={styles.body}>
        {!loaded ? (
          <EmptyState text="..." />
        ) : trainees.length === 0 ? (
          <EmptyState text="شاگردی نیست" />
        ) : (
          trainees.map((t, i) => {
            const u = t.user || {};
            const p = t.profile || {};
            return (
              <Card key={u._id || i}>
                <Text style={styles.title}>{u.name || "شاگرد"}</Text>
                <Text style={styles.meta}>
                  وزن: {p.weightKg ?? "—"} کگ · قد: {p.heightCm ?? "—"} سم · سن:{" "}
                  {p.age ?? "—"}
                </Text>
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
  body: { padding: 16, gap: 8 },
  title: { color: colors.text, fontWeight: "800", textAlign: "right" },
  meta: { color: colors.textMuted, fontSize: 12, textAlign: "right", marginTop: 4 },
});
