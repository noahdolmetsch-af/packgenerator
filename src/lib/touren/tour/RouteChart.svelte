<script>
  /**
   * Tour-Seite, Noah 20.10.2026 «3a»: the same route on other days as a small chart, oldest left. One bar
   * per time with its moving time; this tour is the dark bar. A tap on a bar opens that day's tour.
   * series: routeSeries() [{ id, day, movingS, hf, me }]; hrefOf(id); fmt(secs) → «1:08».
   */
  import { t } from '../../i18n.svelte.js';
  import { dates } from '../../review/fmt.js';

  let { series = [], hrefOf, fmt } = $props();
  const max = $derived(Math.max(...series.map((s) => s.movingS), 1));
  const min = $derived(Math.min(...series.map((s) => s.movingS)));
  // the bars start a bit under the fastest time, so the differences show
  const base = $derived(Math.max(0, min - (max - min) * 1.5 - 60));
  const pct = (s) => Math.round(((s - base) / (max - base)) * 100);
</script>

<ol class="rc" aria-label={t('Same route, other days')} data-route-chart>
  {#each series as s (s.id)}
    <li class:me={s.me}>
      <a href={hrefOf(s.id)} aria-current={s.me ? 'page' : null} aria-label={t('{day}: {time}', { day: dates(s.day), time: fmt(s.movingS) })}>
        <span class="v num">{fmt(s.movingS)}</span>
        <span class="bw"><span class="b" style:height="{pct(s.movingS)}%"></span></span>
        <span class="d num">{dates(s.day)}</span>
      </a>
    </li>
  {/each}
</ol>

<style>
  .rc {
    display: flex;
    align-items: stretch;
    gap: 6px;
    margin: 0;
    padding: 4px 0 0;
    overflow-x: auto;
    list-style: none;
    scrollbar-width: thin;
  }
  .rc li {
    flex: 1 0 64px;
    max-width: 110px;
  }
  .rc a {
    display: grid;
    grid-template-rows: auto 96px auto;
    gap: 4px;
    justify-items: center;
    min-height: 44px;
    color: var(--ink-2);
    text-decoration: none;
  }
  .bw {
    display: flex;
    align-items: flex-end;
    width: 100%;
    height: 96px;
  }
  .b {
    width: 100%;
    min-height: 6px;
    border-radius: 8px 8px 3px 3px;
    background: color-mix(in srgb, var(--accent) 28%, var(--paper));
  }
  .me .b {
    background: var(--accent);
  }
  .v {
    font: 600 var(--fs-small) / 1.2 var(--font-body);
  }
  .me .v {
    color: var(--ink);
  }
  .d {
    color: var(--ink-3);
    font-size: var(--fs-tiny);
    text-align: center;
  }
</style>
