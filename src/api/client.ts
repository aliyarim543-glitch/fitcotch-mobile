import axios, { type InternalAxiosRequestConfig } from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

/**
 * آدرس بک‌اند Fitcotch
 * روی سرور واقعی: https://fitcotch.ir/api
 * برای تست لوکال می‌توانی در فایل .env مقدار دیگری بگذاری.
 */
const envUrl =
  typeof process !== "undefined" && process.env?.EXPO_PUBLIC_API_URL
    ? process.env.EXPO_PUBLIC_API_URL
    : undefined;

export const API_BASE_URL =
  envUrl || "https://fitcotch.ir/api";

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
});

api.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
  const token = await AsyncStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;

/** دانلود فایل با توکن (مثل PDF برنامه) — سازگار با Expo SDK 57 */
export async function downloadAuthedFile(path: string, filename: string) {
  // در SDK 52+ API قدیمی در مسیر legacy است
  const FileSystem = await import("expo-file-system/legacy");
  const Sharing = await import("expo-sharing");

  const token = await AsyncStorage.getItem("token");
  const baseDir =
    FileSystem.documentDirectory || FileSystem.cacheDirectory || "";
  const fileUri = `${baseDir}${filename}`;

  const result = await FileSystem.downloadAsync(
    `${API_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`,
    fileUri,
    {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    }
  );

  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(result.uri);
  }

  return result.uri;
}
