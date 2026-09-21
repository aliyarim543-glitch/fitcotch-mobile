# نصب اپ Fitcotch (Expo SDK 57)

## پیش‌نیاز روی ویندوز
1. Node.js 20 یا جدیدتر: https://nodejs.org
2. روی گوشی اندروید: اپ **Expo Go** از گوگل‌پلی (نسخه سازگار با SDK 57)

---

## مرحله ۱ — باز کردن پروژه
فایل زیپ را باز کن، بعد در PowerShell:

```powershell
cd مسیر\پوشه\mobile-app
```

مثال:
```powershell
cd D:\fitcotch-mobile\mobile-app
```

---

## مرحله ۲ — نصب پکیج‌ها
```powershell
npm install --legacy-peer-deps
```

اگر خطا داد:
```powershell
Remove-Item -Recurse -Force node_modules -ErrorAction SilentlyContinue
Remove-Item -Force package-lock.json -ErrorAction SilentlyContinue
npm install --legacy-peer-deps
```

---

## مرحله ۳ — آدرس سرور
فایل `.env` از قبل روی سرور واقعی تنظیم شده:

```
EXPO_PUBLIC_API_URL=https://fitcotch.ir/api
```

تغییر نده مگر بخواهی به سرور دیگری وصل شوی.

---

## مرحله ۴ — اجرا
```powershell
npx expo start
```

- QR کد را با **Expo Go** اسکن کن
- گوشی و کامپیوتر باید به اینترنت وصل باشند (چون API روی fitcotch.ir است)

اگر QR کار نکرد، در ترمینال `s` بزن برای switch، یا لینک `exp://...` را در Expo Go وارد کن.

---

## ساخت APK (اختیاری)
نیاز به حساب رایگان Expo دارد:

```powershell
npm install -g eas-cli
eas login
eas build -p android --profile preview
```

بعد از اتمام، لینک دانلود APK می‌دهد.

---

## خطاهای رایج
| خطا | کار |
|-----|-----|
| SDK mismatch در Expo Go | Expo Go را آپدیت کن (باید SDK 57 باشد) |
| npm ERESOLVE | `npm install --legacy-peer-deps` |
| لاگین نمی‌شود | `.env` را چک کن؛ باید `https://fitcotch.ir/api` باشد |
| Cannot find module | دوباره `npm install --legacy-peer-deps` |

