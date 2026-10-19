/**
 * «Woche planen» content (Noah 18.10.2026 «4a»): the public holidays of the canton of Zürich and a
 * few season hints that fit a week. Pure rules, no outside service; the names go through t() on the
 * page (HOLIDAY_NAMES, SEASON_TITLES).
 */
import { shiftDay } from '../training.js';

/** Easter Sunday of a year (Gregorian calendar, anonymous algorithm). */
export function easter(year) {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

export const HOLIDAY_NAMES = {
  newyear: "New Year's Day",
  berchtold: "Berchtold's Day",
  goodfriday: 'Good Friday',
  eastermonday: 'Easter Monday',
  labour: 'Labour Day',
  ascension: 'Ascension Day',
  whitmonday: 'Whit Monday',
  national: 'Swiss National Day',
  christmas: 'Christmas Day',
  stephen: "St Stephen's Day",
};

/** The public holidays of the canton of Zürich in a year: [{ day, key }]. */
export function holidaysOf(year) {
  const e = easter(year);
  const y = (md) => `${year}-${md}`;
  return [
    { day: y('01-01'), key: 'newyear' },
    { day: y('01-02'), key: 'berchtold' },
    { day: shiftDay(e, -2), key: 'goodfriday' },
    { day: shiftDay(e, 1), key: 'eastermonday' },
    { day: y('05-01'), key: 'labour' },
    { day: shiftDay(e, 39), key: 'ascension' },
    { day: shiftDay(e, 50), key: 'whitmonday' },
    { day: y('08-01'), key: 'national' },
    { day: y('12-25'), key: 'christmas' },
    { day: y('12-26'), key: 'stephen' },
  ].sort((a, b) => a.day.localeCompare(b.day));
}

/** The holiday key of a day, or null. */
export const holidayOn = (day) => holidaysOf(Number(day.slice(0, 4))).find((h) => h.day === day)?.key ?? null;

/** The last Sunday of a month (the clocks change on the last Sunday of March and October). */
export function lastSunday(year, month) {
  const d = new Date(Date.UTC(year, month, 0, 12));
  d.setUTCDate(d.getUTCDate() - d.getUTCDay());
  return d.toISOString().slice(0, 10);
}

export const SEASON_TITLES = {
  lights: 'Clocks go back on Sunday: check the bike lights',
  winter: 'Get the bike ready for winter: clean the chain, fit mudguards',
  ski: 'Ski touring season: check the skins and the avalanche transceiver',
  spring: 'Service the bike before the season',
};
/** Season windows (month-day, both ends included); lights: the week with the October clock change. */
const WINDOWS = [
  { key: 'winter', from: '10-20', to: '11-30' },
  { key: 'ski', from: '11-15', to: '12-31' },
  { key: 'spring', from: '03-01', to: '04-15' },
];

/** The season hints of a week: [{ key, ref }]; ref `season:<key>:<year>` is taken once a year. */
export function seasonOf(monday) {
  const days = Array.from({ length: 7 }, (_, i) => shiftDay(monday, i));
  const year = Number(days[6].slice(0, 4));
  const out = [];
  if (days.includes(lastSunday(year, 10))) out.push('lights');
  for (const w of WINDOWS) if (days.some((d) => d.slice(5) >= w.from && d.slice(5) <= w.to)) out.push(w.key);
  return out.map((key) => ({ key, ref: `season:${key}:${year}` }));
}
