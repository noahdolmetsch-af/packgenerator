<script>
  /**
   * TR7f «Anstiege dieser Fahrt» (Noah 14.10.2026 «TR5–TR7 freigegeben»): the climbs of this ride from
   * its Strava segments over 3 %, with VAM (metres climbed per hour). On the phone Ø W and Ø Puls drop.
   */
  import AnaCard from '../AnaCard.svelte';
  import { mss } from './analysen.js';
  import { t, num } from '../../i18n.svelte.js';

  let { act = null } = $props();
  const rows = $derived(Array.isArray(act?.climbs) ? act.climbs.filter((c) => c && c.name != null) : []);
  const power = $derived(!!act?.wDevice && rows.some((c) => c.w > 0));
  const v = (x) => (Number.isFinite(x) ? num(x) : '–');
</script>

{#if rows.length}
  <AnaCard key="climbs" sub={t('VAM per climb')} wide>
    <table class="atab">
      <thead>
        <tr>
          <th scope="col" class="nm">{t('Climb|an')}</th>
          <th scope="col">{t('km|an')}</th>
          <th scope="col">%</th>
          <th scope="col">{t('Hm|an')}</th>
          <th scope="col">{t('Time|an')}</th>
          <th scope="col">{t('VAM|an')}</th>
          {#if power}<th scope="col" class="wide-only">{t('Ø W|an')}</th>{/if}
          <th scope="col" class="wide-only">{t('Ø HR|an')}</th>
        </tr>
      </thead>
      <tbody>
        {#each rows as c, i (i)}
          <tr>
            <th scope="row" class="nm">{c.name}</th>
            <td>{v(c.km)}</td>
            <td>{v(c.grade)}</td>
            <td>{v(c.hm)}</td>
            <td>{c.s > 0 ? mss(c.s) : '–'}</td>
            <td><b>{v(c.vam)}</b></td>
            {#if power}<td class="wide-only">{v(c.w)}</td>{/if}
            <td class="wide-only">{v(c.hr)}</td>
          </tr>
        {/each}
      </tbody>
    </table>
    <p class="cap">{t('VAM = metres climbed per hour on the climb. From the Strava segments of this ride steeper than 3 %.')}</p>
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
  @media (max-width: 640px) {
    .wide-only {
      display: none;
    }
    th,
    td {
      padding: 8px 3px;
    }
    /* the numbers keep their width, a long climb name wraps */
    .atab {
      table-layout: fixed;
    }
    thead th:not(.nm) {
      width: 2.9em;
    }
    thead th:nth-child(5),
    thead th:nth-child(6) {
      width: 3.6em;
    }
  }
</style>
