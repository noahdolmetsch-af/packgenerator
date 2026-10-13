<script>
  /**
   * «Dein Tempo» (v0.19.0 «App lernt»; v0.61.0 R2, Noah ★a): your rule in ONE sentence on top, from
   * your recorded rides (GPX here, or uploaded rides that count for your pace). From PACE_MIN rides it
   * replaces the standard guess (16 km/h, 1 h per 600 m) everywhere the riding time is guessed, as a
   * visible suggestion with one tap back («Zurück zur Standardregel», settings 'pace'.standard).
   * Below 5 rides it says how many are missing. Then a few calm small charts (MiniBars of R1): speed
   * per ride over time, speed from flat to hilly, climbing per km. Then the rides, each can be left out.
   * SN2 «Seiten neu» (mockup approved 13.10.2026): one line under the title, the rule as a big short
   * line, five marks up to your own rule and the one main button «Fahrt hochladen» (the GPX picker);
   * right «Woher die Fahrten kommen» with the GPX file and your rides.
   * SN2+ SN2h/SN2i (mockups approved 13.10.2026, answers 3, 4b, 5b): «Pro Velo und Untergrund» (from 5 rides
   * the bike's own pace on that surface is used for the riding time), «Geplant und gefahren» per trip, the
   * months since the first ride (km/h, Ø heart rate, power, zones) and «Deine Pulszonen». Every ride shows
   * its bike and its surface, which can be changed per ride.
   */
  import { liveQuery } from 'dexie';
  import { t, tn, num } from '../i18n.svelte.js';
  import { db } from '../db.js';
  import { SPEED_KMH, CLIMB_MH } from '../route.js';
  import { PACE_KEY, PACE_MIN, rideTiming, learnPace, guessFor, paceOf, ruleOf, withStandard, paceSeries } from '../pace.js';
  import { reviewWindow } from '../yearreview.js';
  import { localDay } from '../localday.js';
  import { n1, dayLong } from '../review/fmt.js';
  import Seg from '../ui/Seg.svelte';
  import MiniBars from '../review/MiniBars.svelte';
  import { Gauge, Upload, FileUp, ChevronRight, Undo2, Check, TriangleAlert } from '@lucide/svelte';
  import '../review/review.css';
  import { loadWerte, saveZones } from '../review/actdata.js';
  import { loadReview } from '../review/load.js';
  import { tripFacts } from '../review/rueckblick.js';
  import { homeTrips } from '../home/heute.js';
  import { plannedRidden, monthly, withUploads, usualSurface, surfaceName, surfaceOf, SURFACES } from '../review/werte.js';
  import { updateEntry } from '../kmbookdb.js';
  import PaceGrid from './PaceGrid.svelte';
  import PlannedRidden from './PlannedRidden.svelte';
  import PaceMonths from './PaceMonths.svelte';
  import HeartZones from './HeartZones.svelte';
  import { Bike } from '@lucide/svelte';

  const paceQ = liveQuery(() => db.settings.get(PACE_KEY));
  const saved = $derived($paceQ?.value ?? null);
  // liveQuery gives undefined while it reads and when the setting is not there: wait a moment for both
  let ready = $state(false);
  $effect(() => {
    const id = setTimeout(() => (ready = true), 300);
    return () => clearTimeout(id);
  });
  const loaded = $derived(ready || !!$paceQ);
  const rides = $derived([...(saved?.rides ?? [])].sort((a, b) => b.date.localeCompare(a.date)));
  const pace = $derived(paceOf(saved));
  const rule = $derived(ruleOf(pace.learned));
  const std = { kmh: SPEED_KMH, climbMh: CLIMB_MH };

  let msg = $state('');
  let busy = $state(false);

  /* ---- SN2+ SN2h/SN2i: bikes, surfaces, planned and ridden, the months ---- */
  const werteQ = liveQuery(async () => ({ ...(await loadWerte(db)), review: await loadReview(db) }));
  const W = $derived($werteQ ?? null);
  const facts = $derived(W ? tripFacts({ ...W.review, trips: homeTrips(W.review.trips), today: localDay() }) : []);
  const pr = $derived(plannedRidden(facts));
  const months = $derived(W ? monthly({ rides: withUploads(W.rides, W.review.rides), entries: W.entries, bounds: W.zones?.bounds ?? null, today: localDay() }) : []);
  const bikeById = $derived(Object.fromEntries((W?.bikes ?? []).map((b) => [b.id, b])));
  const prSurface = (r) => {
    const s = bikeById[r.bikeId] ? usualSurface(bikeById[r.bikeId], W?.rides ?? []) : null;
    return s ? t(surfaceName(s)) : '';
  };
  const tempoOf = (paceId) => W?.rides.find((x) => x.paceId === paceId) ?? null;
  // the surface of one ride: on its ledger entry when it has one (Strava), else on the ride of «Dein Tempo»
  async function setSurface(r, value) {
    const x = tempoOf(r.id);
    if (x?.entryId) await updateEntry(db, x.entryId, { surface: value || null });
    else await store(saved.rides.map((y) => (y.id === r.id ? { ...y, surface: value || null } : y)));
  }

  async function store(list) {
    const learned = learnPace(list);
    await db.settings.put({ key: PACE_KEY, value: { ...(learned ?? { kmh: null, climbMh: null }), rides: list, ...(saved?.standard ? { standard: true } : {}), updatedAt: new Date().toISOString() } });
  }
  const setStandard = (on) => db.settings.put({ key: PACE_KEY, value: withStandard($state.snapshot(saved), on) });

  async function pick(event) {
    const files = [...event.currentTarget.files];
    event.currentTarget.value = '';
    if (!files.length) return;
    busy = true;
    msg = '';
    try {
      const list = [...(saved?.rides ?? [])];
      let added = 0;
      const skipped = [];
      for (const f of files) {
        const r = rideTiming(await f.text(), f.name);
        if (!r) skipped.push(f.name);
        else if (!list.some((x) => x.id === r.id)) list.push({ ...r, use: true }), added++;
      }
      await store(list);
      msg = tn(added, '{n} ride added.', '{n} rides added.') + (skipped.length ? ` ${t('Without times (planned routes?): {files}.', { files: skipped.join(', ') })}` : '');
    } catch (e) {
      msg = t('Could not read the file: {error}', { error: e.message });
    } finally {
      busy = false;
    }
  }

  const toggle = (id) => store(saved.rides.map((r) => (r.id === id ? { ...r, use: r.use === false } : r)));
  const drop = (id) => store(saved.rides.filter((r) => r.id !== id));
  const hm = (h) => `${Math.floor(h)}:${String(Math.round((h % 1) * 60)).padStart(2, '0')}`;

  /* ---- the small charts: the last 12 months (Noah ★a) or all rides ---- */
  const KEEP = 'pace.period';
  let period = $state(
    (() => {
      try {
        return localStorage.getItem(KEEP) || '12m';
      } catch {
        return '12m';
      }
    })(),
  );
  const setPeriod = (v) => {
    period = v;
    try {
      localStorage.setItem(KEEP, v);
    } catch {
      /* private mode: for this visit */
    }
  };
  const PERIODS = $derived([
    { key: '12m', name: t('12 months') },
    { key: 'all', name: t('All|period') },
  ]);
  const series = $derived(paceSeries(saved?.rides ?? [], period === '12m' ? reviewWindow(localDay()).from : null));
  const avg = (xs) => (xs.length ? xs.reduce((s, v) => s + v, 0) / xs.length : null);
  const newest = $derived(series.at(-1)?.id ?? null);
  // the plain average speed of all rides that count (km over moving hours), beside the rule
  const overall = $derived.by(() => {
    const all = paceSeries(saved?.rides ?? []);
    const rs = (saved?.rides ?? []).filter((r) => all.some((x) => x.id === r.id));
    const h = rs.reduce((s, r) => s + r.movingH, 0);
    return h ? rs.reduce((s, r) => s + r.km, 0) / h : null;
  });
  const charts = $derived.by(() => {
    if (series.length < 2) return [];
    const speeds = series.map((r) => r.kmh);
    const climbs = series.map((r) => r.hmPerKm);
    const hilly = [...series].sort((a, b) => a.hmPerKm - b.hmPerKm);
    const half = Math.floor(hilly.length / 2);
    const flat = avg(hilly.slice(0, half).map((r) => r.kmh));
    const steep = avg(hilly.slice(hilly.length - half).map((r) => r.kmh));
    return [
      { key: 'time', name: t('Speed per ride'), value: n1(series.at(-1).kmh), unit: 'km/h', values: series.map((r) => ({ id: r.id, v: r.kmh })), avg: avg(speeds), foot: t('Ø {a} · fastest {b}', { a: n1(avg(speeds)), b: n1(Math.max(...speeds)) }) },
      { key: 'climb', name: t('Speed, flat to hilly'), value: null, values: hilly.map((r) => ({ id: r.id, v: r.kmh })), avg: null, foot: t('flat {a} · hilly {b} km/h', { a: n1(flat), b: n1(steep) }) },
      { key: 'hm', name: t('Climbing per km'), value: num(Math.round(series.at(-1).hmPerKm)), unit: 'Hm', values: series.map((r) => ({ id: r.id, v: r.hmPerKm })), avg: avg(climbs), foot: t('Ø {a} Hm per km', { a: num(Math.round(avg(climbs))) }) },
    ];
  });
