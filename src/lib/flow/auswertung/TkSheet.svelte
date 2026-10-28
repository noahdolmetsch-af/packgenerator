<script>
  /**
   * «Diagramme zum Antippen» (Noah 27.10.2026 «1-5 a»): the content of the window behind a tapped bar of
   * «Haken ausgewertet» (ChartSheet around it). The count, how it compares (pills), then either the days
   * with their ticks (a week) or the activities and how often (a weekday, a time of day, a day).
   * n: the ticks; pills: [{ text, tone: 'up' | 'down' | '' }]; days: [{ day, es }] or null; es: the ticks;
   * nameOf(actId): the activity's name (the user's own, never through t()).
   */
  import { actCounts } from '../auswertung.js';
  import { dayName, weekdayShort } from './words.js';
  import { t, num } from '../../i18n.svelte.js';

  let { n = 0, pills = [], days = null, es = [], nameOf = (id) => id } = $props();
  const acts = $derived(actCounts(es));
  const dow = (day) => (new Date(`${day}T12:00:00Z`).getUTCDay() + 6) % 7;
</script>

<div class="tks">
  <p class="big"><b class="num" data-sheet-n>{num(n)}</b> <span>{n === 1 ? t('tick|count') : t('ticks|count')}</span></p>
  {#if pills.length}
    <p class="pills">{#each pills as p (p.text)}<span class="cpill {p.tone}">{p.text}</span>{/each}</p>
  {/if}
  {#if days}
    <ul class="days" data-sheet-days>
      {#each days as d (d.day)}
        <li data-sheet-day={d.day}>
          <span class="dn"><b>{weekdayShort(dow(d.day))}</b><small>{dayName(d.day)}</small></span>
          <span class="ts">{#each actCounts(d.es) as a (a.actId)}<span class="tag">{nameOf(a.actId)}{#if a.n > 1}{' '}<small>{a.n}×</small>{/if}</span>{:else}<span class="none">–</span>{/each}</span>
        </li>
      {/each}
    </ul>
  {:else if acts.length}
    <ul class="acts" data-sheet-acts>
      {#each acts as a (a.actId)}<li><span>{nameOf(a.actId)}</span><b class="num">{num(a.n)}×</b></li>{/each}
    </ul>
  {:else}
    <p class="none">{t('No tick here.')}</p>
  {/if}
</div>

<style>
  .tks {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  .big {
    display: flex;
    align-items: baseline;
    gap: 8px;
    margin: 0;
  }
  .big b {
    font-size: var(--fs-page);
    line-height: 1.1;
  }
  .pills {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin: 0;
  }
  .cpill {
    padding: 3px 10px;
    border-radius: 999px;
    background: var(--paper-2);
    color: var(--ink-2);
    font-size: var(--fs-tiny);
    font-weight: 600;
  }
  .days,
  .acts {
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .days li {
    display: flex;
    align-items: center;
    gap: 12px;
    min-height: 48px;
    padding: 6px 0;
    border-bottom: 1px solid var(--line);
  }
  .dn {
    display: flex;
    flex-direction: column;
    flex: none;
    width: 64px;
  }
  .dn small {
    color: var(--ink-3);
    font-size: var(--fs-tiny);
  }
  .ts {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
    min-width: 0;
  }
  .tag {
    padding: 2px 8px;
    border-radius: 6px;
    background: var(--paper-2);
    font-size: var(--fs-small);
  }
  .tag small {
    color: var(--ink-3);
  }
  .acts li {
    display: flex;
    justify-content: space-between;
    gap: 12px;
    min-height: 44px;
    align-items: center;
    border-bottom: 1px solid var(--line);
  }
  .none {
    margin: 0;
    color: var(--ink-3);
  }
</style>
