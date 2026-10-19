/**
 * Merken: Geburtstage and Pflanzen (Noah 15.10.2026 «plus geburtstag, pflanzen … ebenfalls reinnehmen»).
 * Two kinds of entries in the same Merken list (settings key 'merken', merkendb.js), next to the to-dos:
 *   birthday = { id, kind: 'birthday', area: 'birthday', text: name, bday: { md: 'MM-DD', year: number | null },
 *                reminds: [{ before: 0 | 1, at: 'HH:MM' }], gift?: string, created, doneAt: null, off? }
 *   plant    = { id, kind: 'plant', area: 'plant', text: name,
 *                plant: { every: days, place: string | null, last: 'YYYY-MM-DD', winter?: false },
 *                remind: null | { at: 'HH:MM', before: 0 }, created, doneAt: null, off? }
 * A birthday repeats every year: by default the day before at 18:00 and on the day at 08:00 (each one
 * changeable and deselectable). A plant is due «every N days» after it was last watered; «Gegossen» sets
 * the last day to today. They show in Kalender › Merken in their own groups and on Ich › Erinnerungen,
 * never on Heute. Pure functions on calendar days (YYYY-MM-DD, Europe/Zurich via localDay()).
 * Content (Noah «1a» 18.10.2026 on inhalt-vorschlag.md, parts 4 and 5): a gift idea with 5 examples; the
 * birthdays of the next 30 days on top, the rest by month; 12 common plants as a start value; in winter
 * (November to February) the interval is 1.5 times longer, per plant deselectable.
 */
import { addDays } from '../merken.js';

export const KINDS = ['birthday', 'plant'];
export const isKind = (td) => KINDS.includes(td?.kind);

/** The reminders a new birthday gets (Noah: the day before at 18:00, on the day at 08:00). */
export const BDAY_REMINDS = [
  { before: 1, at: '18:00' },
  { before: 0, at: '08:00' },
];
export const PLANT_AT = '08:00';

/** Gift ideas to tap (inhalt-vorschlag 4). */
export const GIFT_IDEAS = ['A bike ride together', 'A book', 'Something homemade', 'An experience together', 'A call is enough too'];
/** 12 common plants with a start value for «every N days» (inhalt-vorschlag 5). */
export const PLANT_SUGGESTIONS = [
  { name: 'Monstera', every: 7 },
  { name: 'Pothos', every: 7 },
  { name: 'Ficus', every: 7 },
  { name: 'Spider plant', every: 7 },
  { name: 'Orchid (soak)', every: 7 },
  { name: 'Peace lily', every: 5 },
  { name: 'Snake plant', every: 14 },
  { name: 'ZZ plant', every: 14 },
  { name: 'Aloe', every: 14 },
  { name: 'Cactus', every: 21 },
  { name: 'Basil', every: 2 },
  { name: 'Tomato on the balcony', every: 1 },
];
/** Winter: November to February; the interval is this much longer. */
export const WINTER_MONTHS = [11, 12, 1, 2];
export const WINTER_FACTOR = 1.5;
export const SOON_DAYS = 30;
export const PLANT_EVERY = 7;

const pad = (n) => String(n).padStart(2, '0');
const MD = /^(\d{2})-(\d{2})$/;
const DAY = /^\d{4}-\d{2}-\d{2}$/;

