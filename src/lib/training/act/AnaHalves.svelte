<script>
  /**
   * TR7b «Erste gegen zweite Hälfte» (Noah 14.10.2026 «TR5–TR7 freigegeben»): the two halves of equal
   * time side by side (power, heart rate, watts per beat) and one calm sentence on what changed.
   * Without power only the heart rate. Observation only, computed without breaks.
   */
  import AnaCard from '../AnaCard.svelte';
  import { halvesOf } from './analysen.js';
  import { hmm } from '../../training.js';
  import { t, num, locale } from '../../i18n.svelte.js';

  let { act = null } = $props();
  const h = $derived(halvesOf(act?.halves, !!act?.wDevice));
  const lines = $derived.by(() => {
    if (!h) return [];
    const out = [];
    if (h.power) out.push({ k: 'w', name: t('Ø power|an'), vals: h.rows.map((r) => r.w), fmt: (v) => `${num(v)} W` });
    out.push({ k: 'hr', name: t('Ø heart rate|an'), vals: h.rows.map((r) => r.hr), fmt: (v) => num(v) });
    if (h.power) out.push({ k: 'wpb', name: t('Watts per beat'), vals: h.rows.map((r) => r.wpb), fmt: (v) => v.toLocaleString(locale(), { minimumFractionDigits: 2, maximumFractionDigits: 2 }) });
    return out.map((l) => ({ ...l, max: Math.max(...l.vals) * 1.25 }));
  });
  const hrPart = $derived(!h?.hr ? '' : h.hr.dir === 'same' ? t('the same heart rate') : t(h.hr.dir === 'more' ? '{p} % more heart rate' : '{p} % less heart rate', { p: num(h.hr.p) }));
  const wPart = $derived(!h?.w ? '' : h.w.dir === 'same' ? t('at almost the same power') : t(h.w.dir === 'more' ? 'at {p} % more power' : 'at {p} % less power', { p: num(h.w.p) }));
</script>

{#if h}
  <AnaCard key="halves" sub={t('halves of equal time')}>
    <table class="hv">
      <thead>
        <tr>
          <td></td>
          {#each h.rows as r, i (i)}<th scope="col">{t(i === 0 ? '1st half · {t}' : '2nd half · {t}', { t: hmm(r.s) })}</th>{/each}
        </tr>
      </thead>
      <tbody>
        {#each lines as l (l.k)}
          <tr>
            <th scope="row">{l.name}</th>
            {#each l.vals as v, i (i)}
              <td>
                <span class="bar" aria-hidden="true"><i class={l.k} style:width="{Math.round((v / l.max) * 100)}%"></i></span>
                <span class="v">{l.fmt(v)}</span>
              </td>
            {/each}
          </tr>
        {/each}
      </tbody>
    </table>
    {#if hrPart}<p class="sent" data-halves-sentence>{t('In the second half')} <b>{hrPart}</b>{wPart ? ` ${wPart}` : ''}.</p>{/if}
    <p class="cap">{t('Observation only. Computed without breaks.')}</p>
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
    width: 26%;
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
  .bar .w {
    background: var(--ch-w);
  }
  .bar .hr {
    background: var(--ch-hr);
  }
  .bar .wpb {
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
