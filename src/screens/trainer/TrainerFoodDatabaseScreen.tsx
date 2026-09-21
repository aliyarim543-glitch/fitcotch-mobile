import { useCallback, useState } from "react";
import { View, Text, ScrollView, StyleSheet, TextInput } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import api from "../../api/client";
import { colors, radius } from "../../theme/colors";
import { Card, EmptyState } from "../../components/UI";
import { ScreenHeader } from "../../components/ScreenHeader";

export default function TrainerFoodDatabaseScreen() {
  const [items, setItems] = useState<any[]>([]);
  const [q, setQ] = useState("");
  const [loaded, setLoaded] = useState(false);

  const load = useCallback(async () => {
    try {
      const { data } = await api.get("/foods", { params: q ? { q } : {} });
      setItems(data.foods || data || []);
    } catch {
      setItems([]);
    } finally {
      setLoaded(true);
    }
  }, [q]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  return (
    <ScrollView style={styles.screen}>
      <ScreenHeader title="بانک غذایی" subtitle="مواد غذایی و کالری" />
      <View style={styles.body}>
        <TextInput
          style={styles.search}
          placeholder="جست‌وجوی غذا..."
          placeholderTextColor={colors.textMuted}
          value={q}
          onChangeText={setQ}
          onSubmitEditing={load}
          textAlign="right"
        />
        {!loaded ? (
          <EmptyState text="..." />
        ) : items.length === 0 ? (
          <EmptyState text="موردی نیست" />
        ) : (
          items.slice(0, 80).map((f, i) => (
            <Card key={f._id || i}>
              <Text style={styles.title}>{f.nameFa || f.name}</Text>
              <Text style={styles.meta}>
                {f.caloriesPer100g ?? "—"} کالری / ۱۰۰گ · پروتئین {f.proteinG ?? "—"}گ
              </Text>
            </Card>
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  body: { padding: 16, gap: 8 },
  search: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    color: colors.text,
    padding: 12,
    marginBottom: 8,
  },
  title: { color: colors.text, fontWeight: "700", textAlign: "right" },
  meta: { color: colors.textMuted, fontSize: 12, textAlign: "right", marginTop: 4 },
});
