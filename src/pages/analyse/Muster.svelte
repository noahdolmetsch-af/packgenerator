<script>
  /**
   * «Analyse» M4 «Muster und Rekorde» (Noah 27.10.2026 «alle Mockups 1:1», ideas «Saisons», «Serien und
   * Lücken»), under «Vergleichen»: «Wochenmuster» (when in the week you tick, per part of the day),
   * «Jahr gegen Jahr» (per month or season, this year against last year), «Rekorde» (your best values, «neu»
   * in the last 30 days) and «Serien und Lücken» per activity. Only to look at. Rules in lib/analyse/patterns.js.
   * days: the chosen period; byKey; acts; log; today.
   */
  import Seg from '../../lib/ui/Seg.svelte';
  import { valueText, unitText } from '../../lib/analyse/format.js';
  import { SLOTS, SEASONS, weekPattern, monthsOf, seasonsOf, tickDaysOf, runsAndGaps, bestWeek, extremeOf, bestMonth, isNew } from '../../lib/analyse/patterns.js';
  import { ticksPerDay } from '../../lib/analyse/overview.js';
  import { addDays } from '../../lib/analyse.js';
  import { actName } from '../../lib/flow/ui.svelte.js';
  import { t, num, locale } from '../../lib/i18n.svelte.js';

  let { days = [], byKey = new Map(), acts = [], log = [], today } = $props();

  const LS = 'pg.analyse.patterns';
  const saved = (() => {
    try {
      return JSON.parse(localStorage.getItem(LS) ?? '{}') ?? {};
    } catch {
      return {};
    }
  })();
  let patAct = $state(typeof saved.act === 'string' ? saved.act : '');
  let yearKey = $state(typeof saved.year === 'string' ? saved.year : null);
  let byWhat = $state(saved.by === 'season' ? 'season' : 'month');
  $effect(() => {
    try {
      localStorage.setItem(LS, JSON.stringify({ act: patAct, year: yearKey, by: byWhat }));
    } catch {
      /* a private window: the choice is only for now */
    }
  });

  const dfmt = (d, o) => new Date(`${d}T12:00:00Z`).toLocaleDateString(locale(), { timeZone: 'UTC', ...o });
  const WD = $derived(Array.from({ length: 7 }, (_, i) => dfmt(`2026-10-${String(5 + i).padStart(2, '0')}`, { weekday: 'short' })));
  const WD_LONG = $derived(Array.from({ length: 7 }, (_, i) => dfmt(`2026-10-${String(5 + i).padStart(2, '0')}`, { weekday: 'long' })));
  const SLOT_NAMES = { morning: 'Morning|patterns', noon: 'Midday|patterns', evening: 'Evening|patterns', night: 'Night|patterns' };

  // — Wochenmuster —
  const pat = $derived(weekPattern(log, days, patAct ? new Set([patAct]) : null));
  const level = (n) => (!n || !pat.top ? 0 : Math.max(1, Math.ceil((n / pat.top) * 4)));
  const cellName = (c) => `${WD_LONG[c.wd]} ${t(SLOT_NAMES[SLOTS[c.slot].key])}`;

  // — Jahr gegen Jahr —
  const year = $derived(Number(today.slice(0, 4)));
  const perDay = $derived(ticksPerDay(log));
  const ticksItem = $derived({ key: 'ticks', name: t('Ticks|compare'), unit: '×', sum: true, get: (d) => perDay.get(d) ?? null });
  const YEAR_KEYS = ['km:bike', 'ticks', 'sleep', 'steps', 'azm', 'rhr'];
  const yearValues = $derived(
    YEAR_KEYS.map((k) => (k === 'ticks' ? ticksItem : byKey.get(k)))
      .filter((it) => it?.get)
      .map((it) => ({ it, now: monthsOf(year, it.get, { sum: it.sum, today }), prev: monthsOf(year - 1, it.get, { sum: it.sum, today }) }))
      .filter((x) => [...x.now, ...x.prev].some((v) => v != null)),
  );
  const yv = $derived(yearValues.find((x) => x.it.key === yearKey) ?? yearValues[0] ?? null);
  const MONTHS = $derived(Array.from({ length: 12 }, (_, i) => dfmt(`2026-${String(i + 1).padStart(2, '0')}-15`, { month: 'short' })));
  const SEASON_NAMES = { winter: 'Winter|patterns', spring: 'Spring|patterns', summer: 'Summer|patterns', autumn: 'Autumn|patterns' };
  const bars = $derived.by(() => {
    if (!yv) return [];
    if (byWhat === 'season') {
      const n = seasonsOf(yv.now, yv.it.sum);
      const p = seasonsOf(yv.prev, yv.it.sum);
      return SEASONS.map((s, i) => ({ key: s.key, label: t(SEASON_NAMES[s.key]), now: n[i], prev: p[i] }));
    }
    return MONTHS.map((m, i) => ({ key: String(i), label: m, now: yv.now[i], prev: yv.prev[i] }));
  });
  const barTop = $derived(Math.max(1e-9, ...bars.flatMap((b) => [b.now ?? 0, b.prev ?? 0])));
  const W = 600;
  const H = 170;
  const BASE = H - 6;
  const bh = (v) => ((v ?? 0) / barTop) * (BASE - 10);
  const yOpts = [
    { key: 'month', name: '' },
    { key: 'season', name: '' },
  ];
  const byOpts = $derived(yOpts.map((o) => ({ ...o, name: o.key === 'month' ? t('Months|patterns') : t('Seasons|patterns') })));
  const vText = (it, v) => (v == null ? '–' : `${valueText(it, v, num)}${unitText(it) ? ` ${unitText(it)}` : ''}`);

  // — Rekorde —
  const allDays = $derived(Array.from({ length: 731 }, (_, i) => addDays(today, -730 + i)));
  const records = $derived.by(() => {
    const out = [];
    const anyRun = runsAndGaps(tickDaysOf(log), today);
    if (anyRun.longest > 1) out.push({ key: 'run', name: t('Longest run of ticks|patterns'), best: t('{n} days|overview', { n: anyRun.longest }), day: anyRun.longestEnd, when: dfmt(anyRun.longestEnd, { month: 'short', year: 'numeric' }) });
    const top = acts
      .map((a) => ({ a, w: bestWeek(log, a.id) }))
      .filter((x) => x.w && x.w.n > 1)
      .sort((x, y) => y.w.n - x.w.n)
      .slice(0, 3);
    for (const x of top) out.push({ key: `week:${x.a.id}`, name: t('Most {name} in a week|patterns', { name: actName(x.a) }), best: `${x.w.n}×`, day: addDays(x.w.key, 6), when: t('week of {day}|patterns', { day: dfmt(x.w.key, { day: 'numeric', month: 'short', year: 'numeric' }) }) });
    const bike = byKey.get('km:bike');
    const bm = bike?.get ? bestMonth(allDays, bike.get) : null;
    if (bm) out.push({ key: 'bikeMonth', name: t('Bike km in a month|patterns'), best: vText(bike, bm.v), day: `${bm.key}-28`, when: dfmt(`${bm.key}-15`, { month: 'short', year: 'numeric' }) });
    const one = (key, name, low = false) => {
      const it = byKey.get(key);
      const x = it?.get ? extremeOf(allDays, it.get, low) : null;
      if (x) out.push({ key, name, best: vText(it, x.v), day: x.day, when: dfmt(x.day, { day: 'numeric', month: 'short', year: 'numeric' }) });
    };
    one('rhr', t('Lowest resting pulse|patterns'), true);
    one('steps', t('Most steps|patterns'));
    one('sleep', t('Longest sleep|patterns'));
    one('azm', t('Most active zone minutes|patterns'));
    one('hrv', t('Highest HRV|patterns'));
    return out;
  });

  // — Serien und Lücken —
  const runs = $derived(
    acts
      .map((a) => ({ a, r: runsAndGaps(tickDaysOf(log, a.id), today) }))
      .filter((x) => x.r.since != null)
      .sort((x, y) => x.r.since - y.r.since || y.r.longest - x.r.longest),
  );
  const sinceText = (n) => (n === 0 ? t('today|patterns') : n === 1 ? t('yesterday|patterns') : t('{n} days ago|patterns', { n }));
