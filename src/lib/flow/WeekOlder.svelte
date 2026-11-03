<script>
  /**
   * «Ältere Wochen» (Noah 02.11.2026 «3a»): the five numbers of the 8 weeks before the shown one, one row per week.
   * A row opens that week; the course over 8 weeks (hours) is one tap away. Observation only. Rules: lib/weekreview.js.
   */
  import { olderWeeks, weekHref } from '../weekreview.js';
  import { isoWeek, hmm } from '../training.js';
  import { t, num, locale } from '../i18n.svelte.js';

  let { data, monday, today } = $props();

  const rows = $derived(data ? olderWeeks(data, monday, today) : []);
  const any = $derived(rows.some((r) => !r.empty));
  const day = (d) => new Date(`${d}T12:00:00Z`).toLocaleDateString(locale(), { timeZone: 'UTC', day: 'numeric', month: 'numeric' });
</script>

{#if any}
  <section class="card wo" data-wr="older" aria-labelledby="wr-older">
    <h2 id="wr-older">{t('Older weeks')}</h2>
    <table class="tbl">
      <thead>
        <tr>
          <th scope="col">{t('Week')}</th>
          <th scope="col" class="r">{t('Hours|five')}</th>
          <th scope="col" class="r">{t('km')}</th>
          <th scope="col" class="r">{t('Hm')}</th>
          <th scope="col" class="r">{t('Sessions')}</th>
          <th scope="col" class="r">{t('Goals')}</th>
        </tr>
      </thead>
      <tbody>
        {#each rows as r (r.monday)}
          <tr data-older={r.monday} class:none={r.empty}>
            <th scope="row"><a href={weekHref(r.monday, today)} data-older-open>{t('Wk {n}', { n: isoWeek(r.monday) })}<small class="num">{day(r.monday)}</small></a></th>
            {#if r.empty}
              <td class="r" colspan="5">{t('nothing recorded')}</td>
            {:else}
              <td class="r num">{hmm(r.secs)}</td>
              <td class="r num">{num(r.km)}</td>
              <td class="r num">{num(r.hm)}</td>
              <td class="r num">{num(r.n)}</td>
              <td class="r num">{r.goals ? `${r.goals.met}/${r.goals.of}` : '–'}</td>
            {/if}
          </tr>
        {/each}
      </tbody>
    </table>
    <p class="cap">{t('The 8 weeks before the shown one, each whole. Tap a week to open it.')} <a class="tp-link" href="#/flow/review/tile?k=hours&w={monday}" data-older-course>{t('Course of the hours over 8 weeks')}</a></p>
  </section>
{/if}

<style>
  .wo {
    display: flex;
    flex-direction: column;
    gap: var(--sp-3);
    min-width: 0;
    margin: 0;
    padding: var(--sp-4);
  }
  h2 {
    margin: 0;
    font: 600 var(--fs-sub) / 1.3 var(--font-body);
  }
  .tbl {
    width: 100%;
    border-collapse: collapse;
    font-size: var(--fs-small);
  }
  .tbl th,
  .tbl td {
    padding: 6px 4px;
    border-bottom: 1px solid var(--line);
    text-align: left;
    font-weight: 400;
    vertical-align: baseline;
    white-space: nowrap;
  }
  .tbl thead th {
    color: var(--ink-3);
  }
  .tbl .r {
    text-align: right;
  }
  .tbl tbody th a {
    display: inline-flex;
    flex-direction: column;
    color: var(--ink);
    font-weight: 600;
  }
  .tbl small {
    color: var(--ink-3);
    font-weight: 400;
  }
  .none td {
    color: var(--ink-3);
  }
  .cap {
    margin: 0;
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
</style>
