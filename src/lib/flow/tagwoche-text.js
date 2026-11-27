/**
 * The words of the card «Dein Tag und deine Woche» (Noah 27.11.2026, Fragen 8 bis 12, 18 und 22): the rows from the facts of flow/tagwoche.js.
 * Observation only: «lighter», «more» are against YOUR usual, never a grade. Without measured minutes the number of ticks is counted.
 * → [{ key, label, text, action? }] ; locale: the language code of the app (weekday names).
 */
import { artName, artOptions } from './arten.js';
import { t, num } from '../i18n.svelte.js';

/** n with the number in the language of the app (a mean can have a decimal). */
const tn = (n, one, many) => t(n === 1 ? one : many, { n: num(n) });
const WHEN = { today: 'Today|tw', yesterday: 'Yesterday|tw' };
const PLACE = { light: 'lighter than your usual day', usual: 'a usual day for you', strong: 'stronger than your usual day' };
const WEEK_PLACE = { harder: 'more than usual', similar: 'about as much as usual', lighter: 'less than usual' };

const mins = (m) => tn(Math.round(m), '{n} minute', '{n} minutes');
const daysTxt = (n) => tn(Math.round(n * 10) / 10, '{n} day with movement', '{n} days with movement');
const weekdayName = (idx, loc) => new Date(Date.UTC(2024, 0, 1 + idx, 12)).toLocaleDateString(loc, { weekday: 'long', timeZone: 'UTC' });

export function tagwocheRows({ day, week, mix, pause, free, rhythm, year, nameOf = (a) => a?.name ?? '', loc = 'en', today = '' }) {
  const rows = [];
  if (day) {
    rows.push({
      key: 'day',
      label: t('Day|tw'),
      text:
        day.by === 'min'
          ? t('{when}: {n} of movement. That is {place} (about {u}).', { when: t(WHEN[day.when]), n: mins(day.value), place: t(PLACE[day.kind]), u: mins(day.typical) })
          : t('{when}: {n} ticked. That is {place} (about {u}).', { when: t(WHEN[day.when]), n: tn(day.value, '{n} activity|tw', '{n} activities|tw'), place: t(PLACE[day.kind]), u: num(day.typical) }),
    });
  }
  if (week) {
    const fmt = (v) => (week.by === 'min' ? mins(v) : daysTxt(v));
    rows.push({ key: 'week', label: t('Week|tw'), text: t('This week so far: {cur}, {place} for these days (the last four weeks: about {mean}).', { cur: fmt(week.cur), place: t(WEEK_PLACE[week.kind]), mean: fmt(week.mean) }) });
  }
  if (mix) {
    const parts = mix.kinds.map((k) => `${artName(k.id)} ${tn(k.days, '{n} day', '{n} days')}`);
    const ids = new Set(mix.kinds.map((k) => k.id));
    const lacking = artOptions().filter((k) => !ids.has(k.key)).map((k) => k.name);
    if (parts.length) {
      rows.push({
        key: 'mix',
        label: t('Mix'),
        text: t('Your last 28 days by kind: {list}.', { list: parts.join(', ') }) + (lacking.length ? ` ${t('Nothing of: {list}.', { list: lacking.join(', ') })}` : ''),
        action: mix.missing > 0 ? { text: tn(mix.missing, 'For {n} activity the kind is missing: choose now', 'For {n} activities the kind is missing: choose now') } : null,
      });
    } else if (mix.missing > 0) {
      rows.push({ key: 'mix', label: t('Mix'), text: t('Choose the kind of your sports (strength, endurance …) and this shows the mix of your last 28 days.'), action: { text: tn(mix.missing, 'For {n} activity the kind is missing: choose now', 'For {n} activities the kind is missing: choose now') } });
    }
  }
  if (pause) rows.push({ key: 'pause', label: t('Rests longest'), text: t('{name}: {n} since the last time, usually about {u} between two.', { name: nameOf(pause.act), n: tn(pause.since, '{n} day', '{n} days'), u: tn(pause.usual, '{n} day', '{n} days') }) });
  if (free) rows.push({ key: 'free', label: t('Free days'), text: t('{w} of the last 7 days without movement. The longest stretch of the last 90 days: {l} in a row.', { w: free.week, l: tn(free.longest, '{n} day', '{n} days') }) });
  if (rhythm) {
    const bits = [];
    if (rhythm.weekday != null) bits.push(t('Your most active weekday: {wd} ({d} of {of} days with movement).', { wd: weekdayName(rhythm.weekday, loc), d: rhythm.days, of: rhythm.of }));
    if (rhythm.slot) bits.push(t('Most timed sessions begin between {from} and {to} o’clock ({n} of {of}).', { from: rhythm.slot.from, to: rhythm.slot.from + 3, n: rhythm.slot.n, of: rhythm.slot.of }));
    rows.push({ key: 'rhythm', label: t('Rhythm'), text: bits.join(' ') });
  }
  if (year) {
    const m = year.by === 'min';
    const f = (v) => (m ? mins(v) : daysTxt(v));
    rows.push({ key: 'year', label: t('Year|tw'), text: t('This month up to the {d}.: {a}, last year in the same days: {b}.', { d: year.toDay, a: f(m ? year.min : year.days), b: f(m ? year.minBefore : year.daysBefore) }) });
  }
  return rows;
}
