export type ThemePresetKey =
  | "classic_white"
  | "black_gold"
  | "navy_sport"
  | "modern_gray"
  | "energy_green"
  | "power_red"
  | "custom";

export type AppColors = {
  bg: string;
  surface: string;
  surfaceAlt: string;
  border: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  accent: string;
  accentSoft: string;
  blue: string;
  blueSoft: string;
  success: string;
  successSoft: string;
  warning: string;
  warningSoft: string;
  danger: string;
  dangerSoft: string;
  purple: string;
  purpleSoft: string;
  white: string;
};

const baseDarkExtras = {
  blue: "#3b82f6",
  blueSoft: "rgba(59, 130, 246, 0.15)",
  success: "#22c55e",
  successSoft: "rgba(34, 197, 94, 0.15)",
  warning: "#f59e0b",
  warningSoft: "rgba(245, 158, 11, 0.15)",
  danger: "#ef4444",
  dangerSoft: "rgba(239, 68, 68, 0.15)",
  purple: "#a855f7",
  purpleSoft: "rgba(168, 85, 247, 0.15)",
  white: "#ffffff",
};

export const THEME_PRESETS: Record<
  Exclude<ThemePresetKey, "custom">,
  { label: string } & AppColors
> = {
  classic_white: {
    label: "سفید کلاسیک",
    bg: "#f8fafc",
    surface: "#ffffff",
    surfaceAlt: "#f1f5f9",
    border: "#e5e7eb",
    text: "#1f2937",
    textSecondary: "#4b5563",
    textMuted: "#6b7280",
    accent: "#7c5cff",
    accentSoft: "rgba(124, 92, 255, 0.12)",
    ...baseDarkExtras,
  },
  black_gold: {
    label: "مشکی طلایی",
    bg: "#0b0b0f",
    surface: "#15151a",
    surfaceAlt: "#1d1d23",
    border: "#34343d",
    text: "#f3f4f6",
    textSecondary: "#a1a1aa",
    textMuted: "#6b7280",
    accent: "#d4af37",
    accentSoft: "rgba(212, 175, 55, 0.15)",
    ...baseDarkExtras,
  },
  navy_sport: {
    label: "سرمه‌ای ورزشی",
    bg: "#0b0b0f",
    surface: "#121a2a",
    surfaceAlt: "#1a2638",
    border: "#334155",
    text: "#f3f4f6",
    textSecondary: "#94a3b8",
    textMuted: "#64748b",
    accent: "#38bdf8",
    accentSoft: "rgba(56, 189, 248, 0.15)",
    ...baseDarkExtras,
  },
  modern_gray: {
    label: "خاکستری مدرن",
    bg: "#0b0b0f",
    surface: "#18181b",
    surfaceAlt: "#232329",
    border: "#3f3f46",
    text: "#f3f4f6",
    textSecondary: "#a1a1aa",
    textMuted: "#71717a",
    accent: "#9ca3af",
    accentSoft: "rgba(156, 163, 175, 0.15)",
    ...baseDarkExtras,
  },
  energy_green: {
    label: "سبز انرژی",
    bg: "#0b0b0f",
    surface: "#101916",
    surfaceAlt: "#16221d",
    border: "#294536",
    text: "#f3f4f6",
    textSecondary: "#a1a1aa",
    textMuted: "#6b7280",
    accent: "#22c55e",
    accentSoft: "rgba(34, 197, 94, 0.15)",
    ...baseDarkExtras,
  },
  power_red: {
    label: "قرمز قدرت",
    bg: "#0b0b0f",
    surface: "#1a1111",
    surfaceAlt: "#241616",
    border: "#4a2727",
    text: "#f3f4f6",
    textSecondary: "#a1a1aa",
    textMuted: "#6b7280",
    accent: "#ef4444",
    accentSoft: "rgba(239, 68, 68, 0.15)",
    ...baseDarkExtras,
  },
};

export const DEFAULT_COLORS: AppColors = {
  bg: "#0f0f14",
  surface: "#1c1c24",
  surfaceAlt: "#17171d",
  border: "#26262f",
  text: "#f3f4f6",
  textSecondary: "#a1a1aa",
  textMuted: "#6b7280",
  accent: "#7c5cff",
  accentSoft: "rgba(124, 92, 255, 0.15)",
  ...baseDarkExtras,
};

function hexToRgba(hex: string, alpha: number) {
  const clean = hex.replace("#", "");
  const full =
    clean.length === 3
      ? clean.split("").map((c) => c + c).join("")
      : clean;
  if (full.length !== 6 || Number.isNaN(parseInt(full, 16))) {
    return `rgba(124, 92, 255, ${alpha})`;
  }
  const num = parseInt(full, 16);
  const r = (num >> 16) & 255;
  const g = (num >> 8) & 255;
  const b = num & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function resolveColors(theme?: {
  preset?: ThemePresetKey;
  customColor?: string;
} | null): AppColors {
  if (!theme?.preset || theme.preset === "classic_white") {
    // در موبایل حالت پیش‌فرض تیره اپ را نگه می‌داریم مگر preset صریح روشن
    if (theme?.preset === "classic_white") {
      return { ...THEME_PRESETS.classic_white };
    }
    return { ...DEFAULT_COLORS };
  }

  if (theme.preset === "custom") {
    const accent = theme.customColor || DEFAULT_COLORS.accent;
    return {
      ...DEFAULT_COLORS,
      accent,
      accentSoft: hexToRgba(accent, 0.15),
    };
  }

  return {
    ...(THEME_PRESETS[theme.preset] || DEFAULT_COLORS),
  };
}
