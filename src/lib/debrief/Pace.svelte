<script>
  /**
   * «Dein Tempo» (v0.19.0 «App lernt»; v0.61.0 R2, Noah ★a): your rule in ONE sentence on top, from
   * your recorded rides (GPX here, or uploaded rides that count for your pace). From PACE_MIN rides it
   * replaces the standard guess (16 km/h, 1 h per 600 m) everywhere the riding time is guessed, as a
   * visible suggestion with one tap back («Zurück zur Standardregel», settings 'pace'.standard).
   * Below 5 rides it says how many are missing. Then a few calm small charts (MiniBars of R1): speed
   * per ride over time, speed from flat to hilly, climbing per km. Then the rides, each can be left out.
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
  import { Gauge, Upload, Undo2, Check } from '@lucide/svelte';

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

<div class="tempo">
  <!-- 1. the rule in one sentence, and what the riding time uses now -->
  <section class="card rule" id="pace" aria-labelledby="rule-h">
    <p class="kick"><Gauge size={16} aria-hidden="true" />{pace.mine ? tn(pace.n, 'Your rule · from {n} ride', 'Your rule · from {n} rides') : pace.standard && !pace.need ? t('Standard rule · chosen by you') : t('Standard rule')}</p>
    <h2 id="rule-h" class="sentence">
      {#if rule}
        {t('On the flat you ride {kmh} km/h and need 1 h per {m} m of climbing.', { kmh: num(rule.kmh), m: num(rule.climbMh) })}
      {:else}
        {t('The riding time is guessed with {kmh} km/h and 1 h per {m} m of climbing.', { kmh: num(std.kmh), m: num(std.climbMh) })}
      {/if}
    </h2>
    {#if rule && overall != null}<p class="flat muted">{t('The climbing gets its own time: with the climbing your rides average {avg} km/h.', { avg: n1(overall) })}</p>{/if}
    {#if loaded}
      <div class="state" role="status">
        {#if pace.mine}
          <p><Check size={16} aria-hidden="true" /><span>{t('Pack and On the way guess the riding time with your rule now, instead of {kmh} km/h and 1 h per {m} m.', { kmh: num(std.kmh), m: num(std.climbMh) })}{#if pace.stops && pace.stops > 1.02}{' '}{t('Your usual stops add about {pct} %.', { pct: Math.round((pace.stops - 1) * 100) })}{/if}</span></p>
          <button type="button" class="quiet" onclick={() => setStandard(true)}><Undo2 size={18} aria-hidden="true" />{t('Back to the standard rule')}</button>
        {:else if pace.standard && !pace.need}
          <p><span>{t('The riding time is guessed with the standard rule, {kmh} km/h and 1 h per {m} m, as you chose.', { kmh: num(std.kmh), m: num(std.climbMh) })}</span></p>
          <button type="button" class="quiet" onclick={() => setStandard(false)}><Gauge size={18} aria-hidden="true" />{t('Use my rule')}</button>
        {:else}
          <p class="need">
            <span class="dots" aria-hidden="true">{#each Array.from({ length: PACE_MIN }, (_, i) => i) as i (i)}<i class:on={i < pace.n}></i>{/each}</span>
            <span>{tn(pace.need, '{n} more ride and your rule takes over the riding time.', '{n} more rides and your rule takes over the riding time.')} {t('Until then: {kmh} km/h and 1 h per {m} m.', { kmh: num(std.kmh), m: num(std.climbMh) })}</span>
          </p>
        {/if}
      </div>
    {/if}
  </section>

  <!-- 2. a few calm small charts -->
  <section class="card charts" aria-labelledby="charts-h">
    <div class="ch">
      <h2 id="charts-h">{t('Over time')}</h2>
      <Seg full={false} label={t('Period')} value={period} options={PERIODS} onchange={setPeriod} />
    </div>
    {#if charts.length}
      <p class="lead muted">{tn(series.length, 'Bars = {n} ride, the newest orange, dashed = average.', 'Bars = {n} rides, the newest orange, dashed = average.')}</p>
      <ul class="minis">
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
      <p class="lead muted">{t('From 2 rides small charts show your speed over time.')}</p>
    {/if}
  </section>

  <!-- 3. the rides it learns from -->
  <section class="card rides-c" aria-labelledby="rides-h">
    <h2 id="rides-h" class="ch"><span>{t('Your rides')}</span><span class="r num">{tn(pace.n, '{n} counts', '{n} count')}</span></h2>
    <p class="acts">
      <label class="btn">
        <Upload size={18} aria-hidden="true" />{busy ? t('Reading …') : t('Add rides (GPX)')}<input type="file" accept=".gpx,application/gpx+xml" multiple onchange={pick} hidden disabled={busy} />
      </label>
      <span class="muted small">{t('Garmin Connect or Strava: a ride → Export GPX. Read on this device, nothing is uploaded.')}</span>
    </p>
    {#if msg}<p class="small" role="status">{msg}</p>{/if}
    {#if rides.length}
      <ul class="rides">
        {#each rides as r (r.id)}
          <li class:off={r.use === false}>
            <label class="pick"><input type="checkbox" checked={r.use !== false} onchange={() => toggle(r.id)} /><span class="nm"><b>{r.name}</b><small class="num">{dayLong(r.date)} · {num(r.km)} km · ↑ {num(r.gainM)} m · {t('riding {time} h', { time: hm(r.movingH) })}{r.totalH > r.movingH + 0.05 ? ` ${t('({time} h with stops)', { time: hm(r.totalH) })}` : ''}{pace.mine ? ` · ${t('guess {time} h', { time: hm(guessFor(r, pace)) })}` : ''}{r.km < 20 ? ` · ${t('under 20 km, does not count')}` : ''}</small></span></label>
            <button type="button" class="rm" onclick={() => drop(r.id)} aria-label={t('Remove {name}', { name: r.name })}>{t('Remove')}</button>
          </li>
        {/each}
      </ul>
      <p class="muted small">{t('Untick a ride that does not fit, e.g. a race without luggage.')}</p>
    {/if}
  </section>
</div>

<style>
  .tempo {
    display: grid;
    gap: 16px;
  }
  .kick {
    display: flex;
    align-items: center;
    gap: 6px;
    margin: 0;
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .sentence {
    margin: 6px 0 0;
    font-family: var(--font-brand);
    font-weight: 800;
    font-size: var(--fs-section);
    line-height: 1.15;
    overflow-wrap: break-word;
  }
  @media (min-width: 720px) {
    .sentence {
      font-size: var(--fs-page);
    }
  }
  .flat {
    margin: 6px 0 0;
    font-size: var(--fs-small);
  }
  .state {
    display: grid;
    gap: 4px;
    justify-items: start;
    margin-top: 12px;
    padding-top: 12px;
    border-top: 1px solid var(--line);
  }
  .state p {
    display: flex;
    gap: 8px;
    align-items: flex-start;
    margin: 0;
    color: var(--ink-2);
  }
  .state p :global(svg) {
    flex: none;
    margin-top: 3px;
    color: var(--ok);
  }
  .dots {
    display: inline-flex;
    flex: none;
    gap: 4px;
    margin-top: 6px;
  }
  .dots i {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    border: 1.5px solid var(--line-strong);
    box-sizing: border-box;
  }
  .dots i.on {
    background: var(--accent);
    border-color: var(--accent);
  }
  .quiet {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    min-height: 44px;
    padding: 0;
    border: 0;
    background: none;
    color: var(--accent);
    font: 500 var(--fs-body) var(--font-body);
    cursor: pointer;
  }
  .quiet:hover {
    text-decoration: underline;
  }
  .ch {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 8px 12px;
    margin: 0;
    font-size: var(--fs-sub);
    font-weight: 600;
  }
  .ch h2 {
    margin: 0;
    font-size: var(--fs-sub);
  }
  .ch .r {
    font-size: var(--fs-small);
    font-weight: 400;
    color: var(--ink-3);
  }
  .lead {
    margin: 10px 0 12px;
    font-size: var(--fs-small);
  }
  .muted {
    color: var(--ink-3);
  }
  .small {
    font-size: var(--fs-small);
  }
  .minis {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
    gap: 8px;
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .mini {
    display: grid;
    gap: 2px;
    align-content: start;
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
  .u {
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .acts {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px 12px;
    margin: 12px 0 0;
  }
  .acts .btn {
    min-height: 44px;
  }
  .rides {
    list-style: none;
    margin: 12px 0 4px;
    padding: 0;
  }
  .rides li {
    display: flex;
    align-items: center;
    gap: 8px;
    border-top: 1px solid var(--line);
  }
  .pick {
    flex: 1;
    min-width: 0;
    display: flex;
    gap: 10px;
    align-items: center;
    min-height: 52px;
    padding: 4px 0;
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
    overflow-wrap: break-word;
  }
  .nm small {
    display: block;
    color: var(--ink-3);
    font-size: var(--fs-small);
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
  .rides li.off b {
    color: var(--ink-3);
    text-decoration: line-through;
  }
</style>
