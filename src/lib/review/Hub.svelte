<script>
  import { UNDO_MS } from '../ui/undo.js';
  /**
   * v0.49.0 R1 «Rückblick ruhig» (Noah 4a-7a): ONE page «Rückblick» (#/debrief) instead of five.
   * 1. The last ride: profile, km, Hm, time, pace, weather, plan against real, its learnings, and the
   *    one main button «Rückblick schreiben» while its debrief is open.
   * 2. «Letzte 12 Monate» (rolling; the switch on top: 12 Monate / this year / Alle) with Vorjahr,
   *    Durchschnitt and Bestwert per number.
   * 3. «Touren im Vergleich»: 7 small charts and a compact table; base the last 10 trips, the 12
   *    months or the same kind (Art) as the newest one.
   * 4. One level below: Dein Tempo, Gelernt, Logbuch (their own pages; v0.61.0 R2 rebuilt them).
   * «Fahrt hochladen» is a quiet button in the head. #/review and #/debrief/compare land here.
   * Numbers: review/rueckblick.js (tested); unknown is a calm «–».
   * SN2 «Seiten neu» (mockup approved 13.10.2026, ★ 2a): the state pills Abgeschlossen · n, Bewertet · n
   * in the head; on top the trip whose debrief is missing with the one main button «Bewerten» and a
   * quiet «Nicht gefahren» (with Undo); the period as four tiles and the bars, the long table open
   * under «Alle Kennzahlen» (answer 2b, it can be folded); «Touren im Vergleich» with a column Zustand (on a phone the pill under
   * the name), the small charts and all columns folded; the last ride's details folded at the end.
   */
  import HintCard from '../pageinfo/HintCard.svelte';
  import TipLine from '../pageinfo/TipLine.svelte';
  import { liveQuery } from 'dexie';
  import { db } from '../db.js';
  import { loadReview } from './load.js';
  import { tripFacts, periodStats, compareSet, planVsReal, ARTS } from './rueckblick.js';
  import { homeTrips } from '../home/heute.js';
  import { n0, n1, hours, temps, kg, dates, monthShort, monthLong, dayLong, rainText, DASH } from './fmt.js';
  import { paceOf, ruleOf } from '../pace.js';
  import { logEntries } from './logbook.js';
  import { logbookLine } from '../sk/pages.js';
  import { openTrip } from '../nav.js';
  import { heartBetween, heartOfRide } from '../kmbook.js';
  import HeartLine from '../strava/HeartLine.svelte';
  import { localDay } from '../localday.js';
  import { t, tn, num, locale } from '../i18n.svelte.js';
  import Seg from '../ui/Seg.svelte';
  import MiniBars from './MiniBars.svelte';
  import Empty from '../ui/Empty.svelte';
  import Skeleton from '../ui/Skeleton.svelte';
  import { Upload, ChevronRight, ChevronLeft, Lightbulb, Sparkles, Sun, CloudRain, Cloud, Thermometer, Bike, Clock, Gauge, BookOpen, Mountain, Archive, Flag, Star } from '@lucide/svelte';
  import TripState from '../ui/TripState.svelte';
  import Profile from '../ui/Profile.svelte';
  import Btn from '../ui/Btn.svelte';
  import { factStates, factCounts, PERIOD_KEY } from './state.js';
  import { quickDebrief } from '../debrief.js';
  import { stateExtraText } from '../tripstatetext.js';
  import './review.css';
  import ChronikKarte from '../lernen/ChronikKarte.svelte'; // Paket M #1027
  import { storyReady } from '../lernen/jahrstory.js'; // Paket M #208
  import { Compass, History, GraduationCap, Images, CircleHelp } from '@lucide/svelte';
  import ListGroup from '../list/ListGroup.svelte';
  import { phone } from '../media.svelte.js';

  let { spot = '' } = $props();

  const today = localDay();
  const dataQ = liveQuery(async () => ({ ...(await loadReview(db)), events: await db.events.toArray() }));
  const data = $derived($dataQ ?? null);
  // the same trips as Today's «Letzte 12 Monate»: no archived and no test trips (home/heute.js)
  const facts = $derived(data ? tripFacts({ ...data, trips: homeTrips(data.trips), today }) : []);

  const KEEP = PERIOD_KEY;
  const keepGet = (k, d) => {
    try {
      return localStorage.getItem(k) || d;
    } catch {
      return d;
    }
  };
  const keepSet = (k, v) => {
    try {
      localStorage.setItem(k, v);
    } catch {
      /* private mode: the choice lasts for this visit */
    }
  };
  let mode = $state(keepGet(KEEP, '12m'));
  let base = $state(keepGet('review.base', 'last10'));
  const setMode = (v) => ((mode = v), keepSet(KEEP, v));
  const setBase = (v) => ((base = v), keepSet('review.base', v));

  const stats = $derived(data ? periodStats(facts, data.learnings, mode, today) : null);
  const cmp = $derived(compareSet(facts, base, today));
  const last = $derived(facts[0] ?? null);
  // heart rate from the Strava rides of the last tour (observation only, Noah 12.10.2026 «2a und b»)
  const kmQ = liveQuery(() => db.kmBook.toArray());
  const lastHeart = $derived(!last || !$kmQ ? null : last.kind === 'ride' ? heartOfRide($kmQ, last.rides?.[0]) : heartBetween($kmQ, last.start, last.end, last.trip?.bikeId ?? null));
  const lastPlan = $derived(last ? planVsReal(last).find((x) => x.key === 'movingH') ?? null : null);
  const pace = $derived(paceOf(data?.pace ?? null));
  const rule = $derived(ruleOf(pace.learned));
  const log = $derived(data ? logEntries({ facts, events: data.events }) : []);
  // v0.78.0 «Fünf Orte» 2 (Noah O2.4a): the debriefs still open come first, each with «Write».
  const openList = $derived(facts.filter((r) => r.debrief === 'open' || r.debrief === 'draft'));
  const open = $derived(openList.length);
  const year = today.slice(0, 4);
  const newest = $derived([...(data?.learnings ?? [])].sort((a, b) => String(b.createdAt ?? b.date ?? '').localeCompare(String(a.createdAt ?? a.date ?? ''))).slice(0, 3));

  const PERIODS = $derived([
    { key: '12m', name: t('12 months') },
    { key: 'year', name: year },
    { key: 'all', name: t('All|period') },
  ]);
  const BASES = $derived([
    { key: 'last10', name: t('10 trips') },
    { key: '12m', name: t('12 months') },
    { key: 'same', name: t('Same kind') },
  ]);
  // SN2: the state of every row (Abgeschlossen / Bewertet) and how many of each are in the period
  const states = $derived(data ? factStates(facts, { debriefs: data.debriefs, rides: data.rides, today }) : {});
  // the head counts the trips of the period, the same as the tile «Touren» (an uploaded ride alone is no trip)
  const counts = $derived(stats ? factCounts(stats.rows.filter((r) => r.kind === 'trip'), states) : { all: 0, done: 0, rated: 0 });
  const periodShort = $derived(mode === 'year' ? year : mode === 'all' ? t('All|period') : t('12 months'));
  const extraOf = (id) => stateExtraText(states[id]?.extra);
  // SN2 answer 2b (Noah 13.10.2026): the long table is open as before; 0.159.1 (Noah 14.10.2026 «a»): on a phone it starts closed
  let allFigures = $state(!phone.matches);
  let allColumns = $state(false);
  let lastOpen = $state(false);
  // 0.159.1: the closed lines on a phone (all closed when the page opens)
  let cmpOpen = $state(false);
  let lastFold = $state(false);
  let paceOpen = $state(false);
  let learnOpen = $state(false);
  let moreOpen = $state(false);
  // SN2: «Nicht gefahren» on the trip whose debrief is missing: it leaves every count (skipped), with Undo
  let undo = $state(null);
  let undoTimer;
  async function notRidden(r) {
    const before = await db.trips.get(r.trip.id);
    if (!before) return;
    await db.trips.update(r.trip.id, { skipped: true, updatedAt: new Date().toISOString() });
    clearTimeout(undoTimer);
    undo = { text: t('Not ridden: {title}.', { title: r.title }), restore: () => db.trips.put($state.snapshot(before)) };
    undoTimer = setTimeout(() => (undo = null), UNDO_MS);
  }
  // Impeccable Rückblick 2: the short way is «Kurz: Alles gut» everywhere (as on Today and «Tour beendet»)
  async function allGood(r) {
    const trip = await db.trips.get(r.trip.id);
    if (!trip) return;
    const prev = (await db.debriefs.get(trip.id)) ?? null;
    await db.transaction('rw', db.debriefs, db.trips, async () => {
      await db.debriefs.put(quickDebrief(trip, prev ? structuredClone(prev) : null));
      await db.trips.update(trip.id, { status: 'done' });
    });
    clearTimeout(undoTimer);
    undo = {
      text: t('Saved: {title}, all good.', { title: r.title }),
      restore: () =>
        db.transaction('rw', db.debriefs, db.trips, async () => {
          if (prev) await db.debriefs.put(prev);
          else await db.debriefs.delete(trip.id);
          await db.trips.update(trip.id, { status: trip.status ?? 'planned' });
        }),
    };
    undoTimer = setTimeout(() => (undo = null), UNDO_MS);
  }
  async function undoSkip() {
    const u = undo;
    undo = null;
    clearTimeout(undoTimer);
    if (u) await u.restore();
  }
  // Impeccable Rückblick 2: one word for «Rückblick machen»: «Rückblick schreiben», a started one «weiterschreiben»
  const writeLabel = (r) => (r.debrief === 'draft' ? t('Continue the debrief') : t('Write the debrief'));
  const wxLine = (r) => [rainText(r.rain, r.days), temps(r.tmin, r.tmax)].filter((x) => x !== DASH).join(', ');
  const periodName = $derived(mode === 'year' ? year : mode === 'all' ? t('All years') : t('Last 12 months'));
  const rangeText = $derived(stats ? (stats.period.from ? `${dayLong(stats.period.from)} – ${dayLong(stats.period.to)}` : t('since {date}', { date: dayLong(facts.at(-1)?.start) })) : '');

  /* ---- the numbers of the period, as words ---- */
  const LABEL = { trips: 'Trips', km: 'Distance', gainM: 'Climbing|hm', movingH: 'Moving', kmh: 'Pace|speed', rain: 'Rain|weather', learnings: 'Learnings' };
  const UNIT = { km: 'km', gainM: 'Hm', movingH: 'h', kmh: 'km/h' };
  const bigH = (h) => (h == null ? DASH : h >= 10 ? n0(h) : hours(h));
  function value(s) {
    if (s.key === 'kmh') return n1(s.value);
    if (s.key === 'movingH') return bigH(s.value);
    return n0(s.value);
  }
  const unit = (s) => (s.key === 'rain' ? (s.value != null ? tn(s.value, 'trip|unit', 'trips|unit') : '') : UNIT[s.key] ?? '');
  function deltaText(s) {
    if (s.prev == null) return DASH;
    if (s.delta == null) return DASH;
    if (['km', 'gainM', 'movingH'].includes(s.key)) return `${s.pct > 0 ? '+' : s.pct < 0 ? '−' : '±'}${num(Math.abs(s.pct))} %`;
    if (s.key === 'kmh') return `${s.delta > 0 ? '+' : s.delta < 0 ? '−' : '±'}${n1(Math.abs(s.delta))}`;
    return `${s.delta > 0 ? '+' : s.delta < 0 ? '−' : '±'}${num(Math.abs(s.delta))}`;
  }
  function avgText(s) {
    if (s.avg == null) return DASH;
    if (s.key === 'trips') return tn(s.avg, '{n} day on the way', '{n} days on the way');
    if (s.key === 'km') return `Ø ${n0(s.avg)} km`;
    if (s.key === 'gainM') return `Ø ${n0(s.avg)} Hm`;
    if (s.key === 'movingH') return `Ø ${hours(s.avg)} h`;
    if (s.key === 'kmh') return tn(s.avg, 'from {n} trip', 'from {n} trips');
    if (s.key === 'rain') return t('{n} % of trips', { n: s.avg });
    return DASH;
  }
  function bestText(s) {
    const b = s.best;
    if (!b) return DASH;
    if (s.key === 'trips') return `${monthLong(b.month)}: ${tn(b.value, '{n} trip', '{n} trips')}`;
    if (s.key === 'kmh') return `${b.title}: ${n1(b.value)}`;
    if (s.key === 'movingH') return `${b.title}: ${hours(b.value)}`;
    if (s.key === 'rain') return `${b.title}: ${tn(b.value, '{n} rain day', '{n} rain days')}`;
    return `${b.title}: ${n0(b.value)}`;
  }

  /* ---- the bars of the period (km per month or per year) ---- */
  const barTop = $derived(stats ? Math.max(1, ...stats.bars.map((b) => b.km)) : 1);
  const nice = (v) => {
    const p = 10 ** Math.floor(Math.log10(Math.max(1, v)));
    return [1, 2, 2.5, 5, 10].map((m) => m * p).find((m) => m >= v);
  };
  const axisTop = $derived(nice(barTop));
  const barLabel = (b) => (mode === 'all' ? b.key : monthShort(b.key).slice(0, 1).toUpperCase());

  /* ---- the comparison ---- */
  const CMP = { km: 'Distance', gainM: 'Climbing|hm', movingH: 'Moving time', kmh: 'Pace|speed', baseG: 'Base · multi-day', rainDays: 'Rain days', learnings: 'Learnings' };
  function cmpValue(key, v) {
    if (key === 'kmh') return n1(v);
    if (key === 'movingH') return hours(v);
    if (key === 'baseG') return v == null ? DASH : n1(v / 1000);
    return n0(v);
  }
  const CMPUNIT = { km: 'km', gainM: 'Hm', movingH: 'h', kmh: 'km/h', baseG: 'kg' };
  function cmpFoot(m) {
    const a = m.avg == null ? DASH : cmpValue(m.key, m.key === 'rainDays' || m.key === 'learnings' ? Math.round(m.avg * 10) / 10 : m.avg);
    const b = m.best == null ? DASH : cmpValue(m.key, m.best);
    return `Ø ${m.key === 'rainDays' || m.key === 'learnings' ? n1(m.avg) : a} · ${m.low ? t('lightest {v}', { v: b }) : t('best {v}', { v: b })}`;
  }
  const sentence = $derived.by(() => {
    const s = cmp.sentence;
    if (!s) return '';
    const how = s.shorter == null || s.faster == null ? '' : s.shorter ? (s.faster ? t('short and fast') : t('short and calm')) : s.faster ? t('long and fast') : t('long and calm');
    const nums = s.kmh != null && s.hmPerKm != null ? t('{kmh} km/h at {hm} Hm per km', { kmh: n1(s.kmh), hm: s.hmPerKm }) : '';
    if (!how) return nums ? `${s.title}: ${nums}.` : '';
    return nums ? t('{title} was {how}: {nums}.', { title: s.title, how, nums }) : t('{title} was {how}.', { title: s.title, how });
  });
  const colMax = (f) => Math.max(1, ...cmp.rows.map(f).filter((v) => v != null));
  const scale = $derived({
    km: colMax((r) => r.km),
    gainM: colMax((r) => r.gainM),
    movingH: colMax((r) => r.movingH),
    kmh: colMax((r) => r.kmh),
    baseG: colMax((r) => r.baseG),
    learnings: colMax((r) => (r.trip ? r.learnings.length : null)),
  });
  const pct = (v, top) => (v == null ? 0 : Math.max(2, Math.round((v / top) * 100)));

  $effect(() => {
    if (spot === 'compare' && data) {
      cmpOpen = true; // 0.159.1: on a phone the old address opens the closed line «Touren im Vergleich»
      queueMicrotask(() => document.getElementById('compare')?.scrollIntoView());
    }
    // Regeln der App (14.10.2026): the old link «12 months» (#/review) lands at the period part
    if (spot === 'period' && data) queueMicrotask(() => document.getElementById('per-h')?.closest('section')?.scrollIntoView());
  });
  const highest = (p) => (p?.length ? Math.max(...p.map((x) => x[1] ?? 0)) : null);
  const ARTNAME = Object.fromEntries(ARTS.map((a) => [a.key, a.name]));