</script>

<div class="two">
  <section class="card mu" aria-labelledby="wp-h" data-week-pattern>
    <div class="ch"><h2 id="wp-h">{t('Week pattern|patterns')}</h2><small>{t('when you tick · {n} days|patterns', { n: days.length })}</small></div>
    <label class="asel">
      <span class="sr">{t('Activity|patterns')}</span>
      <select class="sel" bind:value={patAct} data-pat-act>
        <option value="">{t('All activities|patterns')}</option>
        {#each acts as a (a.id)}<option value={a.id}>{actName(a)}</option>{/each}
      </select>
    </label>
    <div class="wpw">
      <table class="wp">
        <thead><tr><td></td>{#each WD as w, i (i)}<th scope="col">{w}</th>{/each}</tr></thead>
        <tbody>
          {#each SLOTS as s, slot (s.key)}
            <tr>
              <th scope="row">{t(SLOT_NAMES[s.key])}</th>
              {#each pat.grid[slot] as n, wd (wd)}
                <td><span class="pc l{level(n)}" data-pat-cell="{slot}-{wd}" aria-label="{cellName({ slot, wd })}: {n}">{n || ''}</span></td>
              {/each}
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
    {#if pat.most}
      <p class="say" data-pat-say>{t('Most: {most}.|patterns', { most: cellName(pat.most) })}{#if pat.least}&nbsp;{t('Least: {least}.|patterns', { least: cellName(pat.least) })}{/if}</p>
    {:else}
      <p class="hint">{t('No ticks with a time in this period yet.|patterns')}</p>
    {/if}
  </section>

  <section class="card mu" aria-labelledby="yy-h" data-year-year>
    <div class="ch"><h2 id="yy-h">{t('Year against year|patterns')}</h2><small>{year} {t('against|compare')} {year - 1}</small></div>
    {#if yv}
      <div class="row">
        <label class="asel">
          <span class="sr">{t('Value|compare')}</span>
          <select class="sel" value={yv.it.key} onchange={(e) => (yearKey = e.currentTarget.value)} data-yy-value>
            {#each yearValues as x (x.it.key)}<option value={x.it.key}>{x.it.name}</option>{/each}
          </select>
        </label>
        <Seg options={byOpts} value={byWhat} onchange={(v) => (byWhat = v)} label={t('Group by|patterns')} full={false} />
      </div>
      <svg viewBox="0 0 {W} {H}" role="img" aria-label="{yv.it.name}: {year} {t('against|compare')} {year - 1}">
        <line class="base" x1="0" x2={W} y1={BASE} y2={BASE} />
        {#each bars as b, i (b.key)}
          {@const slot = W / bars.length}
          {@const bw = Math.max(3, slot / 2 - 4)}
          <rect class="prev" x={i * slot + slot / 2 - bw - 1} width={bw} y={BASE - bh(b.prev)} height={bh(b.prev)} data-yy-prev={b.key}><title>{b.label} {year - 1}: {vText(yv.it, b.prev)}</title></rect>
          <rect class="now" x={i * slot + slot / 2 + 1} width={bw} y={BASE - bh(b.now)} height={bh(b.now)} data-yy-now={b.key}><title>{b.label} {year}: {vText(yv.it, b.now)}</title></rect>
        {/each}
      </svg>
      <div class="xl" style="--n: {bars.length}" aria-hidden="true">{#each bars as b (b.key)}<span>{b.label}</span>{/each}</div>
      <ul class="legend"><li><i class="lsw now"></i>{year}</li><li><i class="lsw prev"></i>{year - 1}</li></ul>
      <p class="hint">{yv.it.sum ? t('Total per month or season.|patterns') : t('Mean per month or season.|patterns')}</p>
    {:else}
      <p class="hint">{t('No values for these two years yet.|patterns')}</p>
    {/if}
  </section>
</div>

<div class="two">
  <section class="card mu" aria-labelledby="rec-h" data-records>
    <div class="ch"><h2 id="rec-h">{t('Records|patterns')}</h2><small>{t('your best values · 2 years|patterns')}</small></div>
    {#if records.length}
      <div class="tw"><table>
        <thead><tr><th scope="col">{t('Value|compare')}</th><th scope="col">{t('Best|patterns')}</th><th scope="col">{t('When|patterns')}</th></tr></thead>
        <tbody>
          {#each records as r (r.key)}
            <tr data-record={r.key}><th scope="row">{r.name}{#if isNew(r.day, today)}&nbsp;<span class="new">{t('new|patterns')}</span>{/if}</th><td class="num"><b>{r.best}</b></td><td>{r.when}</td></tr>
          {/each}
        </tbody>
      </table></div>
    {:else}
      <p class="hint">{t('No records yet.|patterns')}</p>
    {/if}
  </section>

  <section class="card mu" aria-labelledby="rg-h" data-runs>
    <div class="ch"><h2 id="rg-h">{t('Runs and gaps|patterns')}</h2><small>{t('per activity · days in a row|patterns')}</small></div>
    {#if runs.length}
      <div class="tw"><table>
        <thead><tr><th scope="col">{t('Activity|patterns')}</th><th scope="col">{t('Now|patterns')}</th><th scope="col">{t('Longest|patterns')}</th><th scope="col">{t('Longest gap|patterns')}</th><th scope="col">{t('Last|patterns')}</th></tr></thead>
        <tbody>
          {#each runs as x (x.a.id)}
            <tr data-run={x.a.id}><th scope="row">{actName(x.a)}</th><td class="num">{x.r.current || '–'}</td><td class="num">{x.r.longest}</td><td class="num">{x.r.gap}</td><td>{sinceText(x.r.since)}</td></tr>
          {/each}
        </tbody>
      </table></div>
      <p class="hint">{t('Numbers are days. «Now» counts while you ticked today or yesterday.|patterns')}</p>
    {:else}
      <p class="hint">{t('No ticks yet.|patterns')}</p>
    {/if}
  </section>
</div>

<style>
  .two {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
    gap: 16px;
  }
  @media (max-width: 860px) {
    .two {
      grid-template-columns: minmax(0, 1fr);
    }
  }
  .mu {
    display: flex;
    flex-direction: column;
    gap: 10px;
    min-width: 0;
  }
  .ch {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    flex-wrap: wrap;
    gap: 4px 8px;
  }
  .ch h2 {
    margin: 0;
    font-size: var(--fs-section);
  }
  .ch small {
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .row {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px 12px;
  }
  .asel .sel {
    max-width: 100%;
  }
  .wpw,
  .tw {
    overflow-x: auto;
  }
  .wp {
    width: 100%;
    border-collapse: separate;
    border-spacing: 4px;
    font-size: var(--fs-small);
  }
  .wp th {
    color: var(--ink-3);
    font-weight: 500;
    text-align: center;
  }
  .wp th[scope='row'] {
    text-align: left;
    padding-right: 6px;
    white-space: nowrap;
  }
  .wp td {
    padding: 0;
  }
  .pc {
    display: grid;
    place-items: center;
    min-width: 28px;
    height: 28px;
    border-radius: 6px;
    background: var(--paper-2);
    color: var(--ink);
    font-variant-numeric: tabular-nums;
  }
  .pc.l0 {
    height: 10px;
    margin: 9px 0;
  }
  .pc.l1 {
    background: color-mix(in srgb, var(--l1) 22%, var(--paper));
  }
  .pc.l2 {
    background: color-mix(in srgb, var(--l1) 40%, var(--paper));
  }
  .pc.l3 {
    background: color-mix(in srgb, var(--l1) 65%, var(--paper));
    color: var(--paper);
  }
  .pc.l4 {
    background: var(--l1);
    color: var(--paper);
  }
  svg {
    width: 100%;
    height: auto;
  }
  .base {
    stroke: var(--line);
  }
  rect.now {
    fill: var(--l1);
  }
  rect.prev {
    fill: var(--line);
  }
  .xl {
    display: grid;
    grid-template-columns: repeat(var(--n), minmax(0, 1fr));
    color: var(--ink-3);
    font-size: var(--fs-label);
    text-align: center;
  }
  .xl span {
    overflow: hidden;
    white-space: nowrap;
  }
  .legend {
    display: flex;
    flex-wrap: wrap;
    gap: 6px 16px;
    margin: 0;
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
    display: inline-block;
    width: 12px;
    height: 10px;
    border-radius: 2px;
  }
  .lsw.now {
    background: var(--l1);
  }
  .lsw.prev {
    background: var(--line);
  }
  .say {
    margin: 0;
    font-size: var(--fs-small);
  }
  .hint {
    margin: 0;
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  table:not(.wp) {
    width: 100%;
    border-collapse: collapse;
    font-size: var(--fs-small);
  }
  table:not(.wp) th,
  table:not(.wp) td {
    padding: 6px 4px;
    border-bottom: 1px solid var(--line);
    text-align: right;
  }
  table:not(.wp) td {
    white-space: nowrap;
  }
  table:not(.wp) th[scope='row'],
  table:not(.wp) thead th:first-child {
    text-align: left;
    font-weight: 500;
    overflow-wrap: break-word;
  }
  table:not(.wp) thead th {
    color: var(--ink-3);
    font-weight: 500;
  }
  .new {
    display: inline-block;
    padding: 0 6px;
    border-radius: 999px;
    background: color-mix(in srgb, var(--pz4) 30%, var(--paper));
    color: var(--ink);
    font-size: var(--fs-label);
    font-weight: 600;
  }
</style>
