<script>
  /**
   * TR7a «Puls mal Leistung» (Noah 14.10.2026 «TR5–TR7 freigegeben»): minutes per heart rate zone (row)
   * and power zone (column), shaded by the minutes. Only with the grid from Strava (power meter) and an
   * FTP estimate. A real table; on the phone the cells shrink to fit.
   */
  import AnaCard from '../AnaCard.svelte';
  import { gridCells } from './analysen.js';
  import { zones } from '../../strava/zones.svelte.js';
  import { ZONE_NAMES, ftpEstimate, powerBounds } from '../../training.js';
  import { t, num } from '../../i18n.svelte.js';

  let { act = null, all = [], today = '' } = $props();
  const pb = $derived(powerBounds(ftpEstimate(all, today)));
  const cells = $derived(act?.hw && pb ? gridCells(act.hw, zones.bounds, pb) : null);
  const most = $derived(cells ? Math.max(1, ...cells.flat()) : 1);
  const shade = (m) => (m > 0 ? Math.round(14 + (m / most) * 76) : 0);
</script>

{#if cells}
  <AnaCard key="grid" sub={t('Minutes')} wide>
    <div class="gw">
      <table class="grid">
        <thead>
          <tr>
            <th scope="col" class="rh">{t('Heart rate ↓ · power →|an')}</th>
            {#each cells[0] as _, j (j)}<th scope="col">Z{j + 1}</th>{/each}
          </tr>
        </thead>
        <tbody>
          {#each cells as row, i (i)}
            <tr>
              <th scope="row" class="rh">Z{i + 1} {t(ZONE_NAMES[i])}</th>
              {#each row as m, j (j)}
                {@const s = shade(m)}
                <td class:dark={s > 55} style:--s="{s}%" aria-label={t('{m} min in heart rate zone {h} and power zone {p}', { m: num(m), h: i + 1, p: j + 1 })}>{m > 0 ? num(m) : '·'}</td>
              {/each}
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
    <p class="cap">{t('Minutes per heart rate zone (row) and power zone (column). Bottom left corner = high heart rate at little power.')}</p>
  </AnaCard>
{/if}

<style>
  .gw {
    min-width: 0;
  }
  .grid {
    width: 100%;
    border-collapse: separate;
    border-spacing: 2px;
    font-variant-numeric: tabular-nums;
    font-size: var(--fs-small);
    table-layout: fixed;
  }
  th {
    color: var(--ink-3);
    font: 600 var(--fs-tiny) / 1.3 var(--font-body);
    letter-spacing: 0.04em;
    padding: 4px 2px;
  }
  thead .rh {
    text-transform: uppercase;
    text-align: left;
    border-bottom: 1px solid var(--line);
  }
  .rh {
    width: 34%;
  }
  tbody .rh {
    text-align: left;
    color: var(--ink);
    font: 400 var(--fs-small) / 1.3 var(--font-body);
    letter-spacing: 0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  td {
    height: 30px;
    padding: 0;
    text-align: center;
    border-radius: 3px;
    color: var(--ink-2);
    background: color-mix(in srgb, var(--ch-w) var(--s), var(--paper-2));
  }
  td.dark {
    color: var(--brand-ink);
  }
  @media (max-width: 640px) {
    .rh {
      width: 30%;
    }
    tbody .rh {
      font-size: var(--fs-tiny);
    }
    thead .rh {
      font-size: var(--fs-tiny);
      white-space: normal;
    }
    td {
      height: 28px;
      font-size: var(--fs-tiny);
    }
  }
</style>
