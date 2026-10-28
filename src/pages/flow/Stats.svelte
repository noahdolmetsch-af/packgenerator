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
    app: 'Counted by the app from your activities, Fitbit and the morning check (see Form and recovery).',
    check: 'Your answers of the morning check, 1 to 10.',
    strava: 'From your Strava activities; watts per kg with your weight of that day.',
    load: 'From your activities: first the TSS of a FIT file from your bike computer, else power, Strava’s relative effort or pulse and time (see Form).',
    zones: 'Minutes in your pulse zones (Training › Zones), from the pulse of your Strava activities.',
    med: 'Your meditation ticks in Aktiv; a tick without minutes counts as 10.',
    temp: 'Your rides with a temperature from the device (Strava or FIT file). Warm rides often have a higher pulse.',
    ab: 'Your answers to your own question in Me › Your questions; the mean when you answered more than once a day.',
  };
  const PART_NAMES = { sleep: 'Sleep|flow', energy: 'Energy', mood: 'Mood', sys: 'Upper|bp', dia: 'Lower|bp' };
  const parts = $derived(B?.parts && bs ? B.parts.map((p) => ({ p, s: bodyStats(table, today, bkey, range, back, weights, ctx, p) })) : []);
  const STACK_NAMES = { deep: 'Deep|sleep', rem: 'REM', light: 'Light|sleep', awake: 'Awake|sleep', z1: 'Z1', z2: 'Z2', z3: 'Z3', z4: 'Z4', z5: 'Z5' };
  const stg = $derived(B?.stack && bs ? stackBars(table, today, range, back, bkey, zones.bounds) : []);
  const stTop = $derived(Math.max(bkey === 'stages' ? 60 : 10, ...stg.map((d) => B.stack.reduce((x, k) => x + (d[k] ?? 0), 0) || d.asleep || 0)));
  const hm = (m) => (m == null ? '–' : shown('sleep', m, num));
  const isSleep = $derived(bkey === 'sleep' || bkey === 'stages');
  const bv = (v) => {
    if (v == null) return '–';
    if (isSleep) return shown('sleep', v, num);
    if (bkey === 'bed') return bedText(v);
    if (bkey === 'skin') return `${v > 0 ? '+' : ''}${num(Math.round(v * 10) / 10)}`;
    if (['weight', 'hrv', 'wkg', 'spd', 'breath', 'water'].includes(bkey) || isOwnBody(bkey)) return num(Math.round(v * 10) / 10);
    return num(Math.round(v));
  };
  const bu = $derived(B?.unit && !isSleep ? B.unit : '');
  // a line starts near its lowest value; bars start at 0
  const bTicks = $derived.by(() => {
    if (!bs) return [0];
    const fx = B.fixed;
    if (fx) return [0, 1, 2, 3, 4].map((i) => fx[0] + ((fx[1] - fx[0]) / 4) * i);
    if (B.stack) return bkey === 'stages' ? axis(stTop / 60).map((h) => h * 60) : axis(stTop);
    if (!B.line) return bkey === 'sleep' ? axis(Math.max(...bs.points.map((p) => p.v ?? 0)) / 60).map((h) => h * 60) : axis(Math.max(...bs.points.map((p) => p.v ?? 0)));
    const all = parts.length ? parts.flatMap((x) => [x.s.lo, x.s.hi]).filter((v) => v != null) : [bs.lo, bs.hi];
    const lo0 = Math.min(...all);
    const hi0 = Math.max(...all);
    const pad = Math.max(Math.abs(hi0 - lo0) * 0.08, bkey === 'bed' ? 30 : Math.abs(hi0) * 0.02, 0.2);
    const lo = Math.floor(lo0 - pad);
    const st4 = Math.max(bkey === 'bed' ? 30 : 0.5, Math.ceil(((hi0 + pad - lo) / 4) * 2) / 2);
    return [0, 1, 2, 3, 4].map((i) => lo + i * st4);
  });
  const bY = (v) => 100 - ((v - bTicks[0]) / ((bTicks.at(-1) - bTicks[0]) || 1)) * 100;
  const xOf = (i, n) => (n > 1 ? (i / (n - 1)) * 100 : 50);
  const lineOf = (pts, k = 'v', y = bY) => {
    let out = '';
    pts.forEach((p, i) => {
      if (p[k] == null) return;
      out += `${out ? 'L' : 'M'}${xOf(i, pts.length).toFixed(1)} ${y(p[k]).toFixed(1)}`;
    });
    return out;
  };
  const bDots = $derived(bs && B.line && !B.parts ? bs.points.map((p, i) => (p.v == null ? null : { x: xOf(i, bs.points.length), y: bY(p.v) })).filter(Boolean) : []);
  const bTick = (k) => (isSleep ? `${num(Math.round((k / 60) * 10) / 10)} h` : bkey === 'bed' ? bedText(k) : num(Math.round(k * 10) / 10));
  const spread = $derived(bkey === 'bed' && bs ? spreadMin(bs.days.map((d) => d.v)) : null);
  // «Km this year»: this year against the year before, month by month; ‹ goes back a year
  const year = $derived(Number(today.slice(0, 4)) - back);
  const yr = $derived(bkey === 'year' && !kind ? yearKm(table, year, today) : []);
  const ytd = $derived(bkey === 'year' && !kind ? yearToDate(table, today) : null);
  const yTicks = $derived(axis(Math.max(10, ...yr.flatMap((p) => [p.now ?? 0, p.before]))));
  const yY = (v) => 100 - (v / (yTicks.at(-1) || 1)) * 100;
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
  // the axis: four round steps up to the highest bar
  const axis = (max) => {
    const raw = Math.max(1, max) / 4;
    const p = 10 ** Math.floor(Math.log10(raw));
    const step = [1, 2, 4, 5, 10].map((m) => m * p).find((m) => m >= raw);
    return [0, 1, 2, 3, 4].map((i) => i * step);
  };
  const ticks = $derived(st ? (key === 'time' ? axis(Math.max(...st.bars.map((b) => b.v)) / 3600).map((h) => h * 3600) : axis(Math.max(...st.bars.map((b) => b.v)))) : hr ? axis(Math.max(60, ...hr.points.map((p) => p.high ?? p.rest ?? 0))) : [0]);
  const topV = $derived(ticks.at(-1) || 1);
  const label = (k) => (range === 'y1' ? monthShort(k) : dm(k));
  const tickLabel = (k) => (key === 'time' && st ? `${num(Math.round((k / 3600) * 10) / 10)} h` : num(k));
  const day = (d) => new Date(`${d}T00:00:00Z`).toLocaleDateString(locale(), { weekday: 'long', timeZone: 'UTC' });
  const date = (d) => new Date(`${d}T00:00:00Z`).toLocaleDateString(locale(), { day: 'numeric', month: 'long', timeZone: 'UTC' });
  const setRange = (r) => ((range = r), (back = 0));
  const hrY = (v) => 100 - (v / topV) * 100;
  const hrLine = (k) => {
    let out = '';
    hr?.points.forEach((p, i) => {
      if (p[k] == null) return;
      const x = hr.points.length > 1 ? (i / (hr.points.length - 1)) * 100 : 50;
      out += `${out ? 'L' : 'M'}${x.toFixed(1)} ${hrY(p[k]).toFixed(1)}`;
    });
    return out;
  };
  const title = $derived(kind ? sportName(kind) : t('Body values'));
