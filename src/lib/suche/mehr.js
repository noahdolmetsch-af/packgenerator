/**
 * «Suche findet mehr» (Warteliste 1, V1; Noah 22.11.2026 «1a»): besides gear, trips, notes and pages the search
 * also finds rides, places, learnings, bike care, training, tasks and settings. Pure functions; the tables are read
 * only once something is typed (`loadMore` in mehrload.js, loaded on first use), light rows only (no lines, no profiles).
 * Health values are never rows here (Noah «5a»): a health page is found as a page, without a number.
 */
import { t, tn, num } from '../i18n.svelte.js';
import { FEATURES } from '../features.js';
import { topicName } from '../review/topicname.js';

/** The kinds this file adds to `KIND` (search.js): name (English key) and how many rows show before «N more». */
export const MORE_KIND = {
  ride: { name: 'Rides', max: 4 },
  place: { name: 'Places', max: 3 },
  learning: { name: 'Learnings', max: 3 },
  care: { name: 'Bike care', max: 3 },
  training: { name: 'Training', max: 3 },
  task: { name: 'Tasks', max: 3 },
  setting: { name: 'Me|place', max: 4 }, // what the functions under Ich say (settings, tools, connections)
};

const day = (d) => (/^\d{4}-\d{2}-\d{2}/.test(d ?? '') ? new Date(`${String(d).slice(0, 10)}T12:00:00`).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' }) : '');

/** The settings the search finds: functions of «Me» (the address starts with #/me), each once, not a page already found. */
const SETTINGS = FEATURES.filter((f) => String(f.href ?? '').startsWith('#/me'));

/**
 * The extra groups for a search: { ride: [rows], place: [...], … }. hit(...fields): the same word test as searchAll.
 * data: what loadMore returned (missing = nothing yet). Health: nothing here.
 */
export function moreGroups(hit, data = {}) {
  const { rides = [], places = [], learnings = [], visits = [], sessions = [], tasks = [] } = data;
  const byDay = (a, b) => String(b.sub?.day ?? b.day ?? '').localeCompare(String(a.sub?.day ?? a.day ?? ''));
  return {
    ride: rides
      .filter((r) => hit(r.name, r.day, r.bike, r.gear, r.src, r.kind))
      .sort(byDay)
      .map((r) => ({ id: r.id, title: r.name || t('Ride'), sub: [day(r.day), r.km ? `${num(r.km)} km` : '', r.bike, r.src === 'Strava' ? 'Strava' : ''].filter(Boolean).join(' · '), href: '#/trips/rides' })),
    place: places.filter((p) => hit(p.name)).map((p) => ({ id: p.id, title: p.name, sub: p.ele ? `${num(p.ele)} m` : '', href: '#/flow/gipfelbuch' })),
    learning: learnings.filter((l) => hit(l.topic, l.topic ? topicName(l.topic) : '', l.rule, l.action)).map((l) => ({ id: l.id, title: [l.rule, l.action].filter(Boolean).join(' · ').slice(0, 80) || (l.topic ? topicName(l.topic) : ''), sub: l.topic ? topicName(l.topic) : '', href: '#/debrief/learnings' })),
    care: visits
      .filter((v) => hit(v.shop, v.parts, v.bike, v.date))
      .sort((a, b) => String(b.date).localeCompare(String(a.date)))
      .map((v) => ({ id: v.id, title: v.shop || t('Workshop visit'), sub: [day(v.date), v.bike, v.parts.slice(0, 40)].filter(Boolean).join(' · '), href: '#/bikes?tab=shop' })),
    training: sessions
      .filter((s) => hit(s.name, s.day))
      .sort(byDay)
      .map((s) => ({ id: s.id, title: s.name || t('Training'), sub: [day(s.day), s.mins ? tn(s.mins, '{n} min', '{n} min') : ''].filter(Boolean).join(' · '), href: '#/flow/week' })),
    task: tasks.filter((x) => hit(x.title)).map((x) => ({ id: x.id, title: x.title, sub: [x.due ? day(x.due) : t('no day yet'), x.own ? '' : 'Google'].filter(Boolean).join(' · '), href: x.own ? '#/week' : '#/calendar' })),
    setting: SETTINGS.filter((f) => hit(f.title, t(f.title), f.words)).map((f) => ({ id: f.id, title: t(f.title), sub: t(f.text).slice(0, 70), href: f.href })),
  };
}
