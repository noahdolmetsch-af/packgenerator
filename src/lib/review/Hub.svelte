<script>
  /**
   * v0.49.0 R1 «Rückblick ruhig» (Noah 4a-7a): ONE page «Rückblick» (#/debrief) instead of five.
   * 1. The last ride: profile, km, Hm, time, pace, weather, plan against real, its learnings, and the
   *    one main button «Rückblick schreiben» while its debrief is open.
   * 2. «Letzte 12 Monate» (rolling; the switch on top: 12 Monate / this year / Alle) with Vorjahr,
   *    Durchschnitt and Bestwert per number.
   * 3. «Touren im Vergleich»: 7 small charts and a compact table; base the last 10 trips, the 12
   *    months or the same kind (Art) as the newest one.
   * 4. One level below: Dein Tempo, Gelernt, Logbuch (their own pages; v0.53.0 R2 rebuilt them).
   * «Fahrt hochladen» is a quiet button in the head. #/review and #/debrief/compare land here.
   * Numbers: review/rueckblick.js (tested); unknown is a calm «–».
   */
  import { liveQuery } from 'dexie';
  import { db } from '../db.js';
  import { loadReview } from './load.js';
  import { tripFacts, periodStats, compareSet, planVsReal, ARTS } from './rueckblick.js';
  import { homeTrips } from '../home/heute.js';
  import { n0, n1, hours, temps, kg, dates, monthShort, monthLong, dayLong, rainText, DASH } from './fmt.js';
  import { paceOf, ruleOf } from '../pace.js';
  import { logEntries } from './logbook.js';
  import { openTrip } from '../nav.js';
  import { localDay } from '../localday.js';
  import { t, tn, num, locale } from '../i18n.svelte.js';
  import Seg from '../ui/Seg.svelte';
  import Band from './Band.svelte';
  import MiniBars from './MiniBars.svelte';
  import { Upload, ChevronRight, Lightbulb, Sparkles, Sun, CloudRain, Cloud, Thermometer, Bike, Clock, Gauge, BookOpen, Notebook } from '@lucide/svelte';

  let { spot = '' } = $props();

  const today = localDay();
  const dataQ = liveQuery(async () => ({ ...(await loadReview(db)), events: await db.events.toArray() }));
  const data = $derived($dataQ ?? null);
  // the same trips as Today's «Letzte 12 Monate»: no archived and no test trips (home/heute.js)
  const facts = $derived(data ? tripFacts({ ...data, trips: homeTrips(data.trips), today }) : []);

  const KEEP = 'review.period';
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
  const lastPlan = $derived(last ? planVsReal(last).find((x) => x.key === 'movingH') ?? null : null);
  const pace = $derived(paceOf(data?.pace ?? null));
  const rule = $derived(ruleOf(pace.learned));
  const log = $derived(data ? logEntries({ facts, events: data.events }) : []);
  const open = $derived(facts.filter((r) => r.debrief === 'open' || r.debrief === 'draft').length);
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
    if (spot === 'compare' && data) queueMicrotask(() => document.getElementById('compare')?.scrollIntoView());
  });
  const highest = (p) => (p?.length ? Math.max(...p.map((x) => x[1] ?? 0)) : null);
  const ARTNAME = Object.fromEntries(ARTS.map((a) => [a.key, a.name]));
</script>

