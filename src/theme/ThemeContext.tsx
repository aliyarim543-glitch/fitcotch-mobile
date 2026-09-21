import {
  createContext,
  useContext,
  useMemo,
  ReactNode,
} from "react";
import { useAuth } from "../context/AuthContext";
import { resolveColors, type AppColors } from "./presets";
import { radius, spacing } from "./colors";

type ThemeContextValue = {
  colors: AppColors;
  radius: typeof radius;
  spacing: typeof spacing;
  isDark: boolean;
};

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();

  const value = useMemo(() => {
    const theme =
      user?.role === "trainer"
        ? user?.branding?.theme
        : undefined;

    // شاگرد بعداً می‌تواند تم مربی را از API بگیرد؛ فعلاً پیش‌فرض اپ
    const colors = resolveColors(theme || null);
    const isDark = colors.bg !== "#f8fafc" && colors.bg !== "#ffffff";

    return { colors, radius, spacing, isDark };
  }, [user?.role, user?.branding?.theme]);

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    // fallback اگر خارج از Provider باشد
    return {
      colors: resolveColors(null),
      radius,
      spacing,
      isDark: true,
    };
  }
  return ctx;
}
