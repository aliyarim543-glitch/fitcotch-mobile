import { useCallback, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TextInput,
  Image,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import api from "../../api/client";
import { colors, radius } from "../../theme/colors";
import { Card, EmptyState } from "../../components/UI";
import { ScreenHeader } from "../../components/ScreenHeader";
import { exerciseImageUrl } from "../../utils/media";

export default function TrainerExerciseLibraryScreen() {
  const [items, setItems] = useState<any[]>([]);
  const [q, setQ] = useState("");
  const [loaded, setLoaded] = useState(false);

  const load = useCallback(async () => {
    try {
      const { data } = await api.get("/exercises", { params: q ? { q } : {} });
      setItems(data.exercises || data || []);
    } catch {
      setItems([]);
    } finally {
      setLoaded(true);
    }
  }, [q]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  return (
    <ScrollView style={styles.screen}>
      <ScreenHeader
        title="کتابخانه تمرین"
        subtitle="حرکات قابل استفاده در برنامه"
      />
      <View style={styles.body}>
        <TextInput
          style={styles.search}
          placeholder="جست‌وجوی حرکت..."
          placeholderTextColor={colors.textMuted}
          value={q}
          onChangeText={setQ}
          onSubmitEditing={load}
          textAlign="right"
        />
        {!loaded ? (
          <EmptyState text="..." />
        ) : items.length === 0 ? (
          <EmptyState text="حرکتی پیدا نشد" />
        ) : (
          items.slice(0, 100).map((ex, i) => {
            const img = exerciseImageUrl(ex);
            return (
              <Card key={ex._id || i}>
                <View style={styles.row}>
                  {img ? (
                    <Image
                      source={{ uri: img }}
                      style={styles.thumb}
                      resizeMode="contain"
                    />
                  ) : (
                    <View style={[styles.thumb, styles.thumbEmpty]}>
                      <Text style={styles.thumbEmptyText}>—</Text>
                    </View>
                  )}
                  <View style={styles.info}>
                    <Text style={styles.title}>
                      {ex.nameFa || ex.name || ex.nameEn}
                    </Text>
                    <Text style={styles.meta}>
                      {[
                        ex.primaryMuscle || ex.muscleGroup,
                        ex.equipment,
                        ex.difficulty || ex.level,
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    </Text>
                  </View>
                </View>
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
  search: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    color: colors.text,
    padding: 12,
    marginBottom: 8,
  },
  row: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 12,
  },
  thumb: {
    width: 72,
    height: 72,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
  },
  thumbEmpty: {
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.border,
  },
  thumbEmptyText: { color: colors.textMuted },
  info: { flex: 1 },
  title: { color: colors.text, fontWeight: "700", textAlign: "right" },
  meta: {
    color: colors.textMuted,
    fontSize: 12,
    textAlign: "right",
    marginTop: 4,
  },
});
