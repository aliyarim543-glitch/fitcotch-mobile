# نصب اپ موبایل (ویندوز)

## ۱) پاکسازی اگر قبلاً خطا خورده
```powershell
cd D:\mobile-app-full\mobile-app
Remove-Item -Recurse -Force node_modules -ErrorAction SilentlyContinue
Remove-Item -Force package-lock.json -ErrorAction SilentlyContinue
```

## ۲) نصب
```powershell
npm install
```

اگر باز ERESOLVE آمد:
```powershell
npm install --legacy-peer-deps
```

## ۳) اجرا
```powershell
npx expo start
```

## نکته
- `@react-navigation/drawer` حذف شد (استفاده نمی‌شد و با RN 0.74 تداخل داشت).
- خطاهای «Cannot find module axios» بعد از نصب موفق از بین می‌روند.
