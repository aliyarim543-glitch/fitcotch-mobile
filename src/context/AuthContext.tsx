import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

import api from "../api/client";
import type { AuthUser, Role } from "../types";

interface VerifyOtpResult {
  isNewUser: boolean;
  user?: AuthUser;
  token?: string;
}

interface RegisterResult {
  pending: boolean;
  user?: AuthUser;
  token?: string;
  message?: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  requestOtp(phone: string): Promise<void>;
  verifyOtp(
    phone: string,
    code: string,
    name?: string,
    role?: Role
  ): Promise<VerifyOtpResult>;
  login(email: string, password: string): Promise<AuthUser>;
  register(
    name: string,
    email: string,
    password: string,
    role: Role
  ): Promise<RegisterResult>;
  updateUser(partial: Partial<AuthUser>): void;
  logout(): void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  async function clearSession() {
    await AsyncStorage.multiRemove(["token", "user"]);
    setUser(null);
  }

  // بازیابی نشست ذخیره‌شده هنگام باز شدن اپ
  useEffect(() => {
    (async () => {
      try {
        const [savedToken, savedUser] = await AsyncStorage.multiGet([
          "token",
          "user",
        ]);

        const token = savedToken[1];
        const userJson = savedUser[1];

        if (!token || !userJson || token === "undefined" || token === "null") {
          await clearSession();
          return;
        }

        const parsedUser = JSON.parse(userJson);

        if (!parsedUser || !parsedUser.role) {
          await clearSession();
          return;
        }

        setUser(parsedUser);
      } catch (error) {
        console.error("RESTORE SESSION ERROR:", error);
        await clearSession();
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function persistSession(userData: AuthUser, token: string) {
    if (!userData || !token || token === "undefined" || token === "null") {
      console.warn("SESSION NOT SAVED: invalid user or token");
      return;
    }

    await AsyncStorage.setItem("token", token);
    await AsyncStorage.setItem("user", JSON.stringify(userData));

    setUser(userData);
  }

  async function login(email: string, password: string): Promise<AuthUser> {
    const { data } = await api.post("/auth/login", { email, password });

    if (!data || !data.user || !data.token) {
      throw new Error("پاسخ ورود از سرور نامعتبر است");
    }

    await persistSession(data.user, data.token);
    return data.user;
  }

  async function register(
    name: string,
    email: string,
    password: string,
    role: Role
  ): Promise<RegisterResult> {
    await clearSession();

    const { data } = await api.post("/auth/register", {
      name,
      email,
      password,
      role,
    });

    if (data.pending === true) {
      await clearSession();
      return { pending: true, user: data.user, message: data.message };
    }

    if (!data.user || !data.token) {
      throw new Error("پاسخ ثبت‌نام از سرور نامعتبر است");
    }

    await persistSession(data.user, data.token);

    return {
      pending: false,
      user: data.user,
      token: data.token,
      message: data.message,
    };
  }

  async function requestOtp(phone: string): Promise<void> {
    await api.post("/auth/otp/request", { phone });
  }

  async function verifyOtp(
    phone: string,
    code: string,
    name?: string,
    role?: Role
  ): Promise<VerifyOtpResult> {
    const { data } = await api.post("/auth/otp/verify", {
      phone,
      code,
      name,
      role,
    });

    if (data.isNewUser) {
      return { isNewUser: true };
    }

    if (!data.user || !data.token) {
      throw new Error("پاسخ OTP از سرور نامعتبر است");
    }

    await persistSession(data.user, data.token);

    return { isNewUser: false, user: data.user, token: data.token };
  }

  function updateUser(partial: Partial<AuthUser>) {
    setUser((prev) => {
      if (!prev) return prev;
      const updated = { ...prev, ...partial };
      AsyncStorage.setItem("user", JSON.stringify(updated));
      return updated;
    });
  }

  async function logout() {
    await AsyncStorage.multiRemove(["token", "user"]);
    setUser(null);
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        requestOtp,
        verifyOtp,
        login,
        register,
        updateUser,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth باید داخل AuthProvider استفاده شود");
  }
  return ctx;
}
