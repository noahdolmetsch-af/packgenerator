<script>
  /**
   * TR7e «Leistungskurve: 90 Tage gegen das Jahr»: the best mean power per span (5 s … 60 min) of the last
   * 90 days (green) against the calendar year (grey), and one calm sentence on 20 and 60 minutes. weeks.js.
   */
  import AnaCard from '../AnaCard.svelte';
  import { t, locale } from '../../i18n.svelte.js';
  import { curveBests, nearSame, niceTicks } from './weeks.js';

  let { acts = [], today = '' } = $props();
  const rows = $derived(today ? curveBests(acts, today) : []);
  const has = $derived(rows.filter((r) => r.d90 || r.year).length >= 2);
  const year = $derived(today.slice(0, 4));
  const spanName = (s) => (s < 60 ? t('{n} s', { n: s }) : t('{n} min', { n: s / 60 }));
  const monthName = (day) => new Date(`${day}T12:00:00Z`).toLocaleDateString(locale(), { month: 'long', timeZone: 'UTC' });

  let w = $state(0);
  const H = 140;
  const T = 10;
  const L = 40;
  const R = 26;
  const width = $derived(Math.max(240, w || 600));
  const ax = $derived.by(() => {
    if (!has) return null;
    const vals = rows.flatMap((r) => [r.d90?.w, r.year?.w]).filter((v) => v > 0);
    return niceTicks(Math.min(...vals) * 0.9, Math.max(...vals), 5);
  });
  const lx = (s) => Math.log(s);
  const X = (s) => L + ((lx(s) - lx(rows[0].span)) / (lx(rows.at(-1).span) - lx(rows[0].span))) * (width - L - R);
  const Y = (v) => T + ((ax.hi - v) / (ax.hi - ax.lo)) * H;
  const path = (k) =>
    rows
      .filter((r) => r[k])
      .map((r, i) => `${i ? 'L' : 'M'}${X(r.span).toFixed(1)},${Y(r[k].w).toFixed(1)}`)
      .join('');

  const at = (s) => rows.find((r) => r.span === s);
  const sentence = (s) => {
    const r = at(s);
    if (!r?.d90 || !r?.year) return '';
    const near = nearSame(r.d90.w, r.year.w);
    const name = spanName(s);
    if (near === 'same') return t('{span} the same: {w} W.', { span: name, w: r.d90.w });
    if (near === 'near') return t('{span} nearly the same: {a} / {b} W.', { span: name, a: r.d90.w, b: r.year.w });
    if (s !== 1200) return '';
    return t('{span}: {a} W in 90 days, {b} W in the year ({month}).', { span: name, a: r.d90.w, b: r.year.w, month: monthName(r.year.day) });
  };
  const cap = $derived(has ? [sentence(1200), sentence(3600)].filter(Boolean).join(' ') : '');
  const label = $derived(
    rows.map((r) => `${spanName(r.span)}: ${r.d90 ? `${r.d90.w} W` : '–'} / ${r.year ? `${r.year.w} W` : '–'}`).join(', '),
  );
</script>

{#if has}
  <AnaCard key="pcurve" wide sub={t('best mean power per duration')}>
    <div class="plot" bind:clientWidth={w}>
      <svg width={width} height={H + T + 22} viewBox="0 0 {width} {H + T + 22}" role="img" aria-label={label}>
        {#each ax.ticks as v (v)}
          <line x1={L} x2={width - R} y1={Y(v)} y2={Y(v)} class="grid" />
          <text x={L - 8} y={Y(v) + 4} text-anchor="end">{v}</text>
        {/each}
        <path d={path('year')} class="yr" />
        <path d={path('d90')} class="d90" />
        {#each rows as r (r.span)}
          {#if r.year}<circle cx={X(r.span)} cy={Y(r.year.w)} r="3" class="yr" />{/if}
          {#if r.d90}<circle cx={X(r.span)} cy={Y(r.d90.w)} r="3" class="d90" />{/if}
          {@const last = r.span === rows.at(-1).span}
          <text x={last ? width - 2 : X(r.span)} y={H + T + 18} text-anchor={last ? 'end' : r.span === rows[0].span ? 'start' : 'middle'}>{spanName(r.span)}</text>
        {/each}
      </svg>
    </div>
    <ul class="leg">
      <li><i class="k d90"></i>{t('best of the last 90 days')}</li>
      <li><i class="k yr"></i>{t('best {year}', { year })}</li>
    </ul>
    {#if cap}<p class="cap">{cap}</p>{/if}
  </AnaCard>
{/if}

<style>
  .plot {
    min-width: 0;
    overflow: hidden;
  }
  svg {
    display: block;
  }
  text {
    fill: var(--ink-3);
    font: 400 var(--fs-tiny) / 1 var(--font-body);
  }
  .grid {
    stroke: var(--line);
    stroke-dasharray: 3 4;
  }
  path {
    fill: none;
    stroke-width: 2.5;
    stroke-linejoin: round;
  }
  path.d90 {
    stroke: var(--ch-w);
  }
  path.yr {
    stroke: var(--pz1);
  }
  circle.d90 {
    fill: var(--ch-w);
  }
  circle.yr {
    fill: var(--pz1);
  }
  .leg {
    display: flex;
    flex-wrap: wrap;
    gap: 4px 16px;
    margin: 0;
    padding: 0;
    list-style: none;
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .leg li {
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }
  .k {
    display: inline-block;
    width: 14px;
    height: 0;
    border-top: 3px solid;
  }
  .k.d90 {
    border-color: var(--ch-w);
  }
  .k.yr {
    border-color: var(--pz1);
  }
</style>
