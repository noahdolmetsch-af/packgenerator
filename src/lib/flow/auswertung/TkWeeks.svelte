<script>
  /**
   * «Haken pro Woche» (Noah 20.10.2026, like «Leistungsbereiche als Balken» on the ride page): one bar
   * per week, stacked by ring (Bewegung, Achtsamkeit, Erholung), the count on top. Observation only.
   */
  import AnaCard from '../../training/AnaCard.svelte';
  import { perWeek } from '../auswertung.js';
  import { RING_WORDS, dayName } from './words.js';
  import { t, num } from '../../i18n.svelte.js';

  let { d } = $props();
  // the rings in the chart colours of the ride page (green, blue-grey, yellow), so they stay apart
  const RING_COLOUR = { move: 'var(--ch-w)', mind: 'var(--pz2)', rest: 'var(--pz4)' };
  const weeks = $derived(perWeek(d.list, d.from, d.to, d.ringOf));
  // a year has 53 weeks: the bars stay readable, the labels only every few weeks
  const step = $derived(weeks.length > 26 ? 8 : weeks.length > 8 ? 4 : 1);
  const most = $derived(Math.max(1, ...weeks.map((w) => w.n)));
  const rings = $derived(Object.keys(RING_WORDS).filter((r) => weeks.some((w) => w.rings[r] > 0)));
  const mean = $derived(weeks.length ? Math.round((weeks.reduce((s, w) => s + w.n, 0) / weeks.length) * 10) / 10 : 0);
  const aria = $derived(weeks.map((w) => `${dayName(w.mon)}: ${w.n}`).join(', '));
</script>

{#if weeks.some((w) => w.n > 0)}
  <AnaCard key="tkweeks" sub={t('Ticks')} wide>
    <div class="bars num" class:many={weeks.length > 26} role="img" aria-label={t('Ticks per week: {list}', { list: aria })} style:grid-template-columns="repeat({weeks.length}, minmax(0, 1fr))">
      {#each weeks as w, i (w.mon)}
        <div class="col" data-week={w.mon}>
          {#if weeks.length <= 26}<b>{w.n || ''}</b>{/if}
          <span class="stack" style:height="{Math.max(w.n ? 3 : 0, (w.n / most) * 100)}px">
            {#each rings as r (r)}{#if w.rings[r]}<i style:flex-grow={w.rings[r]} style:background={RING_COLOUR[r]}></i>{/if}{/each}
          </span>
          <small>{i % step === 0 ? dayName(w.mon) : ''}</small>
        </div>
      {/each}
    </div>
    {#if rings.length > 1}
      <ul class="lg">{#each rings as r (r)}<li><i style:background={RING_COLOUR[r]}></i>{t(RING_WORDS[r])}</li>{/each}</ul>
    {/if}
    <p class="cap num">{t('Ticks per week, Monday to Sunday. Ø {n} per week.', { n: num(mean) })}</p>
  </AnaCard>
{/if}

<style>
  .bars {
    display: grid;
    gap: 4px;
    height: 150px;
    align-items: end;
  }
  .bars.many {
    gap: 2px;
  }
  .col {
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
    height: 100%;
    min-width: 0;
  }
  .col b {
    text-align: center;
    font-size: var(--fs-tiny);
    margin-bottom: 4px;
  }
  .stack {
    display: flex;
    flex-direction: column-reverse;
    border-radius: 4px 4px 0 0;
    overflow: hidden;
  }
  .stack i {
    display: block;
    flex-basis: 0;
  }
  .col small {
    height: 1.4em;
    margin-top: 6px;
    color: var(--ink-3);
    font-size: var(--fs-tiny);
    white-space: nowrap;
    overflow: visible;
  }
  .lg {
    display: flex;
    flex-wrap: wrap;
    gap: 4px 14px;
    margin: 0;
    padding: 0;
    list-style: none;
    color: var(--ink-2);
    font-size: var(--fs-tiny);
  }
  .lg li {
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .lg i {
    width: 10px;
    height: 10px;
    border-radius: 2px;
  }
</style>
