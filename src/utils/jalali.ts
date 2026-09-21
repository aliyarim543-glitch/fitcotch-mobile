/** تبدیل شمسی ↔ میلادی (الگوریتم استاندارد jalaali-js) */

function div(a: number, b: number) {
  return Math.floor(a / b);
}

export function jalaliToGregorian(
  jy: number,
  jm: number,
  jd: number
): [number, number, number] {
  let year = jy - 979;
  let month = jm - 1;
  let day = jd - 1;

  let jDayNo =
    365 * year + div(year, 33) * 8 + div((year % 33) + 3, 4);

  for (let i = 0; i < month; i++) {
    jDayNo += i < 6 ? 31 : 30;
  }
  jDayNo += day;

  let gDayNo = jDayNo + 79;
  let gy = 1600 + 400 * div(gDayNo, 146097);
  gDayNo = gDayNo % 146097;

  let leap = true;
  if (gDayNo >= 36525) {
    gDayNo--;
    gy += 100 * div(gDayNo, 36524);
    gDayNo = gDayNo % 36524;
    if (gDayNo >= 365) gDayNo++;
    else leap = false;
  }

  gy += 4 * div(gDayNo, 1461);
  gDayNo %= 1461;

  if (gDayNo >= 366) {
    leap = false;
    gDayNo--;
    gy += div(gDayNo, 365);
    gDayNo = gDayNo % 365;
  }

  const salA = [
    0,
    31,
    leap ? 29 : 28,
    31,
    30,
    31,
    30,
    31,
    31,
    30,
    31,
    30,
    31,
  ];

  let gm = 1;
  while (gm < 13 && gDayNo >= salA[gm]) {
    gDayNo -= salA[gm];
    gm++;
  }

  return [gy, gm, gDayNo + 1];
}

export function gregorianToJalali(
  gy: number,
  gm: number,
  gd: number
): [number, number, number] {
  let year = gy - 1600;
  let month = gm - 1;
  let day = gd - 1;

  let gDayNo =
    365 * year +
    div(year + 3, 4) -
    div(year + 99, 100) +
    div(year + 399, 400);

  const gMonthDays = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  for (let i = 0; i < month; i++) gDayNo += gMonthDays[i];

  if (
    month > 1 &&
    ((gy % 4 === 0 && gy % 100 !== 0) || gy % 400 === 0)
  ) {
    gDayNo++;
  }
  gDayNo += day;

  let jDayNo = gDayNo - 79;
  const jNp = div(jDayNo, 12053);
  jDayNo %= 12053;

  let jy = 979 + 33 * jNp + 4 * div(jDayNo, 1461);
  jDayNo %= 1461;

  if (jDayNo >= 366) {
    jy += div(jDayNo - 1, 365);
    jDayNo = (jDayNo - 1) % 365;
  }

  let jm: number;
  let jd: number;
  if (jDayNo < 186) {
    jm = 1 + div(jDayNo, 31);
    jd = 1 + (jDayNo % 31);
  } else {
    jm = 7 + div(jDayNo - 186, 30);
    jd = 1 + ((jDayNo - 186) % 30);
  }

  return [jy, jm, jd];
}

export const JALALI_MONTHS = [
  "فروردین",
  "اردیبهشت",
  "خرداد",
  "تیر",
  "مرداد",
  "شهریور",
  "مهر",
  "آبان",
  "آذر",
  "دی",
  "بهمن",
  "اسفند",
];

export function toPersianDigits(value: string | number) {
  return String(value).replace(/\d/g, (d) => "۰۱۲۳۴۵۶۷۸۹"[Number(d)]);
}

export function toEnglishDigits(value: string) {
  return value.replace(/[۰-۹]/g, (d) =>
    String("۰۱۲۳۴۵۶۷۸۹".indexOf(d))
  );
}

export function formatJalaliDate(date: Date) {
  const [y, m, d] = gregorianToJalali(
    date.getFullYear(),
    date.getMonth() + 1,
    date.getDate()
  );
  return `${toPersianDigits(d)} ${JALALI_MONTHS[m - 1]} ${toPersianDigits(y)}`;
}

export function formatJalaliMonth(date: Date) {
  const [y, m] = gregorianToJalali(
    date.getFullYear(),
    date.getMonth() + 1,
    date.getDate()
  );
  return `${JALALI_MONTHS[m - 1]} ${toPersianDigits(y)}`;
}

export function getJalaliDateInput(date: Date) {
  const [y, m, d] = gregorianToJalali(
    date.getFullYear(),
    date.getMonth() + 1,
    date.getDate()
  );
  return `${y}/${String(m).padStart(2, "0")}/${String(d).padStart(2, "0")}`;
}

export function parseJalaliDate(value: string): Date | null {
  const normalized = toEnglishDigits(value).replace(/-/g, "/");
  const parts = normalized.split("/");
  if (parts.length !== 3) return null;

  const year = Number(parts[0]);
  const month = Number(parts[1]);
  const day = Number(parts[2]);

  if (
    !Number.isInteger(year) ||
    !Number.isInteger(month) ||
    !Number.isInteger(day) ||
    year < 1300 ||
    year > 1500 ||
    month < 1 ||
    month > 12 ||
    day < 1 ||
    day > (month <= 6 ? 31 : month <= 11 ? 30 : 30)
  ) {
    return null;
  }

  const [gy, gm, gd] = jalaliToGregorian(year, month, day);
  const result = new Date(gy, gm - 1, gd);
  if (
    result.getFullYear() !== gy ||
    result.getMonth() !== gm - 1 ||
    result.getDate() !== gd
  ) {
    return null;
  }
  return result;
}
