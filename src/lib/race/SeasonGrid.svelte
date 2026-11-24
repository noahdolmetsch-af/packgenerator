<script>
  /**
   * «Saison-Raster» (Noah 24.11.2026 «C mit A»): the chosen races of one year as bars on a grid of twelve
   * months, the ones on the same days hatched in red. A picture of the season; the details stand in the
   * list below it. items: [{ key, name, from, to, state: 'on' | 'clash' | 'known' }].
   */
  import { packLanes, yearPos } from './atlas.js';
  import { t, locale } from '../i18n.svelte.js';

  let { items = [], year = new Date().getFullYear() } = $props();
  let w = $state(360);
  const months = $derived(Array.from({ length: 12 }, (_, m) => new Date(Date.UTC(Number(year), m, 15)).toLocaleDateString(locale(), { month: 'short', timeZone: 'UTC' }).replace('.', '')));
  const narrow = $derived(w < 520);
  const bars = $derived(
    items
      .map((it) => {
        const x0 = yearPos(it.from, year);
        const x1 = yearPos(it.to, year);
        if (x0 == null && x1 == null) return null;
        const a = Math.max(0, x0 ?? 0);
        const b = Math.min(100, (x1 ?? 100) + 100 / 365);
        const label = ((it.name.length * 8.5 + 14) / Math.max(w, 1)) * 100;
        const right = b + 1.6 + label <= 100;
        const lo = right ? a : Math.max(0, a - 0.8 - label);
        const hi = right ? b + 1.6 + label : b;
        return { ...it, a, b, label, right, lo, hi };
      })
      .filter(Boolean),
  );
  const lanes = $derived(packLanes(bars.map((b) => ({ a: b.lo, b: b.hi })), 0.6));
  const rows = $derived(Math.max(1, ...lanes.map((l) => l + 1)));
</script>

<div class="sg" bind:clientWidth={w} role="img" aria-label={t('Season {year}: {n} races', { year, n: bars.length })} data-season-grid>
  <div class="mo" aria-hidden="true">{#each months as m (m)}<span>{narrow ? m.slice(0, 1) : m}</span>{/each}</div>
  <div class="lanes" style:height="{rows * 30}px" aria-hidden="true">
    {#each bars as b, i (b.key)}
      <span class="bar {b.state}" style:left="{b.a}%" style:width="{Math.max(b.b - b.a, 1.2)}%" style:top="{lanes[i] * 30 + 4}px"></span>
      <span class="lab" style:left="{b.right ? b.b + 1.6 : b.lo}%" style:top="{lanes[i] * 30 + 5}px" style:width="{b.label}%" class:r={!b.right}>{b.name}</span>
    {/each}
  </div>
  <div class="key" aria-hidden="true"><span><i class="bar on"></i>{t('chosen|race')}</span><span><i class="bar clash"></i>{t('same days|race')}</span><span><i class="bar known"></i>{t('already here|race')}</span></div>
</div>

<style>
  .sg {
    padding: 12px 14px 10px;
    border: 1px solid var(--card-line);
    border-radius: var(--radius-card);
    background: var(--paper);
    min-width: 0;
  }
  .mo {
    display: grid;
    grid-template-columns: repeat(12, 1fr);
    padding-bottom: 4px;
    border-bottom: 1px solid var(--line);
    font-size: var(--fs-tiny);
    font-weight: 700;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    color: var(--ink-3);
  }
  .mo span {
    padding-left: 3px;
    border-left: 1px solid var(--line);
    overflow: hidden;
  }
  .mo span:first-child {
    border-left: 0;
  }
  .lanes {
    position: relative;
    background: repeating-linear-gradient(90deg, transparent 0, transparent calc(100% / 12 - 1px), var(--line) calc(100% / 12 - 1px), var(--line) calc(100% / 12));
  }
  .bar {
    position: absolute;
    height: 22px;
    min-width: 10px;
    border-radius: 7px;
    background: var(--accent);
  }
  .bar.clash {
    background: repeating-linear-gradient(135deg, var(--bad) 0 5px, color-mix(in srgb, var(--bad) 70%, var(--paper)) 5px 10px);
  }
  .bar.known {
    background: var(--paper-2);
    border: 1.5px dashed var(--line-strong);
  }
  .lab {
    position: absolute;
    height: 22px;
    line-height: 22px;
    font-size: var(--fs-small);
    font-weight: 600;
    color: var(--ink-2);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    box-sizing: border-box;
    padding: 0 6px;
  }
  .lab.r {
    text-align: right;
  }
  .key {
    display: flex;
    flex-wrap: wrap;
    gap: 4px 14px;
    margin-top: 6px;
    font-size: var(--fs-tiny);
    color: var(--ink-3);
  }
  .key span {
    display: inline-flex;
    align-items: center;
    gap: 5px;
  }
  .key .bar {
    position: static;
    display: inline-block;
    width: 18px;
    height: 10px;
    min-width: 0;
    border-radius: 4px;
  }
</style>