</script>

<!-- v0.109.0 Design-Refresh P6 (T19 «Dein Tempo», approved 12.10.2026): two columns on a computer. Left the
     rule as a white card, what the riding time uses now, then the small charts; right the rides.
     SN2: the line under the title, the rule short and big, five marks, «Fahrt hochladen» as the main button. -->
{#snippet picker(cls, children)}
  <label class={cls}>{@render children()}<input type="file" accept=".gpx,application/gpx+xml" multiple onchange={pick} hidden disabled={busy} /></label>
{/snippet}
<p class="page-sub psub">{t('How the app guesses the riding time of a new trip')}</p>
<div class="tempo rv-lay">
  <div class="rv-col">
    <!-- 1. the rule, what the riding time uses now, the marks up to your own rule -->
    <section class="rule" id="pace" aria-labelledby="rule-h">
      <div class="rv-box pad rcard">
        <p class="kick"><Gauge size={14} aria-hidden="true" />{pace.mine ? tn(pace.n, 'Your rule · from {n} ride', 'Your rule · from {n} rides') : pace.standard && !pace.need ? t('Standard rule · chosen by you') : t('Standard rule')}</p>
        <h2 id="rule-h" class="sentence">{t('{kmh} km/h and 1 h per {m} Hm', { kmh: num(rule ? rule.kmh : std.kmh), m: num(rule ? rule.climbMh : std.climbMh) })}</h2>
        {#if rule && !pace.mine}<p class="flat">{t('Your rule so far; the riding time still uses {kmh} km/h and 1 h per {m} m.', { kmh: num(std.kmh), m: num(std.climbMh) })}</p>{/if}
        {#if rule && overall != null}<p class="flat">{t('The climbing gets its own time: with the climbing your rides average {avg} km/h.', { avg: n1(overall) })}</p>{/if}
        {#if loaded}
          <div class="state" role="status">
            {#if pace.mine}
              <p><Check size={16} aria-hidden="true" /><span>{t('Pack and On the way guess the riding time with your rule now, instead of {kmh} km/h and 1 h per {m} m.', { kmh: num(std.kmh), m: num(std.climbMh) })}{#if pace.stops && pace.stops > 1.02}{' '}{t('Your usual stops add about {pct} %.', { pct: Math.round((pace.stops - 1) * 100) })}{/if}</span></p>
              <button type="button" class="quiet" onclick={() => setStandard(true)}><Undo2 size={18} aria-hidden="true" />{t('Back to the standard rule')}</button>
            {:else if pace.standard && !pace.need}
              <p><Check size={16} aria-hidden="true" /><span>{t('The riding time is guessed with the standard rule, {kmh} km/h and 1 h per {m} m, as you chose.', { kmh: num(std.kmh), m: num(std.climbMh) })}</span></p>
              <button type="button" class="quiet" onclick={() => setStandard(false)}><Gauge size={18} aria-hidden="true" />{t('Use my rule')}</button>
            {:else}
              <span class="marks" aria-hidden="true">{#each Array.from({ length: PACE_MIN }, (_, i) => i) as i (i)}<i class:on={i < pace.n}></i>{/each}</span>
              <p class="need">{t('{n} of {min} rides. From {min} rides your own pace counts, you can switch back any time.', { n: pace.n, min: PACE_MIN })}</p>
            {/if}
          </div>
        {/if}
        <div class="acts">
          {#snippet upl()}<Upload size={17} aria-hidden="true" /><span class="kl">{busy ? t('Reading …') : t('Upload ride')}</span>{/snippet}
          {@render picker('btn k hi', upl)}
          {#if msg}<p class="msg" role="status">{msg}</p>{/if}
        </div>
      </div>
    </section>

    <!-- SN2+ SN2h: per bike and surface, planned and ridden; SN2i: the months -->
    {#if W}
      <PaceGrid grid={W.grid} rule={pace.kmh} />
      <PlannedRidden rows={pr.rows} avgMin={pr.avgMin} surfaceOf={prSurface} />
      <PaceMonths {months} />
    {/if}

    <!-- 2. a few calm small charts -->
    <section class="rv-sec charts" aria-labelledby="charts-h">
      <div class="rv-h">
        <div>
          <h2 id="charts-h">{t('Over time')}</h2>
          <p class="rv-sub num">{charts.length ? tn(series.length, 'Bars = {n} ride, the newest orange, dashed = average.', 'Bars = {n} rides, the newest orange, dashed = average.') : t('comes from 2 rides')}</p>
        </div>
        {#if charts.length}<Seg full={false} label={t('Period')} value={period} options={PERIODS} onchange={setPeriod} />{/if}
      </div>
      {#if charts.length}
        <ul class="rv-box pad minis">
          {#each charts as c (c.key)}
            <li class="mini">
              <span class="ml">{c.name}</span>
              {#if c.value != null}<span class="mv"><b class="num">{c.value}</b> <span class="u">{c.unit}</span></span>{/if}
              <MiniBars values={c.values} mark={newest} avg={c.avg} label={c.name} />
              <span class="mf num">{c.foot}</span>
            </li>
          {/each}
        </ul>
      {:else}
        <div class="rv-box pad"><p class="none">{rides.length ? t('From 2 rides small charts show your speed over time.') : t('No rides with a time yet. A GPX file brings km, climbing and time.')}</p></div>
      {/if}
    </section>
  </div>

  <!-- 3. where the rides come from, and the rides it learns from -->
  <div class="rv-col rides-c">
    <section class="rv-sec" aria-labelledby="from-h">
      <div class="rv-h"><div><h2 id="from-h">{t('Where the rides come from')}</h2></div></div>
      <ul class="rv-box">
        <li>
          {#snippet gpx()}<span class="rv-ic" aria-hidden="true"><FileUp size={18} /></span><span class="rv-m"><span class="rv-t">{t('GPX file')}</span><span class="rv-s">{t('Garmin Connect or Strava: a ride → Export GPX. Read on this device, nothing is uploaded.')}</span></span><ChevronRight class="rv-chev" size={18} aria-hidden="true" />{/snippet}
          {@render picker('rv-row', gpx)}
        </li>
      </ul>
    </section>
    {#if rides.length}
      <section class="rv-sec" aria-labelledby="rides-h">
        <div class="rv-h"><div><h2 id="rides-h">{t('Your rides')}</h2><p class="rv-sub num">{tn(pace.n, '{n} counts', '{n} count')}</p></div></div>
        <ul class="rv-box rides">
          {#each rides as r (r.id)}
            {@const x = tempoOf(r.id)}
            {@const rb = x?.bikeId ? bikeById[x.bikeId] ?? null : null}
            {@const sf = x ? surfaceOf(x, rb) : null}
            <li class:off={r.use === false} data-ride={r.id}>
              <label class="pick"><input type="checkbox" checked={r.use !== false} onchange={() => toggle(r.id)} /><span class="nm"><span class="rv-t">{r.name}</span><span class="rv-s num">{dayLong(r.date)} · {num(r.km)} km · ↑ {num(r.gainM)} m · {t('riding {time} h', { time: hm(r.movingH) })}{r.totalH > r.movingH + 0.05 ? ` ${t('({time} h with stops)', { time: hm(r.totalH) })}` : ''}{pace.mine ? ` · ${t('guess {time} h', { time: hm(guessFor(r, pace)) })}` : ''}{r.km < 20 ? ` · ${t('under 20 km, does not count')}` : ''}</span></span></label>
              <button type="button" class="rm" onclick={() => drop(r.id)} aria-label={t('Remove {name}', { name: r.name })}>{t('Remove')}</button>
              <!-- SN2+ SN2h: the ride's bike and its surface, changeable per ride -->
              {#if W}
                <span class="tg">
                  {#if rb}<span class="bchip"><Bike size={13} aria-hidden="true" />{rb.name}</span>{/if}
                  <select class="schip" value={sf ?? ''} aria-label={t('Surface of {name}', { name: r.name })} onchange={(ev) => setSurface(r, ev.currentTarget.value)}>
                    {#if !sf}<option value="">{t('Surface?')}</option>{/if}
                    {#each SURFACES as so (so.key)}<option value={so.key}>{t(so.name)}</option>{/each}
                  </select>
                </span>
              {/if}
            </li>
          {/each}
        </ul>
        <p class="rv-note"><TriangleAlert size={16} aria-hidden="true" /><span>{t('Untick a ride that does not fit, e.g. a race without luggage.')}</span></p>
      </section>
    {/if}
    {#if W}<HeartZones zones={W.zones} onsave={(b) => saveZones(db, b)} />{/if}
  </div>
</div>

<style>
  .rcard {
    padding: 16px 18px;
  }
  .kick {
    display: flex;
    align-items: center;
    gap: 6px;
    margin: 0;
    color: var(--ink-3);
    font-size: var(--fs-tiny);
    font-weight: 600;
    letter-spacing: 0.06em;
    text-transform: uppercase;
  }
  .sentence {
    margin: 8px 0 0;
    font: 500 var(--fs-sub) / 1.4 var(--font-body);
    color: var(--ink);
    overflow-wrap: break-word;
  }
  .flat {
    margin: 6px 0 0;
    color: var(--ink-3);
    font-size: var(--fs-small);
    line-height: 1.4;
  }
  .state {
    display: grid;
    gap: 2px;
    justify-items: start;
    margin: 12px 0 0;
  }
  .state p {
    display: flex;
    gap: 10px;
    align-items: flex-start;
    margin: 0;
    color: var(--ink-2);
    font-size: var(--fs-small);
    line-height: 1.45;
  }
  .state p :global(svg) {
    flex: none;
    margin-top: 2px;
    color: var(--ink-2);
  }
  /* SN2: five marks up to your own rule */
  .marks {
    display: flex;
    gap: 6px;
    margin: 4px 0 2px;
  }
  .marks i {
    width: 28px;
    height: 8px;
    border-radius: 4px;
    background: var(--paper-2);
  }
  .marks i.on {
    background: var(--ok);
  }
  .psub {
    margin: -10px 0 16px;
  }
  .none {
    margin: 0;
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .quiet {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    min-height: 44px;
    padding: 0;
    border: 0;
    background: none;
    color: var(--ink);
    font: 500 var(--fs-small) var(--font-body);
    text-decoration: underline;
    text-underline-offset: 3px;
    cursor: pointer;
  }
  .rv-h :global(.seg) {
    flex: none;
  }
  .minis {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(170px, 1fr));
    gap: 10px;
  }
  .mini {
    display: grid;
    gap: 2px;
    align-content: start;
    padding: 10px 10px 8px;
    border-radius: var(--r-ctl);
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
    font: 600 var(--fs-sub) / 1.2 var(--font-body);
  }
  .u {
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .acts {
    display: grid;
    gap: 8px;
    justify-items: start;
    margin-top: 14px;
  }
  .acts .btn {
    min-height: 44px;
  }
  .msg {
    margin: 0;
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .rides {
    padding: 0 16px;
  }
  .rides li {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0 8px;
  }
  /* SN2+ SN2h: the bike and the surface of a ride, small under it */
  .tg {
    flex-basis: 100%;
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 6px;
    padding: 0 0 10px 32px;
  }
  .bchip,
  .schip {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    min-height: 32px;
    padding: 2px 10px;
    border: 1px solid var(--line);
    border-radius: 999px;
    background: var(--paper-2);
    color: var(--ink-2);
    font: 500 var(--fs-small) var(--font-body);
  }
  .schip {
    min-height: 44px;
    border-color: var(--line-strong);
    background: var(--paper);
    color: var(--ink);
    cursor: pointer;
  }
  .pick {
    flex: 1;
    min-width: 0;
    display: flex;
    gap: 12px;
    align-items: center;
    min-height: 60px;
    padding: 8px 0;
    cursor: pointer;
  }
  .pick input {
    flex: none;
    width: 20px;
    height: 20px;
    accent-color: var(--ink);
  }
  .nm {
    min-width: 0;
  }
  .rm {
    flex: none;
    min-height: 44px;
    min-width: 44px;
    padding: 0 4px;
    border: 0;
    background: none;
    color: var(--ink-3);
    font: 500 var(--fs-small) var(--font-body);
    cursor: pointer;
  }
  .rm:hover {
    color: var(--ink);
    text-decoration: underline;
  }
  .rides li.off .rv-t {
    color: var(--ink-3);
    text-decoration: line-through;
  }
</style>
