<script>
  /**
   * Tour-Seite, answer 4 «beides» (Noah 19.10.2026): «Abgeschlossene Touren» as a calendar, one month at a
   * time from Monday; ‹ › change the month. Each day shows its tours; a tap opens one.
   * rows: list rows; start: 'YYYY-MM' to begin with.
   */
  import { t, locale } from '../i18n.svelte.js';
  import { n0 } from '../review/fmt.js';
  import { calMonth, shiftMonth } from './tour.js';
  import { monthLong } from '../review/fmt.js';
  import { typeKey } from '../training.js';
  import { ChevronLeft, ChevronRight } from '@lucide/svelte';
  import { phone } from '../media.svelte.js';

  let { rows = [], start } = $props();
  // svelte-ignore state_referenced_locally
  let ym = $state(start);
  const weeks = $derived(calMonth(rows, ym));
  // Monday to Sunday in the app's language (12.10.2026 was a Monday)
  const DAYS = $derived(Array.from({ length: 7 }, (_, i) => new Date(Date.UTC(2026, 9, 12 + i)).toLocaleDateString(locale(), { weekday: 'short', timeZone: 'UTC' })));
  const n = $derived(rows.filter((r) => r.day.slice(0, 7) === ym || (r.endDay ?? r.day).slice(0, 7) === ym).length);
</script>

<div class="cal" data-act-cal={ym}>
  <div class="ch">
    <button type="button" class="nav" aria-label={t('Month before')} onclick={() => (ym = shiftMonth(ym, -1))} data-cal-prev><ChevronLeft size={18} aria-hidden="true" /></button>
    <h3>{monthLong(ym)} <small class="num">· {t('{n} tours', { n })}</small></h3>
    <button type="button" class="nav" aria-label={t('Month after')} onclick={() => (ym = shiftMonth(ym, 1))} data-cal-next><ChevronRight size={18} aria-hidden="true" /></button>
  </div>
  <table>
    <thead><tr>{#each DAYS as dn (dn)}<th scope="col">{dn}</th>{/each}</tr></thead>
    <tbody>
      {#each weeks as w, i (i)}
        <tr>
          {#each w as c, j (j)}
            <td class:has={c?.rows.length}>
              {#if c}
                <span class="dn num">{Number(c.day.slice(8))}</span>
                {#each c.rows as r (r.id)}
                  <a class="ev" href={r.href} data-cal-tour={r.id} title={r.name}>{phone.matches ? `${n0(r.km)} km` : r.name || t(typeKey(r.type))}</a>
                {/each}
              {/if}
            </td>
          {/each}
        </tr>
      {/each}
    </tbody>
  </table>
</div>

<style>
  .cal {
    padding: 10px 12px 14px;
    border: 1px solid var(--card-line);
    border-radius: var(--radius-card);
    background: var(--paper);
  }
  .ch {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
  }
  .ch h3 {
    margin: 0;
    font: 600 var(--fs-body) / 1.3 var(--font-body);
    text-align: center;
  }
  .ch small {
    color: var(--ink-2);
    font-weight: 400;
  }
  .nav {
    display: grid;
    place-items: center;
    width: 44px;
    height: 44px;
    border: 1px solid var(--card-line);
    border-radius: 50%;
    background: var(--paper);
    color: var(--ink);
    cursor: pointer;
  }
  table {
    width: 100%;
    margin-top: 8px;
    border-collapse: collapse;
    table-layout: fixed;
  }
  th {
    padding: 4px 0;
    color: var(--ink-3);
    font: 500 var(--fs-tiny) / 1 var(--font-body);
  }
  td {
    height: 64px;
    padding: 3px;
    border: 1px solid var(--card-line);
    vertical-align: top;
  }
  td.has {
    background: var(--st-done-soft, var(--paper-2));
  }
  .dn {
    display: block;
    color: var(--ink-2);
    font-size: var(--fs-tiny);
  }
  .ev {
    display: block;
    margin-top: 2px;
    padding: 2px 4px;
    overflow: hidden;
    border-radius: 6px;
    background: var(--paper);
    color: var(--ink);
    font-size: var(--fs-tiny);
    line-height: 1.3;
    text-decoration: none;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .ev:hover {
    text-decoration: underline;
  }
</style>