export const isLeap = (y) => (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
/** Days in a month (1–12); February with 29 when no year is given (a birthday may be on 29 Feb). */
export const daysInMonth = (m, y = 2000) => new Date(Date.UTC(y, m, 0)).getUTCDate();

/** Is 'MM-DD' a real day of the year (29 Feb included)? */
export function validMd(md) {
  const m = MD.exec(md ?? '');
  if (!m) return false;
  const mm = +m[1];
  const dd = +m[2];
  return mm >= 1 && mm <= 12 && dd >= 1 && dd <= daysInMonth(mm);
}

/** The birthday in a given year; 29 Feb becomes 28 Feb in a year without 29 Feb. */
export function birthdayIn(md, year) {
  const [mm, dd] = md.split('-').map(Number);
  const d = mm === 2 && dd === 29 && !isLeap(year) ? 28 : dd;
  return `${year}-${pad(mm)}-${pad(d)}`;
}

/** The next birthday on or after today. */
export function nextBirthday(bday, today) {
  const y = +today.slice(0, 4);
  const day = birthdayIn(bday.md, y);
  return day >= today ? day : birthdayIn(bday.md, y + 1);
}

/** Calendar days from a to b (b later → positive). */
export const daysBetween = (a, b) => Math.round((Date.parse(`${b}T12:00:00Z`) - Date.parse(`${a}T12:00:00Z`)) / 864e5);

/** The age on that birthday («wird 40»); null without a year or for a year in the future. */
export function ageOn(bday, day) {
  if (!Number.isInteger(bday?.year)) return null;
  const n = +day.slice(0, 4) - bday.year;
  return n >= 0 ? n : null;
}

/** The days a reminder shows for the next birthday: [{ day, at, before }], earliest first, the past left out. */
export function birthdayReminders(td, today) {
  if (td.off) return [];
  const next = nextBirthday(td.bday, today);
  return (td.reminds ?? [])
    .map((r) => ({ ...r, day: addDays(next, -(r.before ?? 0)) }))
    .filter((r) => r.day >= today)
    .sort((a, b) => a.day.localeCompare(b.day) || a.at.localeCompare(b.at));
}

/** Switches one of the default birthday reminders (before 1 or 0) on or off, keeping its time. */
export function toggleRemind(reminds = [], before, at = BDAY_REMINDS.find((r) => r.before === before)?.at ?? '08:00') {
  if (reminds.some((r) => r.before === before)) return reminds.filter((r) => r.before !== before);
  return [...reminds, { before, at }].sort((a, b) => b.before - a.before);
}
/** Changes the time of one birthday reminder. */
export const remindAt = (reminds = [], before, at) => reminds.map((r) => (r.before === before ? { ...r, at } : r));

/** A new birthday; null without a name or a real day. */
export function newBirthday({ name, md, year = null, reminds = BDAY_REMINDS, gift = '' } = {}, { id, now = new Date().toISOString() } = {}) {
  const text = String(name ?? '').trim();
  if (!text || !validMd(md)) return null;
  const y = Number.isInteger(+year) && +year > 1900 ? +year : null;
  const td = { id, kind: 'birthday', area: 'birthday', text, bday: { md, year: y }, reminds: reminds.map((r) => ({ ...r })), created: now, doneAt: null };
  const g = String(gift ?? '').trim();
  if (g) td.gift = g;
  return td;
}

/** A new plant; null without a name. every: whole days ≥ 1; last: the day it was last watered (default today). */
export function newPlant({ name, every = PLANT_EVERY, place = null, last = null, remind = { at: PLANT_AT, before: 0 }, winter = true } = {}, { id, today, now = new Date().toISOString() } = {}) {
  const text = String(name ?? '').trim();
  if (!text) return null;
  const n = Math.max(1, Math.round(+every || PLANT_EVERY));
  const pl = String(place ?? '').trim() || null;
  const plant = { every: n, place: pl, last: DAY.test(last ?? '') ? last : today };
  if (winter === false) plant.winter = false;
  return { id, kind: 'plant', area: 'plant', text, plant, remind, created: now, doneAt: null };
}

/** Is this calendar day in winter (November to February)? */
export const isWinter = (day) => WINTER_MONTHS.includes(+day.slice(5, 7));
/** The «winter longer» switch: on unless switched off. */
export const winterOn = (plant) => plant.winter !== false;

/** The interval from a watering on this day: 1.5 times longer in winter (whole days), unless switched off. */
export function everyOn(plant, day) {
  return winterOn(plant) && isWinter(day) ? Math.round(plant.every * WINTER_FACTOR) : plant.every;
}

/** When a plant needs water next: from the last watering, with the interval of that day. */
export const plantNext = (td) => addDays(td.plant.last, everyOn(td.plant, td.plant.last));

/** «Gegossen»: watered today, so the next day moves on (the caller keeps the old entry for Undo). */
export const watered = (td, today) => ({ ...td, plant: { ...td.plant, last: today } });

/** Birthdays for Merken: next ones first. [{ td, day, in, age }] */
export function birthdayRows(todos, today) {
  return todos
    .filter((x) => x.kind === 'birthday' && !x.doneAt)
    .map((td) => {
      const day = nextBirthday(td.bday, today);
      return { td, day, in: daysBetween(today, day), age: ageOn(td.bday, day) };
    })
    .sort((a, b) => a.day.localeCompare(b.day) || a.td.text.localeCompare(b.td.text));
}

/** Plants for Merken: the most urgent first. [{ td, day, in }] (in < 0: late by that many days). */
export function plantRows(todos, today) {
  return todos
    .filter((x) => x.kind === 'plant' && !x.doneAt)
    .map((td) => {
      const day = plantNext(td);
      return { td, day, in: daysBetween(today, day) };
    })
    .sort((a, b) => a.day.localeCompare(b.day) || a.td.text.localeCompare(b.td.text));
}

/** The day a plant reminder shows: the due day, today when it is late; null when off or without a time. */
export const plantReminder = (td, today) => (td.off || !td.remind ? null : { day: plantNext(td) < today ? today : plantNext(td), at: td.remind.at });

/**
 * The birthday rows in sections: the next 30 days on top ('soon'), the rest by month ('YYYY-MM'),
 * in the order of the rows (next ones first). → [{ key, rows }]
 */
export function birthdaySections(rows, soon = SOON_DAYS) {
  const out = [];
  for (const r of rows) {
    const key = r.in <= soon ? 'soon' : r.day.slice(0, 7);
    if (out.at(-1)?.key !== key) out.push({ key, rows: [] });
    out.at(-1).rows.push(r);
  }
  return out;
}

/** iCalendar rule for a yearly birthday reminder; 29 Feb follows the last day of February. */
export function yearlyRule(md, before) {
  const [mm, dd] = md.split('-').map(Number);
  if (mm === 2 && dd === 29) return `FREQ=YEARLY;BYMONTH=2;BYMONTHDAY=${-1 - before}`;
  return 'FREQ=YEARLY';
}

/** Calendar events (for icsCalendar) of the birthdays: one yearly event per reminder, with its time. */
export function birthdayEvents(todos, today) {
  return todos
    .filter((x) => x.kind === 'birthday' && !x.doneAt && !x.off)
    .flatMap((td) => {
      const next = nextBirthday(td.bday, today);
      return (td.reminds ?? []).map((r) => {
        // the first event is one the rule gives too: for 29 Feb in a common year that is 28 Feb
        return { uid: `bday-${td.id}-${r.before}`, title: td.text, day: addDays(next, -(r.before ?? 0)), time: r.at, minutes: 15, rrule: yearlyRule(td.bday.md, r.before ?? 0) };
      });
    });
}
