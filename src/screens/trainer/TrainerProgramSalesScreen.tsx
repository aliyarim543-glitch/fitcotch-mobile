import { useCallback, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Alert,
  Modal,
  TouchableOpacity,
  RefreshControl,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { Package, Plus, Trash2, PlayCircle, CheckCircle2 } from "lucide-react-native";
import api from "../../api/client";
import { colors, radius } from "../../theme/colors";
import { Card, Badge, IconBadge, iconColor, EmptyState } from "../../components/UI";
import { Button } from "../../components/Button";
import { FormField } from "../../components/FormField";
import { ScreenHeader } from "../../components/ScreenHeader";
import type { WorkoutPlan, MealPlan } from "../../types";

interface PlanPackage {
  _id: string;
  type: "workout" | "meal" | "bundle";
  title: string;
  description?: string;
  durationWeeks: number;
  priceToman: number;
  isActive: boolean;
}

interface ProgramRequest {
  _id: string;
  trainee: { _id: string; name: string; phone?: string } | string;
  type: "workout" | "workout_meal";
  priceToman: number;
  status:
    | "pending_payment"
    | "paid"
    | "assigned"
    | "in_progress"
    | "completed"
    | "cancelled";
  notes?: string;
  workoutPlan?: WorkoutPlan | null;
  mealPlan?: MealPlan | null;
  createdAt: string;
}

const PACKAGE_TYPE_LABELS: Record<string, string> = {
  workout: "فقط تمرینی",
  meal: "فقط غذایی",
  bundle: "تمرینی + غذایی",
};

const REQUEST_STATUS_LABELS: Record<string, string> = {
  pending_payment: "در انتظار پرداخت",
  paid: "پرداخت‌شده — آماده‌ی شروع",
  assigned: "واگذارشده",
  in_progress: "در حال ساخت",
  completed: "تکمیل‌شده",
  cancelled: "لغو‌شده",
};

const REQUEST_STATUS_BADGE: Record<string, "blue" | "green" | "purple" | "orange"> = {
  pending_payment: "orange",
  paid: "blue",
  assigned: "blue",
  in_progress: "purple",
  completed: "green",
  cancelled: "orange",
};

function traineeName(req: ProgramRequest): string {
  return typeof req.trainee === "object" ? req.trainee.name : "شاگرد";
}

function traineeId(req: ProgramRequest): string {
  return typeof req.trainee === "object" ? req.trainee._id : req.trainee;
}

export default function TrainerProgramSalesScreen() {
  const [packages, setPackages] = useState<PlanPackage[]>([]);
  const [requests, setRequests] = useState<ProgramRequest[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [pkgType, setPkgType] = useState<"workout" | "meal" | "bundle">("workout");
  const [title, setTitle] = useState("");
  const [priceToman, setPriceToman] = useState("");
  const [durationWeeks, setDurationWeeks] = useState("4");
  const [saving, setSaving] = useState(false);

  // پیکر برای تکمیل درخواست
  const [pickerRequest, setPickerRequest] = useState<ProgramRequest | null>(null);
  const [traineeWorkouts, setTraineeWorkouts] = useState<WorkoutPlan[]>([]);
  const [traineeMeals, setTraineeMeals] = useState<MealPlan[]>([]);
  const [selectedWorkoutId, setSelectedWorkoutId] = useState<string | null>(null);
  const [selectedMealId, setSelectedMealId] = useState<string | null>(null);
  const [completing, setCompleting] = useState(false);

  const load = useCallback(async () => {
    try {
      const [pkgRes, reqRes] = await Promise.all([
        api.get("/plan-packages/my-packages").catch(() => ({ data: { packages: [] } })),
        api.get("/program-requests/trainer").catch(() => ({ data: { requests: [] } })),
      ]);
      setPackages(pkgRes.data.packages || []);
      setRequests(reqRes.data.requests || []);
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

  async function onRefresh() {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }

  async function createPackage() {
    if (!title.trim() || !priceToman.trim()) {
      Alert.alert("خطا", "عنوان و قیمت رو پر کن");
      return;
    }
    setSaving(true);
    try {
      await api.post("/plan-packages", {
        type: pkgType,
        title: title.trim(),
        priceToman: Number(priceToman),
        durationWeeks: Number(durationWeeks) || 4,
        includesWorkout: pkgType === "workout" || pkgType === "bundle",
        includesMeal: pkgType === "meal" || pkgType === "bundle",
      });
      setTitle("");
      setPriceToman("");
      setDurationWeeks("4");
      setShowForm(false);
      load();
    } catch (err: any) {
      Alert.alert("خطا", err?.response?.data?.message || "ثبت بسته ناموفق بود");
    } finally {
      setSaving(false);
    }
  }

  function confirmDeletePackage(pkg: PlanPackage) {
    Alert.alert("حذف بسته", `«${pkg.title}» حذف بشه؟`, [
      { text: "انصراف", style: "cancel" },
      {
        text: "حذف",
        style: "destructive",
        onPress: async () => {
          try {
            await api.delete(`/plan-packages/${pkg._id}`);
            load();
          } catch (err: any) {
            Alert.alert("خطا", err?.response?.data?.message || "حذف ناموفق بود");
          }
        },
      },
    ]);
  }

  async function startRequest(req: ProgramRequest) {
    setBusyId(req._id);
    try {
      await api.put(`/program-requests/${req._id}/start`);
      await load();
    } catch (err: any) {
      Alert.alert("خطا", err?.response?.data?.message || "شروع درخواست ناموفق بود");
    } finally {
      setBusyId(null);
    }
  }

  async function openCompletionPicker(req: ProgramRequest) {
    setPickerRequest(req);
    setSelectedWorkoutId(null);
    setSelectedMealId(null);
    try {
      const tId = traineeId(req);
      const [workoutRes, mealRes] = await Promise.all([
        api.get(`/workouts/trainee/${tId}`).catch(() => ({ data: { plans: [] } })),
        api.get(`/meal-plans/trainee/${tId}`).catch(() => ({ data: { plans: [] } })),
      ]);
      setTraineeWorkouts(workoutRes.data.plans || []);
      setTraineeMeals(mealRes.data.plans || []);
    } catch {
      // نادیده گرفتن خطا
    }
  }

  async function submitCompletion() {
    if (!pickerRequest) return;

    if (
      (pickerRequest.type === "workout" || pickerRequest.type === "workout_meal") &&
      !selectedWorkoutId
    ) {
      Alert.alert("خطا", "یک برنامه‌ی تمرینی انتخاب کن");
      return;
    }
    if (pickerRequest.type === "workout_meal" && !selectedMealId) {
      Alert.alert("خطا", "یک برنامه‌ی غذایی هم انتخاب کن");
      return;
    }

    setCompleting(true);
    try {
      await api.put(`/program-requests/${pickerRequest._id}/complete`, {
        workoutPlanId: selectedWorkoutId || undefined,
        mealPlanId: selectedMealId || undefined,
      });
      setPickerRequest(null);
      load();
    } catch (err: any) {
      Alert.alert("خطا", err?.response?.data?.message || "تکمیل درخواست ناموفق بود");
    } finally {
      setCompleting(false);
    }
  }

  return (
    <ScrollView
      style={styles.screen}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <ScreenHeader
        title="فروش برنامه"
        subtitle="بسته‌های فروشی و درخواست‌های خرید تمرین/تغذیه"
      />

      <View style={styles.body}>
        {/* ---- بسته‌های فروشی ---- */}
        <Card>
          <View style={styles.sectionHead}>
            <IconBadge color="purple">
              <Package size={18} color={iconColor("purple")} />
            </IconBadge>
            <Text style={styles.cardTitle}>بسته‌های فروشی من</Text>
            <Button
              title={showForm ? "بستن" : "افزودن"}
              icon={!showForm ? <Plus size={14} color="#fff" /> : undefined}
              onPress={() => setShowForm((s) => !s)}
              variant={showForm ? "secondary" : "primary"}
            />
          </View>

          {showForm && (
            <View style={styles.form}>
              <Text style={styles.label}>نوع بسته</Text>
              <View style={styles.chipRow}>
                {(["workout", "meal", "bundle"] as const).map((t) => (
                  <TouchableOpacity
                    key={t}
                    style={[styles.chip, pkgType === t && styles.chipActive]}
                    onPress={() => setPkgType(t)}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        pkgType === t && styles.chipTextActive,
                      ]}
                    >
                      {PACKAGE_TYPE_LABELS[t]}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <FormField label="عنوان بسته" value={title} onChangeText={setTitle} />
              <View style={{ flexDirection: "row-reverse", gap: 10 }}>
                <View style={{ flex: 1 }}>
                  <FormField
                    label="قیمت (تومان)"
                    keyboardType="number-pad"
                    value={priceToman}
                    onChangeText={setPriceToman}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <FormField
                    label="مدت (هفته)"
                    keyboardType="number-pad"
                    value={durationWeeks}
                    onChangeText={setDurationWeeks}
                  />
                </View>
              </View>
              <Button
                title={saving ? "در حال ثبت..." : "ثبت بسته"}
                onPress={createPackage}
                loading={saving}
                fullWidth
              />
            </View>
          )}

          {!loaded ? (
            <EmptyState text="در حال بارگذاری..." />
          ) : packages.length === 0 ? (
            <EmptyState text="هنوز بسته‌ای برای فروش نساختی." />
          ) : (
            <View style={{ gap: 10, marginTop: showForm ? 16 : 0 }}>
              {packages.map((pkg) => (
                <View key={pkg._id} style={styles.pkgRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.pkgTitle}>{pkg.title}</Text>
                    <View style={{ flexDirection: "row-reverse", gap: 8, marginTop: 4 }}>
                      <Badge label={PACKAGE_TYPE_LABELS[pkg.type]} color="blue" />
                      <Text style={styles.pkgMeta}>
                        {pkg.priceToman.toLocaleString("fa-IR")} تومان ·{" "}
                        {pkg.durationWeeks} هفته
                      </Text>
                    </View>
                  </View>
                  <Button
                    title=""
                    icon={<Trash2 size={14} color="#fff" />}
                    onPress={() => confirmDeletePackage(pkg)}
                    variant="danger"
                    style={styles.smallBtn}
                  />
                </View>
              ))}
            </View>
          )}
        </Card>

        {/* ---- درخواست‌های خرید ---- */}
        <Card>
          <View style={styles.sectionHead}>
            <IconBadge color="green">
              <CheckCircle2 size={18} color={iconColor("green")} />
            </IconBadge>
            <Text style={styles.cardTitle}>درخواست‌های خرید</Text>
          </View>

          {!loaded ? (
            <EmptyState text="در حال بارگذاری..." />
          ) : requests.length === 0 ? (
            <EmptyState text="هنوز درخواست خریدی ثبت نشده." />
          ) : (
            <View style={{ gap: 12 }}>
              {requests.map((req) => (
                <View key={req._id} style={styles.reqRow}>
                  <View style={styles.reqHead}>
                    <Text style={styles.reqTrainee}>{traineeName(req)}</Text>
                    <Badge
                      label={REQUEST_STATUS_LABELS[req.status] || req.status}
                      color={REQUEST_STATUS_BADGE[req.status] || "blue"}
                    />
                  </View>

                  <Text style={styles.reqMeta}>
                    {req.type === "workout" ? "خرید برنامه تمرینی" : "خرید تمرین + تغذیه"}{" "}
                    · {req.priceToman.toLocaleString("fa-IR")} تومان
                  </Text>

                  {req.status === "paid" && (
                    <Button
                      title="شروع ساخت برنامه"
                      icon={<PlayCircle size={14} color="#fff" />}
                      onPress={() => startRequest(req)}
                      loading={busyId === req._id}
                      variant="info"
                    />
                  )}

                  {req.status === "in_progress" && (
                    <Button
                      title="اتصال برنامه‌ی ساخته‌شده"
                      icon={<CheckCircle2 size={14} color="#fff" />}
                      onPress={() => openCompletionPicker(req)}
                      variant="success"
                    />
                  )}
                </View>
              ))}
            </View>
          )}
        </Card>
      </View>

      {/* ---- Modal انتخاب برنامه برای تکمیل درخواست ---- */}
      <Modal
        visible={!!pickerRequest}
        animationType="slide"
        transparent
        onRequestClose={() => setPickerRequest(null)}
      >
        <View style={styles.overlay}>
          <View style={styles.sheet}>
            <Text style={styles.sheetTitle}>
              اتصال برنامه برای {pickerRequest ? traineeName(pickerRequest) : ""}
            </Text>

            <ScrollView style={{ maxHeight: 380 }}>
              <Text style={styles.label}>برنامه‌ی تمرینی</Text>
              {traineeWorkouts.length === 0 ? (
                <EmptyState text="این شاگرد هنوز برنامه‌ی تمرینی‌ای نداره — اول از تب «برنامه‌ها» یا وب براش بساز." />
              ) : (
                traineeWorkouts.map((w) => (
                  <TouchableOpacity
                    key={w._id}
                    style={[
                      styles.pickRow,
                      selectedWorkoutId === w._id && styles.pickRowActive,
                    ]}
                    onPress={() => setSelectedWorkoutId(w._id)}
                  >
                    <Text style={styles.pickTitle}>{w.title}</Text>
                    <Badge label={w.status} color="blue" />
                  </TouchableOpacity>
                ))
              )}

              {pickerRequest?.type === "workout_meal" && (
                <>
                  <Text style={[styles.label, { marginTop: 16 }]}>
                    برنامه‌ی غذایی
                  </Text>
                  {traineeMeals.length === 0 ? (
                    <EmptyState text="این شاگرد هنوز برنامه‌ی غذایی‌ای نداره." />
                  ) : (
                    traineeMeals.map((m) => (
                      <TouchableOpacity
                        key={m._id}
                        style={[
                          styles.pickRow,
                          selectedMealId === m._id && styles.pickRowActive,
                        ]}
                        onPress={() => setSelectedMealId(m._id)}
                      >
                        <Text style={styles.pickTitle}>{m.title}</Text>
                        <Badge label={m.status} color="green" />
                      </TouchableOpacity>
                    ))
                  )}
                </>
              )}
            </ScrollView>

            <View style={{ flexDirection: "row-reverse", gap: 10, marginTop: 14 }}>
              <Button
                title="انصراف"
                variant="secondary"
                onPress={() => setPickerRequest(null)}
                style={{ flex: 1 }}
              />
              <Button
                title={completing ? "در حال ثبت..." : "تکمیل و اطلاع به شاگرد"}
                onPress={submitCompletion}
                loading={completing}
                style={{ flex: 2 }}
              />
            </View>
          </View>
        </View>
      </Modal>
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
    flex: 1,
    color: colors.text,
    fontSize: 15,
    fontWeight: "700",
    textAlign: "right",
  },
  form: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.md,
    padding: 12,
    marginBottom: 14,
  },
  label: {
    color: colors.textSecondary,
    fontSize: 12.5,
    marginBottom: 8,
    textAlign: "right",
  },
  chipRow: {
    flexDirection: "row-reverse",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 14,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
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
  pkgRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 10,
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.md,
    padding: 12,
  },
  pkgTitle: {
    color: colors.text,
    fontSize: 13.5,
    fontWeight: "700",
    textAlign: "right",
  },
  pkgMeta: {
    color: colors.textMuted,
    fontSize: 11.5,
  },
  smallBtn: {
    width: 36,
    height: 36,
    paddingHorizontal: 0,
    paddingVertical: 0,
  },
  reqRow: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.md,
    padding: 12,
    gap: 8,
  },
  reqHead: {
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    alignItems: "center",
  },
  reqTrainee: {
    color: colors.text,
    fontSize: 13.5,
    fontWeight: "700",
    textAlign: "right",
  },
  reqMeta: {
    color: colors.textMuted,
    fontSize: 11.5,
    textAlign: "right",
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    padding: 16,
    maxHeight: "80%",
  },
  sheetTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "700",
    textAlign: "right",
    marginBottom: 14,
  },
  pickRow: {
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.sm,
    padding: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  pickRowActive: {
    borderColor: colors.accent,
    backgroundColor: colors.accentSoft,
  },
  pickTitle: {
    color: colors.text,
    fontSize: 12.5,
    fontWeight: "600",
  },
});
