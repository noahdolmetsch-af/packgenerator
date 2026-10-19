<script>
  /**
   * «Segmentzeiten» (Noah 19.10.2026 «2a»): your own time on each Strava segment of this ride; a personal
   * record (Strava's rank 1–3 of your own times) is marked. No leaderboards, no other people.
   */
  import { Trophy } from '@lucide/svelte';
  import AnaCard from '../AnaCard.svelte';
  import { mss } from './analysen.js';
  import { t } from '../../i18n.svelte.js';

  let { act = null } = $props();
  const FIRST = 10;
  const rows = $derived(Array.isArray(act?.segs) ? act.segs.filter((s) => s && s.name && s.s > 0) : []);
  const prs = $derived(rows.filter((s) => s.pr).length);
  let all = $state(false);
  const shown = $derived(all ? rows : rows.slice(0, FIRST));
  const prText = (p) => (p === 1 ? t('your best time') : p === 2 ? t('your 2nd best time') : t('your 3rd best time'));
</script>

{#if rows.length}
  <AnaCard key="segs" sub={prs ? t('{n} of your best times', { n: prs }) : t('Your own times')} wide>
    <table class="atab" data-segs>
      <thead>
        <tr>
          <th scope="col" class="nm">{t('Segment|an')}</th>
          <th scope="col">{t('Time|an')}</th>
        </tr>
      </thead>
      <tbody>
        {#each shown as s, i (i)}
          <tr>
            <th scope="row" class="nm">{s.name}{#if s.pr}<span class="pill ok pr" data-pr={s.pr}><Trophy size={12} aria-hidden="true" /> {prText(s.pr)}</span>{/if}</th>
            <td><b>{mss(s.s)}</b></td>
          </tr>
        {/each}
      </tbody>
    </table>
    {#if rows.length > FIRST}
      <button type="button" class="btn sm more" aria-expanded={all} onclick={() => (all = !all)} data-segs-all>{all ? t('Show fewer') : t('Show all {n} segments', { n: rows.length })}</button>
    {/if}
    <p class="cap">{t('Only your own times, compared with your earlier rides on the same segment.')}</p>
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
    white-space: nowrap;
  }
  thead th {
    color: var(--ink-3);
    font: 600 var(--fs-tiny) / 1.3 var(--font-body);
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }
  .nm {
    text-align: left;
    font-weight: 400;
    white-space: normal;
    overflow-wrap: break-word;
  }
  thead .nm {
    font-weight: 600;
  }
  .cap {
    margin: 0;
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .more {
    align-self: flex-start;
  }
  .pr {
    display: flex;
    width: fit-content;
    align-items: center;
    gap: 4px;
    margin-top: 4px;
  }
  @media (max-width: 640px) {
    .wide-only {
      display: none;
    }
    th,
    td {
      padding: 8px 3px;
    }
  }
</style>
