import { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
} from "react-native";
import { useAuth } from "../../context/AuthContext";
import { colors } from "../../theme/colors";
import { FormField } from "../../components/FormField";
import { Button } from "../../components/Button";
import type { Role } from "../../types";

type Mode = "phone" | "email";
type Step = "phone" | "code" | "profile";

export default function PhoneAuthScreen() {
  const { requestOtp, verifyOtp, login } = useAuth();

  const [mode, setMode] = useState<Mode>("phone");
  const [step, setStep] = useState<Step>("phone");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(0);

  useEffect(() => {
    if (resendCountdown <= 0) return;
    const t = setInterval(() => setResendCountdown((c) => c - 1), 1000);
    return () => clearInterval(t);
  }, [resendCountdown]);

  async function handleRequestOtp() {
    setError("");
    if (!phone.trim()) {
      setError("شماره موبایل را وارد کن");
      return;
    }
    setSubmitting(true);
    try {
      await requestOtp(phone.trim());
      setStep("code");
      setResendCountdown(60);
    } catch (err: any) {
      setError(err?.response?.data?.message || "خطا در ارسال کد");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleVerifyOtp() {
    setError("");
    if (!code.trim()) {
      setError("کد تایید را وارد کن");
      return;
    }
    setSubmitting(true);
    try {
      const result = await verifyOtp(phone.trim(), code.trim());
      if (result.isNewUser) {
        setStep("profile");
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || "کد تایید اشتباه است");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleCompleteRegistration() {
    setError("");
    if (!name.trim()) {
      setError("نام خودت را وارد کن");
      return;
    }
    setSubmitting(true);
    try {
      const role: Role = "trainee";
      await verifyOtp(phone.trim(), code.trim(), name.trim(), role);
    } catch (err: any) {
      setError(err?.response?.data?.message || "خطا در تکمیل ثبت‌نام");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleEmailLogin() {
    setError("");
    if (!email.trim() || !password) {
      setError("ایمیل و رمز را وارد کن");
      return;
    }
    setSubmitting(true);
    try {
      await login(email.trim(), password);
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "ورود ناموفق بود"
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.bg }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>پلتفرم فیتنس</Text>

        <View style={styles.tabs}>
          <TouchableOpacity
            style={[styles.tab, mode === "phone" && styles.tabActive]}
            onPress={() => {
              setMode("phone");
              setError("");
            }}
          >
            <Text
              style={[
                styles.tabText,
                mode === "phone" && styles.tabTextActive,
              ]}
            >
              موبایل (OTP)
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, mode === "email" && styles.tabActive]}
            onPress={() => {
              setMode("email");
              setError("");
            }}
          >
            <Text
              style={[
                styles.tabText,
                mode === "email" && styles.tabTextActive,
              ]}
            >
              ایمیل (مربی/ادمین)
            </Text>
          </TouchableOpacity>
        </View>

        {mode === "email" ? (
          <>
            <Text style={styles.subtitle}>ورود با ایمیل و رمز عبور</Text>
            <FormField
              label="ایمیل"
              placeholder="you@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
            />
            <FormField
              label="رمز عبور"
              placeholder="••••••••"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />
            <Button
              title={submitting ? "در حال ورود..." : "ورود"}
              onPress={handleEmailLogin}
              loading={submitting}
              fullWidth
            />
          </>
        ) : (
          <>
            <Text style={styles.subtitle}>
              {step === "phone" && "شماره موبایلت را وارد کن"}
              {step === "code" && `کد ارسال‌شده به ${phone} را وارد کن`}
              {step === "profile" && "برای تکمیل ثبت‌نام، نامت را وارد کن"}
            </Text>

            {step === "phone" && (
              <>
                <FormField
                  label="شماره موبایل"
                  placeholder="09xxxxxxxxx"
                  keyboardType="phone-pad"
                  value={phone}
                  onChangeText={setPhone}
                />
                <Button
                  title={submitting ? "در حال ارسال..." : "دریافت کد تایید"}
                  onPress={handleRequestOtp}
                  loading={submitting}
                  fullWidth
                />
              </>
            )}

            {step === "code" && (
              <>
                <FormField
                  label="کد تایید"
                  placeholder="123456"
                  keyboardType="number-pad"
                  value={code}
                  onChangeText={setCode}
                />
                <Button
                  title={submitting ? "در حال بررسی..." : "تایید کد"}
                  onPress={handleVerifyOtp}
                  loading={submitting}
                  fullWidth
                />
                <Button
                  title={
                    resendCountdown > 0
                      ? `ارسال دوباره (${resendCountdown})`
                      : "ارسال دوباره کد"
                  }
                  onPress={handleRequestOtp}
                  variant="secondary"
                  disabled={resendCountdown > 0}
                  style={{ marginTop: 10 }}
                  fullWidth
                />
              </>
            )}

            {step === "profile" && (
              <>
                <FormField
                  label="نام و نام خانوادگی"
                  placeholder="مثلا: علی رضایی"
                  value={name}
                  onChangeText={setName}
                />
                <Button
                  title={submitting ? "در حال ثبت..." : "تکمیل ثبت‌نام"}
                  onPress={handleCompleteRegistration}
                  loading={submitting}
                  fullWidth
                />
              </>
            )}
          </>
        )}

        {error ? <Text style={styles.error}>{error}</Text> : null}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 24,
  },
  title: {
    color: colors.text,
    fontSize: 24,
    fontWeight: "800",
    textAlign: "center",
    marginBottom: 16,
  },
  tabs: {
    flexDirection: "row-reverse",
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: "center",
  },
  tabActive: {
    backgroundColor: colors.accent,
  },
  tabText: {
    color: colors.textMuted,
    fontSize: 12.5,
    fontWeight: "600",
  },
  tabTextActive: {
    color: "#fff",
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: 13.5,
    textAlign: "center",
    marginBottom: 20,
  },
  error: {
    color: colors.danger,
    fontSize: 13,
    textAlign: "center",
    marginTop: 12,
  },
});
