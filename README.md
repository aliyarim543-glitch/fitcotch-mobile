# Fitness Platform — Mobile (Expo)

## امکانات اضافه‌شده
- تم داینامیک مربی (`ThemeProvider` + presetهای وب)
- پیام‌رسانی مربی ↔ شاگرد (`/api/messages`)
- تقویم جلسات مربی با تبدیل شمسی صحیح

## اجرا
```bash
cd mobile-app
npm install
```

آدرس API را در `src/api/client.ts` تنظیم کن:
```ts
export const API_BASE_URL = "http://IP_کامپیوتر:5000/api";
```
روی گوشی واقعی به‌جای `localhost` از IP سیستم روی همان وای‌فای استفاده کن.

```bash
npx expo start
```

## پیش‌نیاز بک‌اند
- مسیر `/api/messages` فعال باشد
- مسیر `/api/appointments` برای مربی فعال باشد

## ساختار مهم
- `src/theme/` — رنگ‌ها و تم
- `src/screens/shared/MessagingScreen.tsx` — چت
- `src/screens/trainer/TrainerCalendarScreen.tsx` — تقویم
- `src/utils/jalali.ts` — تبدیل تاریخ شمسی
