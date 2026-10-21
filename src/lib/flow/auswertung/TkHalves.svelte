<script>
  /**
   * «Erste gegen zweite Hälfte» (Noah 20.10.2026, like the same card on the ride page): the two halves of
   * the period side by side (ticks, days with a tick, minutes) and one calm sentence. Observation only.
   */
  import AnaCard from '../../training/AnaCard.svelte';
  import { halvesOf } from '../auswertung.js';
  import { dayName } from './words.js';
  import { t, num } from '../../i18n.svelte.js';

  let { d } = $props();
  const h = $derived(halvesOf(d.list, d.from, d.to));
  const lines = $derived.by(() => {
    if (!h) return [];
    const out = [
      { k: 'n', name: t('Ticks'), vals: h.rows.map((r) => r.ticks) },
      { k: 'd', name: t('Days with a tick'), vals: h.rows.map((r) => r.days) },
    ];
    if (h.min) out.push({ k: 'm', name: t('Minutes|tk'), vals: h.rows.map((r) => r.min) });
    return out.map((l) => ({ ...l, max: Math.max(1, ...l.vals) * 1.25 }));
  });
  const part = $derived(!h ? '' : h.ticks.dir === 'same' ? t('about as often') : t(h.ticks.dir === 'more' ? '{p} % more often' : '{p} % less often', { p: num(h.ticks.p) }));
</script>

{#if h}
  <AnaCard key="tkhalves" sub={t('halves of equal days')}>
    <table class="hv">
      <thead>
        <tr>
          <td></td>
          {#each h.rows as r, i (i)}<th scope="col">{t(i === 0 ? '1st half · {t}' : '2nd half · {t}', { t: `${dayName(r.from)}–${dayName(r.to)}` })}</th>{/each}
        </tr>
      </thead>
      <tbody>
        {#each lines as l (l.k)}
          <tr>
            <th scope="row">{l.name}</th>
            {#each l.vals as v, i (i)}
              <td>
                <span class="bar" aria-hidden="true"><i class={l.k} style:width="{Math.round((v / l.max) * 100)}%"></i></span>
                <span class="v">{num(v)}</span>
              </td>
            {/each}
          </tr>
        {/each}
      </tbody>
    </table>
    <p class="sent" data-halves-sentence>{t('In the second half you ticked')} <b>{part}</b>.</p>
    <p class="cap">{t('Observation only.')}</p>
  </AnaCard>
{/if}

<style>
  .hv {
    width: 100%;
    border-collapse: collapse;
    table-layout: fixed;
  }
  thead th {
    text-align: left;
    color: var(--ink-3);
    font: 600 var(--fs-small) / 1.3 var(--font-body);
    padding: 0 6px 6px;
  }
  tbody th {
    width: 30%;
    text-align: left;
    font: 400 var(--fs-small) / 1.3 var(--font-body);
    padding: 6px 6px 6px 0;
  }
  td {
    padding: 6px;
    vertical-align: middle;
  }
  .bar {
    display: block;
    height: 12px;
    border-radius: 6px;
    background: var(--paper-2);
    overflow: hidden;
  }
  .bar i {
    display: block;
    height: 100%;
    border-radius: 6px;
  }
  .bar .n {
    background: var(--ch-w);
  }
  .bar .d {
    background: var(--pz2);
  }
  .bar .m {
    background: var(--pz4);
  }
  .v {
    display: block;
    margin-top: 3px;
    font-size: var(--fs-tiny);
    font-variant-numeric: tabular-nums;
  }
  .sent {
    margin: 0;
  }
  @media (max-width: 640px) {
    thead th {
      font-size: var(--fs-tiny);
    }
  }
</style>