</script>

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
      <div class="plot">
        <div class="yl">{#each [...ticks].reverse() as k (k)}<span class="num">{tickLabel(k)}</span>{/each}</div>
        <div class="area" style="--n:{st.bars.length}">
          {#each ticks as k (k)}<i class="gl" style="bottom:{(k / topV) * 100}%"></i>{/each}
          {#each st.bars as b (b.key)}
            <span class="bc" title="{label(b.key)}: {fmtV(key, b.v)} {unit(key)}"><i style="height:{b.v ? Math.max(1.5, (b.v / topV) * 100) : 0}%"></i></span>
          {/each}
        </div>
      </div>
      <div class="xl"><span>{label(st.bars[0].key)}</span><span>{label(st.bars.at(-1).key)}</span></div>
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
        <div class="plot">
          <div class="yl">{#each [...bTicks].reverse() as k (k)}<span class="num">{bTick(k)}</span>{/each}</div>
          <div class="area" style="--n:{bs.points.length}">
            {#each bTicks as k (k)}<i class="gl" style="bottom:{100 - bY(k)}%"></i>{/each}
            {#if B.parts}
              <svg viewBox="0 0 100 100" preserveAspectRatio="none" class="hl" aria-hidden="true">{#each parts as f (f.p)}<path d={lineOf(f.s.points)} class="f-{f.p}" />{/each}</svg>
            {:else if B.stack}
              {#each stg as d (d.key)}
                <span class="bc stk" title="{label(d.key)}: {bv(d.asleep)}">
                  {#each [...B.stack].reverse() as k (k)}<i class="s-{k}" style="height:{d[k] ? (d[k] / (bTicks.at(-1) || 1)) * 100 : 0}%"></i>{/each}
                </span>
              {/each}
            {:else if B.line}
              <svg viewBox="0 0 100 100" preserveAspectRatio="none" class="hl" aria-hidden="true"><path d={lineOf(bs.points)} class="rest" /></svg>
              {#each bDots as d, i (i)}<i class="dot" style="left:{d.x}%;top:{d.y}%"></i>{/each}
            {:else}
              {#each bs.points as p (p.key)}
                <span class="bc" title="{label(p.key)}: {bv(p.v)} {bu}"><i style="height:{p.v ? Math.max(1.5, (p.v / (bTicks.at(-1) || 1)) * 100) : 0}%"></i></span>
              {/each}
            {/if}
          </div>
        </div>
        <div class="xl"><span>{label(bs.points[0].key)}</span><span>{label(bs.points.at(-1).key)}</span></div>
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
        <p class="q">{B.entry ? t('No entry in this range yet. Enter one above.') : B.src === 'fitbit' ? t('No value in this range. It comes with Fitbit.') : t('No value in this range yet.')}</p>
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
      <div class="plot">
        <div class="yl">{#each [...yTicks].reverse() as k (k)}<span class="num">{num(k)}</span>{/each}</div>
        <div class="area">
          {#each yTicks as k (k)}<i class="gl" style="bottom:{100 - yY(k)}%"></i>{/each}
          <svg viewBox="0 0 100 100" preserveAspectRatio="none" class="hl" aria-hidden="true"><path d={lineOf(yr, 'before', yY)} class="f-before" /><path d={lineOf(yr, 'now', yY)} class="rest" /></svg>
        </div>
      </div>
      <div class="xl"><span>{monthShort(yr[0].key)}</span><span>{monthShort(yr.at(-1).key)}</span></div>
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
        <div class="plot">
          <div class="yl">{#each [tY[1], Math.round((tY[0] + tY[1]) / 2), tY[0]] as k (k)}<span class="num">{k}</span>{/each}</div>
          <div class="area">
            {#each tp as p (p.id)}<i class="dot" data-temp-dot style="left:{((p.temp - tX[0]) / (tX[1] - tX[0])) * 100}%;top:{100 - ((p.hr - tY[0]) / (tY[1] - tY[0])) * 100}%" title="{date(p.day)}: {num(p.temp)} °C · {p.hr} bpm"></i>{/each}
          </div>
        </div>
        <div class="xl"><span>{tX[0]} °C</span><span>{tX[1]} °C</span></div>
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
      <div class="plot">
        <div class="yl">{#each [...ticks].reverse() as k (k)}<span class="num">{num(k)}</span>{/each}</div>
        <div class="area">
          {#each ticks as k (k)}<i class="gl" style="bottom:{(k / topV) * 100}%"></i>{/each}
          <svg viewBox="0 0 100 100" preserveAspectRatio="none" class="hl" aria-hidden="true"><path d={hrLine('rest')} class="rest" /><path d={hrLine('high')} class="high" /></svg>
        </div>
      </div>
      <div class="xl"><span>{label(hr.points[0].key)}</span><span>{label(hr.points.at(-1).key)}</span></div>
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
  {#if !kind && !ownKeys.length}<p class="q" data-own-body-hint>{t('A value of your own (back pain, mood, blood sugar …)? Add an own question with a number in Me › Your questions: it shows here under «Own».')} <a href="#/me/abfragen">{t('Me › Your questions')} ›</a></p>{/if}
</div>

<style>
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
  .hl .f-sys {
    stroke: var(--bad);
  }
  .hl .f-dia {
    stroke: var(--hi);
  }
  .hl .f-before {
    stroke: var(--ink-3);
    stroke-dasharray: 4 3;
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
  .stk i {
    width: min(70%, 14px);
    border-radius: 0;
  }
  .stk i:last-child {
    border-radius: 99px 99px 0 0;
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
  .hl .f-sleep {
    stroke: var(--l4);
  }
  .hl .f-energy {
    stroke: var(--hi);
  }
  .hl .f-mood {
    stroke: var(--warn);
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
    width: 8px;
    height: 8px;
    margin: -4px 0 0 -4px;
    border-radius: 50%;
    background: var(--hi);
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
  .bc i {
    display: block;
    width: min(70%, 14px);
    border-radius: 99px 99px 0 0;
    background: var(--hi);
  }
  .hl {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
  }
  .hl path {
    fill: none;
    stroke-width: 2.5;
    vector-effect: non-scaling-stroke;
  }
  .hl .rest {
    stroke: var(--hi);
  }
  .hl .high {
    stroke: var(--bad);
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
  .ownl {
    margin: 4px 0 0;
    font-size: var(--fs-small);
  }
</style>
