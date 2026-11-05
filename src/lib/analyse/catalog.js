/**
 * «Analyse» (Noah 27.10.2026 «alle Werte, alle Mockups 1:1»): the list of every value the Analyse pages
 * know, in groups, each with its name, unit, source and how to read one day. The tile page, the page of
 * one value (M6) and «Eigenes Diagramm» (D1–D6) use the same list.
 *
 * analyseGroups(d): d = { table, weights, ctx, acts, log, ownKeys, period } (analyse/data.svelte.js).
 * An item: { key, name, unit, src, sum?, dec?, get(day) → number|null, hoursOf?(day) → 24 values,
 * profile?(days), later?, tick?, old? (the older page of the value), own? + how (an own calculation and how it
 * is counted) }. «Tagesform» is the app's own «Bereitschaft» (body group). Every item opens
 * #/auswerten/analyse/<key>.
 */
import { bodyOf, kindDay, BODY, KIND_ORDER } from '../uebersicht.js';
import { sportName } from '../flow/garmin/words.js';
import { actName } from '../flow/ui.svelte.js';
import { sourceOf, ticksByDay, tickPeriod, hourProfile, activeHours, meanOfHours, sumOf } from '../analyse.js';
import { t } from '../i18n.svelte.js';
import { sleepScoreOf, restlessOf, cardioLoadOf } from './own.js';
import { valueHref } from './jump.js';
import { lateOf, LATE_HOUR } from './late.js';
import { feelOf } from '../training.js';

/** The mean felt effort of the bike rides of a day (the day's activities; answers 1–10), or null without one. */
export function feelDay(dayActs) {
  const v = (dayActs ?? []).filter((a) => a.kind === 'bike').map(feelOf).filter((x) => x != null);
  return v.length ? v.reduce((a, b) => a + b, 0) / v.length : null;
}

export const detailHref = (key) => valueHref(key);

