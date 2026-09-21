import { useCallback, useMemo, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Trash2,
  Pencil,
  X,
} from "lucide-react-native";
import api from "../../api/client";
import { useTheme } from "../../theme/ThemeContext";
import { ScreenHeader } from "../../components/ScreenHeader";
import {
  formatJalaliMonth,
  formatJalaliDate,
  getJalaliDateInput,
  parseJalaliDate,
  toPersianDigits,
  toEnglishDigits,
  gregorianToJalali,
} from "../../utils/jalali";

interface TraineeRow {
  user: { _id: string; name: string };
}

interface Appointment {
  _id: string;
  title: string;
  startAt: string;
  durationMinutes: number;
  type: string;
  notes?: string;
  trainee: any;
}

const TYPES: Record<string, string> = {
  training: "تمرین",
  consultation: "مشاوره",
  assessment: "ارزیابی",
  nutrition: "تغذیه",
  follow_up: "پیگیری",
  other: "سایر",
};

const WEEK = ["ش", "ی", "د", "س", "چ", "پ", "ج"];

function toDateKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function getCalendarDays(month: Date) {
  const first = new Date(month.getFullYear(), month.getMonth(), 1);
  const last = new Date(month.getFullYear(), month.getMonth() + 1, 0);
  const offset = (first.getDay() + 1) % 7;
  const days: Date[] = [];
  for (let i = 0; i < offset; i++) {
    const d = new Date(first);
    d.setDate(first.getDate() - (offset - i));
    days.push(d);
  }
  for (let day = 1; day <= last.getDate(); day++) {
    days.push(new Date(month.getFullYear(), month.getMonth(), day));
  }
  while (days.length % 7 !== 0) {
    const n = new Date(days[days.length - 1]);
    n.setDate(n.getDate() + 1);
    days.push(n);
  }
  return days;
}

function getTraineeName(t: any) {
  if (typeof t === "string") return "شاگرد";
  return t?.user?.name || "شاگرد";
}

function getTraineeId(t: TraineeRow) {
  return t.user?._id || "";
}

