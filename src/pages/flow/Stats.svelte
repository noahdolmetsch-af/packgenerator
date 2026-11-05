<script>
  /**
   * Garmin-Übersicht (Noah 20.10.2026, screenshots 4 and 5): the pages behind «Im Fokus» and «Überblick».
   * #/flow/stats/<sport>  all of one sport: 7 days / 4 weeks / 1 year, back in time with ‹, the tabs
   *                       distance, time, climbing, calories, one bar per day (per month for a year), the
   *                       total and the daily mean, the activities of the range;
   * #/flow/stats/hr       «Körperwerte» (Noah 20.10.2026 «gewicht, schlafminuten, aktivzonenminuten und
   *                       weitere»): tabs heart rate (resting and highest pulse per day), sleep, active zone
   *                       minutes, steps, HRV, calories and weight (entered right here, the same entries
   *                       as Ich › Gewicht); #/flow/stats/<tab> opens a tab. Garmin's «1 T» (the pulse over
   *                       one day) is missing: the app gets only day values from Fitbit.
   * Loaded only when opened (Flow.svelte).
   */
  import { ChevronLeft, ChevronRight, Trash2 } from '@lucide/svelte';
  import Crumb from '../../lib/flow/kit/Crumb.svelte';
  import Seg from '../../lib/ui/Seg.svelte';
  import BarChart from '../../lib/charts/BarChart.svelte';
  import LineChart from '../../lib/charts/LineChart.svelte';
  import ChartSheet from '../../lib/charts/ChartSheet.svelte';
  import DataTable from '../../lib/charts/DataTable.svelte';
  import Readout from '../../lib/charts/Readout.svelte';
  import { tableQuery } from '../../lib/messwerte-data.js';
  import { liveQuery } from 'dexie';
  import { db } from '../../lib/db.js';
  import { stats, hrStats, bodyStats, stackBars, windowOf, STAT_KEYS, KIND_ORDER, BODY, groupOf, isOwnBody, ownBodyKeys, bodyGroupsWith, ownBodyDays } from '../../lib/uebersicht.js';
  import { AB_KEY, configOf } from '../../lib/abfragen.js';
  import { bodyExtras } from '../../lib/form-data.js';
  import { kgOn } from '../../lib/weight.js';
  import { shown } from '../../lib/messwerte.js';
  import { weight, saveWeight } from '../../lib/weight.svelte.js';
  import { cleanKg } from '../../lib/weight.js';
  import { BP_KEY, WATER_KEY, bpEntries, waterEntries, withDay, cleanBp, cleanL, medByDay, bedText, spreadMin, yearKm, yearToDate, tempPoints, tempBands } from '../../lib/koerper.js';
  import { zones } from '../../lib/strava/zones.svelte.js';
  import { offerDone } from '../../lib/ui/rename.svelte.js';
  import { askDelete, deleteWithUndo } from '../../lib/ui/ask.js';
  import { SPORT_ICON, sportName, hms, km2, dm, rangeText, monthShort } from '../../lib/flow/garmin/words.js';
  import { localDay } from '../../lib/localday.js';
  import { t, num, locale } from '../../lib/i18n.svelte.js';
  import { stravaName } from '../../lib/stravanames.js';

  let { id = 'bike' } = $props();
  const kind = $derived(id === 'hr' || BODY[id] || isOwnBody(id) ? null : KIND_ORDER.includes(id) ? id : 'other');
  // svelte-ignore state_referenced_locally
  let bkey = $state(BODY[id] || isOwnBody(id) ? id : 'hr');
  // «Eigene Körperwerte» (Noah 21.10.2026 «3a»): the own questions with a number or a scale are a group of their own
  const abQ = liveQuery(() => db.settings.get(AB_KEY));
  const ansQ = liveQuery(() => (db.abAnswers ? db.abAnswers.toArray() : []));
  const ownKeys = $derived(ownBodyKeys(configOf($abQ?.value).own));
  const GROUPS = $derived(bodyGroupsWith(ownKeys));
  const BX = $derived({ ...BODY, ...Object.fromEntries(ownKeys.map((k) => [k.key, k])) });
  const bname = (k) => (BX[k]?.own ? BX[k].name : t(BX[k]?.name ?? '')); // a typed name never through t()
  // an own value that is gone (its question deleted) falls back to the heart rate
  $effect(() => {
    if ($abQ !== undefined && isOwnBody(bkey) && !BX[bkey]) bkey = 'hr';
  });
  const bgroup = $derived(BX[bkey] ? groupOf(bkey) : 'heart');
  const gtabs = $derived((GROUPS.find((g) => g.key === bgroup) ?? GROUPS[0]).tabs);
  const today = localDay();
  const q = tableQuery();
  const table = $derived($q ?? new Map());
  let range = $state('d7');
  let back = $state(0);
  let key = $state('km');
  const RANGE_NAMES = { d7: '7 d.|range', w4: '4 wk.|range', y1: '1 y|range' };
  const TAB = { km: 'Distance', time: 'Time|stat', hm: 'Climbing', kcal: 'Calories' };
  const TOTAL = { km: 'Total distance', time: 'Total time', hm: 'Total climbing', kcal: 'Total calories' };
  const B = $derived(BX[bkey] ?? BODY.hr);
  const st = $derived(kind ? stats(table, today, kind, key, range, back) : null);
  const hr = $derived(kind || bkey !== 'hr' ? null : hrStats(table, today, range, back));
  const weights = $derived(new Map(weight.entries.map((e) => [e.day, e.kg])));
  const get = async (k) => (await db.settings.get(k))?.value ?? null;
  const checksQ = liveQuery(() => (db.flowChecks ? db.flowChecks.toArray() : []));
  const medQ = liveQuery(() => (db.flowLog ? db.flowLog.where('actId').equals('meditation').toArray() : []));
  const bpQ = liveQuery(() => get(BP_KEY));
  const waterQ = liveQuery(() => get(WATER_KEY));
  const bps = $derived(bpEntries($bpQ));
  const waters = $derived(waterEntries($waterQ));
  const win = $derived(windowOf(range, today, back));
  // the values the app counts itself (readiness, load) only for the tabs that need them
  const NEEDS_CTX = ['ready', 'load', 'felt', 'wkg'];
  const ctx = $derived({
    ...(!kind && NEEDS_CTX.includes(bkey) ? bodyExtras({ table, checks: $checksQ ?? [], from: win.from, to: win.to }) : {}),
    kgOn: (d) => kgOn(weight.entries, d),
    bounds: zones.bounds,
    med: medByDay($medQ ?? []),
    water: new Map(waters.map((e) => [e.day, e.l])),
    bp: new Map(bps.map((e) => [e.day, e])),
    ab: isOwnBody(bkey) ? ownBodyDays($ansQ ?? [], ownKeys) : new Map(),
  });
  const special = $derived(!!B?.view);
  const bs = $derived(kind || bkey === 'hr' || special ? null : bodyStats(table, today, bkey, range, back, weights, ctx, B.parts?.[0] ?? null));
  const SRC_TEXT = {
    own: 'Your own entries, only on this device.',
    fitbit: 'From your Fitbit, observation only.',
    health: 'From Fitbit or Apple Health (Me › Connections), observation only. It changes slowly, often only once a week.',
    app: 'Counted by the app from your activities, Fitbit and the morning check (see Form and recovery).',
    check: 'Your answers of the morning check, 1 to 10.',
    strava: 'From your Strava activities; watts per kg with your weight of that day.',
    zones: 'Minutes in your pulse zones (Training › Zones), from the pulse of your Strava activities.',
    med: 'Your meditation ticks in Aktiv; a tick without minutes counts as 10.',
    temp: 'Your rides with a temperature from the device (Strava or FIT file). Warm rides often have a higher pulse.',
    ab: 'Your answers to your own question in Me › Your questions; the mean when you answered more than once a day.',
  };
  const PART_NAMES = { sleep: 'Sleep|flow', energy: 'Energy', mood: 'Mood', sys: 'Upper|bp', dia: 'Lower|bp' };
  const parts = $derived(B?.parts && bs ? B.parts.map((p) => ({ p, s: bodyStats(table, today, bkey, range, back, weights, ctx, p) })) : []);
  const STACK_NAMES = { deep: 'Deep|sleep', rem: 'REM', light: 'Light|sleep', awake: 'Awake|sleep', z1: 'Z1', z2: 'Z2', z3: 'Z3', z4: 'Z4', z5: 'Z5' };
  const stg = $derived(B?.stack && bs ? stackBars(table, today, range, back, bkey, zones.bounds) : []);
  const hm = (m) => (m == null ? '–' : shown('sleep', m, num));
  const isSleep = $derived(bkey === 'sleep' || bkey === 'stages');
  const bv = (v) => {
    if (v == null) return '–';
    if (isSleep) return shown('sleep', v, num);
    if (bkey === 'bed') return bedText(v);
    if (bkey === 'skin') return `${v > 0 ? '+' : ''}${num(Math.round(v * 10) / 10)}`;
    if (['weight', 'vo2max', 'hrv', 'wkg', 'spd', 'breath', 'water'].includes(bkey) || isOwnBody(bkey)) return num(Math.round(v * 10) / 10);
    return num(Math.round(v));
  };
  const bu = $derived(B?.unit && !isSleep ? B.unit : '');
  const spread = $derived(bkey === 'bed' && bs ? spreadMin(bs.days.map((d) => d.v)) : null);
  // «Km this year»: this year against the year before, month by month; ‹ goes back a year
  const year = $derived(Number(today.slice(0, 4)) - back);
  const yr = $derived(bkey === 'year' && !kind ? yearKm(table, year, today) : []);
  const ytd = $derived(bkey === 'year' && !kind ? yearToDate(table, today) : null);
  // «Temperature and pulse»: one dot per ride of the range
  const tp = $derived(bkey === 'temp' && !kind ? tempPoints(table, win.from, win.to) : []);
  const tBands = $derived(tempBands(tp));
  const tX = $derived.by(() => {
    const v = tp.map((p) => p.temp);
    const lo = Math.floor(Math.min(0, ...v) / 5) * 5;
    const hi = Math.ceil(Math.max(30, ...v) / 5) * 5;
    return [lo, hi];
  });
  const tY = $derived.by(() => {
    const v = tp.map((p) => p.hr);
    return [Math.floor(Math.min(100, ...v) / 10) * 10, Math.ceil(Math.max(170, ...v) / 10) * 10];
  });
  let tView = $state('chart');
  let tSel = $state(null);
  let tOpen = $state(null);
  const tShown = $derived(tp.find((p) => p.id === tSel) ?? tp.at(-1) ?? null);
  const tSheet = $derived(tp.find((p) => p.id === tOpen) ?? null);
  const BAND_NAMES = { cold: 'below 10 °C', mild: '10 to 20 °C', warm: 'from 20 °C' };
  const span = $derived(st ?? bs ?? hr ?? (special ? win : null));
  let wDay = $state(localDay());
  let wKg = $state('');
  async function addWeight(e) {
    e.preventDefault();
    const kg = cleanKg(wKg);
    if (kg == null) return;
    await saveWeight(wDay, kg);
    wKg = '';
    offerDone(t('Weight saved: {kg} kg', { kg: num(kg) }));
  }
  // blood pressure and water: one entry per day; the same day again replaces it
  let bSys = $state('');
  let bDia = $state('');
  let wL = $state('');
  let entryErr = $state('');
  const putEntries = (k, entries) => db.settings.put({ key: k, value: { entries } });
  async function addBp(e) {
    e.preventDefault();
    const bp = cleanBp(bSys, bDia);
    if (!bp) return (entryErr = t('Upper 70 to 250, lower 40 to 150, upper above lower.'));
    entryErr = '';
    await putEntries(BP_KEY, withDay(bps, wDay, bp));
    bSys = bDia = '';
    offerDone(t('Blood pressure saved: {sys}/{dia}', bp));
  }
  async function addWater(e) {
    e.preventDefault();
    const l = cleanL(wL);
    if (l == null) return (entryErr = t('Between 0.1 and 10 litres.'));
    entryErr = '';
    await putEntries(WATER_KEY, withDay(waters, wDay, { l }));
    wL = '';
    offerDone(t('Water saved: {l} l', { l: num(l) }));
  }
  async function removeDay(d) {
    const isBp = bkey === 'bp';
    const k = isBp ? BP_KEY : WATER_KEY;
    const list = isBp ? bps : waters;
    const name = `${bname(bkey)} ${date(d)}`;
    if ((await askDelete({ title: t('Delete "{name}"?', { name }), text: t('Only this day’s entry goes.') })) !== 'delete') return;
    await deleteWithUndo({
      name,
      text: t('"{name}" deleted.', { name }),
      run: async () => {
        await putEntries(k, withDay(list, d, null));
        return list;
      },
      undo: (saved) => putEntries(k, saved),
    });
  }
  const fmtV = (k, v) => (k === 'time' ? hms(v) : k === 'km' ? km2(v) : num(Math.round(v)));
  const unit = (k) => (k === 'km' ? 'km' : k === 'hm' ? 'm' : k === 'kcal' ? 'kcal' : '');
  const label = (k) => (monthly ? monthShort(k) : dm(k));
  const day = (d) => new Date(`${d}T00:00:00Z`).toLocaleDateString(locale(), { weekday: 'long', timeZone: 'UTC' });
  const date = (d) => new Date(`${d}T00:00:00Z`).toLocaleDateString(locale(), { day: 'numeric', month: 'long', timeZone: 'UTC' });
  const setRange = (r) => ((range = r), (back = 0));
  // «Diagramme zum Antippen» (Noah 27.10.2026 «1-5 a»): every chart of this page is a BarChart or a LineChart of
  // src/lib/charts (axis with round steps, exact values when pointing, a tap opens the day, «Als Tabelle»).
  // M describes the chart that shows; the sheet behind a tap shows the same numbers and, for a sport, its activities.
  const monthly = $derived(range === 'y1' || (bkey === 'year' && !kind));
  const xsOf = (rows) => rows.map((r, i) => ({ key: r.key, x: i === 0 || i === rows.length - 1 || i === Math.floor((rows.length - 1) / 2) ? label(r.key) : '' }));
  const when = (k) => (monthly ? `${monthShort(k)} ${k.slice(0, 4)}` : `${day(k)}, ${date(k)}`);
  const one = (v) => num(Math.round(v * 10) / 10);
  const COLOR = { sleep: 'var(--l4)', energy: 'var(--hi)', mood: 'var(--warn)', sys: 'var(--bad)', dia: 'var(--hi)', deep: 'var(--l4)', rem: 'var(--hi)', light: 'var(--hi-bright)', awake: 'var(--warn)', z1: 'var(--z1)', z2: 'var(--z2)', z3: 'var(--z3)', z4: 'var(--z4)', z5: 'var(--z5)' };
  const M = $derived.by(() => {
    const head = (name) => [monthly ? t('Month') : t('Day'), name];
    if (st) {
      const div = key === 'time' ? 3600 : 1;
      const u = key === 'time' ? 'h' : unit(key);
      const f = (v) => `${fmtV(key, v)}${unit(key) ? ` ${unit(key)}` : ''}`;
      const items = (i) => [{ label: t(TAB[key]), value: f(st.bars[i].v), color: 'var(--ch-b)' }];
      return {
        kind: 'bar', id: 'stat', unit: u, items, when, rows: st.bars, name: t(TOTAL[key]),
        cols: st.bars.map((b, i) => ({ key: b.key, x: xsOf(st.bars)[i].x, top: b.v ? one(b.v / div) : '', parts: [{ v: b.v / div, color: 'var(--ch-b)' }] })),
        table: { head: head(t(TAB[key])), rows: [...st.bars].reverse().map((b) => ({ key: b.key, cells: [when(b.key), f(b.v)] })) },
        label: t('{what} from {a} to {b}', { what: t(TOTAL[key]), a: label(st.bars[0].key), b: label(st.bars.at(-1).key) }),
        acts: (i) => st.acts.filter((a) => (monthly ? a.day.startsWith(st.bars[i].key.slice(0, 7)) : a.day === st.bars[i].key)),
      };
    }
    if (hr) {
      const items = (i) => [{ label: t('at rest'), value: `${hr.points[i].rest ?? '–'} bpm`, color: 'var(--hi)' }, { label: t('highest'), value: `${hr.points[i].high ?? '–'} bpm`, color: 'var(--bad)' }];
      return {
        kind: 'line', id: 'hr', unit: 'bpm', items, when, rows: hr.points, name: t('Daily values'), tick: null, scale: null,
        cols: xsOf(hr.points),
        series: [{ key: 'rest', color: 'var(--hi)', v: hr.points.map((p) => p.rest) }, { key: 'high', color: 'var(--bad)', v: hr.points.map((p) => p.high) }],
        table: { head: [...head(t('at rest')), t('highest')], rows: [...hr.points].reverse().map((p) => ({ key: p.key, cells: [when(p.key), p.rest ?? '–', p.high ?? '–'] })) },
        label: t('Resting and highest pulse per day'),
      };
    }
    if (bkey === 'year' && !kind && yr.length) {
      const items = (i) => [{ label: String(year), value: `${num(yr[i].now ?? 0)} km`, color: 'var(--hi)' }, { label: String(year - 1), value: `${num(yr[i].before ?? 0)} km`, color: 'var(--ink-3)' }];
      return {
        kind: 'line', id: 'year', unit: 'km', items, when, rows: yr, name: t('Bike km, added up'), tick: null,
        scale: null, cols: xsOf(yr),
        series: [{ key: 'before', color: 'var(--ink-3)', dashed: true, v: yr.map((p) => p.before) }, { key: 'now', color: 'var(--hi)', v: yr.map((p) => p.now) }],
        table: { head: [t('Month'), String(year), String(year - 1)], rows: [...yr].reverse().map((p) => ({ key: p.key, cells: [when(p.key), num(p.now ?? 0), num(p.before ?? 0)] })) },
        label: t('Bike km, added up'),
      };
    }
    if (!bs || !bs.n) return null;
    const pts = bs.points;
    const u = isSleep ? 'h' : bu ? (B.own ? bu : t(bu)) : '';
    const cell = (v) => bv(v);
    if (B.parts) {
      const items = (i) => parts.map((f) => ({ label: t(PART_NAMES[f.p]), value: f.s.points[i]?.v == null ? '–' : bv(f.s.points[i].v), color: COLOR[f.p] }));
      return {
        kind: 'line', id: 'body', unit: u, items, when, rows: pts, name: bname(bkey), tick: null, scale: null, cols: xsOf(pts),
        series: parts.map((f) => ({ key: f.p, color: COLOR[f.p] ?? 'var(--hi)', v: f.s.points.map((p) => p.v) })),
        table: { head: [...head(t(PART_NAMES[parts[0].p])), ...parts.slice(1).map((f) => t(PART_NAMES[f.p]))], rows: [...pts.keys()].reverse().map((i) => ({ key: pts[i].key, cells: [when(pts[i].key), ...parts.map((f) => (f.s.points[i]?.v == null ? '–' : cell(f.s.points[i].v)))] })) },
        label: bname(bkey),
      };
    }
    if (B.stack) {
      const div = bkey === 'stages' ? 60 : 1;
      const su = bkey === 'stages' ? 'h' : 'min';
      const val = (d, k) => d[k] ?? 0;
      const f = (v) => (bkey === 'stages' ? shown('sleep', v, num) : `${num(Math.round(v))} min`);
      const items = (i) => [...B.stack].reverse().map((k) => ({ label: t(STACK_NAMES[k]), value: f(val(stg[i], k)), color: COLOR[k] }));
      return {
        kind: 'bar', id: 'body', unit: su, items, when, rows: stg, name: bname(bkey),
        cols: stg.map((d, i) => ({ key: d.key, x: xsOf(stg)[i].x, top: '', parts: [...B.stack].map((k) => ({ v: val(d, k) / div, color: COLOR[k] })) })),
        table: { head: [...head(t(STACK_NAMES[B.stack[0]])), ...B.stack.slice(1).map((k) => t(STACK_NAMES[k]))], rows: [...stg].reverse().map((d) => ({ key: d.key, cells: [when(d.key), ...B.stack.map((k) => f(val(d, k)))] })) },
        label: bname(bkey),
      };
    }
    const div = isSleep ? 60 : 1;
    const items = (i) => [{ label: bname(bkey), value: `${bv(pts[i].v)}${bu && !isSleep ? ` ${B.own ? bu : t(bu)}` : ''}`, color: 'var(--hi)' }];
    const table = { head: head(bname(bkey)), rows: [...pts].reverse().map((p) => ({ key: p.key, cells: [when(p.key), p.v == null ? '–' : `${bv(p.v)}${bu && !isSleep ? ` ${B.own ? bu : t(bu)}` : ''}`] })) };
    if (B.line) {
      const fx = B.fixed;
      const scale = fx ? { lo: fx[0], hi: fx[1], step: (fx[1] - fx[0]) / 4, ticks: [0, 1, 2, 3, 4].map((i) => fx[0] + ((fx[1] - fx[0]) / 4) * i) } : null;
      return {
        kind: 'line', id: 'body', unit: u, items, when, rows: pts, name: bname(bkey), scale, tick: bkey === 'bed' ? bedText : null, cols: xsOf(pts),
        series: [{ key: 'v', color: 'var(--hi)', v: pts.map((p) => (p.v == null ? null : p.v / div)) }],
        table, label: bname(bkey), topText: bkey === 'bed' ? bedText : null,
      };
    }
    return {
      kind: 'bar', id: 'body', unit: u, items, when, rows: pts, name: bname(bkey),
      cols: pts.map((p, i) => ({ key: p.key, x: xsOf(pts)[i].x, top: p.v ? one(p.v / div) : '', parts: [{ v: (p.v ?? 0) / div, color: 'var(--hi)' }] })),
      table, label: bname(bkey),
    };
  });
  let open = $state(null);
  // a new chart (other tab, range or page back) starts without a sheet
  $effect(() => {
    void [key, bkey, range, back];
    open = null;
  });
  const roOf = (m) => (i) => ({ title: m.when(m.rows[i].key), items: m.items(i) });
  // «Gesundheitssignale» (Noah 03.11.2026): the Fitbit tabs and their page in Analyse (range, what stands out, source)
  const SIGNAL_KEY = { hr: 'rhr', hrv: 'hrv', sleep: 'sleep', spo2: 'spo2', breath: 'breath', skin: 'skin' };
  const title = $derived(kind ? sportName(kind) : t('Body values'));
