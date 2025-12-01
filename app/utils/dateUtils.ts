import jalaali from 'jalaali-js';

export interface WeekOption {
  label: string;
  fromDate: string;
  toDate: string;
}

const formatJalaliDate = (jy: number, jm: number, jd: number): string => {
  const y = jy.toString();
  const m = jm.toString().padStart(2, '0');
  const d = jd.toString().padStart(2, '0');
  return `${y}/${m}/${d}`;
};

const persianWeekDayNames = ['شنبه', 'یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنج‌شنبه', 'جمعه'];

const getDayOfWeek = (jy: number, jm: number, jd: number): number => {
  // Convert Jalali to Gregorian to get day of week
  const greg = jalaali.toGregorian(jy, jm, jd);
  const date = new Date(greg.gy, greg.gm - 1, greg.gd);
  const dayOfWeek = date.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  
  // Convert to Persian week (Saturday = 0, Sunday = 1, ..., Friday = 6)
  return dayOfWeek === 6 ? 0 : dayOfWeek + 1;
};

const addDays = (jy: number, jm: number, jd: number, days: number): { jy: number; jm: number; jd: number } => {
  const greg = jalaali.toGregorian(jy, jm, jd);
  const date = new Date(greg.gy, greg.gm - 1, greg.gd);
  date.setDate(date.getDate() + days);
  return jalaali.toJalaali(date.getFullYear(), date.getMonth() + 1, date.getDate());
};

export const getWeeksOfYear = (year: number): WeekOption[] => {
  const weeks: WeekOption[] = [];
  let weekNumber = 1;
  
  // Week 1: Starts on Farvardin 1st, ends on the first Friday
  const firstDayOfWeek = getDayOfWeek(year, 1, 1);
  // Days until Friday (day 6 in Persian week)
  const daysUntilFriday = (6 - firstDayOfWeek + 7) % 7;
  const week1EndDay = 1 + daysUntilFriday;
  
  weeks.push({
    label: `هفته ۱ (${formatJalaliDate(year, 1, 1)} تا ${formatJalaliDate(year, 1, week1EndDay)})`,
    fromDate: formatJalaliDate(year, 1, 1),
    toDate: formatJalaliDate(year, 1, week1EndDay),
  });
  
  // Subsequent weeks: Saturday to Friday
  let currentDate = addDays(year, 1, week1EndDay, 1); // Next Saturday
  weekNumber = 2;
  
  const lastDayOfYear = { jy: year, jm: 12, jd: jalaali.jalaaliMonthLength(year, 12) };
  
  while (true) {
    const weekStart = { ...currentDate };
    const weekEnd = addDays(currentDate.jy, currentDate.jm, currentDate.jd, 6); // +6 days = 7 days total
    
    // Check if this week extends beyond the year
    if (weekEnd.jy > year || (weekEnd.jy === year && weekEnd.jm === 12 && weekEnd.jd > lastDayOfYear.jd)) {
      // Last partial week of the year
      if (weekStart.jy === year && weekStart.jm <= 12) {
        weeks.push({
          label: `هفته ${weekNumber} (${formatJalaliDate(weekStart.jy, weekStart.jm, weekStart.jd)} تا ${formatJalaliDate(lastDayOfYear.jy, lastDayOfYear.jm, lastDayOfYear.jd)})`,
          fromDate: formatJalaliDate(weekStart.jy, weekStart.jm, weekStart.jd),
          toDate: formatJalaliDate(lastDayOfYear.jy, lastDayOfYear.jm, lastDayOfYear.jd),
        });
      }
      break;
    }
    
    // Check if week start is beyond the year
    if (weekStart.jy > year) {
      break;
    }
    
    weeks.push({
      label: `هفته ${weekNumber} (${formatJalaliDate(weekStart.jy, weekStart.jm, weekStart.jd)} تا ${formatJalaliDate(weekEnd.jy, weekEnd.jm, weekEnd.jd)})`,
      fromDate: formatJalaliDate(weekStart.jy, weekStart.jm, weekStart.jd),
      toDate: formatJalaliDate(weekEnd.jy, weekEnd.jm, weekEnd.jd),
    });
    
    // Move to next week (next Saturday)
    currentDate = addDays(weekEnd.jy, weekEnd.jm, weekEnd.jd, 1);
    weekNumber++;
    
    // Safety check
    if (weekNumber > 60) break;
  }
  
  return weeks;
};

export const getCurrentJalaliYear = (): number => {
    const today = new Date();
    const j = jalaali.toJalaali(today);
    return j.jy;
}