export default function TrainerCalendarScreen() {
  const { colors, radius } = useTheme();
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(
    new Date(today.getFullYear(), today.getMonth(), 1)
  );
  const [selectedDate, setSelectedDate] = useState(toDateKey(today));
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [trainees, setTrainees] = useState<TraineeRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Appointment | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [form, setForm] = useState({
    trainee: "",
    title: "جلسه تمرینی",
    jalaliDate: "",
    time: "10:00",
    durationMinutes: 60,
    type: "training",
    notes: "",
  });

  const calendarDays = useMemo(
    () => getCalendarDays(currentMonth),
    [currentMonth]
  );

  const byDate = useMemo(() => {
    const map: Record<string, Appointment[]> = {};
    appointments.forEach((a) => {
      const k = toDateKey(new Date(a.startAt));
      if (!map[k]) map[k] = [];
      map[k].push(a);
    });
    return map;
  }, [appointments]);

  const dayList = byDate[selectedDate] || [];

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const from = new Date(
        currentMonth.getFullYear(),
        currentMonth.getMonth(),
        1
      ).toISOString();
      const to = new Date(
        currentMonth.getFullYear(),
        currentMonth.getMonth() + 1,
        0,
        23,
        59,
        59
      ).toISOString();
      const { data } = await api.get(
        `/appointments?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`
      );
      setAppointments(data.appointments || []);
    } catch (err: any) {
      setError(err?.response?.data?.message || "خطا در دریافت جلسات");
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  }, [currentMonth]);

  useFocusEffect(
    useCallback(() => {
      load();
      api
        .get("/trainees/my-trainees")
        .then((r) => setTrainees(r.data.trainees || []))
        .catch(() => setTrainees([]));
    }, [load])
  );

  function openCreate(dateKey?: string) {
    const key = dateKey || selectedDate;
    const target = new Date(
      Number(key.slice(0, 4)),
      Number(key.slice(5, 7)) - 1,
      Number(key.slice(8, 10))
    );
    setEditing(null);
    setForm({
      trainee: trainees[0] ? getTraineeId(trainees[0]) : "",
      title: "جلسه تمرینی",
      jalaliDate: getJalaliDateInput(target),
      time: "10:00",
      durationMinutes: 60,
      type: "training",
      notes: "",
    });
    setFormError("");
    setShowModal(true);
  }

  function openEdit(a: Appointment) {
    const d = new Date(a.startAt);
    const traineeId =
      typeof a.trainee === "string"
        ? a.trainee
        : a.trainee?.user?._id || a.trainee?._id || "";
    setEditing(a);
    setForm({
      trainee: traineeId,
      title: a.title,
      jalaliDate: getJalaliDateInput(d),
      time: `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`,
      durationMinutes: a.durationMinutes,
      type: a.type,
      notes: a.notes || "",
    });
    setFormError("");
    setShowModal(true);
  }

  async function save() {
    setFormError("");
    if (!form.trainee) {
      setFormError("شاگرد را انتخاب کنید");
      return;
    }
    if (!form.title.trim()) {
      setFormError("عنوان را وارد کنید");
      return;
    }
    const base = parseJalaliDate(form.jalaliDate);
    if (!base) {
      setFormError("تاریخ شمسی نامعتبر است (مثال: 1405/06/14)");
      return;
    }
    const [hh, mm] = form.time.split(":").map(Number);
    if (
      !Number.isInteger(hh) ||
      !Number.isInteger(mm) ||
      hh < 0 ||
      hh > 23 ||
      mm < 0 ||
      mm > 59
    ) {
      setFormError("ساعت نامعتبر است");
      return;
    }
    base.setHours(hh, mm, 0, 0);

    setSaving(true);
    try {
      const payload = {
        trainee: form.trainee,
        title: form.title.trim(),
        startAt: base.toISOString(),
        durationMinutes: Number(form.durationMinutes),
        type: form.type,
        notes: form.notes.trim(),
      };
      if (editing) {
        await api.put(`/appointments/${editing._id}`, payload);
      } else {
        await api.post("/appointments", payload);
      }
      setShowModal(false);
      await load();
    } catch (err: any) {
      setFormError(err?.response?.data?.message || "ذخیره ناموفق بود");
    } finally {
      setSaving(false);
    }
  }

  function remove(a: Appointment) {
    Alert.alert("حذف جلسه", `«${a.title}» حذف شود؟`, [
      { text: "انصراف", style: "cancel" },
      {
        text: "حذف",
        style: "destructive",
        onPress: async () => {
          try {
            await api.delete(`/appointments/${a._id}`);
            await load();
          } catch (err: any) {
            Alert.alert(
              "خطا",
              err?.response?.data?.message || "حذف انجام نشد"
            );
          }
        },
      },
    ]);
  }

  const styles = makeStyles(colors, radius);

  return (
    <View style={styles.screen}>
      <ScreenHeader title="تقویم جلسات" subtitle="ثبت و مدیریت قرارها" />

      <View style={styles.toolbar}>
        <TouchableOpacity style={styles.primaryBtn} onPress={() => openCreate()}>
          <Plus size={16} color="#fff" />
          <Text style={styles.primaryBtnText}>جلسه جدید</Text>
        </TouchableOpacity>
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <View style={styles.monthCard}>
        <View style={styles.monthHeader}>
          <TouchableOpacity
            onPress={() =>
              setCurrentMonth(
                new Date(
                  currentMonth.getFullYear(),
                  currentMonth.getMonth() - 1,
                  1
                )
              )
            }
            style={styles.navBtn}
          >
            <ChevronRight size={20} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.monthTitle}>
            {formatJalaliMonth(currentMonth)}
          </Text>
          <TouchableOpacity
            onPress={() =>
              setCurrentMonth(
                new Date(
                  currentMonth.getFullYear(),
                  currentMonth.getMonth() + 1,
                  1
                )
              )
            }
            style={styles.navBtn}
          >
            <ChevronLeft size={20} color={colors.text} />
          </TouchableOpacity>
        </View>

        <View style={styles.weekRow}>
          {WEEK.map((d) => (
            <Text key={d} style={styles.weekDay}>
              {d}
            </Text>
          ))}
        </View>

        {loading ? (
          <ActivityIndicator color={colors.accent} style={{ margin: 20 }} />
        ) : (
          <View style={styles.grid}>
            {calendarDays.map((day, idx) => {
              const key = toDateKey(day);
              const inMonth =
                day.getMonth() === currentMonth.getMonth() &&
                day.getFullYear() === currentMonth.getFullYear();
              const isSelected = key === selectedDate;
              const isToday = key === toDateKey(today);
              const count = (byDate[key] || []).length;
              const [, , jd] = gregorianToJalali(
                day.getFullYear(),
                day.getMonth() + 1,
                day.getDate()
              );

              return (
                <TouchableOpacity
                  key={`${key}-${idx}`}
                  style={[
                    styles.dayCell,
                    !inMonth && { opacity: 0.35 },
                    isSelected && {
                      backgroundColor: colors.accentSoft,
                      borderColor: colors.accent,
                    },
                    isToday && { borderColor: colors.accent },
                  ]}
                  onPress={() => {
                    setSelectedDate(key);
                    if (!inMonth) {
                      setCurrentMonth(
                        new Date(day.getFullYear(), day.getMonth(), 1)
                      );
                    }
                  }}
                  onLongPress={() => openCreate(key)}
                >
                  <Text style={styles.dayNum}>{toPersianDigits(jd)}</Text>
                  {count > 0 ? (
                    <View style={styles.dotRow}>
                      {Array.from({ length: Math.min(count, 3) }).map(
                        (_, i) => (
                          <View key={i} style={styles.dot} />
                        )
                      )}
                    </View>
                  ) : null}
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </View>

      <ScrollView style={styles.list} contentContainerStyle={{ padding: 16 }}>
        <Text style={styles.listTitle}>
          جلسات{" "}
          {formatJalaliDate(
            new Date(
              Number(selectedDate.slice(0, 4)),
              Number(selectedDate.slice(5, 7)) - 1,
              Number(selectedDate.slice(8, 10))
            )
          )}
        </Text>
        {dayList.length === 0 ? (
          <Text style={styles.muted}>جلسه‌ای برای این روز نیست</Text>
        ) : (
          dayList.map((a) => (
            <View key={a._id} style={styles.session}>
              <View style={{ flex: 1 }}>
                <Text style={styles.sessionTitle}>{a.title}</Text>
                <Text style={styles.muted}>
                  {new Date(a.startAt).toLocaleTimeString("fa-IR", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}{" "}
                  · {getTraineeName(a.trainee)} · {TYPES[a.type] || a.type}
                </Text>
              </View>
              <TouchableOpacity onPress={() => openEdit(a)} style={styles.iconBtn}>
                <Pencil size={16} color={colors.textSecondary} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => remove(a)} style={styles.iconBtn}>
                <Trash2 size={16} color={colors.danger} />
              </TouchableOpacity>
            </View>
          ))
        )}
      </ScrollView>

      <Modal visible={showModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editing ? "ویرایش جلسه" : "جلسه جدید"}
              </Text>
              <TouchableOpacity onPress={() => !saving && setShowModal(false)}>
                <X size={20} color={colors.text} />
              </TouchableOpacity>
            </View>

            <Text style={styles.label}>شاگرد</Text>
            <ScrollView
              horizontal
              inverted
              showsHorizontalScrollIndicator={false}
              style={{ marginBottom: 10 }}
            >
              {trainees.map((t) => {
                const id = getTraineeId(t);
                const active = form.trainee === id;
                return (
                  <TouchableOpacity
                    key={id}
                    onPress={() => setForm((f) => ({ ...f, trainee: id }))}
                    style={[
                      styles.chip,
                      active && { backgroundColor: colors.accent },
                    ]}
                  >
                    <Text
                      style={{
                        color: active ? "#fff" : colors.text,
                        fontSize: 12,
                      }}
                    >
                      {t.user.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <Text style={styles.label}>عنوان</Text>
            <TextInput
              style={styles.input}
              value={form.title}
              onChangeText={(v) => setForm((f) => ({ ...f, title: v }))}
              placeholderTextColor={colors.textMuted}
            />

            <Text style={styles.label}>تاریخ شمسی (سال/ماه/روز)</Text>
            <TextInput
              style={styles.input}
              value={toPersianDigits(form.jalaliDate)}
              onChangeText={(v) =>
                setForm((f) => ({ ...f, jalaliDate: toEnglishDigits(v) }))
              }
              placeholder="۱۴۰۵/۰۶/۱۴"
              placeholderTextColor={colors.textMuted}
              keyboardType="numbers-and-punctuation"
            />

            <Text style={styles.label}>ساعت (HH:MM)</Text>
            <TextInput
              style={styles.input}
              value={form.time}
              onChangeText={(v) => setForm((f) => ({ ...f, time: v }))}
              placeholder="10:00"
              placeholderTextColor={colors.textMuted}
            />

            <Text style={styles.label}>مدت (دقیقه)</Text>
            <View style={{ flexDirection: "row-reverse", gap: 8, marginBottom: 10 }}>
              {[30, 45, 60, 90, 120].map((m) => (
                <TouchableOpacity
                  key={m}
                  onPress={() =>
                    setForm((f) => ({ ...f, durationMinutes: m }))
                  }
                  style={[
                    styles.chip,
                    form.durationMinutes === m && {
                      backgroundColor: colors.accent,
                    },
                  ]}
                >
                  <Text
                    style={{
                      color:
                        form.durationMinutes === m ? "#fff" : colors.text,
                      fontSize: 12,
                    }}
                  >
                    {toPersianDigits(m)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>یادداشت</Text>
            <TextInput
              style={[styles.input, { minHeight: 60 }]}
              value={form.notes}
              onChangeText={(v) => setForm((f) => ({ ...f, notes: v }))}
              multiline
              placeholderTextColor={colors.textMuted}
            />

            {formError ? <Text style={styles.error}>{formError}</Text> : null}

            <TouchableOpacity
              style={[styles.primaryBtn, { marginTop: 8, opacity: saving ? 0.6 : 1 }]}
              onPress={save}
              disabled={saving}
            >
              <Text style={styles.primaryBtnText}>
                {saving ? "در حال ذخیره..." : editing ? "ذخیره تغییرات" : "ثبت جلسه"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function makeStyles(colors: any, radius: any) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.bg },
    toolbar: {
      paddingHorizontal: 16,
      marginBottom: 8,
      flexDirection: "row-reverse",
    },
    primaryBtn: {
      flexDirection: "row-reverse",
      alignItems: "center",
      gap: 6,
      backgroundColor: colors.accent,
      paddingHorizontal: 14,
      paddingVertical: 10,
      borderRadius: radius.md,
    },
    primaryBtnText: { color: "#fff", fontWeight: "700", fontSize: 13 },
    error: { color: colors.danger, paddingHorizontal: 16, marginBottom: 8, fontSize: 12 },
    monthCard: {
      marginHorizontal: 16,
      backgroundColor: colors.surface,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: colors.border,
      overflow: "hidden",
    },
    monthHeader: {
      flexDirection: "row-reverse",
      alignItems: "center",
      justifyContent: "space-between",
      padding: 12,
    },
    navBtn: {
      width: 36,
      height: 36,
      borderRadius: 10,
      backgroundColor: colors.surfaceAlt,
      alignItems: "center",
      justifyContent: "center",
    },
    monthTitle: {
      color: colors.text,
      fontWeight: "800",
      fontSize: 15,
    },
    weekRow: { flexDirection: "row-reverse" },
    weekDay: {
      flex: 1,
      textAlign: "center",
      color: colors.textMuted,
      fontSize: 11,
      paddingVertical: 6,
    },
    grid: { flexDirection: "row-reverse", flexWrap: "wrap" },
    dayCell: {
      width: "14.28%",
      minHeight: 52,
      padding: 4,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: "center",
    },
    dayNum: { color: colors.text, fontSize: 12, fontWeight: "700" },
    dotRow: { flexDirection: "row", gap: 2, marginTop: 4 },
    dot: {
      width: 5,
      height: 5,
      borderRadius: 3,
      backgroundColor: colors.accent,
    },
    list: { flex: 1 },
    listTitle: {
      color: colors.text,
      fontWeight: "800",
      fontSize: 14,
      textAlign: "right",
      marginBottom: 10,
    },
    muted: { color: colors.textMuted, fontSize: 12, textAlign: "right" },
    session: {
      flexDirection: "row-reverse",
      alignItems: "center",
      backgroundColor: colors.surface,
      borderRadius: radius.md,
      padding: 12,
      marginBottom: 8,
      borderWidth: 1,
      borderColor: colors.border,
      gap: 8,
    },
    sessionTitle: {
      color: colors.text,
      fontWeight: "700",
      fontSize: 13,
      textAlign: "right",
    },
    iconBtn: { padding: 6 },
    modalOverlay: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.55)",
      justifyContent: "flex-end",
    },
    modal: {
      backgroundColor: colors.surface,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      padding: 16,
      maxHeight: "90%",
    },
    modalHeader: {
      flexDirection: "row-reverse",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 12,
    },
    modalTitle: { color: colors.text, fontWeight: "800", fontSize: 16 },
    label: {
      color: colors.textSecondary,
      fontSize: 12,
      textAlign: "right",
      marginBottom: 6,
    },
    input: {
      backgroundColor: colors.surfaceAlt,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.md,
      color: colors.text,
      paddingHorizontal: 12,
      paddingVertical: 10,
      marginBottom: 10,
      textAlign: "right",
      fontSize: 14,
    },
    chip: {
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 20,
      backgroundColor: colors.surfaceAlt,
      borderWidth: 1,
      borderColor: colors.border,
      marginLeft: 6,
    },
  });
}