</script>

{#snippet chart()}
  {#if M}
    {#if M.kind === 'bar'}
      <BarChart id={M.id} cols={M.cols} readout={roOf(M)} onopen={(i) => (open = i)} unit={M.unit} table={M.table} label={M.label} hint={t('Point at a day for its numbers, tap it for what is behind.')} />
    {:else}
      <LineChart id={M.id} cols={M.cols} series={M.series} scale={M.scale} tick={M.tick} topText={M.topText} readout={roOf(M)} onopen={(i) => (open = i)} unit={M.unit} table={M.table} label={M.label} hint={t('Point at a day for its numbers, tap it for what is behind.')} />
    {/if}
  {/if}
{/snippet}

<div class="gs" data-stats={id}>
  <header class="hd">
    <Crumb path={[{ href: '#/flow', label: t('Active|place') }]} here={title} />
    <h1 class="ptitle" tabindex="-1" data-page-title>{#if kind}{@const I = SPORT_ICON[kind]}<I size={24} aria-hidden="true" />{/if}{title}</h1>
  </header>

  {#if !kind}
    <div class="groups" data-bgroups><Seg options={GROUPS.map((g) => ({ key: g.key, name: t(g.name) }))} value={bgroup} onchange={(g) => ((bkey = GROUPS.find((x) => x.key === g).tabs[0]), (back = 0))} label={t('Body values')} /></div>
    <!-- «332 Use Cases» (Noah 26.10.2026 «eigene körperwerte» sichtbar): without own values, the way to make one stands on top -->
    {#if !ownKeys.length}<p class="ownl" data-own-body-link><a href="#/me/abfragen">{t('Own body values')} ›</a></p>{/if}
    <div class="tabs btabs noswipe" role="tablist" aria-label={t((GROUPS.find((g) => g.key === bgroup) ?? GROUPS[0]).name)}>
      {#each gtabs as k (k)}<button type="button" role="tab" aria-selected={bkey === k} data-btab={k} onclick={() => ((bkey = k), bkey === 'year' && (back = 0))}>{bname(k)}</button>{/each}
    </div>
  {/if}
  {#if kind || bkey !== 'year'}
    <div data-ranges><Seg options={Object.keys(RANGE_NAMES).map((r) => ({ key: r, name: t(RANGE_NAMES[r]) }))} value={range} onchange={setRange} label={t('Range')} /></div>
  {/if}
  {#if span}
    <div class="per">
      <button type="button" class="nav" aria-label={t('Earlier')} data-back onclick={() => back++}><ChevronLeft size={20} aria-hidden="true" /></button>
      <b class="num" data-span>{bkey === 'year' && !kind ? `${year}` : range === 'y1' ? `${monthShort(span.from)} ${span.from.slice(0, 4)}–${monthShort(span.to)} ${span.to.slice(0, 4)}` : rangeText(span.from, span.to)}</b>
      <button type="button" class="nav" aria-label={t('Later')} disabled={back === 0} onclick={() => (back = Math.max(0, back - 1))}><ChevronRight size={20} aria-hidden="true" /></button>
    </div>
  {/if}

  {#if st}
    <div class="tabs" role="tablist">
      {#each STAT_KEYS as k (k)}<button type="button" role="tab" aria-selected={key === k} data-tab={k} onclick={() => (key = k)}>{t(TAB[k])}</button>{/each}
    </div>
    <section class="card ch" aria-label={t(TOTAL[key])}>
      <h2>{t(TOTAL[key])}</h2>
      {@render chart()}
      <div class="tot">
        <span><b class="num" data-total>{fmtV(key, st.total)}{#if unit(key)}{' '}<small>{unit(key)}</small>{/if}</b><small>{t(TOTAL[key])}</small></span>
        <span><b class="num">{fmtV(key, st.perDay)}{#if unit(key)}{' '}<small>{unit(key)}</small>{/if}</b><small>{t('Daily average')}</small></span>
      </div>
      {#if key === 'kcal' && !st.total}<p class="q">{t('Calories come with the details of an activity from Strava.')}</p>{/if}
    </section>
    <section aria-labelledby="gs-acts">
      <h2 id="gs-acts" class="cap">{t('Activities of type «{sport}»', { sport: title })}</h2>
      {#if st.acts.length}
        <ul class="card list">
          {#each st.acts as a (a.id)}
            <li><a href="#/flow/training/a/{encodeURIComponent(a.id)}" data-stat-act={a.id}><span class="m"><b>{stravaName(a.name) || title}</b><small>{date(a.day)}{a.time ? ` · ${a.time}` : ''}</small></span><span class="v num">{a.km ? `${km2(a.km)} km` : ''}<small>{hms(a.movingS)}</small></span></a></li>
          {/each}
        </ul>
      {:else}
        <p class="q">{t('No activity in this range.')}</p>
      {/if}
    </section>
  {/if}
  {#if bs && B.entry}
    {#if bkey === 'weight'}
      <form class="card wf" onsubmit={addWeight} data-weight-form>
        <label><span>{t('Day')}</span><input class="inp" type="date" bind:value={wDay} max={today} /></label>
        <label><span>{t('Weight in kg')}</span><input class="inp num" type="text" inputmode="decimal" bind:value={wKg} placeholder="72.5" data-weight-kg /></label>
        <button type="submit" class="btn hi" data-weight-save>{t('Save')}</button>
        <small class="q">{t('Only on this device. The same entries as Me › Weight, where you change or delete them.')} <a href="#/me/weight">{t('Me › Weight')} ›</a></small>
      </form>
    {:else if bkey === 'bp'}
      <form class="card wf w4" onsubmit={addBp} data-bp-form>
        <label><span>{t('Day')}</span><input class="inp" type="date" bind:value={wDay} max={today} /></label>
        <label><span>{t('Upper|bp')}</span><input class="inp num" type="text" inputmode="numeric" bind:value={bSys} placeholder="120" data-bp-sys /></label>
        <label><span>{t('Lower|bp')}</span><input class="inp num" type="text" inputmode="numeric" bind:value={bDia} placeholder="80" data-bp-dia /></label>
        <button type="submit" class="btn hi" data-bp-save>{t('Save')}</button>
        {#if entryErr}<small class="err" role="alert">{entryErr}</small>{/if}
        <small class="q">{t('Only on this device, observation only. The same day again replaces its entry; the bin below deletes it.')}</small>
      </form>
    {:else if bkey === 'water'}
      <form class="card wf" onsubmit={addWater} data-water-form>
        <label><span>{t('Day')}</span><input class="inp" type="date" bind:value={wDay} max={today} /></label>
        <label><span>{t('Litres drunk')}</span><input class="inp num" type="text" inputmode="decimal" bind:value={wL} placeholder="2.5" data-water-l /></label>
        <button type="submit" class="btn hi" data-water-save>{t('Save')}</button>
        {#if entryErr}<small class="err" role="alert">{entryErr}</small>{/if}
        <small class="q">{t('What you drank that day, only on this device. How much you need on a ride comes with the weather and the route.')}</small>
      </form>
    {/if}
  {/if}
  {#if bs}
    <section class="card ch" aria-label={bname(bkey)} data-body={bkey}>
      <h2>{t('Daily values')}</h2>
      {#if bs.n}
        {@render chart()}
        {#if B.parts}
          <ul class="leg" data-legend>{#each parts as f (f.p)}<li><i class="f-{f.p}"></i>{t(PART_NAMES[f.p])} <b class="num">{f.s.mean == null ? '–' : num(f.s.mean)}</b></li>{/each}</ul>
        {:else if B.stack}
          <ul class="leg" data-legend>{#each B.stack as k (k)}<li><i class="s-{k}"></i>{t(STACK_NAMES[k])}</li>{/each}</ul>
        {/if}
        <div class="tot">
          <span><b class="num" data-body-mean>{bv(bs.mean)}{#if bu}{' '}<small>{(B.own ? bu : t(bu))}</small>{/if}</b><small>{t('Daily average')}</small></span>
          {#if B.sum}
            <span><b class="num">{bv(bs.total)}{#if bu}{' '}<small>{(B.own ? bu : t(bu))}</small>{/if}</b><small>{t('Total|body')}</small></span>
          {:else if bkey === 'bed'}
            <span><b class="num" data-bed-spread>{spread == null ? '–' : `± ${spread}`} <small>min</small></b><small>{t('How regular (spread)')}</small></span>
          {:else}
            <span><b class="num">{bv(bs.lo)}–{bv(bs.hi)}{#if bu}{' '}<small>{(B.own ? bu : t(bu))}</small>{/if}</b><small>{t('lowest to highest')}</small></span>
          {/if}
        </div>
      {:else}
        <p class="q">{B.entry ? t('No entry in this range yet. Enter one above.') : B.src === 'fitbit' ? t('No value in this range. It comes with Fitbit.') : B.src === 'health' ? t('No value in this range. It comes with Fitbit or the Apple Health export (Me › Connections).') : t('No value in this range yet.')}</p>
      {/if}
    </section>
    <ul class="days">
      {#each bs.days.filter((d) => d.v != null) as d (d.key)}
        {@const sg = bkey === 'stages' ? stg.find((x) => x.key === d.key) : null}
        <li class="card" data-body-day={d.key}>
          <span class="m"><b>{day(d.key)}</b><small>{date(d.key)}{#if sg?.start}{` · ${sg.start}–${sg.end}`}{/if}</small></span>
          <span class="v num">{bkey === 'bp' ? `${ctx.bp.get(d.key).sys}/${ctx.bp.get(d.key).dia}` : bv(d.v)}{bu ? ` ${(B.own ? bu : t(bu))}` : ''}{#if sg && sg.deep != null}<small>{t('deep {d} · REM {r}', { d: hm(sg.deep), r: hm(sg.rem) })}</small>{/if}{#if bkey === 'felt'}<small>{t('sleep {s} · mood {m}', { s: ctx.checks?.get(d.key)?.sleep ?? '–', m: ctx.checks?.get(d.key)?.mood ?? '–' })}</small>{/if}</span>
          {#if bkey === 'bp' || bkey === 'water'}<button type="button" class="nav del" aria-label={t('Delete')} data-entry-del={d.key} onclick={() => removeDay(d.key)}><Trash2 size={18} aria-hidden="true" /></button>{/if}
        </li>
      {/each}
    </ul>
    <p class="q">{t(SRC_TEXT[B.src])}</p>
    {#if B.own}<p class="q"><a href="#/me/abfragen" data-own-body-edit>{t('Rename, change or delete the question: Me › Your questions')} ›</a></p>{/if}
  {:else if bkey === 'year' && !kind}
    <section class="card ch" aria-label={t(B.name)} data-body="year">
      <h2>{t('Bike km, added up')}</h2>
      {@render chart()}
      <ul class="leg"><li><i class="rest"></i>{year}</li><li><i class="f-before"></i>{year - 1}</li></ul>
      <div class="tot">
        <span><b class="num" data-year-now>{num(back === 0 ? ytd.now : (yr.at(-1).now ?? 0))} <small>km</small></b><small>{back === 0 ? t('this year up to today') : `${year}`}</small></span>
        <span><b class="num" data-year-before>{num(back === 0 ? ytd.before : yr.at(-1).before)} <small>km</small></b><small>{back === 0 ? t('last year up to the same day') : `${year - 1}`}</small></span>
      </div>
    </section>
    <p class="q">{t('Your bike rides of the app and Strava, as Velo counts them.')}</p>
  {:else if bkey === 'temp' && !kind}
    <section class="card ch" aria-label={t(B.name)} data-body="temp">
      <h2>{t('Mean pulse by temperature')}</h2>
      {#if tp.length}
        <div class="vw"><Seg small full={false} label={t('Show as')} value={tView} onchange={(v) => (tView = v)} options={[{ key: 'chart', name: t('Chart|table') }, { key: 'table', name: t('As table') }]} /></div>
        {#if tView === 'table'}
          <DataTable head={[t('Day'), t('Temperature'), t('Mean pulse')]} rows={[...tp].reverse().map((p) => ({ key: p.id, cells: [`${day(p.day)}, ${date(p.day)}`, `${num(p.temp)} °C`, `${p.hr} bpm`] }))} />
        {:else}
          {#if tShown}<Readout title={`${day(tShown.day)}, ${date(tShown.day)}`} items={[{ label: t('Temperature'), value: `${num(tShown.temp)} °C` }, { label: t('Mean pulse'), value: `${tShown.hr} bpm`, color: 'var(--hi)' }]} />{/if}
          <div class="plot" data-chart="temp">
            <div class="yl">{#each [tY[1], Math.round((tY[0] + tY[1]) / 2), tY[0]] as k (k)}<span class="num">{k} bpm</span>{/each}</div>
            <div class="area">
              {#each tp as p (p.id)}<button type="button" class="dot" data-temp-dot aria-label="{date(p.day)}: {num(p.temp)} °C · {p.hr} bpm" onpointerenter={() => (tSel = p.id)} onfocus={() => (tSel = p.id)} onclick={() => ((tSel = p.id), (tOpen = p.id))} style="left:{((p.temp - tX[0]) / (tX[1] - tX[0])) * 100}%;top:{100 - ((p.hr - tY[0]) / (tY[1] - tY[0])) * 100}%"></button>{/each}
            </div>
          </div>
          <div class="xl"><span>{tX[0]} °C</span><span>{tX[1]} °C</span></div>
          <p class="q">{t('Point at a ride or tap it for its numbers.')}</p>
        {/if}
        <ul class="bands">
          {#each tBands as b (b.band)}<li data-band={b.band}><b class="num">{b.hr ?? '–'}{b.hr ? ' bpm' : ''}</b><small>{t(BAND_NAMES[b.band])} · {t('{n} rides', { n: b.n })}</small></li>{/each}
        </ul>
      {:else}
        <p class="q">{t('No ride with a temperature in this range. Choose «1 y» or ride with a device that measures it.')}</p>
      {/if}
    </section>
    <p class="q">{t(SRC_TEXT.temp)}</p>
  {:else if hr}
    <section class="card ch" aria-label={t('Daily values')}>
      <h2>{t('Daily values')}</h2>
      {@render chart()}
      <ul class="leg"><li><i class="rest"></i>{t('at rest')}</li><li><i class="high"></i>{t('highest')}</li></ul>
      <div class="tot">
        <span><b class="num" data-hr-rest>{hr.rest ?? '--'} <small>bpm</small></b><small>{t('avg resting pulse')}</small></span>
        <span><b class="num" data-hr-high>{hr.high ?? '--'} <small>bpm</small></b><small>{t('avg highest')}</small></span>
      </div>
    </section>
    <ul class="days">
      {#each hr.days as d (d.key)}
        <li class="card" data-hr-day={d.key}><span class="m"><b>{day(d.key)}</b><small>{date(d.key)}</small></span><span class="v num"><span>{d.rest ?? '--'}{d.rest != null ? ' bpm' : ''}</span><span>{d.high ?? '--'}{d.high != null ? ' bpm' : ''}</span></span></li>
      {/each}
    </ul>
    <p class="q">{t('At rest from Fitbit; highest from Fitbit, else from your activities. Garmin’s view of one day is missing: Fitbit gives the app only day values.')}</p>
  {/if}
  {#if !kind && SIGNAL_KEY[bkey]}<p class="q" data-signal-link><a href="#/auswerten/analyse/{SIGNAL_KEY[bkey]}">{t('Your range and what stands out ›|signals')}</a></p>{/if}
  {#if !kind && !ownKeys.length}<p class="q" data-own-body-hint>{t('A value of your own (back pain, mood, blood sugar …)? Add an own question with a number in Me › Your questions: it shows here under «Own».')} <a href="#/me/abfragen">{t('Me › Your questions')} ›</a></p>{/if}
</div>

{#if tSheet}
  <ChartSheet kicker={t('Mean pulse by temperature')} title={`${day(tSheet.day)}, ${date(tSheet.day)}`} onclose={() => (tOpen = null)}>
    <ul class="shl" data-stat-sheet>
      <li><span>{t('Temperature')}</span><b class="num">{num(tSheet.temp)} °C</b></li>
      <li><span><i style:background="var(--hi)"></i>{t('Mean pulse')}</span><b class="num">{tSheet.hr} bpm</b></li>
    </ul>
    <ul class="shl acts"><li><a href="#/flow/training/a/{encodeURIComponent(tSheet.id)}"><span>{t('Open the ride')}</span><b>›</b></a></li></ul>
  </ChartSheet>
{/if}

{#if M && open != null && M.rows[open]}
  {@const r = M.rows[open]}
  <ChartSheet kicker={M.name} title={M.when(r.key)} onclose={() => (open = null)} onprev={open > 0 ? () => open-- : null} onnext={open < M.rows.length - 1 ? () => open++ : null} prevLabel={t('Day before')} nextLabel={t('Next day')}>
    <ul class="shl" data-stat-sheet>
      {#each M.items(open) as it (it.label)}<li><span>{#if it.color}<i style:background={it.color}></i>{/if}{it.label}</span><b class="num">{it.value}</b></li>{/each}
    </ul>
    {#if M.acts}
      {@const list = M.acts(open)}
      {#if list.length}
        <ul class="shl acts">
          {#each list as a (a.id)}<li><a href="#/flow/training/a/{encodeURIComponent(a.id)}"><span>{stravaName(a.name) || title}</span><b class="num">{a.km ? `${km2(a.km)} km` : hms(a.movingS)}</b></a></li>{/each}
        </ul>
      {:else}
        <p class="q">{t('No activity in this range.')}</p>
      {/if}
    {/if}
  </ChartSheet>
{/if}

<style>
  .shl {
    display: grid;
    gap: 6px;
    margin: 0 0 10px;
    padding: 0;
    list-style: none;
  }
  .shl li,
  .shl a {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 12px;
    color: inherit;
    text-decoration: none;
  }
  .shl span {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    color: var(--ink-2);
  }
  .shl i {
    width: 10px;
    height: 10px;
    border-radius: 2px;
  }
  .gs {
    display: grid;
    gap: var(--sp-4);
    max-width: 760px;
  }
  .hd {
    display: grid;
    gap: 4px;
  }
  .ptitle {
    display: flex;
    align-items: center;
    gap: 10px;
    margin: 0;
    font: 600 var(--fs-page) / var(--lh-title) var(--font-title);
  }
  .ptitle :global(svg) {
    color: var(--hi);
  }
  .per {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12px;
  }
  .nav {
    display: grid;
    place-items: center;
    width: 40px;
    height: 40px;
    border: 0;
    border-radius: 50%;
    background: var(--paper-2);
    color: var(--ink);
    cursor: pointer;
  }
  .nav:disabled {
    opacity: 0.35;
    cursor: default;
  }
  .tabs {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    border-bottom: 1px solid var(--line);
  }
  .tabs button {
    min-height: 44px;
    padding: 0 4px;
    border: 0;
    border-bottom: 3px solid transparent;
    background: none;
    color: var(--ink-2);
    font: inherit;
    font-size: var(--fs-small);
    cursor: pointer;
  }
  .tabs button[aria-selected='true'] {
    border-bottom-color: var(--ink);
    color: var(--ink);
    font-weight: 600;
  }
  .btabs {
    display: flex;
    overflow-x: auto;
    scrollbar-width: none;
  }
  .btabs::-webkit-scrollbar {
    display: none;
  }
  .btabs button {
    flex: 0 0 auto;
    padding: 0 12px;
    white-space: nowrap;
  }
  .wf {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) auto;
    align-items: end;
    gap: 10px;
    padding: 14px 16px;
  }
  .wf label {
    display: grid;
    gap: 4px;
    min-width: 0;
    font-size: var(--fs-small);
  }
  .wf label span {
    color: var(--ink-2);
  }
  .wf .inp {
    width: 100%;
    min-width: 0;
  }
  .wf small {
    grid-column: 1 / -1;
  }
  .wf a {
    color: var(--ink);
    font-weight: 600;
  }
  .groups {
    overflow-x: auto;
    scrollbar-width: none;
  }
  .wf.w4 {
    grid-template-columns: minmax(0, 1.3fr) minmax(0, 1fr) minmax(0, 1fr) auto;
  }
  @media (max-width: 520px) {
    .wf.w4 {
      grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
    }
  }
  .err {
    grid-column: 1 / -1;
    color: var(--bad);
    font-size: var(--fs-small);
  }
  .del {
    flex: 0 0 auto;
    width: 44px;
    height: 44px;
    color: var(--ink-2);
  }
  .bands {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 12px;
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .bands li {
    display: grid;
    padding-top: 8px;
    border-top: 1px solid var(--line);
  }
  .bands b {
    font: 600 var(--fs-sub) / 1.2 var(--font-body);
  }
  .bands small {
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .s-z1,
  .leg .s-z1 {
    background: var(--z1);
  }
  .s-z2,
  .leg .s-z2 {
    background: var(--z2);
  }
  .s-z3,
  .leg .s-z3 {
    background: var(--z3);
  }
  .s-z4,
  .leg .s-z4 {
    background: var(--z4);
  }
  .s-z5,
  .leg .s-z5 {
    background: var(--z5);
  }
  .leg .f-sys {
    background: var(--bad);
  }
  .leg .f-dia {
    background: var(--hi);
  }
  .leg .f-before {
    background: var(--ink-3);
  }
  .stk {
    flex-direction: column-reverse;
    justify-content: flex-start;
  }
  .s-deep {
    background: var(--l4);
  }
  .s-rem {
    background: var(--hi);
  }
  .s-light {
    background: var(--hi-bright);
  }
  .s-awake {
    background: var(--warn);
  }
  .leg .f-sleep,
  .leg .s-deep {
    background: var(--l4);
  }
  .leg .f-energy,
  .leg .s-rem {
    background: var(--hi);
  }
  .leg .f-mood,
  .leg .s-awake {
    background: var(--warn);
  }
  .leg .s-light {
    background: var(--hi-bright);
  }
  .dot {
    position: absolute;
    width: 10px;
    height: 10px;
    margin: -5px 0 0 -5px;
    padding: 0;
    border: 2px solid var(--paper);
    border-radius: 50%;
    background: var(--hi);
    cursor: pointer;
  }
  .dot::after {
    content: '';
    position: absolute;
    inset: -8px;
  }
  .vw {
    display: flex;
    justify-content: flex-end;
  }
  .ch {
    display: grid;
    gap: 10px;
    padding: 14px 16px;
  }
  .ch h2,
  .cap {
    margin: 0;
    font: 600 var(--fs-sub) / 1.3 var(--font-body);
  }
  .cap {
    margin: 0 2px 8px;
    color: var(--ink-2);
    font-size: var(--fs-small);
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }
  .plot {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr);
    gap: 8px;
    height: 200px;
  }
  .yl {
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    color: var(--ink-3);
    font-size: var(--fs-tiny);
    text-align: right;
  }
  .yl span {
    line-height: 0;
  }
  .yl span:first-child {
    line-height: 1;
  }
  .yl span:last-child {
    line-height: 0.6;
  }
  .area {
    position: relative;
    display: grid;
    grid-template-columns: repeat(var(--n, 7), minmax(0, 1fr));
    align-items: end;
    gap: 2px;
  }
  .gl {
    position: absolute;
    right: 0;
    left: 0;
    height: 1px;
    background: var(--line);
  }
  .bc {
    position: relative;
    display: flex;
    justify-content: center;
    align-items: flex-end;
    height: 100%;
  }
  .hl {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
  }
  .xl {
    display: flex;
    justify-content: space-between;
    padding-left: 32px;
    color: var(--ink-3);
    font-size: var(--fs-tiny);
  }
  .leg {
    display: flex;
    justify-content: center;
    gap: 18px;
    margin: 0;
    padding: 0;
    color: var(--ink-2);
    font-size: var(--fs-small);
    list-style: none;
  }
  .leg li {
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .leg i {
    width: 12px;
    height: 12px;
    border-radius: 50%;
  }
  .leg .rest {
    background: var(--hi);
  }
  .leg .high {
    background: var(--bad);
  }
  .tot {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 16px;
  }
  .tot > span {
    display: grid;
    padding-top: 8px;
    border-top: 1px solid var(--line);
  }
  .tot b {
    font: 600 var(--fs-title) / 1.15 var(--font-body);
  }
  .tot b small {
    font-size: var(--fs-small);
    font-weight: 400;
  }
  .tot > span > small,
  .q {
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .q {
    margin: 0 2px;
  }
  .list,
  .days {
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .list li {
    border-top: 1px solid var(--line);
  }
  .list li:first-child {
    border-top: 0;
  }
  .list a,
  .days li {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    min-height: 56px;
    padding: 10px 16px;
    color: var(--ink);
    text-decoration: none;
  }
  .list a:hover {
    background: var(--paper-2);
  }
  .days {
    display: grid;
    gap: 8px;
  }
  .m,
  .v {
    display: grid;
    min-width: 0;
  }
  .m small,
  .v small {
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .v {
    justify-items: end;
    font-weight: 600;
  }
  .ownl a {
    display: inline-block;
    padding-block: 13px; /* F03: a 44 px tap area, the layout stays (negative margin) */
    margin-block: -13px;
  }
  .ownl {
    margin: 4px 0 0;
    font-size: var(--fs-small);
  }
</style>
