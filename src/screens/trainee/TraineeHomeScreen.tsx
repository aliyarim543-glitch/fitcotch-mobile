import { useCallback, useState } from "react";
import { View, Text, ScrollView, StyleSheet, RefreshControl, TouchableOpacity, Image } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import {
  Scale,
  Dumbbell,
  UtensilsCrossed,
  Package,
  Link2,
} from "lucide-react-native";
import api, { downloadAuthedFile } from "../../api/client";
import { useAuth } from "../../context/AuthContext";
import { colors } from "../../theme/colors";
import { Card, IconBadge, StatCard, iconColor } from "../../components/UI";
import { Button } from "../../components/Button";
import { FormField } from "../../components/FormField";
import { ScreenHeader } from "../../components/ScreenHeader";
import type { WorkoutPlan, MealPlan, ProgressLog, StoreOrder } from "../../types";
import { exerciseImageUrl, resolveMediaUrl } from "../../utils/media";

export default function TraineeHomeScreen({ navigation }: any) {
  const { user, updateUser } = useAuth();

  const [plan, setPlan] = useState<WorkoutPlan | null>(null);
  const [mealPlan, setMealPlan] = useState<MealPlan | null>(null);
  const [progressLogs, setProgressLogs] = useState<ProgressLog[]>([]);
  const [orders, setOrders] = useState<StoreOrder[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const [inviteCode, setInviteCode] = useState("");
  const [linking, setLinking] = useState(false);
  const [openDays, setOpenDays] = useState<Record<number, boolean>>({});
  const [linkStatus, setLinkStatus] = useState("");

  const load = useCallback(async () => {
    try {
      const [planRes, mealRes, progressRes, ordersRes] = await Promise.all([
        api.get("/workouts/trainee").catch(() => ({ data: { plans: [] } })),
        api.get("/meal-plans/trainee").catch(() => ({ data: { plans: [] } })),
        api.get("/progress").catch(() => ({ data: { logs: [] } })),
        api.get("/orders/mine").catch(() => ({ data: { orders: [] } })),
      ]);

      const publishedPlan = (planRes.data.plans || []).find(
        (p: WorkoutPlan) => p.status === "published"
      );
      const publishedMeal = (mealRes.data.plans || []).find(
        (p: MealPlan) => p.status === "published"
      );

      setPlan(publishedPlan || null);
      setMealPlan(publishedMeal || null);
      setProgressLogs(progressRes.data.logs || []);
      setOrders(ordersRes.data.orders || []);
    } catch {
      // نادیده گرفتن خطای کلی بارگذاری
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

  async function handleLinkTrainer() {
    if (!inviteCode.trim()) return;
    setLinking(true);
    setLinkStatus("");
    try {
      const { data } = await api.post("/trainees/link-trainer", {
        inviteCode: inviteCode.trim(),
      });
      updateUser({ trainer: data.trainer });
      setLinkStatus(data.message || "متصل شدی ✅");
      setInviteCode("");
    } catch (err: any) {
      setLinkStatus(err?.response?.data?.message || "کد دعوت نامعتبر است");
    } finally {
      setLinking(false);
    }
  }

  const latestWeight =
    progressLogs.length > 0
      ? progressLogs[progressLogs.length - 1].weightKg
      : null;
  const firstWeight = progressLogs.length > 0 ? progressLogs[0].weightKg : null;
  const weightDelta =
    latestWeight != null && firstWeight != null
      ? Math.round((latestWeight - firstWeight) * 10) / 10
      : null;

  function handleNotificationPress() {
    navigation.navigate("خانه");
  }

  return (
    <ScrollView
      style={styles.screen}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <ScreenHeader
        title={`سلام ${user?.name ?? ""} 👋`}
        subtitle="این وضعیت امروز برنامه‌تونه"
        onNotificationPress={handleNotificationPress}
      />

      <View style={styles.body}>
        <View style={styles.statGrid}>
          <StatCard
            icon={<Scale size={20} color={iconColor("purple")} />}
            color="purple"
            label="وزن فعلی"
            value={latestWeight != null ? `${latestWeight} کیلوگرم` : "—"}
            delta={
              weightDelta != null
                ? `${weightDelta > 0 ? "+" : ""}${weightDelta} از شروع ثبت`
                : undefined
            }
          />
          <StatCard
            icon={<Dumbbell size={20} color={iconColor("blue")} />}
            color="blue"
            label="برنامه تمرینی"
            value={plan ? "فعال است" : "هنوز ندارید"}
          />
          <StatCard
            icon={<UtensilsCrossed size={20} color={iconColor("green")} />}
            color="green"
            label="برنامه غذایی"
            value={mealPlan ? "فعال است" : "هنوز ندارید"}
          />
          <StatCard
            icon={<Package size={20} color={iconColor("orange")} />}
            color="orange"
            label="سفارش‌های من"
            value={String(orders.length)}
          />
        </View>

        <Card>
          {user?.trainer ? (
            <View style={{ flexDirection: "row-reverse", alignItems: "center", gap: 12 }}>
              <IconBadge color="purple">
                <Link2 size={18} color={iconColor("purple")} />
              </IconBadge>
              <Text style={styles.connectedText}>
                🔗 متصل به مربی: <Text style={{ fontWeight: "700" }}>{user.trainer.name}</Text>
              </Text>
            </View>
          ) : (
            <>
              <View style={{ flexDirection: "row-reverse", alignItems: "center", gap: 10, marginBottom: 12 }}>
                <IconBadge color="purple">
                  <Link2 size={18} color={iconColor("purple")} />
                </IconBadge>
                <Text style={styles.cardTitle}>اتصال به مربی</Text>
              </View>
              <Text style={styles.cardDesc}>
                هنوز به هیچ مربی‌ای وصل نیستی. کد دعوتی که مربی‌ت بهت داده رو
                اینجا وارد کن.
              </Text>
              <FormField
                label="کد دعوت مربی"
                placeholder="مثلا: A1B2C3"
                value={inviteCode}
                onChangeText={setInviteCode}
                autoCapitalize="characters"
              />
              <Button
                title={linking ? "در حال اتصال..." : "اتصال به مربی"}
                onPress={handleLinkTrainer}
                loading={linking}
                fullWidth
              />
              {linkStatus ? (
                <Text style={styles.status}>{linkStatus}</Text>
              ) : null}
            </>
          )}
        </Card>

        
        {plan && Array.isArray(plan.schedule) && plan.schedule.length > 0 && (
          <Card>
            <Text style={styles.cardTitle}>روزهای برنامه تمرینی</Text>
            {plan.schedule.map((day: any, idx: number) => {
              const open = !!openDays[idx];
              const exercises = day.exercises || [];
              return (
                <View key={idx} style={{ marginTop: 10, borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 10 }}>
                  <TouchableOpacity
                    onPress={() => setOpenDays((p) => ({ ...p, [idx]: !p[idx] }))}
                    style={{ flexDirection: "row-reverse", justifyContent: "space-between", alignItems: "center" }}
                  >
                    <Text style={{ color: colors.text, fontWeight: "700", textAlign: "right" }}>
                      {day.dayOfWeek || `روز ${idx + 1}`} — {day.focus || ""}
                    </Text>
                    <Text style={{ color: colors.accent }}>{open ? "بستن" : "باز"}</Text>
                  </TouchableOpacity>
                  {open &&
                    exercises.map((ex: any, i: number) => {
                      const img = exerciseImageUrl(ex);
                      const pairImg = resolveMediaUrl(
                        ex.techniqueParams?.pairImageUrl ||
                          ex.techniqueParams?.pairExerciseImageUrl ||
                          null
                      );
                      return (
                      <View key={i} style={{ marginTop: 10, paddingRight: 6, flexDirection: "row-reverse", gap: 10 }}>
                        {img ? (
                          <Image source={{ uri: img }} style={{ width: 64, height: 64, borderRadius: 8, backgroundColor: colors.surface }} resizeMode="contain" />
                        ) : null}
                        <View style={{ flex: 1 }}>
                        <Text style={{ color: colors.text, fontSize: 13, textAlign: "right" }}>
                          {ex.name}
                          {ex.technique === "superset" ? " (سوپرست)" : ""}
                        </Text>
                        <Text style={{ color: colors.textMuted, fontSize: 12, textAlign: "right" }}>
                          {ex.sets} ست × {ex.reps}
                          {ex.restSeconds ? ` — استراحت ${ex.restSeconds}ث` : ""}
                        </Text>
                        {ex.technique === "superset" && ex.techniqueParams?.pairExerciseName ? (
                          <View style={{ marginTop: 4, flexDirection: "row-reverse", gap: 8, alignItems: "center" }}>
                            {pairImg ? (
                              <Image source={{ uri: pairImg }} style={{ width: 40, height: 40, borderRadius: 6 }} resizeMode="contain" />
                            ) : null}
                            <Text style={{ color: colors.accent, fontSize: 12, textAlign: "right", flex: 1 }}>
                              + {ex.techniqueParams.pairExerciseName}
                              {ex.techniqueParams.pairSets
                                ? ` — ${ex.techniqueParams.pairSets}×${ex.techniqueParams.pairReps || ""}`
                                : ""}
                            </Text>
                          </View>
                        ) : null}
                        </View>
                      </View>
                      );
                    })}
                </View>
              );
            })}
          </Card>
        )}

{(plan || mealPlan) && (
          <Card>
            <View style={{ flexDirection: "row-reverse", alignItems: "center", gap: 10, marginBottom: 14 }}>
              <IconBadge color="purple">
                <Package size={18} color={iconColor("purple")} />
              </IconBadge>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardTitle}>برنامه‌های من</Text>
                <Text style={styles.cardSubtitle}>
                  دانلود کن و همراهت داشته باش
                </Text>
              </View>
            </View>

            <View style={{ gap: 10 }}>
              {plan && (
                <View style={[styles.downloadTile, { borderColor: colors.blue }]}>
                  <IconBadge color="blue" size={40}>
                    <Dumbbell size={20} color={iconColor("blue")} />
                  </IconBadge>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.tileTitle}>برنامه تمرینی</Text>
                    <Text style={styles.tileSubtitle}>{plan.title}</Text>
                  </View>
                  <Button
                    title="دانلود"
                    variant="info"
                    onPress={() =>
                      downloadAuthedFile(
                        `/workouts/${plan._id}/pdf`,
                        `${plan.title}.pdf`
                      )
                    }
                  />
                </View>
              )}

              {mealPlan && (
                <View style={[styles.downloadTile, { borderColor: colors.success }]}>
                  <IconBadge color="green" size={40}>
                    <UtensilsCrossed size={20} color={iconColor("green")} />
                  </IconBadge>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.tileTitle}>برنامه غذایی</Text>
                    <Text style={styles.tileSubtitle}>{mealPlan.title}</Text>
                  </View>
                  <Button
                    title="دانلود"
                    variant="success"
                    onPress={() =>
                      downloadAuthedFile(
                        `/meal-plans/${mealPlan._id}/pdf`,
                        `${mealPlan.title}.pdf`
                      )
                    }
                  />
                </View>
              )}
            </View>
          </Card>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  body: {
    padding: 16,
    paddingTop: 0,
  },
  statGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 14,
  },
  connectedText: {
    color: colors.text,
    fontSize: 13.5,
    textAlign: "right",
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
  cardDesc: {
    color: colors.textSecondary,
    fontSize: 12.5,
    textAlign: "right",
    marginBottom: 12,
    lineHeight: 19,
  },
  status: {
    color: colors.textSecondary,
    fontSize: 12.5,
    textAlign: "center",
    marginTop: 10,
  },
  downloadTile: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 10,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    backgroundColor: colors.surfaceAlt,
  },
  tileTitle: {
    color: colors.text,
    fontSize: 13.5,
    fontWeight: "700",
    textAlign: "right",
  },
  tileSubtitle: {
    color: colors.textMuted,
    fontSize: 11.5,
    textAlign: "right",
    marginTop: 2,
  },
});