export function analyseGroups({ table = new Map(), weights = new Map(), ctx = {}, acts = [], log = [], ownKeys = [], period = 30 } = {}) {
  const at = (it) => ({ href: detailHref(it.key), ...it });
  const body = (key, extra = {}) =>
    at({
      key,
      name: t(BODY[key].name),
      unit: BODY[key].unit,
      src: sourceOf(BODY[key].src),
      sum: !!BODY[key].sum,
      old: `#/flow/stats/${key}`,
      get: (d) => bodyOf(table, d, key, weights, ctx, extra.part ?? null),
      ...extra,
    });
  const PART = { sleep: 'Sleep|flow', energy: 'Energy', mood: 'Mood' };
  const fit = (d, k) => table.get(d)?.fit?.[k];
  const fb = (key, name, unit, get, extra = {}) => at({ key, name, unit, src: 'fitbit', get, ...extra });
  const later = (key, name, why) => ({ key, name, unit: '', src: 'fitbit', later: why, href: null });
  return [
    {
      key: 'heart',
      name: t('Heart|group'),
      items: [
        at({ key: 'rhr', name: t('Resting pulse'), unit: 'bpm', src: 'fitbit', old: '#/flow/stats/hr', get: (d) => table.get(d)?.rhr }),
        at({ key: 'hrMax', name: t('Highest pulse of the day'), unit: 'bpm', src: 'fitbit', old: '#/flow/stats/hr', get: (d) => table.get(d)?.hrMax }),
        body('hrv'),
        body('spo2'),
        body('breath'),
        body('bp', { key: 'bp', part: 'sys', name: t('Blood pressure') }),
        fb('hrMin', t('Lowest pulse of the day'), 'bpm', (d) => fit(d, 'hrMin')),
        fb('hrAvg', t('Mean pulse of the day'), 'bpm', (d) => fit(d, 'hrAvg')),
        fb('hrDay', t('Pulse over the day'), 'bpm', (d) => meanOfHours(fit(d, 'hrH')), { hours: true, hoursOf: (d) => fit(d, 'hrH'), profile: (ds) => hourProfile(ds, (d) => fit(d, 'hrH')) }),
        fb('vo2max', t('VO₂max (cardio fitness)'), 'ml/kg/min', (d) => fit(d, 'vo2max'), { dec: 1 }),
        fb('fitZones', t('Minutes in pulse zones (Fitbit)'), 'min', (d) => sumOf(fit(d, 'hrZones')), { sum: true }),
        at({ key: 'cardioLoad', name: t('Cardio load'), unit: t('points|own'), src: 'fitbit', sum: true, own: true, how: t('Own calculation: minutes per pulse zone, light ×1, moderate ×2, hard ×3, peak ×4.|own'), get: (d) => cardioLoadOf(fit(d, 'hrZones')) }),
      ],
    },
    {
      key: 'sleep',
      name: t('Sleep|group'),
      items: [body('sleep'), body('eff'), body('bed'), body('skin'), at({ key: 'sleepScore', name: t('Sleep score'), unit: '', src: 'fitbit', own: true, how: t('Own calculation, 0–100: duration (half, full at 8 h), deep and REM sleep (a quarter), calm (a quarter).|own'), get: (d) => sleepScoreOf(table.get(d)?.night) }), at({ key: 'restless', name: t('Restlessness|sleep'), unit: t('min/h|own'), src: 'fitbit', dec: 1, own: true, how: t('Own calculation: minutes awake per hour of sleep.|own'), get: (d) => restlessOf(table.get(d)?.night) })],
    },
    {
      key: 'move',
      name: t('Movement|analyse'),
      items: [
        body('azm'),
        body('steps', { hoursOf: (d) => fit(d, 'stepH') }),
        body('kcal'),
        body('zones'),
        body('load'),
        fb('distKm', t('Distance (watch)'), 'km', (d) => fit(d, 'distKm'), { sum: true, dec: 1 }),
        fb('floors', t('Floors'), '', (d) => fit(d, 'floors'), { sum: true }),
        fb('climbM', t('Climb (watch)'), 'm', (d) => fit(d, 'climbM'), { sum: true }),
        fb('actHours', t('Hourly activity'), t('of 12|hours'), (d) => activeHours(fit(d, 'stepH')), { hours: true, bars: true, hoursOf: (d) => fit(d, 'stepH'), profile: (ds) => hourProfile(ds, (d) => fit(d, 'stepH')) }),
        fb('activeMin', t('Active minutes'), 'min', (d) => sumOf(fit(d, 'levels'), ['light', 'mod', 'very']), { sum: true }),
        fb('sedMin', t('Sitting time'), 'min', (d) => fit(d, 'levels')?.sed ?? null),
        fb('workouts', t('Fitbit workouts'), 'min', (d) => sumOf(Object.fromEntries((fit(d, 'exercises') ?? []).map((e, i) => [i, e.min]))), { sum: true }),
      ],
    },
    {
      key: 'sports',
      name: t('Sports and bike|analyse'),
      items: [
        ...KIND_ORDER.map((k) => at({ key: `km:${k}`, name: sportName(k), unit: 'km', src: 'strava', sum: true, old: `#/flow/stats/${k}`, get: (d) => kindDay(table.get(d), k).km || null })),
        body('wkg'),
        body('cad'),
        body('spd'),
        // «Persönliche Experimente» (Noah 04.11.2026, Idee 2): how hard the rides of a day felt, so a try can ask «easier with …?»
        at({ key: 'rideFeel', name: t('Felt effort of rides (1–10)'), unit: '', src: 'body', dec: 1, own: true, how: t('Own calculation: the mean of your answers to «How hard was your ride?» on that day, 1 (very easy) to 10 (all out).|own'), get: (d) => feelDay(table.get(d)?.acts) }),
        // «Muster entdeckt» (Noah 03.11.2026, Idee 5): so the links can ask «do I sleep shorter after late sessions?»
        at({ key: 'late', name: t('Late sessions'), unit: '×', src: 'strava', sum: true, how: t('Sessions that end at {h}:00 or later, counted per day; 0 on a day with sessions that are not late.|late', { h: LATE_HOUR }), get: (d) => lateOf(table.get(d)) }),
      ],
    },
    {
      key: 'body',
      name: t('Body|group'),
      items: [
        body('weight'),
        body('water'),
        body('ready'),
        fb('fitKg', t('Weight (Fitbit)'), 'kg', (d) => fit(d, 'fitKg'), { dec: 1 }),
        fb('bodyFat', t('Body fat'), '%', (d) => fit(d, 'bodyFat'), { dec: 1 }),
      ],
    },
    {
      key: 'garmin',
      name: t('Garmin|analyse'),
      items: [
        later('gTrain', t('Training status'), 'garmin'),
        later('gEffect', t('Training effect'), 'garmin'),
        later('gVo2', t('VO₂max (Garmin)'), 'garmin'),
        later('gLactate', t('Lactate threshold'), 'garmin'),
        later('gStress', t('HRV stress'), 'garmin'),
        later('gCycling', t('Cycling ability'), 'garmin'),
      ],
    },
    {
      key: 'felt',
      name: t("Wi gaht's?|analyse"),
      items: [
        ...Object.entries(PART).map(([p, n]) => body('felt', { key: `felt:${p}`, part: p, name: t(n), old: '#/flow/stats/felt' })),
        // an own question keeps the name you typed (never through t())
        ...ownKeys.map((k) => at({ key: k.key, name: k.name, unit: k.unit ?? '', src: 'check', old: `#/flow/stats/${k.key}`, get: (d) => bodyOf(table, d, k.key, weights, ctx) })),
      ],
    },
    {
      key: 'aktiv',
      name: t('Your activities in Aktiv'),
      items: acts.map((a) => {
        const by = ticksByDay(log, a.id);
        return at({ key: `act:${a.id}`, name: actName(a), unit: '×', src: 'aktiv', sum: true, tick: true, old: `#/flow/auswertung?act=${encodeURIComponent(a.id)}&p=${tickPeriod(period)}`, get: (d) => by.get(d) ?? null });
      }),
    },
  ];
}

/** Every item of the groups by its key. */
export const itemsByKey = (groups) => new Map(groups.flatMap((g) => g.items.map((it) => [it.key, { ...it, group: g.key, groupName: g.name }])));
