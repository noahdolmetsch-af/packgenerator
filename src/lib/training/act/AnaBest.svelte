<script>
  /**
   * TR7b «Bestwerte» (Noah 14.10.2026 «TR5–TR7 freigegeben»): this ride's best average power for 5 s to
   * 60 min next to the best of the 90 days before it and of its year so far. A star when it is at
   * least as good as the 90 days. With a weight also W/kg. Only with a power curve.
   */
  import AnaCard from '../AnaCard.svelte';
  import { bestTable } from './analysen.js';
  import { wkg } from '../../training.js';
  import { kgOn } from '../../weight.js';
  import { weight } from '../../weight.svelte.js';
  import { t, num, locale } from '../../i18n.svelte.js';

  let { act = null, all = [] } = $props();
  const tab = $derived(bestTable(act, all));
  const kg = $derived(act ? kgOn(weight.entries, act.day) : null);
  const wk = (w) => wkg(w, kg)?.toLocaleString(locale(), { minimumFractionDigits: 1, maximumFractionDigits: 1 }) ?? '';
  const spanName = (s) => (s < 60 ? t('{n} s|an', { n: s }) : t('{n} min|an', { n: s / 60 }));
</script>

{#if tab}
  <AnaCard key="best" sub={t('best Ø power per duration')} wide>
    <table class="atab">
      <thead>
        <tr>
          <th scope="col" class="l">{t('Duration|an')}</th>
          <th scope="col">{t('This ride')}</th>
          <th scope="col">{t('Best 90 days')}</th>
          <th scope="col">{t('Best {year}', { year: tab.year })}</th>
        </tr>
      </thead>
      <tbody>
        {#each tab.rows as r (r.span)}
          <tr data-best={r.span}>
            <th scope="row" class="l">{spanName(r.span)}</th>
            <td>
              {#if r.me != null}
                <b>{num(r.me)} W</b>{#if r.star}<span class="bst" role="img" aria-label={t('best of the last 90 days or as good')}>☆</span>{/if}
                {#if kg}<small>{wk(r.me)} W/kg</small>{/if}
              {:else}–{/if}
            </td>
            <td>
              {r.d90 != null ? `${num(r.d90)} W` : '–'}
              {#if kg && r.d90 != null}<small>{wk(r.d90)} W/kg</small>{/if}
            </td>
            <td>
              {r.year != null ? `${num(r.year)} W` : '–'}
              {#if kg && r.year != null}<small>{wk(r.year)} W/kg</small>{/if}
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
    <p class="cap">{t('Star = new best of the last 90 days or as good. With a weight also in W/kg.')}</p>
  </AnaCard>
{/if}

<style>
  .atab {
    width: 100%;
    border-collapse: collapse;
    font-variant-numeric: tabular-nums;
    font-size: var(--fs-small);
  }
  th,
  td {
    padding: 9px 6px;
    text-align: right;
    border-bottom: 1px solid var(--line);
    vertical-align: top;
  }
  thead th {
    color: var(--ink-3);
    font: 600 var(--fs-tiny) / 1.3 var(--font-body);
    text-transform: uppercase;
    letter-spacing: 0.04em;
    vertical-align: bottom;
  }
  .l {
    text-align: left;
    font-weight: 400;
    white-space: nowrap;
  }
  thead .l {
    font-weight: 600;
  }
  td {
    white-space: nowrap;
  }
  .bst {
    margin-left: 4px;
    color: var(--warn);
  }
  small {
    display: block;
    color: var(--ink-3);
    font-size: var(--fs-tiny);
  }
  @media (max-width: 640px) {
    th,
    td {
      padding: 8px 3px;
    }
  }
</style>