</script>

{#snippet rainIcon(rain)}
  {#if rain?.wet === true}<CloudRain size={16} aria-hidden="true" />{:else if rain?.wet === false}<Sun size={16} aria-hidden="true" />{:else}<Cloud size={16} aria-hidden="true" />{/if}
{/snippet}

<!-- v0.109.0 Design-Refresh P6 (T17 «Rückblick», approved 12.10.2026): two columns as in the mockup.
     SN2: the head with the state pills, the trip whose debrief is missing on top, then left the period
     (tiles, bars, «Alle Kennzahlen») and trips compared; right your pace, Gelernt and «Mehr». -->
<div class="hub rv-page">
  <nav class="crumb" aria-label={t('Path')}><a href="#/trips"><ChevronLeft size={14} aria-hidden="true" />{t('Trips|place')}</a><ChevronRight size={12} aria-hidden="true" /><span aria-current="page">{t('Look back|page')}</span></nav>
  <header class="head">
    <div class="ht">
      <h1 class="title">{t('Look back|page')}</h1>
      {#if stats && (counts.done || counts.rated)}
        <p class="pills">{#if counts.done}<TripState state="done" extra={num(counts.done)} />{/if}{#if counts.rated}<TripState state="rated" extra={num(counts.rated)} />{/if}</p>
      {/if}
      {#if stats}<p class="page-sub num">{periodShort} · {tn(stats.stats[0].value ?? 0, '{n} trip ridden', '{n} trips ridden')}</p>{/if}
    </div>
    <div class="hacts">
      <Seg full={false} label={t('Period')} value={mode} options={PERIODS} onchange={setMode} />
    </div>
  </header>
  <!-- «Mehr Inhalt» (Noah 15.10.2026, 1a–5a): the card «Was hier steht» under the title; the Einstieg carries
    the tip of the day (as on Aktiv), the tip line only when the Einstieg is taken away -->
  <!-- Noah 19.10 «2a»: one card per page; the Einstieg lives in the card «Was hier steht» (its own card only while the page is empty) -->
  <HintCard page="debrief" intro="debrief" />
  {#if undo}<p class="undo" role="status">{undo.text} <button type="button" class="ulink" onclick={undoSkip}>{t('Undo')}</button></p>{/if}

  {#if !data}
    <!-- v0.127.0 A-U2: a calm placeholder while loading, the one empty building block when there is nothing -->
    <Skeleton rows={3} />
  {:else if !facts.length}
    <Empty icon={Upload} title={t('Nothing to look back on yet.')} text={t('A trip shows up here the day after it ends, an uploaded ride at once.')} action={{ label: t('Upload ride'), href: '#/debrief/ride' }} />
    <TipLine page="debrief" name={t('Look back|page')} />
  {:else}
    {#if openList.length}
      <!-- SN2: the trip whose debrief is missing, with the one main button «Bewerten» -->
      {@const r = openList[0]}
      <section class="rv-box pad hero" aria-labelledby="open-h" data-open-debrief>
        <span class="hic" aria-hidden="true"><Flag size={22} /></span>
        <span class="hm">
          <TripState state="done" extra={r.debrief === 'draft' ? t('debrief started') : t('debrief missing')} />
          <b id="open-h" class="hname">{r.title}</b>
          <small>{[dates(r.start, r.end), r.bike, wxLine(r)].filter(Boolean).join(' · ')}</small>
        </span>
        <span class="rowacts">
          {#if r.trip}<Btn kind="quiet" label={t('Not ridden')} explain={t('It was not ridden: it leaves every count. You can undo it.')} onclick={() => notRidden(r)} />{/if}
          {#if r.trip}<Btn label={t('Short: all good')} explain={t('"All good": every item counts as used and nothing else changes.')} aria="{t('Short: all good')}: {r.title}" onclick={() => allGood(r)} />{/if}
          <Btn kind="hi" icon={Star} label={writeLabel(r)} href="#/debrief/{encodeURIComponent(r.id)}" onclick={() => openTrip(r.id)} aria="{writeLabel(r)}: {r.title}" />
        </span>
        {#if openList.length > 1}
          <ul class="more-open">
            {#each phone.matches && !moreOpen ? openList.slice(1, 2) : openList.slice(1) as o (o.id)}
              <li>
                <span class="rv-m"><span class="rv-t">{o.title}</span><span class="rv-s">{[dates(o.start, o.end), extraOf(o.id)].filter(Boolean).join(' · ')}</span></span>
                <Btn label={writeLabel(o)} href="#/debrief/{encodeURIComponent(o.id)}" onclick={() => openTrip(o.id)} aria="{writeLabel(o)}: {o.title}" />
              </li>
            {/each}
          </ul>
          <!-- 0.159.1: on a phone one more open debrief shows, the rest behind one tap -->
          {#if phone.matches && openList.length > 2}
            <button type="button" class="fold-btn" aria-expanded={moreOpen} onclick={() => (moreOpen = !moreOpen)}>{moreOpen ? t('Show fewer') : tn(openList.length - 2, '{n} more to rate', '{n} more to rate')}<ChevronRight size={15} aria-hidden="true" /></button>
          {/if}
        {/if}
      </section>
    {/if}
    <!-- Gesamttest 20.10.2026 Design 2: the tip of the day under the first part of the page, not above it -->
    <TipLine page="debrief" name={t('Look back|page')} />
    <div class="rv-lay">
      <div class="rv-col">
        <!-- 1. the period: four tiles, the bars, the long table folded (SN2, ★ 2a) -->
        <section class="rv-sec period" aria-labelledby="per-h">
          <div class="rv-h"><div><h2 id="per-h">{periodName}</h2><p class="rv-sub num">{rangeText} · {t('only Completed and Rated')}</p></div></div>
          <div class="rv-box ptiles">
            <ul class="rv-tiles" aria-label={periodName}>
              {#each stats.stats.filter((s) => ['trips', 'km', 'gainM', 'rain'].includes(s.key)) as s (s.key)}
                <li class="rv-tile"><b class="num">{s.key === 'rain' ? num(s.value ?? 0) : value(s)}</b><small>{s.key === 'trips' ? tn(s.value ?? 0, 'trip|unit', 'trips|unit') : s.key === 'km' ? 'km' : s.key === 'gainM' ? t('Climbing|hm') : t('with rain')}</small></li>
              {/each}
            </ul>
            <div class="pin">
              {#if stats.bars.length > 1}
                <div class="cols" role="img" aria-label={mode === 'all' ? t('km per year') : t('km per month')}>
                  {#each stats.bars as b, i (b.key)}
                    <span class="col" title="{mode === 'all' ? b.key : monthLong(b.key)}: {num(b.km)} km"><i class:now={i === stats.bars.length - 1} style:height="{b.km ? Math.max(3, (b.km / axisTop) * 100) : 3}%"></i><small>{barLabel(b)}</small></span>
                  {/each}
                </div>
              {/if}
              <button type="button" class="fold-btn" aria-expanded={allFigures} aria-controls="kz-all" onclick={() => (allFigures = !allFigures)}>{t('All figures')}<ChevronRight size={15} aria-hidden="true" /></button>
              {#if allFigures}
                <table class="kz" id="kz-all">
                  <thead><tr><th scope="col">{t('Figure')}</th><th scope="col" class="n">{periodName}</th>{#if mode !== 'all'}<th scope="col" class="n">{t('Previous year')}</th>{/if}<th scope="col">{t('Average')}</th><th scope="col">{t('Best')}</th></tr></thead>
                  <tbody>
                    {#each stats.stats as s (s.key)}
                      <tr>
                        <th scope="row">{t(LABEL[s.key])}</th>
                        <td class="n v num"><b>{value(s)}</b>{#if unit(s)}{' '}<span class="u">{unit(s)}</span>{/if}</td>
                        {#if mode !== 'all'}<td class="n d num" class:up={s.delta > 0}>{deltaText(s)}</td>{/if}
                        <td class="a">{avgText(s)}</td>
                        <td class="b">{bestText(s)}</td>
                      </tr>
                    {/each}
                  </tbody>
                </table>
              {/if}
            </div>
          </div>
        </section>

        <!-- 2. trips compared: name, state, km, weather; the small charts and all columns folded -->
        <!-- 0.159.1 «UI-Regeln» Teil 2 (UI1, UI5, Noah «Seiten kürzer am Handy»): on a phone the lower sections are
             one closed line each (SL ListGroup), with what is inside; on a computer they stay open as before. -->
        {#if phone.matches}
          <div id="compare"><ListGroup id="rv-compare" title={t('Trips compared')} count={cmp.rows.length >= 2 ? tn(cmp.rows.length, '{n} trip', '{n} trips') : ''} peek={cmp.rows.slice(0, 3).map((r) => r.title).join(' · ')} bind:open={cmpOpen}>{@render cmpBody()}</ListGroup></div>
        {:else}
        <section class="rv-sec cmp" id="compare" aria-labelledby="cmp-h">
          <div class="rv-h"><div><h2 id="cmp-h">{t('Trips compared')}</h2><p class="rv-sub">{cmp.rows.length >= 2 ? t('the last {n}, newest first', { n: cmp.rows.length }) : ''}</p></div></div>
          {@render cmpBody()}
        </section>
        {/if}

        <!-- 3. the last ride: its numbers, weather, plan against real, heart rate and learnings, folded (SN2) -->
        {#if last}
          {#if phone.matches}
            <ListGroup id="rv-last" title={t('Last ride')} peek={[last.title, dates(last.start, last.end)].join(' · ')} sum={last.km ? `${n0(last.km)} km` : ''} bind:open={lastFold}>{@render lastBody()}</ListGroup>
          {:else}
          <section class="rv-sec" aria-labelledby="last-h">
            <div class="rv-h"><div><h2 id="last-h">{t('Last ride')}</h2><p class="rv-sub">{[last.title, dates(last.start, last.end), last.trip ? t(ARTNAME[last.art]) : t('Uploaded ride')].join(' · ')}</p></div></div>
            {@render lastBody()}
          </section>
          {/if}
        {/if}
      </div>

      <!-- 4. one level below -->
      <div class="rv-col below">
        {#if phone.matches}
          <ListGroup id="rv-pace" title={t('Your pace')} peek={t('{kmh} km/h · 1 h per {m} Hm', { kmh: num(rule && pace.mine ? rule.kmh : pace.kmh), m: num(rule && pace.mine ? rule.climbMh : pace.climbMh) })} bind:open={paceOpen}>{@render paceBody()}</ListGroup>
        {:else}
        <section class="rv-sec sub" aria-labelledby="pace-h">
          <div class="rv-h"><div><h2 id="pace-h">{t('Your pace')}</h2><p class="rv-sub">{pace.mine ? tn(pace.n, 'your rule, from {n} ride', 'your rule, from {n} rides') : pace.need ? tn(pace.need + pace.n, 'standard rule, until {n} ride is there', 'standard rule, until {n} rides are there') : t('standard rule, as you chose')}</p></div></div>
          {@render paceBody()}
        </section>
        {/if}
        {#if phone.matches}
          <ListGroup id="rv-learned" title={t('Learned|review')} count={data.learnings.length ? tn(data.learnings.length, '{n} learning', '{n} learnings') : ''} peek={newest[0]?.rule ?? ''} bind:open={learnOpen}>
            {@render learnBody()}
            {#if data.learnings.length}<a class="rv-more lg-all" href="#/debrief/learnings">{t('All learnings')}<ChevronRight size={16} aria-hidden="true" /></a>{/if}
          </ListGroup>
        {:else}
        <section class="rv-sec" aria-labelledby="learn-h">
          <div class="rv-h"><div><h2 id="learn-h">{t('Learned|review')}</h2><p class="rv-sub num">{data.learnings.length ? tn(data.learnings.length, '{n} learning', '{n} learnings') : t('from every debrief')}</p></div>{#if data.learnings.length}<a class="rv-more" href="#/debrief/learnings">{t('All learnings')}<ChevronRight size={16} aria-hidden="true" /></a>{/if}</div>
          {@render learnBody()}
        </section>
        {/if}
        <!-- Paket M #1027: «Früher um diese Zeit», the Chronik-Karte as a section -->
        <ChronikKarte trips={data.trips} debriefs={data.debriefs} rides={data.rides} {today} frame="section" />
        <section class="rv-sec" aria-labelledby="hmore-h">
          <div class="rv-h"><div><h2 id="hmore-h">{t('More')}</h2></div></div>
          {#if storyReady(today)}<p class="rv-note" data-story-ready><Sparkles size={16} aria-hidden="true" /><a href="#/jahr">{t('Your year as pictures is ready')}</a></p>{/if}
          <ul class="rv-box">
            <!-- Paket M «Aus Touren lernen»: Neuland, Chronik, Was die App gelernt hat, Jahr als Bildgeschichte, Quiz -->
            <li><a class="rv-row" href="#/neuland" data-m-row="neuland"><span class="rv-ic" aria-hidden="true"><Compass size={18} /></span><span class="rv-m"><span class="rv-t">{t('New ground')}</span><span class="rv-s">{t('Cantons, passes, huts and more you reached for the first time')}</span></span><ChevronRight class="rv-chev" size={18} aria-hidden="true" /></a></li>
            <li><a class="rv-row" href="#/chronik" data-m-row="chronik"><span class="rv-ic" aria-hidden="true"><History size={18} /></span><span class="rv-m"><span class="rv-t">{t('Chronicle')}</span><span class="rv-s">{t('Everything on one time line, month by month')}</span></span><ChevronRight class="rv-chev" size={18} aria-hidden="true" /></a></li>
            <li><a class="rv-row" href="#/gelernt" data-m-row="gelernt"><span class="rv-ic" aria-hidden="true"><GraduationCap size={18} /></span><span class="rv-m"><span class="rv-t">{t('What the app learned')}</span><span class="rv-s">{t('Month card and year letter')}</span></span><ChevronRight class="rv-chev" size={18} aria-hidden="true" /></a></li>
            <li><a class="rv-row" href="#/jahr" data-m-row="jahr"><span class="rv-ic" aria-hidden="true"><Images size={18} /></span><span class="rv-m"><span class="rv-t">{t('Your year as pictures')}</span><span class="rv-s">{t('Your trips of a year as a picture story')}</span></span><ChevronRight class="rv-chev" size={18} aria-hidden="true" /></a></li>
            <li><a class="rv-row" href="#/quiz" data-m-row="quiz"><span class="rv-ic" aria-hidden="true"><CircleHelp size={18} /></span><span class="rv-m"><span class="rv-t">{t('Quiz the evening before')}</span><span class="rv-s">{t('3 questions on gear and route, your own ones too')}</span></span><ChevronRight class="rv-chev" size={18} aria-hidden="true" /></a></li>
            <li><a class="rv-row" href="#/debrief/logbook" aria-label={t('Logbook')}><span class="rv-ic" aria-hidden="true"><BookOpen size={18} /></span><span class="rv-m"><span class="rv-t">{t('Logbook')}</span><span class="rv-s">{log.length ? logbookLine(log.filter((x) => x.kind !== 'event').length, log.filter((x) => x.kind === 'event').length) : t('No entries yet.')}</span></span><span class="rv-v">{num(log.length)}</span><ChevronRight class="rv-chev" size={18} aria-hidden="true" /></a></li>
            <li><a class="rv-row" href="#/pack/past"><span class="rv-ic" aria-hidden="true"><Archive size={18} /></span><span class="rv-m"><span class="rv-t">{t('Past trips')}</span><span class="rv-s">{t('Table, filter, year')}</span></span><ChevronRight class="rv-chev" size={18} aria-hidden="true" /></a></li>
            <li><a class="rv-row" href="#/debrief/ride"><span class="rv-ic" aria-hidden="true"><Upload size={18} /></span><span class="rv-m"><span class="rv-t">{t('Upload ride')}</span><span class="rv-s">{t('Strava, Garmin or GPX')}</span></span><ChevronRight class="rv-chev" size={18} aria-hidden="true" /></a></li>
          </ul>
        </section>
      </div>
    </div>
  {/if}
</div>


<!-- 0.159.1: the bodies of the sections that fold on a phone -->
{#snippet cmpBody()}
          <div class="rv-box pad">
            {#if cmp.rows.length < 2}
              <p class="muted">{t('Two trips are needed to compare.')}</p>
            {:else}
              <table class="st">
                <thead><tr><th scope="col">{t('Trip')}</th><th scope="col" class="ph-hide">{t('State|trip')}</th><th scope="col" class="n">km</th><th scope="col" class="ph-hide">{t('Weather')}</th><th scope="col" class="n ph-hide">{t('Temp.')}</th></tr></thead>
                <tbody>
                  {#each cmp.rows as r (r.id)}
                    <tr data-state={states[r.id]?.state}>
                      <th scope="row"><a href={r.href} onclick={() => r.trip && openTrip(r.trip.id)}><span class="tn">{r.title}</span><small>{dates(r.start, r.end)}</small></a><span class="ph-only"><TripState state={states[r.id]?.state} extra={extraOf(r.id)} /></span></th>
                      <td class="ph-hide"><TripState state={states[r.id]?.state} extra={extraOf(r.id)} /></td>
                      <td class="n num">{n0(r.km)}</td>
                      <td class="ph-hide">{rainText(r.rain, r.days)}</td>
                      <td class="n num ph-hide">{temps(r.tmin, r.tmax)}</td>
                    </tr>
                  {/each}
                </tbody>
              </table>
              <div class="cfoot">
                <Seg full={false} label={t('Compare with')} value={base} options={BASES} onchange={setBase} />
                <a class="rv-more" href="#/pack/past">{t('As a table')}<ChevronRight size={16} aria-hidden="true" /></a>
              </div>
              <button type="button" class="fold-btn" aria-expanded={allColumns} aria-controls="cmp-all" onclick={() => (allColumns = !allColumns)}>{t('Charts and all columns')}<ChevronRight size={15} aria-hidden="true" /></button>
              {#if allColumns}
                <div id="cmp-all">
                  {#if sentence}<p class="lead">{sentence}</p>{/if}
                  <p class="lead muted">{base === 'same' && cmp.latest ? t('Bars = the last {n} trips of the kind «{art}», the newest orange, dashed = average.', { n: cmp.rows.length, art: t(ARTNAME[cmp.latest.art]) }) : t('Bars = the last {n} trips, the newest orange, dashed = average.', { n: cmp.rows.length })}</p>
                  <ul class="minis">
                    {#each cmp.metrics as m (m.key)}
                      <li class="mini">
                        <span class="ml">{t(CMP[m.key])}</span>
                        <span class="mv"><b class="num">{cmpValue(m.key, m.latest)}</b>{#if CMPUNIT[m.key] && m.latest != null}{' '}<span class="u">{CMPUNIT[m.key]}</span>{/if}</span>
                        <MiniBars values={m.values} mark={cmp.latest?.id} avg={m.avg} label={t(CMP[m.key])} />
                        <span class="mf num">{cmpFoot(m)}</span>
                      </li>
                    {/each}
                  </ul>
                  <div class="tscroll" role="region" aria-label={t('Trips compared')} tabindex="0">
                    <table class="tt">
                      <thead>
                        <tr><th scope="col" class="first">{t('Trip')}</th><th scope="col" class="n">km</th><th scope="col" class="n">Hm</th><th scope="col" class="n">{t('Time')}</th><th scope="col" class="n">km/h</th><th scope="col" class="n">{t('Base')}</th><th scope="col">{t('Rain|weather')}</th><th scope="col" class="n">{t('Temp.')}</th><th scope="col" class="n">{t('Learn.')}</th></tr>
                      </thead>
                      <tbody>
                        {#each cmp.rows as r (r.id)}
                          {@const me = r.id === cmp.latest?.id}
                          <tr class:me>
                            <th scope="row" class="first"><a href={r.href} onclick={() => r.trip && openTrip(r.trip.id)}><span class="tn">{r.title}</span><small>{dates(r.start, r.end)}</small></a></th>
                            <td class="n num">{n0(r.km)}<i class="sc" style:width="{pct(r.km, scale.km)}%"></i></td>
                            <td class="n num">{n0(r.gainM)}<i class="sc" style:width="{pct(r.gainM, scale.gainM)}%"></i></td>
                            <td class="n num">{hours(r.movingH)}<i class="sc" style:width="{pct(r.movingH, scale.movingH)}%"></i></td>
                            <td class="n num">{n1(r.kmh)}<i class="sc" style:width="{pct(r.kmh, scale.kmh)}%"></i></td>
                            <td class="n num">{r.baseG ? n1(r.baseG / 1000) : DASH}{#if r.baseG}<i class="sc" style:width="{pct(r.baseG, scale.baseG)}%"></i>{/if}</td>
                            <td class="wx">{@render rainIcon(r.rain)}<span class="sr">{rainText(r.rain, r.days)}</span></td>
                            <td class="n num">{temps(r.tmin, r.tmax)}</td>
                            <td class="n num">{r.trip ? num(r.learnings.length) : DASH}</td>
                          </tr>
                        {/each}
                      </tbody>
                    </table>
                  </div>
                </div>
              {/if}
            {/if}
          </div>
{/snippet}

{#snippet lastBody()}
            <div class="rv-box pad lastride">
              <button type="button" class="fold-btn top" aria-expanded={lastOpen} aria-controls="last-all" onclick={() => (lastOpen = !lastOpen)}>{t('Numbers of the last ride')}<ChevronRight size={15} aria-hidden="true" /></button>
              {#if lastOpen}
                <div id="last-all">
                  <dl class="rv-tiles big">
                    <div class="rv-tile"><dd><b>{n0(last.km)} km</b></dd><dt><small>{t('Distance')}</small></dt></div>
                    <div class="rv-tile"><dd><b>{n0(last.gainM)} Hm</b></dd><dt><small>{t('Climbing|hm')}</small></dt></div>
                    <div class="rv-tile"><dd><b>{hours(last.movingH)} h</b></dd><dt><small>{last.totalH && last.movingH && last.totalH > last.movingH ? t('moving · {h} total', { h: hours(last.totalH) }) : t('moving')}</small></dt></div>
                    <div class="rv-tile"><dd><b>{n1(last.kmh)} km/h</b></dd><dt><small>{t('average while moving')}</small></dt></div>
                  </dl>
                  <ul class="facts">
                    <li>{@render rainIcon(last.rain)}{rainText(last.rain, last.days)}</li>
                    <li><Thermometer size={16} aria-hidden="true" />{temps(last.tmin, last.tmax)}</li>
                    <li><Bike size={16} aria-hidden="true" />{last.bike ?? DASH}</li>
                    {#if last.pauses}<li><Clock size={16} aria-hidden="true" />{tn(last.pauses.n, '{n} stop', '{n} stops')} · {num(last.pauses.min)} min</li>{/if}
                    {#if highest(last.profile)}<li><Mountain size={16} aria-hidden="true" />{t('GPX · {m} m highest point', { m: num(highest(last.profile)) })}</li>{/if}
                  </ul>
                  <!-- v0.151.0 HP1 (F13, Noah «1a»): the profile of the ridden GPX, the planned route dashed over it -->
                  {#if last.rideProfile}<div class="lprof"><Profile points={last.rideProfile} plan={last.planProfile} label="Elevation of the ride" /></div>{/if}
                  {#if lastPlan}
                    {@const mins = Math.round(lastPlan.diff * 60)}
                    <p class="plan"><Gauge size={16} aria-hidden="true" /><span>{t('Planned {plan} h, ridden {real} h:', { plan: hours(lastPlan.plan), real: hours(lastPlan.real) })} <b>{mins < 0 ? t('{n} min faster', { n: -mins }) : mins > 0 ? t('{n} min slower', { n: mins }) : t('right on time')}</b>.</span></p>
                  {/if}
                  {#if last.learnings.length || last.special}
                    <ul class="learned">
                      {#each last.learnings.slice(0, 2) as l (l.id)}<li><Lightbulb size={16} aria-hidden="true" />{l.rule}</li>{/each}
                      {#if last.special}<li class="sp"><Sparkles size={16} aria-hidden="true" />{last.special}</li>{/if}
                    </ul>
                  {/if}
                  {#if lastHeart}
                    <p class="heart"><HeartLine heart={lastHeart} size={16} label={t('Heart rate')} /> <span class="pill">{t('from Strava · observation')}</span></p>
                  {:else}
                    <p class="later">{t('Heart rate, zones and watts come with Strava, as an observation without a score.')} <span class="pill">{t('later · S1')}</span></p>
                  {/if}
                  <div class="acts">
                    <Btn href={last.href} onclick={() => last.trip && openTrip(last.trip.id)} label={last.kind === 'ride' ? t('Open the ride') : last.debrief === 'open' || last.debrief === 'draft' ? writeLabel(last) : t('Open its debrief')} />
                  </div>
                </div>
              {/if}
            </div>
{/snippet}

{#snippet paceBody()}
          <ul class="rv-box">
            <li><a class="rv-row" href="#/debrief/pace" aria-label={t('Your pace')}><span class="rv-ic" aria-hidden="true"><Gauge size={18} /></span><span class="rv-m"><span class="rv-t">{t('{kmh} km/h · 1 h per {m} Hm', { kmh: num(rule && pace.mine ? rule.kmh : pace.kmh), m: num(rule && pace.mine ? rule.climbMh : pace.climbMh) })}</span><span class="rv-s">{pace.mine ? tn(pace.n, 'The riding time uses your rule (from {n} ride).', 'The riding time uses your rule (from {n} rides).') : pace.need ? tn(pace.need, '{n} more ride, then your own pace counts', '{n} more rides, then your own pace counts') : t('The riding time uses the standard rule, as you chose.')}</span></span><ChevronRight class="rv-chev" size={18} aria-hidden="true" /></a></li>
          </ul>
{/snippet}

{#snippet learnBody()}
          <ul class="rv-box">
            {#each newest as l (l.id)}<li class="rv-row"><span class="rv-ic" aria-hidden="true"><Lightbulb size={18} /></span><span class="rv-m"><span class="rv-t">{l.rule}</span>{#if l.source}<span class="rv-s">{l.source === 'import' ? t('From the import') : l.source}</span>{/if}</span></li>
            {:else}<li class="rv-row muted">{openList.length ? t('Nothing learned yet. It comes from every debrief, «Write the debrief» above is the next one.') : t('No learnings yet. They come from every debrief.')}</li>{/each}
          </ul>
{/snippet}

<style>
  /* 0.159.1: inside a closed-line group (phone) the section's own box gives way to the group's */
  .rv-lay :global(.ls-g) {
    margin: 0 0 12px;
  }
  .rv-lay :global(.ls-gb > .rv-box) {
    border: 0;
    box-shadow: none;
    background: none;
  }
  .lg-all {
    margin: 4px 16px 12px;
  }
  .crumb {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: var(--fs-small);
    color: var(--ink-3);
  }
  .crumb a {
    display: inline-flex;
    align-items: center;
    min-height: 44px;
    color: var(--ink-3);
    text-decoration: none;
  }
  .crumb a:hover {
    color: var(--ink);
    text-decoration: underline;
  }
  .crumb [aria-current] {
    color: var(--ink);
  }
  .head {
    display: flex;
    flex-wrap: wrap;
    align-items: flex-end;
    justify-content: space-between;
    gap: 8px 16px;
    margin-bottom: 16px;
  }
  .head .page-sub {
    margin-bottom: 0;
  }
  .hacts {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px 16px;
  }
  .muted {
    color: var(--ink-3);
  }
  /* 1. the last ride */
  .u {
    margin-left: 2px;
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .facts {
    display: flex;
    flex-wrap: wrap;
    gap: 4px 16px;
    margin: 12px 0 0;
    padding: 0;
    list-style: none;
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .facts li {
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }
  .facts :global(svg) {
    color: var(--ink-3);
  }
  .plan {
    display: flex;
    gap: 8px;
    align-items: flex-start;
    margin: 14px 0 0;
    padding: 10px 12px;
    border-radius: var(--radius);
    background: var(--paper-2);
    font-size: var(--fs-small);
  }
  .plan :global(svg) {
    flex: none;
    margin-top: 2px;
    color: var(--accent);
  }
  .learned {
    margin: 12px 0 0;
    padding: 0;
    list-style: none;
    display: grid;
    gap: 6px;
  }
  .learned li {
    display: flex;
    gap: 8px;
    align-items: flex-start;
  }
  .learned :global(svg) {
    flex: none;
    margin-top: 3px;
    color: var(--warn);
  }
  .learned .sp :global(svg) {
    color: var(--l4);
  }
  .heart {
    margin: 12px 0 0;
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;
    font-size: var(--fs-small);
  }
  .later {
    margin: 12px 0 0;
    padding: 8px 12px;
    border: 1px dashed var(--line);
    border-radius: var(--radius);
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .acts {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px 20px;
    margin-top: 16px;
  }
  /* 2. the period */
  .cols {
    display: flex;
    align-items: stretch;
    gap: 4px;
    height: 118px;
    border-top: 1px dashed var(--line);
  }
  .col {
    flex: 1 1 0;
    min-width: 0;
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
    align-items: stretch;
    gap: 4px;
  }
  .col i {
    display: block;
    border-radius: 3px 3px 0 0;
    background: var(--hi);
    opacity: 0.78;
    max-height: 96px;
  }
  .col i.now {
    opacity: 1;
  }
  .col small {
    text-align: center;
    color: var(--ink-3);
    font-size: var(--fs-small);
    line-height: 18px;
  }
  .kz {
    width: 100%;
    border-collapse: collapse;
    font-size: var(--fs-small);
  }
  .kz thead th {
    padding: 6px 8px 6px 0;
    color: var(--ink-3);
    font-weight: 500;
    text-align: left;
    white-space: nowrap;
    border-bottom: 1px solid var(--line);
  }
  .kz .n {
    text-align: right;
  }
  .kz tbody th,
  .kz td {
    padding: 10px 8px 10px 0;
    border-bottom: 1px solid var(--line);
    text-align: left;
    font-weight: 400;
    vertical-align: baseline;
  }
  .kz tbody tr:last-child > * {
    border-bottom: 0;
  }
  .kz tbody th {
    font-weight: 500;
    color: var(--ink);
  }
  .kz .v {
    white-space: nowrap;
    text-align: right;
  }
  .kz .v b {
    font-family: var(--font-brand);
    font-weight: 800;
    font-size: var(--fs-sub);
  }
  .kz .d {
    color: var(--ink-3);
    white-space: nowrap;
  }
  .kz .d.up {
    color: var(--ok);
  }
  .kz .a,
  .kz .b {
    color: var(--ink-2);
  }
  /* phone: one row per number, the average and the best below it */
  @media (max-width: 719px) {
    .kz thead {
      display: none;
    }
    .kz tr {
      display: grid;
      grid-template-columns: minmax(0, 1fr) auto;
      column-gap: 12px;
      padding: 8px 0;
      border-bottom: 1px solid var(--line);
    }
    .kz tbody tr:last-child {
      border-bottom: 0;
    }
    .kz tbody th,
    .kz td {
      padding: 0;
      border: 0;
    }
    .kz tbody th {
      grid-column: 1;
      grid-row: 1;
    }
    .kz .v {
      grid-column: 2;
      grid-row: 1;
    }
    .kz .d {
      grid-column: 2;
      grid-row: 2;
      text-align: right;
    }
    .kz .a {
      grid-column: 1;
      grid-row: 2;
      color: var(--ink-3);
    }
    .kz .b {
      grid-column: 1 / -1;
      grid-row: 3;
      color: var(--ink-3);
    }
  }
  /* 3. trips compared */
  .lead {
    margin: 10px 0 12px;
    font-size: var(--fs-small);
  }
  .minis {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
    gap: 8px;
    margin: 0 0 12px;
    padding: 0;
    list-style: none;
  }
  .mini {
    display: grid;
    gap: 2px;
    padding: 10px 10px 8px;
    border-radius: var(--radius);
    background: var(--paper-2);
    min-width: 0;
  }
  .ml,
  .mf {
    color: var(--ink-3);
    font-size: var(--fs-small);
    overflow-wrap: break-word;
  }
  .mv b {
    font-family: var(--font-brand);
    font-weight: 800;
    font-size: var(--fs-section);
  }
  .tscroll {
    position: relative;
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
  }
  .tt {
    width: 100%;
    border-collapse: collapse;
    font-size: var(--fs-small);
  }
  .tt thead th {
    padding: 6px 10px;
    color: var(--ink-3);
    font-weight: 500;
    text-align: left;
    white-space: nowrap;
    border-bottom: 1px solid var(--line);
  }
  .tt .n {
    text-align: right;
  }
  .tt tbody th,
  .tt td {
    position: relative;
    padding: 4px 10px 10px;
    border-bottom: 1px solid var(--line);
    white-space: nowrap;
    font-weight: 400;
    text-align: left;
  }
  .tt td.n {
    text-align: right;
  }
  .tt tbody tr:last-child > * {
    border-bottom: 0;
  }
  .tt .first {
    position: sticky;
    left: 0;
    z-index: 1;
    background: var(--paper);
    min-width: 150px;
    max-width: 240px;
    white-space: normal;
  }
  .tt tbody th a {
    display: flex;
    flex-direction: column;
    justify-content: center;
    min-height: 44px;
    color: var(--ink);
    text-decoration: none;
  }
  .tt tbody th a .tn {
    font-weight: 500;
    overflow-wrap: break-word;
  }
  .tt tbody th a:hover .tn {
    text-decoration: underline;
  }
  .tt tbody th small {
    display: block;
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .tt .sc {
    position: absolute;
    right: 10px;
    bottom: 4px;
    height: 2px;
    max-width: calc(100% - 20px);
    border-radius: 1px;
    background: var(--line);
  }
  .tt tr.me .sc {
    background: var(--hi);
  }
  .tt tr.me th a .tn {
    font-weight: 600;
  }
  .tt .wx :global(svg) {
    color: var(--ink-3);
  }
  /* 4. one level below */

  /* v0.109.0 Design-Refresh P6 (T17) */
  /* SN2: the head's state pills, the trip whose debrief is missing, the folds */
  .pills {
    display: flex;
    flex-wrap: wrap;
    gap: var(--sp-2);
    margin: 6px 0 4px;
  }
  .undo {
    margin: 0 0 var(--sp-3);
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .ulink {
    min-height: 44px;
    padding: 0 4px;
    border: 0;
    background: none;
    color: var(--ink);
    font: 600 var(--fs-small) var(--font-body);
    text-decoration: underline;
    cursor: pointer;
  }
  .hero {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 12px 16px;
    margin: 0 0 22px;
    padding: 18px 20px;
  }
  .hic {
    display: grid;
    flex: none;
    place-items: center;
    width: 44px;
    height: 44px;
    border-radius: var(--r-ctl);
    background: var(--st-done-soft);
    color: var(--st-done);
  }
  .hm {
    display: grid;
    justify-items: start;
    gap: 4px;
    flex: 1 1 240px;
    min-width: 0;
  }
  .hname {
    font: 600 var(--fs-sub) / 1.25 var(--font-body);
    overflow-wrap: break-word;
  }
  .hm small {
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  /* Impeccable Runde 2: three actions on a phone: the main button full width on top, the two quiet ones below */
  @media (max-width: 719px) {
    .hero .rowacts {
      flex-wrap: wrap;
    }
    .hero .rowacts > :global(.btn.hi) {
      order: -1;
      flex: 1 1 100%;
    }
  }
  .more-open .rv-m {
    flex: 1 1 220px;
    min-width: 0;
  }
  .more-open {
    flex: 1 1 100%;
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .more-open li {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px 12px;
    padding: 10px 0 0;
    margin-top: 10px;
    border-top: 1px solid var(--line);
  }
  .ptiles {
    padding: 0;
  }
  .ptiles .rv-tiles {
    margin: 0;
    list-style: none;
  }
  .pin {
    padding: 0 16px 10px;
  }
  .pin .cols {
    margin-bottom: 4px;
    border-top: 0;
  }
  .fold-btn {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    min-height: 44px;
    padding: 0;
    border: 0;
    background: none;
    color: var(--ink);
    font: 500 var(--fs-small) var(--font-body);
    cursor: pointer;
  }
  .fold-btn:hover {
    text-decoration: underline;
    text-underline-offset: 3px;
  }
  .fold-btn :global(svg) {
    transition: transform 0.15s;
  }
  .fold-btn[aria-expanded='true'] :global(svg) {
    transform: rotate(90deg);
  }
  .fold-btn.top {
    margin-top: -6px;
  }
  .st {
    width: 100%;
    border-collapse: collapse;
    font-size: var(--fs-small);
  }
  .st thead th {
    padding: 4px 10px 8px 0;
    color: var(--ink-3);
    font-weight: 500;
    text-align: left;
    border-bottom: 1px solid var(--line);
  }
  .st .n {
    text-align: right;
  }
  .st tbody th,
  .st td {
    padding: 8px 10px 8px 0;
    border-bottom: 1px solid var(--line);
    font-weight: 400;
    text-align: left;
    vertical-align: middle;
  }
  .st td.n {
    text-align: right;
    white-space: nowrap;
  }
  .st th:last-child,
  .st td:last-child {
    padding-right: 0;
  }
  .st tbody tr:last-child > * {
    border-bottom: 0;
  }
  .st tbody th a {
    display: flex;
    flex-direction: column;
    justify-content: center;
    min-height: 44px;
    color: var(--ink);
    text-decoration: none;
  }
  .st tbody th a .tn {
    font-size: var(--fs-body);
    font-weight: 500;
    overflow-wrap: break-word;
  }
  .st tbody th a:hover .tn {
    text-decoration: underline;
  }
  .st tbody th small {
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .ph-only {
    display: none;
  }
  @media (max-width: 719px) {
    .ph-hide {
      display: none;
    }
    .ph-only {
      display: block;
      margin: 2px 0 4px;
    }
    /* the name column takes the room, a long pill gives way with «…» instead of widening the page */
    .st {
      table-layout: fixed;
    }
    .st th.n,
    .st td.n {
      width: 4.5em;
    }
  }
  .cfoot {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 8px 16px;
    margin-top: 12px;
  }
  .lastride .big {
    margin: 10px -16px 0;
  }
  .lastride .big div {
    display: flex;
    flex-direction: column;
  }
  .lastride .big dd,
  .lastride .big dt {
    margin: 0;
  }
  .rv-row.muted {
    color: var(--ink-3);
  }
  .rv-h :global(.seg) {
    flex: none;
  }
  /* v0.151.0 HP1 */
  .lprof {
    margin: 4px 0 14px;
  }
</style>
