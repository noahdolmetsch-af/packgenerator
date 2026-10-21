<script>
  /**
   * «Peak Power» 1:1 wie Strava (Noah 21.10.2026 «beide übersichten 1:1 übernehmen»): the best watts over
   * 5 s, 15 s, 30 s, 1, 2, 5 and 10 minutes and longer, as long as the ride lasted. The list on the left of
   * Strava's activity page; used on the tour page (Analyse) and in the Rückblick. a: the activity.
   */
  import { t, locale } from '../../i18n.svelte.js';
  import { PEAK_SPANS, peakOf } from '../stravaana.js';
  import { Zap } from '@lucide/svelte';

  let { a } = $props();
  // as on Strava: only spans the ride was in motion for (19:39 moving → up to 10 minutes)
  const long = $derived(Number(a?.own?.movingS ?? a?.movingS) || Number(a?.elapsedS) || Infinity);
  const rows = $derived(
    PEAK_SPANS.filter(([s]) => s <= long)
      .map(([s, n, u]) => ({ s, label: u === 's' ? t('{n} s|peak', { n }) : u === 'min' ? t('{n} min|peak', { n }) : t('{n} h|peak', { n }), w: peakOf(a, s) }))
      .filter((p) => p.w != null),
  );
  const w0 = (v) => Number(v).toLocaleString(locale(), { maximumFractionDigits: 0 });
</script>

{#if rows.length}
  <div class="peak" data-ana-peak>
    <p class="ph"><Zap size={16} aria-hidden="true" />{t('Peak Power')}</p>
    <table>
      <tbody>{#each rows as p (p.s)}<tr><th scope="row">{p.label}</th><td>{w0(p.w)} <small>W</small></td></tr>{/each}</tbody>
    </table>
  </div>
{/if}

<style>
  .peak {
    border: 1px solid var(--card-line);
    border-radius: var(--radius-card);
    background: var(--paper);
    overflow: hidden;
  }
  .ph {
    display: flex;
    align-items: center;
    gap: 6px;
    margin: 0;
    padding: 8px 12px;
    border-bottom: 2px solid var(--accent);
    font-weight: 600;
  }
  table {
    width: 100%;
    border-collapse: collapse;
    font-size: var(--fs-small);
  }
  th,
  td {
    padding: 8px 12px;
    border-bottom: 1px solid var(--line);
    font-variant-numeric: tabular-nums;
  }
  tr:last-child th,
  tr:last-child td {
    border-bottom: 0;
  }
  th {
    font-weight: 400;
    text-align: left;
  }
  td {
    color: var(--accent);
    text-align: right;
  }
</style>
