# ساخت اپ اندروید — دو روش واقعی

قبل از هر چیز آدرس API را درست کن.

## ۰) تنظیم API (اجباری)

فایل `src/api/client.ts` یا `.env`:

```env
EXPO_PUBLIC_API_URL=http://IP_کامپیوتر_شما:5000/api
```

مثال:
```env
EXPO_PUBLIC_API_URL=http://192.168.1.25:5000/api
```

IP را با `ipconfig` (ویندوز) ببین. گوشی و کامپیوتر باید روی یک وای‌فای باشند.
بک‌اند باید روشن باشد و فایروال پورت ۵۰۰۰ را باز کند.

برای نسخه اینترنت:
```env
EXPO_PUBLIC_API_URL=https://api.yourdomain.com/api
```

---

## روش ۱ — تست واقعی با Expo Go (سریع)

1. روی گوشی اندروید اپ **Expo Go** را از Play Store نصب کن.
2. در پوشه پروژه:

```bash
cd mobile-app
npm install
npx expo start
```

3. QR کد را با Expo Go اسکن کن.
4. اپ روی گوشی باز می‌شود (وابسته به Expo Go است، ولی برای تست واقعی است).

اگر به API وصل نشد:
- IP را درست کن
- بک‌اند را با `0.0.0.0` گوش بده (نه فقط localhost)
- CORS و `CLIENT_URL` را چک کن

---

## روش ۲ — APK واقعی (نصب‌شدنی، بدون Expo Go)

### یک‌بار

```bash
npm install -g eas-cli
eas login
cd mobile-app
npm install
eas build:configure
```

### ساخت APK

```bash
# آدرس API را قبل از بیلد ست کن
# ویندوز PowerShell:
$env:EXPO_PUBLIC_API_URL="http://192.168.1.25:5000/api"
eas build -p android --profile preview
```

یا در فایل `.env` همان مقدار را بگذار، بعد:

```bash
eas build -p android --profile preview
```

بعد از اتمام بیلد، Expo لینک دانلود APK می‌دهد.
APK را روی گوشی نصب کن (ممکن است Install unknown apps لازم باشد).

### برای انتشار در Play Store (AAB)

```bash
eas build -p android --profile production
```

---

## نکات مهم

- `localhost` روی گوشی کار نمی‌کند.
- برای HTTP لوکال، `usesCleartextTraffic: true` در app.json گذاشته شده.
- روی اینترنت حتماً HTTPS بگذار.
- بعد از عوض کردن API، برای APK باید **دوباره بیلد** بگیری.

## پروفایل‌های eas.json

| پروفایل | خروجی |
|---------|--------|
| preview | APK برای تست/نصب مستقیم |
| production | AAB برای گوگل‌پلی |
