import { useCallback, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import * as Clipboard from "expo-clipboard";
import { Copy, UserRound } from "lucide-react-native";
import api from "../../api/client";
import { useAuth } from "../../context/AuthContext";
import { colors, radius } from "../../theme/colors";
import { Card, Badge, EmptyState } from "../../components/UI";
import { Button } from "../../components/Button";
import { ScreenHeader } from "../../components/ScreenHeader";

interface TraineeRow {
  user: { _id: string; name: string; email?: string; phone?: string };
  hasProfile: boolean;
  profile: { experienceLevel?: string; goals?: string[] } | null;
}

const LEVEL_LABELS: Record<string, string> = {
  beginner: "مبتدی",
  intermediate: "متوسط",
  advanced: "پیشرفته",
};

export default function TrainerClientsScreen() {
  const { user } = useAuth();
  const [trainees, setTrainees] = useState<TraineeRow[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [copied, setCopied] = useState(false);

  const load = useCallback(async () => {
    try {
      const { data } = await api.get("/trainees/my-trainees");
      setTrainees(data.trainees || []);
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

  async function copyInviteCode() {
    if (!user?.inviteCode) return;
    await Clipboard.setStringAsync(user.inviteCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <ScrollView style={styles.screen}>
      <ScreenHeader
        title={`شاگردان من ${loaded ? `(${trainees.length})` : ""}`}
      />

      <View style={styles.body}>
        {user?.inviteCode && (
          <Card>
            <Text style={styles.cardTitle}>کد دعوت شما</Text>
            <Text style={styles.cardDesc}>
              این کد رو به شاگردهایی که خودشون ثبت‌نام می‌کنن بده تا مستقیم
              بهت وصل بشن.
            </Text>
            <View style={styles.inviteRow}>
              <Text style={styles.inviteCode}>{user.inviteCode}</Text>
              <Button
                title={copied ? "کپی شد ✅" : "کپی"}
                icon={<Copy size={14} color={colors.text} />}
                onPress={copyInviteCode}
                variant="secondary"
              />
            </View>
          </Card>
        )}

        <Card>
          {!loaded ? (
            <EmptyState text="در حال بارگذاری..." />
          ) : trainees.length === 0 ? (
            <EmptyState text="هنوز شاگردی نداری. کد دعوت بالا رو به اشتراک بذار." />
          ) : (
            <View style={{ gap: 10 }}>
              {trainees.map((t) => (
                <TouchableOpacity key={t.user._id} style={styles.row}>
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>
                      {t.user.name?.[0] || "?"}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.name}>{t.user.name}</Text>
                    <Text style={styles.contact}>
                      {t.user.email || t.user.phone}
                    </Text>
                  </View>
                  {t.hasProfile && t.profile?.experienceLevel ? (
                    <Badge
                      label={
                        LEVEL_LABELS[t.profile.experienceLevel] ||
                        t.profile.experienceLevel
                      }
                      color="purple"
                    />
                  ) : (
                    <Badge label="پروفایل ناقص" color="blue" />
                  )}
                </TouchableOpacity>
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
  cardTitle: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "700",
    textAlign: "right",
  },
  cardDesc: {
    color: colors.textMuted,
    fontSize: 12,
    textAlign: "right",
    marginTop: 4,
    marginBottom: 12,
    lineHeight: 18,
  },
  inviteRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 10,
  },
  inviteCode: {
    color: colors.text,
    fontSize: 18,
    letterSpacing: 2,
    fontWeight: "700",
    backgroundColor: colors.surfaceAlt,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radius.sm,
  },
  row: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 12,
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.accentSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    color: colors.accent,
    fontWeight: "700",
  },
  name: {
    color: colors.text,
    fontSize: 13.5,
    fontWeight: "700",
    textAlign: "right",
  },
  contact: {
    color: colors.textMuted,
    fontSize: 11.5,
    textAlign: "right",
    marginTop: 2,
  },
});
