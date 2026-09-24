import { API_BASE_URL } from "../api/client";

/** پایه دامنه بدون /api — برای فایل‌های استاتیک مثل /exercise-media/... */
export function getOrigin(): string {
  return API_BASE_URL.replace(/\/api\/?$/, "");
}

/**
 * آدرس نسبی یا کامل رسانه را به URL قابل نمایش تبدیل می‌کند.
 * مثال: /exercise-media/exercises/Star_Jump.gif
 *   → https://fitcotch.ir/exercise-media/exercises/Star_Jump.gif
 */
export function resolveMediaUrl(
  url?: string | null
): string | null {
  if (!url || typeof url !== "string") return null;
  const trimmed = url.trim();
  if (!trimmed) return null;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (trimmed.startsWith("data:")) return trimmed;
  const origin = getOrigin();
  return `${origin}${trimmed.startsWith("/") ? "" : "/"}${trimmed}`;
}

/** از آبجکت حرکت، بهترین فیلد تصویر/گیف را برمی‌دارد */
export function exerciseImageUrl(ex: any): string | null {
  if (!ex) return null;
  return resolveMediaUrl(
    ex.imageUrl ||
      ex.gifUrl ||
      ex.animationUrl ||
      ex.mediaUrl ||
      ex.exercise?.imageUrl ||
      null
  );
}