{#snippet rainIcon(rain)}
  {#if rain?.wet === true}<CloudRain size={16} aria-hidden="true" />{:else if rain?.wet === false}<Sun size={16} aria-hidden="true" />{:else}<Cloud size={16} aria-hidden="true" />{/if}
{/snippet}

<div class="hub">
  <nav class="crumb" aria-label={t('Path')}><a href="#/trips">{t('Trips|place')}</a><ChevronRight size={14} aria-hidden="true" /></nav>
  <header class="head">
    <div class="ht">
      <h1 class="title">{t('Look back|page')}</h1>
      {#if stats}<p class="page-sub num">{[rangeText, tn(stats.stats[0].value ?? 0, '{n} trip', '{n} trips'), open ? tn(open, '{n} debrief open', '{n} debriefs open') : ''].filter(Boolean).join(' · ')}</p>{/if}
    </div>
    <div class="hacts">
      <Seg full={false} label={t('Period')} value={mode} options={PERIODS} onchange={setMode} />
      <a class="quiet" href="#/debrief/ride"><Upload size={18} aria-hidden="true" />{t('Upload ride')}</a>
    </div>
  </header>

  {#if !data}
    <p class="page-sub">{t('Loading…')}</p>
  {:else if !facts.length}
    <section class="card empty">
      <b>{t('Nothing to look back on yet.')}</b>
      <p>{t('A trip shows up here the day after it ends, an uploaded ride at once.')}</p>
      <a class="btn" href="#/debrief/ride"><Upload size={18} aria-hidden="true" />{t('Upload ride')}</a>
    </section>
  {:else}
    <div class="top">
      <!-- 1. the last ride -->
      {#if last}
        <section class="card lastride" aria-labelledby="last-h">
          {#if last.profile}
            <div class="bandwrap">
              <Band points={last.profile} />
              <span class="pill act tag">{t('Last ride')}</span>
              {#if highest(last.profile)}<span class="pill gpx num">{t('GPX · {m} m highest point', { m: num(highest(last.profile)) })}</span>{/if}
            </div>
          {/if}
          <div class="in">
            <p class="kick">{[dates(last.start, last.end), last.trip ? t(ARTNAME[last.art]) : t('Uploaded ride')].join(' · ')}</p>
            <h2 id="last-h" class="lt">{last.title}</h2>
            <dl class="big">
              <div><dt>{t('Distance')}</dt><dd><b class="bignum">{n0(last.km)}</b> <span class="u">km</span></dd></div>
              <div><dt>{t('Climbing|hm')}</dt><dd><b class="bignum">{n0(last.gainM)}</b> <span class="u">Hm</span></dd></div>
              <div><dt>{last.totalH && last.movingH && last.totalH > last.movingH ? t('moving · {h} total', { h: hours(last.totalH) }) : t('moving')}</dt><dd><b class="bignum">{hours(last.movingH)}</b> <span class="u">h</span></dd></div>
              <div><dt>{t('average while moving')}</dt><dd><b class="bignum">{n1(last.kmh)}</b> <span class="u">km/h</span></dd></div>
            </dl>
            <ul class="facts">
              <li>{@render rainIcon(last.rain)}{rainText(last.rain, last.days)}</li>
              <li><Thermometer size={16} aria-hidden="true" />{temps(last.tmin, last.tmax)}</li>
              <li><Bike size={16} aria-hidden="true" />{last.bike ?? DASH}</li>
              {#if last.pauses}<li><Clock size={16} aria-hidden="true" />{tn(last.pauses.n, '{n} stop', '{n} stops')} · {num(last.pauses.min)} min</li>{/if}
            </ul>
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
            <p class="later">{t('Heart rate, zones and watts come with Strava, as an observation without a score.')} <span class="pill">{t('later · S1')}</span></p>
            <div class="acts">
              {#if last.debrief === 'open' || last.debrief === 'draft'}
                <a class="btn hi" href={last.href} onclick={() => last.trip && openTrip(last.trip.id)}>{last.debrief === 'draft' ? t('Continue the debrief') : t('Write the debrief')}<ChevronRight size={18} aria-hidden="true" /></a>
              {:else}
                <a class="btn" href={last.href} onclick={() => last.trip && openTrip(last.trip.id)}>{last.kind === 'ride' ? t('Open the ride') : t('Open its debrief')}<ChevronRight size={18} aria-hidden="true" /></a>
              {/if}
              <a class="lnk" href="#/pack/past">{t('All past trips')}</a>
            </div>
          </div>
        </section>
      {/if}

      <!-- 2. the period -->
      <section class="card period" aria-labelledby="per-h">
        <h2 id="per-h" class="ch"><span>{periodName}</span><span class="r num">{rangeText}</span></h2>
        {#if stats.bars.length > 1}
          <div class="bars">
            <span class="ax num" aria-hidden="true"><span>{num(axisTop)}</span><span>{num(axisTop / 2)}</span></span>
            <div class="cols" role="img" aria-label={mode === 'all' ? t('km per year') : t('km per month')}>
              {#each stats.bars as b, i (b.key)}
                <span class="col" title="{mode === 'all' ? b.key : monthLong(b.key)}: {num(b.km)} km"><i class:now={i === stats.bars.length - 1} style:height="{b.km ? Math.max(3, (b.km / axisTop) * 100) : 0}%"></i><small>{barLabel(b)}</small></span>
              {/each}
            </div>
          </div>
        {/if}
        <table class="kz">
          <thead><tr><th scope="col">{t('Figure')}</th><th scope="col" class="n">{periodName}</th>{#if mode !== 'all'}<th scope="col" class="n">{t('Previous year')}</th>{/if}<th scope="col">{t('Average')}</th><th scope="col">{t('Best')}</th></tr></thead>
          <tbody>
            {#each stats.stats as s (s.key)}
              <tr>
                <th scope="row">{t(LABEL[s.key])}</th>
                <td class="n v num"><b>{value(s)}</b>{#if unit(s)} <span class="u">{unit(s)}</span>{/if}</td>
                {#if mode !== 'all'}<td class="n d num" class:up={s.delta > 0}>{deltaText(s)}</td>{/if}
                <td class="a">{avgText(s)}</td>
                <td class="b">{bestText(s)}</td>
              </tr>
            {/each}
          </tbody>
        </table>
      </section>
    </div>

    <!-- 3. trips compared -->
    <section class="card cmp" id="compare" aria-labelledby="cmp-h">
      <div class="cmph">
        <h2 id="cmp-h" class="ch"><span>{t('Trips compared')}</span></h2>
        <Seg full={false} label={t('Compare with')} value={base} options={BASES} onchange={setBase} />
      </div>
      {#if cmp.rows.length < 2}
        <p class="muted">{t('Two trips are needed to compare.')}</p>
      {:else}
        <p class="lead">{#if sentence}<b>{sentence}</b>{' '}{/if}<span class="muted">{base === 'same' && cmp.latest ? t('Bars = the last {n} trips of the kind «{art}», the newest orange, dashed = average.', { n: cmp.rows.length, art: t(ARTNAME[cmp.latest.art]) }) : t('Bars = the last {n} trips, the newest orange, dashed = average.', { n: cmp.rows.length })}</span></p>
        <ul class="minis">
          {#each cmp.metrics as m (m.key)}
            <li class="mini">
              <span class="ml">{t(CMP[m.key])}</span>
              <span class="mv"><b class="num">{cmpValue(m.key, m.latest)}</b>{#if CMPUNIT[m.key] && m.latest != null} <span class="u">{CMPUNIT[m.key]}</span>{/if}</span>
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
        <p class="more"><a class="lnk" href="#/pack/past">{t('All {n} trips as a table', { n: facts.length })}<ChevronRight size={16} aria-hidden="true" /></a></p>
      {/if}
    </section>

    <!-- 4. one level below -->
    <div class="below">
      <section class="card sub" aria-labelledby="pace-h">
        <h2 id="pace-h" class="ch"><span><Gauge size={18} aria-hidden="true" />{t('Your pace')}</span></h2>
        <p>{rule ? t('You ride {kmh} km/h on average and need 1 h per {m} m of climbing.', { kmh: num(rule.kmh), m: num(rule.climbMh) }) : t('The riding time is guessed with {kmh} km/h and 1 h per {m} m of climbing.', { kmh: num(pace.kmh), m: num(pace.climbMh) })}</p>
        <p class="muted small">{pace.mine ? tn(pace.n, 'The riding time uses your rule (from {n} ride).', 'The riding time uses your rule (from {n} rides).') : pace.need ? tn(pace.need, '{n} more ride and your rule takes over the riding time.', '{n} more rides and your rule takes over the riding time.') : t('The riding time uses the standard rule, as you chose.')}</p>
        <a class="lnk" href="#/debrief/pace">{t('Your pace')}<ChevronRight size={16} aria-hidden="true" /></a>
      </section>
      <section class="card sub" aria-labelledby="learn-h">
        <h2 id="learn-h" class="ch"><span><Lightbulb size={18} aria-hidden="true" />{t('Learned|review')}</span><span class="r num">{num(data.learnings.length)}</span></h2>
        {#if newest.length}
          <ul class="sl">{#each newest as l (l.id)}<li><span class="st">{l.rule}</span>{#if l.source}<small>{l.source === 'import' ? t('From the import') : l.source}</small>{/if}</li>{/each}</ul>
        {:else}
          <p class="muted">{t('No learnings yet. They come from every debrief.')}</p>
        {/if}
        <a class="lnk" href="#/debrief/learnings">{t('All learnings')}<ChevronRight size={16} aria-hidden="true" /></a>
      </section>
      <section class="card sub" aria-labelledby="log-h">
        <h2 id="log-h" class="ch"><span><Notebook size={18} aria-hidden="true" />{t('Logbook')}</span><span class="r num">{num(log.length)}</span></h2>
        {#if log.length}
          <ul class="sl">{#each log.slice(0, 3) as e (e.id)}<li><span class="st">{e.title}</span><small>{[e.kind === 'event' ? (e.ev.dateText ?? e.year) : dates(e.date, e.end), e.km != null ? `${n0(e.km)} km` : '', e.ev?.source === 'excel' ? t('from Excel') : ''].filter(Boolean).join(' · ')}</small></li>{/each}</ul>
        {:else}
          <p class="muted">{t('No entries yet.')}</p>
        {/if}
        <a class="lnk" href="#/debrief/logbook">{t('Logbook')}<ChevronRight size={16} aria-hidden="true" /></a>
      </section>
    </div>
  {/if}
</div>

<style>
  .hub {
    max-width: 1400px;
    margin: 0 auto;
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
    min-width: 44px;
    color: var(--accent);
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
  .quiet,
  .lnk {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    min-height: 44px;
    color: var(--accent);
    font-weight: 500;
    text-decoration: none;
  }
  .quiet:hover,
  .lnk:hover {
    text-decoration: underline;
  }
  .muted {
    color: var(--ink-3);
  }
  .empty {
    display: grid;
    gap: 8px;
    justify-items: start;
  }
  .empty p {
    margin: 0;
    color: var(--ink-2);
  }
  .top {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    gap: 16px;
    align-items: start;
  }
  @media (min-width: 1000px) {
    .top {
      grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
    }
  }
  .ch {
    display: flex;
    align-items: center;
    gap: 8px 12px;
    margin: 0;
    font-size: var(--fs-sub);
    font-weight: 600;
  }
  .ch > span:first-child {
    display: inline-flex;
    align-items: center;
    gap: 8px;
  }
  .ch .r {
    margin-left: auto;
    font-size: var(--fs-small);
    font-weight: 400;
    color: var(--ink-3);
    text-align: right;
  }
  /* 1. the last ride */
  .lastride {
    padding: 0;
    overflow: hidden;
  }
  .bandwrap {
    position: relative;
  }
  .bandwrap .pill {
    position: absolute;
    top: 10px;
  }
  .tag {
    left: 12px;
  }
  .gpx {
    right: 12px;
    background: var(--paper);
  }
  .lastride .in {
    padding: 16px 20px 20px;
  }
  .kick {
    margin: 0;
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .lt {
    margin: 2px 0 12px;
    font-family: var(--font-brand);
    font-weight: 800;
    font-size: var(--fs-page);
    line-height: 1.05;
    overflow-wrap: break-word;
  }
  .big {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 8px 16px;
    margin: 0;
  }
  @media (max-width: 559px) {
    .big {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }
  .big div {
    display: flex;
    flex-direction: column-reverse;
    min-width: 0;
  }
  .big dt {
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .big dd {
    margin: 0;
    white-space: nowrap;
  }
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
  .acts .btn {
    min-height: 44px;
  }
  /* 2. the period */
  .period .ch {
    margin-bottom: 12px;
  }
  .bars {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr);
    gap: 8px;
    margin-bottom: 8px;
  }
  .bars .ax {
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    height: 96px;
    color: var(--ink-3);
    font-size: var(--fs-small);
    text-align: right;
  }
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
    background: var(--bar);
    max-height: 96px;
  }
  .col i.now {
    background: var(--hi);
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
  .cmp {
    margin-top: 16px;
  }
  .cmph {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 8px 16px;
  }
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
  .more {
    margin: 8px 0 0;
  }
  /* 4. one level below */
  .below {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    gap: 16px;
    margin-top: 16px;
  }
  @media (min-width: 900px) {
    .below {
      grid-template-columns: repeat(3, minmax(0, 1fr));
    }
  }
  .sub {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .sub p {
    margin: 0;
  }
  .small {
    font-size: var(--fs-small);
  }
  .sub .lnk {
    margin-top: auto;
  }
  .sl {
    display: grid;
    gap: 8px;
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .sl li {
    display: grid;
  }
  .sl .st {
    overflow-wrap: break-word;
  }
  .sl small {
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
</style>
