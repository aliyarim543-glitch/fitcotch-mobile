import { useCallback, useState } from "react";
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { User } from "lucide-react-native";
import api from "../../api/client";
import { colors, radius } from "../../theme/colors";
import { Card, IconBadge, iconColor } from "../../components/UI";
import { Button } from "../../components/Button";
import { FormField } from "../../components/FormField";
import { ScreenHeader } from "../../components/ScreenHeader";
import type { TraineeProfile } from "../../types";

const GOAL_LABELS: Record<string, string> = {
  weight_loss: "کاهش وزن",
  muscle_gain: "افزایش حجم عضلانی",
  endurance: "استقامت",
  flexibility: "انعطاف‌پذیری",
  general_fitness: "آمادگی عمومی",
  rehabilitation: "بازتوانی",
};

const GENDER_OPTIONS: { value: TraineeProfile["gender"]; label: string }[] = [
  { value: "male", label: "مرد" },
  { value: "female", label: "زن" },
  { value: "other", label: "سایر" },
];

const LEVEL_OPTIONS: { value: TraineeProfile["experienceLevel"]; label: string }[] = [
  { value: "beginner", label: "مبتدی" },
  { value: "intermediate", label: "متوسط" },
  { value: "advanced", label: "پیشرفته" },
];

const EQUIPMENT_OPTIONS: { value: TraineeProfile["equipmentAccess"]; label: string }[] = [
  { value: "full_gym", label: "باشگاه کامل" },
  { value: "home_basic", label: "وسایل خانگی" },
  { value: "none", label: "بدون تجهیزات" },
];

const emptyProfile: TraineeProfile = {
  heightCm: 175,
  weightKg: 75,
  age: 25,
  gender: "male",
  experienceLevel: "beginner",
  goals: ["general_fitness"],
  limitations: [],
  availableDaysPerWeek: 3,
  equipmentAccess: "full_gym",
  preferredSystem: "auto",
};

function Chip({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.chip, active && styles.chipActive]}
    >
      <Text style={[styles.chipText, active && styles.chipTextActive]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

export default function TraineeProfileScreen() {
  const [profile, setProfile] = useState<TraineeProfile>(emptyProfile);
  const [hasProfile, setHasProfile] = useState(false);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");

  const load = useCallback(async () => {
    try {
      const { data } = await api.get("/trainees/profile");
      setProfile(data.profile);
      setHasProfile(true);
    } catch {
      setHasProfile(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  function toggleGoal(goal: string) {
    setProfile((p) => ({
      ...p,
      goals: p.goals.includes(goal)
        ? p.goals.filter((g) => g !== goal)
        : [...p.goals, goal],
    }));
  }

  async function saveProfile() {
    setLoading(true);
    setStatus("");
    try {
      await api.post("/trainees/profile", profile);
      setHasProfile(true);
      setStatus("پروفایل ذخیره شد ✅");
    } catch (err: any) {
      setStatus(err?.response?.data?.message || "خطا در ذخیره پروفایل");
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScrollView style={styles.screen}>
      <ScreenHeader
        title={hasProfile ? "به‌روزرسانی پروفایل" : "تکمیل پروفایل بدنی"}
      />

      <View style={styles.body}>
        <Card>
          <View style={styles.sectionHead}>
            <IconBadge color="purple">
              <User size={18} color={iconColor("purple")} />
            </IconBadge>
            <Text style={styles.cardTitle}>مشخصات بدنی</Text>
          </View>

          <View style={styles.row2}>
            <View style={{ flex: 1 }}>
              <FormField
                label="قد (سانتی‌متر)"
                keyboardType="number-pad"
                value={String(profile.heightCm)}
                onChangeText={(t) =>
                  setProfile({ ...profile, heightCm: Number(t) || 0 })
                }
              />
            </View>
            <View style={{ flex: 1 }}>
              <FormField
                label="وزن (کیلوگرم)"
                keyboardType="number-pad"
                value={String(profile.weightKg)}
                onChangeText={(t) =>
                  setProfile({ ...profile, weightKg: Number(t) || 0 })
                }
              />
            </View>
          </View>

          <View style={styles.row2}>
            <View style={{ flex: 1 }}>
              <FormField
                label="سن"
                keyboardType="number-pad"
                value={String(profile.age)}
                onChangeText={(t) =>
                  setProfile({ ...profile, age: Number(t) || 0 })
                }
              />
            </View>
            <View style={{ flex: 1 }}>
              <FormField
                label="روزهای تمرین در هفته"
                keyboardType="number-pad"
                value={String(profile.availableDaysPerWeek)}
                onChangeText={(t) =>
                  setProfile({
                    ...profile,
                    availableDaysPerWeek: Number(t) || 0,
                  })
                }
              />
            </View>
          </View>

          <Text style={styles.label}>جنسیت</Text>
          <View style={styles.chipRow}>
            {GENDER_OPTIONS.map((o) => (
              <Chip
                key={o.value}
                label={o.label}
                active={profile.gender === o.value}
                onPress={() => setProfile({ ...profile, gender: o.value })}
              />
            ))}
          </View>

          <Text style={styles.label}>سطح تجربه</Text>
          <View style={styles.chipRow}>
            {LEVEL_OPTIONS.map((o) => (
              <Chip
                key={o.value}
                label={o.label}
                active={profile.experienceLevel === o.value}
                onPress={() =>
                  setProfile({ ...profile, experienceLevel: o.value })
                }
              />
            ))}
          </View>

          <Text style={styles.label}>دسترسی به تجهیزات</Text>
          <View style={styles.chipRow}>
            {EQUIPMENT_OPTIONS.map((o) => (
              <Chip
                key={o.value}
                label={o.label}
                active={profile.equipmentAccess === o.value}
                onPress={() =>
                  setProfile({ ...profile, equipmentAccess: o.value })
                }
              />
            ))}
          </View>

          <Text style={styles.label}>اهداف (چندتایی)</Text>
          <View style={styles.chipRow}>
            {Object.entries(GOAL_LABELS).map(([key, label]) => (
              <Chip
                key={key}
                label={label}
                active={profile.goals.includes(key)}
                onPress={() => toggleGoal(key)}
              />
            ))}
          </View>

          <FormField
            label="محدودیت‌ها (با کاما جدا کن)"
            placeholder="مثلا: زانو، کمر"
            value={(profile.limitations || []).join("، ")}
            onChangeText={(t) =>
              setProfile({
                ...profile,
                limitations: t
                  .split(/،|,/)
                  .map((s) => s.trim())
                  .filter(Boolean),
              })
            }
          />

          <Button
            title={loading ? "در حال ذخیره..." : "ذخیره پروفایل"}
            onPress={saveProfile}
            loading={loading}
            fullWidth
          />
          {status ? <Text style={styles.status}>{status}</Text> : null}
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
  row2: {
    flexDirection: "row-reverse",
    gap: 10,
  },
  label: {
    color: colors.textSecondary,
    fontSize: 12.5,
    marginBottom: 8,
    marginTop: 4,
    textAlign: "right",
  },
  chipRow: {
    flexDirection: "row-reverse",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 16,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceAlt,
  },
  chipActive: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  chipText: {
    color: colors.textSecondary,
    fontSize: 12.5,
  },
  chipTextActive: {
    color: "#fff",
    fontWeight: "700",
  },
  status: {
    color: colors.textSecondary,
    fontSize: 12.5,
    textAlign: "center",
    marginTop: 10,
  },
});
