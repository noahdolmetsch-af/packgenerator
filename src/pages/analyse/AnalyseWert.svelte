<script>
  /**
   * «Analyse» M6 (Noah 27.10.2026 «alle Mockups 1:1»): the page of one value, #/auswerten/analyse/<key>.
   * For every value of the Analyse list (Fitbit, Strava, body, «Wi gaht's?», every Aktiv activity): day,
   * week, month, 3 months, year or everything, back in time with ‹ ›; four boxes (mean or total, lowest,
   * highest, your typical range); the course with your typical range, trips as bands, the 7-day mean, up to
   * two more values as layers and the year before; per weekday; the days, newest first. A tap on a point
   * shows that day with every value. Only to look at, nothing is rated. Rules in lib/analyse/detail.js.
   */
  import { ChevronLeft, ChevronRight, X } from '@lucide/svelte';
  import Crumb from '../../lib/flow/kit/Crumb.svelte';
  import PageHead from '../../lib/ui/PageHead.svelte';
  import Seg from '../../lib/ui/Seg.svelte';
  import Empty from '../../lib/ui/Empty.svelte';
  import { analyseData } from '../../lib/analyse/data.svelte.js';
  import { analyseGroups, itemsByKey, detailHref } from '../../lib/analyse/catalog.js';
  import { valueText, unitText } from '../../lib/analyse/format.js';
  import { RANGES, DEFAULT_RANGE, windowOf, bucketsOf, statsOf, typicalOf, mean7, weekdays, weekdayExtremes, tripBands, yearBefore, firstDay } from '../../lib/analyse/detail.js';
  import { addDays } from '../../lib/analyse.js';
  import { tripEnd } from '../../lib/tripstate.js';
  import { actName } from '../../lib/flow/ui.svelte.js';
  import { t, num, locale } from '../../lib/i18n.svelte.js';

  let { key } = $props();

  const LS = 'pg.analyse.wert';
  const saved = (() => {
    try {
      return JSON.parse(localStorage.getItem(LS) ?? '{}') ?? {};
    } catch {
      return {};
    }
  })();
  // svelte-ignore state_referenced_locally
  const mine = saved[key] ?? {};
  let range = $state(RANGES.some((r) => r.key === mine.range) ? mine.range : DEFAULT_RANGE);
  let back = $state(0);
  let layers = $state(Array.isArray(mine.layers) ? mine.layers.slice(0, 2) : []);
  let prevYear = $state(mine.prevYear === true);
  let picked = $state(null);
  let allDays = $state(false);
  $effect(() => {
    try {
      const all = JSON.parse(localStorage.getItem(LS) ?? '{}') ?? {};
      all[key] = { range, layers, prevYear };
      localStorage.setItem(LS, JSON.stringify(all));
    } catch {
      /* a private window: only for now */
    }
  });

  const data = analyseData({ from: () => addDays(data.today, -800) });
  const today = data.today;
  const groups = $derived(analyseGroups({ table: data.table, weights: data.weights, ctx: data.ctx, acts: data.acts, log: data.log, ownKeys: data.ownKeys }));
  const byKey = $derived(itemsByKey(groups));
  const item = $derived(byKey.get(key) ?? null);
  const COLORS = { heart: 'var(--pz6)', sleep: 'var(--l3)', move: 'var(--pz3)', sports: 'var(--pz5)', body: 'var(--l4)', felt: 'var(--pz4)', aktiv: 'var(--l1)', garmin: 'var(--ink-3)' };
  const LAYER_COLORS = ['var(--l3)', 'var(--l4)'];
  const color = $derived(COLORS[item?.group] ?? 'var(--hi)');
  const layerItems = $derived(layers.map((k) => byKey.get(k)).filter((x) => x && !x.later && x.key !== key));

  // the first day the app has anything (for «Alles»)
  const first = $derived.by(() => {
    if (!item?.get) return null;
    const keys = [...data.table.keys(), ...data.log.map((e) => e.day)].filter((d) => typeof d === 'string').sort();
    if (!keys.length) return null;
    const days = windowOf('all', today, 0, keys[0]).days;
    return firstDay(days, item.get);
  });
  const win = $derived(windowOf(range, today, back, first));
  const isDay = $derived(range === 'd');
  const hours = $derived(isDay && item?.hoursOf ? item.hoursOf(win.to) : null);
  const get = (it) => (d) => (it?.get ? it.get(d) : null);
  // on «T» with hours: the boxes count the hours of that day (lowest and highest name the hour)
  const HOURS = Array.from({ length: 24 }, (_, i) => String(i));
  const st = $derived(item?.get ? (hours ? statsOf(HOURS, (h) => hours[Number(h)], !!item.sum) : statsOf(win.days, item.get, !!item.sum)) : null);
  const when = (d) => (hours ? `${d.padStart(2, '0')}:00` : dfmt(d, { day: 'numeric', month: 'short' }));
  const typical = $derived(item?.get && !item.sum && !hours ? typicalOf(windowOf('m3', today).days, item.get) : null);
  const pts = $derived(item?.get ? (hours ? hours.map((v, i) => ({ key: `${i}`, v, days: [win.to] })) : bucketsOf(win.days, item.get, !!item.sum)) : []);
  const avg7 = $derived(item?.sum || hours ? [] : mean7(pts));
  const layerPts = $derived(layerItems.map((it) => (hours ? [] : bucketsOf(win.days, it.get, !!it.sum))));
  const prevPts = $derived(prevYear && item?.get && !hours ? bucketsOf(yearBefore(win.days), item.get, !!item.sum) : []);
  const bands = $derived(hours ? [] : tripBands(data.trips, win.days, tripEnd).map((b) => ({ ...b, a: Math.floor(b.a / (pts.length < win.days.length ? 7 : 1)), b: Math.floor(b.b / (pts.length < win.days.length ? 7 : 1)) })));
  const bars = $derived(!!item?.sum || !!item?.bars);

  // the scales: bars from 0, lines near their lowest value; a layer has its own scale (right)
  function scaleOf(list, fromZero) {
    const vals = list.filter((v) => v != null && Number.isFinite(v));
    if (!vals.length) return { lo: 0, hi: 1 };
    let lo = fromZero ? 0 : Math.min(...vals);
    let hi = Math.max(...vals);
    if (hi === lo) {
      hi += 1;
      lo = fromZero ? 0 : lo - 1;
    }
    const pad = fromZero ? 0 : (hi - lo) * 0.1;
    return { lo: lo - pad, hi: hi + pad * 0.5 };
  }
  const sc = $derived(scaleOf([...pts.map((p) => p.v), ...prevPts.map((p) => p.v), ...(typical ?? [])], bars));
  const lsc = $derived(layerPts.map((lp, i) => scaleOf(lp.map((p) => p.v), !!layerItems[i]?.sum)));
  const W = 1000;
  const H = 260;
  const xOf = (i, n) => (n > 1 ? 20 + (i / (n - 1)) * (W - 40) : W / 2);
  const yOf = (v, s) => H - 16 - ((v - s.lo) / (s.hi - s.lo || 1)) * (H - 40);
  const path = (list, s, k = 'v') => {
    let d = '';
    let open = false;
    list.forEach((p, i) => {
      const v = typeof p === 'number' || p == null ? p : p[k];
      if (v == null) {
        open = false;
        return;
      }
      d += `${open ? 'L' : 'M'}${xOf(i, list.length).toFixed(1)} ${yOf(v, s).toFixed(1)}`;
      open = true;
    });
    return d;
  };
  const barW = $derived(Math.max(2, (W - 40) / Math.max(pts.length, 1) - 2));

  function tap(e) {
    if (!pts.length) return;
    const r = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width) * W;
    const i = Math.max(0, Math.min(pts.length - 1, Math.round(((x - 20) / (W - 40)) * (pts.length - 1))));
    picked = pts[i]?.days?.at(-1) ?? null;
  }
  function key2(e, i) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      picked = pts[i]?.days?.at(-1) ?? null;
    }
  }

  // texts
  const dfmt = (d, o) => new Date(`${d}T12:00:00Z`).toLocaleDateString(locale(), { timeZone: 'UTC', ...o });
  const dayText = (d) => dfmt(d, { weekday: 'short', day: 'numeric', month: 'short' });
  const rangeText = $derived.by(() => {
    if (isDay) return dfmt(win.to, { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' });
    const a = new Date(`${win.from}T12:00:00Z`);
    const b = new Date(`${win.to}T12:00:00Z`);
    if (range === 'w' || range === 'm') return `${dfmt(win.from, { day: 'numeric', month: 'short' })} – ${dfmt(win.to, { day: 'numeric', month: 'short', year: 'numeric' })}`;
    if (a.getUTCFullYear() === b.getUTCFullYear()) return `${dfmt(win.from, { month: 'short' })} – ${dfmt(win.to, { month: 'short', year: 'numeric' })}`;
    return `${dfmt(win.from, { month: 'short', year: 'numeric' })} – ${dfmt(win.to, { month: 'short', year: 'numeric' })}`;
  });
  const WD = $derived(Array.from({ length: 7 }, (_, i) => dfmt(addDays('2026-10-05', i), { weekday: 'short' })));
  const WD_LONG = $derived(Array.from({ length: 7 }, (_, i) => dfmt(addDays('2026-10-05', i), { weekday: 'long' })));
  const RANGE_NAMES = { d: 'D|range', w: 'W|range', m: 'M|range', m3: '3 M|range', y: 'Y|range', all: 'All|range' };
  const rangeOpts = $derived(RANGES.map((r) => ({ key: r.key, name: t(RANGE_NAMES[r.key]) })));
  const v = (x, val) => valueText(x, val, num);
  const tripOn = (d) => data.trips.find((tr) => tr.startDate && tr.startDate <= d && (tripEnd(tr) ?? tr.startDate) >= d);
  const SRC_TEXT = {
    fitbit: 'Fitbit · from your watch via Google.',
    strava: 'Strava · from your activities.',
    body: 'Your own entries and what the app counts.',
    check: "Your answers in «Wi gaht's?».",
    aktiv: 'Your ticks in Aktiv.',
  };
  const wdList = $derived(item?.get && !isDay ? weekdays(win.days, item.get) : []);
  const wdTop = $derived(Math.max(...wdList.map((x) => x.v ?? 0), 0) || 1);
  // bars of means start a bit under the lowest weekday, so the differences show (sums start at 0)
  const wdLo = $derived.by(() => {
    if (item?.sum) return 0;
    const vals = wdList.filter((x) => x.v != null).map((x) => x.v);
    if (!vals.length) return 0;
    const lo = Math.min(...vals);
    const hi = Math.max(...vals);
    return hi > lo ? lo - (hi - lo) * 0.7 : lo * 0.9;
  });
  const ext = $derived(weekdayExtremes(wdList));
  // the rows of «Tage»: newest first, the first layer next to it, and what you did the day before
  const rows = $derived(item?.get ? [...win.days].reverse().map((d) => ({ d, v: item.get(d), l: layerItems[0]?.get(d) ?? null })).filter((r) => r.v != null) : []);
  const names = $derived(new Map(data.acts.map((a) => [a.id, actName(a)])));
  const dayBefore = (d) => {
    const prev = addDays(d, -1);
    const ticked = [...new Set(data.log.filter((e) => e.day === prev).map((e) => names.get(e.actId)).filter(Boolean))];
    const rides = (data.table.get(prev)?.acts ?? []).map((a) => a.sportName ?? a.type).filter(Boolean);
    return [...new Set([...ticked, ...rides])].slice(0, 2).join(', ') || '–';
  };
  // every value of the picked day, grouped (D6 short)
  const dayAll = $derived(
    picked
      ? groups
          .map((g) => ({ ...g, items: g.items.filter((it) => !it.later && it.get).map((it) => ({ ...it, value: it.get(picked) })).filter((it) => it.value != null) }))
          .filter((g) => g.items.length)
      : [],
  );
  // suggestions for a layer: sleep, the activity ticked most often, bike km
  const suggest = $derived.by(() => {
    const counts = new Map();
    for (const e of data.log) if (e.day >= win.from && e.day <= win.to) counts.set(e.actId, (counts.get(e.actId) ?? 0) + 1);
    const topAct = [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
    return ['sleep', topAct ? `act:${topAct}` : null, 'km:bike'].filter((k) => k && k !== key && byKey.has(k) && !layers.includes(k)).slice(0, 3);
  });
  const addLayer = (k) => {
    if (!k || layers.includes(k) || k === key) return;
    layers = [...layers, k].slice(-2);
  };
  const dropLayer = (k) => (layers = layers.filter((x) => x !== k));
  let pick = $state('');
</script>

{#if data.loading}
  <p class="hint" role="status">{t('Loading …')}</p>
{:else if !item}
  <Empty text={t('This value is not there (any more).')} action={{ label: t('Back to Analyse'), href: '#/auswerten/analyse' }} />
{:else}
  <div class="wv" style="--c: {color}" data-detail={key}>
    <header>
      <Crumb path={[{ href: '#/auswerten', label: t('Analysis|place') }, { href: '#/auswerten/analyse', label: t('Analyse|page') }]} here={item.name} />
      <PageHead title={item.name} sub={`${t(SRC_TEXT[item.src] ?? SRC_TEXT.body)} ${t('Only to look at.|analyse')}`} />
    </header>

    {#if item.later}
      <Empty text={item.later === 'garmin' ? t('Garmin does not give this out') : t('Google does not give this out; the app will count its own')} />
    {:else}
      <section class="card top" aria-label={t('Range|analyse')}>
        <div class="bar">
          <Seg options={rangeOpts} value={range} onchange={(r) => ((range = r), (back = 0), (picked = null))} label={t('Range|analyse')} full={false} />
          {#if range !== 'all'}
            <div class="pager">
              <button type="button" class="nav" aria-label={t('Earlier|analyse')} data-back onclick={() => ((back += 1), (picked = null))}><ChevronLeft size={18} aria-hidden="true" /></button>
              <b data-range-text>{rangeText}</b>
              <button type="button" class="nav" aria-label={t('Later|analyse')} data-fwd disabled={back === 0} onclick={() => ((back = Math.max(0, back - 1)), (picked = null))}><ChevronRight size={18} aria-hidden="true" /></button>
            </div>
          {/if}
        </div>
        <div class="boxes">
          <div class="box" data-box="avg"><b class="num">{v(item, item.sum ? st?.total : st?.avg)}{#if unitText(item)}<small> {unitText(item)}</small>{/if}</b><span>{item.sum ? t('total|analyse') : t('average|analyse')}</span></div>
          <div class="box" data-box="lo"><b class="num">{v(item, st?.lo?.v)}</b><span>{st?.lo ? t('lowest ({day})|analyse', { day: when(st.lo.day) }) : t('lowest|analyse')}</span></div>
          <div class="box" data-box="hi">
            <b class="num">{v(item, st?.hi?.v)}</b>
            <span>{st?.hi ? (!hours && tripOn(st.hi.day) ? t('highest ({day})|analyse', { day: tripOn(st.hi.day).name }) : t('highest ({day})|analyse', { day: when(st.hi.day) })) : t('highest|analyse')}</span>
          </div>
          {#if typical}<div class="box" data-box="typ"><b class="num">{v(item, typical[0])}–{v(item, typical[1])}</b><span>{t('your typical range|analyse')}</span></div>{/if}
        </div>
      </section>

      <section class="card chart" aria-labelledby="wv-course">
        <div class="ch">
          <h2 id="wv-course">{hours ? t('Over the day|analyse') : t('Course|analyse')}</h2>
          <small>{hours ? t('per hour|analyse') : bars ? t('per day|analyse') : t('points and 7-day mean|analyse')}</small>
        </div>
        {#if !hours}
          <div class="chips" role="group" aria-label={t('Layers|analyse')}>
            <span class="chip on main"><i class="dot" style="background:{color}"></i>{item.name}</span>
            {#each layerItems as l, i (l.key)}
              <span class="chip on" data-layer={l.key}><i class="dot" style="background:{LAYER_COLORS[i]}"></i>{l.name}<button type="button" class="x" aria-label={t('Remove {name}|analyse', { name: l.name })} onclick={() => dropLayer(l.key)}><X size={14} aria-hidden="true" /></button></span>
            {/each}
            {#if layers.length < 2}
              {#each suggest as k (k)}
                <button type="button" class="chip" data-suggest={k} onclick={() => addLayer(k)}>+ {byKey.get(k).name}</button>
              {/each}
              <label class="chip sel">
                <span class="sr">{t('Add another value|analyse')}</span>
                <select bind:value={pick} onchange={() => (addLayer(pick), (pick = ''))} data-add-layer>
                  <option value="">+ {t('Value|analyse')}</option>
                  {#each groups as g (g.key)}
                    <optgroup label={g.name}>
                      {#each g.items.filter((x) => !x.later && x.key !== key && !layers.includes(x.key)) as x (x.key)}<option value={x.key}>{x.name}</option>{/each}
                    </optgroup>
                  {/each}
                </select>
              </label>
            {/if}
            <button type="button" class="chip" class:on={prevYear} aria-pressed={prevYear} data-prev-year onclick={() => (prevYear = !prevYear)}>{t('Year before alongside|analyse')}</button>
          </div>
        {/if}
        {#if !pts.some((p) => p.v != null)}
          <p class="hint" role="status">{isDay && !item.hoursOf ? t('One value per day: see the week or month for its course.|analyse') : t('No value in this range.|analyse')}</p>
        {:else}
          <div class="plot">
            <div class="ax l" aria-hidden="true"><span style="color:{color}">{v(item, sc.hi)}</span><span style="color:{color}">{v(item, sc.lo)}</span></div>
            <!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_noninteractive_element_interactions -->
            <svg viewBox="0 0 {W} {H}" preserveAspectRatio="none" role="img" aria-label={t('Course of {name}|analyse', { name: item.name })} onclick={tap}>
              {#each bands as b, bi (bi)}
                <rect class="band" x={xOf(b.a, pts.length) - 4} width={Math.max(8, xOf(b.b, pts.length) - xOf(b.a, pts.length) + 8)} y="4" height={H - 20} />
              {/each}
              {#if typical}<rect class="typ" x="20" width={W - 40} y={yOf(typical[1], sc)} height={Math.max(1, yOf(typical[0], sc) - yOf(typical[1], sc))} />{/if}
              {#if prevPts.length}<path class="prev" d={path(prevPts, sc)} vector-effect="non-scaling-stroke" />{/if}
              {#if bars}
                {#each pts as p, i (p.key)}
                  {#if p.v != null}<rect class="b" class:pk={picked && p.days.includes(picked)} x={xOf(i, pts.length) - barW / 2} width={barW} y={yOf(p.v, sc)} height={Math.max(1, H - 16 - yOf(p.v, sc))} rx="2" />{/if}
                {/each}
              {:else}
                <path class="ln" d={path(pts, sc)} vector-effect="non-scaling-stroke" />
                {#if avg7.length}<path class="m7" d={path(avg7, sc)} vector-effect="non-scaling-stroke" />{/if}
              {/if}
              {#each layerPts as lp, li (li)}
                <path class="lay" style="stroke:{LAYER_COLORS[li]}" d={path(lp, lsc[li])} vector-effect="non-scaling-stroke" />
              {/each}
              {#if picked}
                {@const i = pts.findIndex((p) => p.days.includes(picked))}
                {#if i >= 0}<line class="pick" x1={xOf(i, pts.length)} x2={xOf(i, pts.length)} y1="4" y2={H - 16} vector-effect="non-scaling-stroke" />{/if}
              {/if}
            </svg>
            {#if layerItems[0]}<div class="ax r" aria-hidden="true"><span style="color:{LAYER_COLORS[0]}">{v(layerItems[0], lsc[0].hi)}</span><span style="color:{LAYER_COLORS[0]}">{v(layerItems[0], lsc[0].lo)}</span></div>{/if}
            {#each bands as b, bi (bi)}{@const at = xOf(b.a, pts.length) / W}<span class="bn" class:end={at > 0.6} style="left:{at * 100}%">{b.name}</span>{/each}
          </div>
          <div class="xl" aria-hidden="true">
            {#if hours}<span>0</span><span>6</span><span>12</span><span>18</span><span>24 h</span>{:else}<span>{dfmt(win.from, { day: 'numeric', month: 'short' })}</span><span>{dfmt(win.days[Math.floor(win.days.length / 2)], { day: 'numeric', month: 'short' })}</span><span>{dfmt(win.to, { day: 'numeric', month: 'short' })}</span>{/if}
          </div>
          <ul class="legend">
            <li><i class="lsw" style="background:{color}"></i>{item.name}{#if layerItems.length}&nbsp;({t('left|axis')}){/if}</li>
            {#each layerItems as l, i (l.key)}<li><i class="lsw dash" style="border-color:{LAYER_COLORS[i]}"></i>{l.name}{#if i === 0}&nbsp;({t('right|axis')}){/if}</li>{/each}
            {#if typical}<li><i class="lsw typ"></i>{t('your typical range|analyse')}</li>{/if}
            {#if prevPts.length}<li><i class="lsw prev"></i>{t('year before|analyse')}</li>{/if}
            {#if bands.length}<li><i class="lsw band"></i>{t('trips|analyse')}</li>{/if}
          </ul>
          {#if !hours}<p class="hint">{t('Tap a point: the day with all its values (sleep, training, ticks, mood).')}</p>{/if}
          <!-- the points as buttons for the keyboard -->
          <div class="sr">
            {#each pts as p, i (p.key)}{#if p.v != null}<button type="button" onkeydown={(e) => key2(e, i)} onclick={() => (picked = p.days.at(-1))}>{dayText(p.days.at(-1))}: {v(item, p.v)}</button>{/if}{/each}
          </div>
        {/if}
      </section>

      {#if picked}
        <section class="card dayall" aria-labelledby="wv-day" data-day={picked}>
          <div class="ch">
            <h2 id="wv-day">{dfmt(picked, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</h2>
            <button type="button" class="nav" aria-label={t('Close')} onclick={() => (picked = null)}><X size={18} aria-hidden="true" /></button>
          </div>
          {#if tripOn(picked)}<p class="trip">{t('Trip|analyse')}: {tripOn(picked).name}</p>{/if}
          {#each dayAll as g (g.key)}
            <h3>{g.name}</h3>
            <ul class="vals">
              {#each g.items as x (x.key)}<li><a href={detailHref(x.key)}><span>{x.name}</span><b class="num">{v(x, x.value)}{#if unitText(x)}<small> {unitText(x)}</small>{/if}</b></a></li>{/each}
            </ul>
          {:else}
            <p class="hint">{t('No values on this day.|analyse')}</p>
          {/each}
          <div class="dnav">
            <button type="button" class="btn" onclick={() => (picked = addDays(picked, -1))}><ChevronLeft size={16} aria-hidden="true" />{t('Day before|analyse')}</button>
            <button type="button" class="btn" disabled={picked >= today} onclick={() => (picked = addDays(picked, 1))}>{t('Next day|analyse')}<ChevronRight size={16} aria-hidden="true" /></button>
          </div>
        </section>
      {/if}

      {#if !isDay}
        <div class="two">
          <section class="card wd" aria-labelledby="wv-wd">
            <div class="ch"><h2 id="wv-wd">{t('Per weekday|analyse')}</h2><small>{t('average|analyse')}</small></div>
            <div class="wdbars" aria-hidden="true">
              {#each wdList as x (x.wd)}
                <div class="wdc"><i style="height:{x.v == null ? 0 : Math.max(4, ((x.v - wdLo) / (wdTop - wdLo || 1)) * 100)}%"></i><span>{WD[x.wd]}</span></div>
              {/each}
            </div>
            {#if ext}<p class="hint" data-wd-note>{t('Highest on {hi}, lowest on {lo}.|analyse', { hi: WD_LONG[ext.hi], lo: WD_LONG[ext.lo] })}</p>{/if}
          </section>
          <section class="card days" aria-labelledby="wv-days">
            <div class="ch"><h2 id="wv-days">{t('Days|analyse')}</h2><small>{t('newest first|analyse')}</small></div>
            <table>
              <thead><tr><th>{t('Day|analyse')}</th><th class="n">{item.name}</th>{#if layerItems[0]}<th class="n">{layerItems[0].name}</th>{/if}<th class="n">{t('Day before|analyse')}</th></tr></thead>
              <tbody>
                {#each allDays ? rows : rows.slice(0, 7) as r (r.d)}
                  <tr><td><button type="button" class="lk" onclick={() => (picked = r.d)}>{dayText(r.d)}</button></td><td class="n num"><b>{v(item, r.v)}</b></td>{#if layerItems[0]}<td class="n num">{v(layerItems[0], r.l)}</td>{/if}<td class="n sm">{dayBefore(r.d)}</td></tr>
                {/each}
              </tbody>
            </table>
            {#if rows.length > 7}<button type="button" class="lk more" data-all-days onclick={() => (allDays = !allDays)}>{allDays ? t('Show fewer|analyse') : t('Show all {n} days|analyse', { n: rows.length })}</button>{/if}
          </section>
        </div>
      {/if}
      {#if item.old}<p class="hint"><a href={item.old}>{item.tick ? t('Also in «Ticks evaluated»|analyse') : t('Also in the older view|analyse')}</a></p>{/if}
    {/if}
  </div>
{/if}

<style>
  .wv {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }
  .wv section {
    min-width: 0;
  }
  .bar {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    align-items: center;
    gap: 10px 16px;
  }
  .pager {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .nav {
    display: inline-grid;
    place-items: center;
    width: 40px;
    height: 40px;
    border: 1px solid var(--line);
    border-radius: 50%;
    background: var(--paper);
    color: var(--ink);
    cursor: pointer;
  }
  .nav:disabled {
    opacity: 0.4;
    cursor: default;
  }
  .boxes {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
    gap: 8px;
    margin-top: 12px;
  }
  .box {
    display: flex;
    flex-direction: column;
    gap: 2px;
    padding: 10px 12px;
    border-radius: 12px;
    background: var(--paper-2);
  }
  .box b {
    font-size: var(--fs-sub);
  }
  .box b small {
    margin-left: 3px;
    font-weight: 400;
  }
  .box small,
  .box span {
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .ch {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    gap: 8px;
  }
  .ch h2 {
    margin: 0;
    font-size: var(--fs-section);
  }
  .ch small {
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .chips {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin: 10px 0;
  }
  .chip {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    min-height: 36px;
    padding: 4px 12px;
    border: 1px solid var(--line);
    border-radius: 999px;
    background: var(--paper);
    color: var(--ink-2);
    font: inherit;
    font-size: var(--fs-small);
    cursor: pointer;
  }
  .chip.on {
    border-color: var(--c);
    background: var(--paper-2);
    color: var(--ink);
    font-weight: 600;
  }
  .chip.main {
    cursor: default;
  }
  .chip .x {
    display: inline-grid;
    place-items: center;
    margin: 0 -6px 0 0;
    padding: 2px;
    border: 0;
    background: none;
    color: var(--ink-3);
    cursor: pointer;
  }
  .chip.sel select {
    border: 0;
    background: none;
    color: inherit;
    font: inherit;
    cursor: pointer;
  }
  @media (pointer: coarse) {
    .chip {
      min-height: 44px;
    }
  }
  .dot {
    width: 9px;
    height: 9px;
    border-radius: 50%;
  }
  .plot {
    position: relative;
    display: flex;
    gap: 6px;
  }
  .plot svg {
    flex: 1;
    min-width: 0;
    width: 100%;
    height: 240px;
    cursor: crosshair;
  }
  .ax {
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    padding: 4px 0 16px;
    font-size: var(--fs-label);
    min-width: 28px;
  }
  .ax.r {
    text-align: right;
  }
  .bn {
    position: absolute;
    top: 2px;
    transform: translateX(32px);
    color: var(--ink-2);
    font-size: var(--fs-label);
    white-space: nowrap;
  }
  .bn.end {
    transform: translateX(calc(32px - 100% - 6px));
  }
  .band {
    fill: var(--pz4);
    fill-opacity: 0.16;
  }
  .typ {
    fill: var(--ink-3);
    fill-opacity: 0.1;
  }
  .ln {
    fill: none;
    stroke: var(--c);
    stroke-width: 1.5;
    stroke-opacity: 0.55;
  }
  .m7 {
    fill: none;
    stroke: var(--c);
    stroke-width: 3;
    stroke-linejoin: round;
  }
  .lay {
    fill: none;
    stroke-width: 2.5;
    stroke-dasharray: 6 5;
  }
  .prev {
    fill: none;
    stroke: var(--ink-3);
    stroke-width: 2;
    stroke-opacity: 0.5;
  }
  .b {
    fill: var(--c);
    fill-opacity: 0.75;
  }
  .b.pk {
    fill-opacity: 1;
  }
  .pick {
    stroke: var(--ink);
    stroke-width: 1.5;
  }
  .xl {
    display: flex;
    justify-content: space-between;
    padding: 0 34px;
    color: var(--ink-3);
    font-size: var(--fs-label);
  }
  .legend {
    display: flex;
    flex-wrap: wrap;
    gap: 4px 14px;
    margin: 8px 0 0;
    padding: 0;
    list-style: none;
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .legend li {
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }
  .lsw {
    width: 16px;
    height: 3px;
    border-radius: 2px;
  }
  .lsw.dash {
    height: 0;
    border-top: 3px dashed;
    background: none;
  }
  .lsw.typ {
    height: 10px;
    background: var(--ink-3);
    opacity: 0.2;
  }
  .lsw.prev {
    background: var(--ink-3);
    opacity: 0.5;
  }
  .lsw.band {
    height: 10px;
    background: var(--pz4);
    opacity: 0.35;
  }
  .hint {
    margin: 8px 0 0;
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .two {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 16px;
  }
  .wdbars {
    display: flex;
    align-items: flex-end;
    gap: 6px;
    height: 130px;
    margin-top: 12px;
  }
  .wdc {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
    align-items: center;
    gap: 4px;
    height: 100%;
  }
  .wdc i {
    width: 100%;
    border-radius: 4px 4px 0 0;
    background: var(--c);
    opacity: 0.4;
  }
  .wdc span {
    color: var(--ink-3);
    font-size: var(--fs-label);
  }
  table {
    width: 100%;
    margin-top: 8px;
    border-collapse: collapse;
    font-size: var(--fs-small);
  }
  th,
  td {
    padding: 7px 4px;
    border-bottom: 1px solid var(--line);
    text-align: left;
  }
  th {
    color: var(--ink-3);
    font-weight: 500;
  }
  .n {
    text-align: right;
  }
  td.sm {
    color: var(--ink-2);
  }
  .lk {
    padding: 0;
    border: 0;
    background: none;
    color: inherit;
    font: inherit;
    text-decoration: underline;
    text-decoration-color: var(--line);
    cursor: pointer;
  }
  .lk.more {
    margin-top: 8px;
    color: var(--ink-2);
  }
  .dayall h3 {
    margin: 12px 0 4px;
    font-size: var(--fs-small);
    color: var(--ink-3);
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }
  .vals {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
    gap: 4px 16px;
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .vals a {
    display: flex;
    justify-content: space-between;
    gap: 8px;
    padding: 6px 0;
    border-bottom: 1px solid var(--line);
    color: var(--ink);
    text-decoration: none;
  }
  .vals small {
    color: var(--ink-3);
  }
  .trip {
    margin: 6px 0 0;
    color: var(--ink-2);
  }
  .dnav {
    display: flex;
    justify-content: space-between;
    gap: 8px;
    margin-top: 12px;
  }
</style>
