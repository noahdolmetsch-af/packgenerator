<script>
  /**
   * «Erste gegen zweite Hälfte» of one answer (Noah 20.10.2026, like the same card on the ride page): Ø and
   * the number of answers in both halves, one calm sentence. Observation only.
   */
  import AnaCard from '../../training/AnaCard.svelte';
  import { valueHalves } from '../auswertung.js';
  import { dayName } from './words.js';
  import { t, num } from '../../i18n.svelte.js';

  let { d } = $props();
  const h = $derived(valueHalves(d.vals, d.from, d.to));
  const lines = $derived.by(() => {
    if (!h) return [];
    const out = [
      { k: 'm', name: t('Ø answer'), vals: h.rows.map((r) => r.mean), max: d.scale ? 10 : Math.max(...h.rows.map((r) => r.mean)) * 1.25 },
      { k: 'n', name: t('Answers'), vals: h.rows.map((r) => r.n), max: Math.max(1, ...h.rows.map((r) => r.n)) * 1.25 },
    ];
    return out;
  });
  const part = $derived(!h ? '' : h.change.dir === 'same' ? t('about the same') : t(h.change.dir === 'more' ? '{p} % higher' : '{p} % lower', { p: num(h.change.p) }));
</script>

{#if h}
  <AnaCard key="anhalves" sub={t('halves of equal days')}>
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
    <p class="sent" data-halves-sentence>{t('In the second half your answer was')} <b>{part}</b>.</p>
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
  .bar .m {
    background: var(--ch-w);
  }
  .bar .n {
    background: var(--pz2);
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
