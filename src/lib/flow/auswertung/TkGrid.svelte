<script>
  /**
   * «Aktivität mal Wochentag» (Noah 20.10.2026, like «Puls mal Leistung» on the ride page): the ticks per
   * activity (row) and weekday (column), shaded by the count. A real table; on the phone the cells shrink.
   */
  import AnaCard from '../../training/AnaCard.svelte';
  import { gridOf, inRange } from '../auswertung.js';
  import { weekdayShort } from './words.js';
  import { t, num } from '../../i18n.svelte.js';

  let { d } = $props();
  const rows = $derived(gridOf(inRange(d.list, d.from, d.to), d.ids));
  const most = $derived(Math.max(1, ...rows.flatMap((r) => r.n)));
  const shade = (m) => (m > 0 ? Math.round(14 + (m / most) * 76) : 0);
</script>

{#if rows.length > 1}
  <AnaCard key="tkgrid" sub={t('Ticks')} wide>
    <table class="grid">
      <thead>
        <tr>
          <th scope="col" class="rh">{t('Activity ↓ · weekday →|tk')}</th>
          {#each Array(7) as _, j (j)}<th scope="col">{weekdayShort(j)}</th>{/each}
        </tr>
      </thead>
      <tbody>
        {#each rows as r (r.id)}
          <tr data-grid-act={r.id}>
            <th scope="row" class="rh">{d.nameOf(r.id)}</th>
            {#each r.n as m, j (j)}
              {@const s = shade(m)}
              <td class:dark={s > 55} style:--s="{s}%" aria-label={t('{n} ticks of {name} on {day}', { n: num(m), name: d.nameOf(r.id), day: weekdayShort(j) })}>{m > 0 ? num(m) : '·'}</td>
            {/each}
          </tr>
        {/each}
      </tbody>
    </table>
    <p class="cap">{t('Ticks per activity (row) and weekday (column). The darker, the more often.')}</p>
  </AnaCard>
{/if}

<style>
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
    tbody .rh,
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
