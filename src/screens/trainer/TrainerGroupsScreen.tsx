import { useCallback, useState } from "react";
import { View, Text, ScrollView, StyleSheet } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { Users2 } from "lucide-react-native";
import api from "../../api/client";
import { colors } from "../../theme/colors";
import { Card, Badge, IconBadge, iconColor, EmptyState } from "../../components/UI";
import { ScreenHeader } from "../../components/ScreenHeader";

interface TraineeGroup {
  _id: string;
  name: string;
  members?: { _id: string; name: string }[];
}

export default function TrainerGroupsScreen() {
  const [groups, setGroups] = useState<TraineeGroup[]>([]);
  const [loaded, setLoaded] = useState(false);

  const load = useCallback(async () => {
    try {
      const { data } = await api.get("/groups");
      setGroups(data.groups || data || []);
    } catch {
      // نادیده گرفتن خطا
    } finally {
      setLoaded(true);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  return (
    <ScrollView style={styles.screen}>
      <ScreenHeader title="گروه‌های شاگردان" />

      <View style={styles.body}>
        <Card>
          {!loaded ? (
            <EmptyState text="در حال بارگذاری..." />
          ) : groups.length === 0 ? (
            <EmptyState text="هنوز گروهی نساختی. ساخت و مدیریت گروه از نسخه‌ی وب در دسترسه و به‌زودی اینجا هم اضافه میشه." />
          ) : (
            <View style={{ gap: 10 }}>
              {groups.map((g) => (
                <View key={g._id} style={styles.row}>
                  <IconBadge color="purple">
                    <Users2 size={16} color={iconColor("purple")} />
                  </IconBadge>
                  <Text style={styles.name}>{g.name}</Text>
                  <Badge
                    label={`${g.members?.length ?? 0} نفر`}
                    color="blue"
                  />
                </View>
              ))}
            </View>
          )}
        </Card>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  body: { padding: 16, paddingTop: 0 },
  row: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 10,
  },
  name: {
    flex: 1,
    color: colors.text,
    fontSize: 13.5,
    fontWeight: "700",
    textAlign: "right",
  },
});
