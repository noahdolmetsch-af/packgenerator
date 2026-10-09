<script>
  /**
   * What a trip needs before it starts (Bike care). v0.21.0 (Noah 2b): the tasks from the Excel
   * preparation list stay on every trip but fold into one row "Preparation: n open (m overdue)";
   * the bike's own rows (workshop, repairs) stay as they are. The rules are hints inside that row.
   */
  import { Flag, ChevronRight } from '@lucide/svelte';
  import MoreMenu from './MoreMenu.svelte';
  import { prepSummary, isEvent } from '../care.js';
  import { t, locale, dateOf } from '../i18n.svelte.js';
  import { bikeCareLine, eventPrepLine } from '../readiness.js';

  // v0.22.0 (AP06): care = Bike care of the trip's bike (readiness.js), prep = Event preparation;
  // two named scopes with their own count. focus: opened from a link to this trip's preparation.
  let { trip, rows, rules, care = null, prep = null, focus = false, bikeName, today, order = null, onorder, onresult, onundo, onevent, onall = null } = $props();

  const sum = $derived(prepSummary(rows));
  const bikeRows = $derived(care ? [...care.rows, ...care.soon] : []);
  let prepOpen = $state(false); // the rows are only drawn when the row is opened
  let open = $state(false); // v0.31.0: the whole trip is one folded row
  $effect(() => {
    if (focus) open = prepOpen = true;
  });
  // What the row counts: the bike's rows (due now, before and on the trip) and the open preparation tasks.
  const count = $derived(bikeRows.length + (isEvent(trip) ? sum.open : 0));
  const dueLabel = (iso) => new Date(`${iso}T00:00:00`).toLocaleDateString(locale(), { day: 'numeric', month: 'short' });
</script>

<!-- v0.31.0 (Velopflege redesign): one folded row "Before Jura event · 18 Oct 2026 · 5 due ›". -->
<details class="block" id="before-{trip.id}" bind:open>
  <summary>
    <Flag size={18} aria-hidden="true" />
    <h2 id="trip-{trip.id}" class="title">{t('Before {trip}', { trip: trip.title })} <small><span class="num">{dateOf(trip.startDate)}</span> · {bikeName ?? t('no bike')}</small></h2>
    <span class="r">{#if count}<span class="badge">{t('{n} due', { n: count })}</span>{/if}<ChevronRight size={18} aria-hidden="true" /></span>
  </summary>
  {#if open}
  <div class="in">
  {#if care}
    <div class="shop">
      <span class="lbl">{bikeCareLine(care)}</span>
      {#if bikeRows.length}
        <ul>{#each bikeRows as r (r.key)}<li class:late={r.late}><b class="rn">{r.name}</b> <small>{r.when === 'during' ? `${t('on the trip')} · ` : r.late ? '' : `${t('before the start')} · `}{r.detail}</small></li>{/each}</ul>
      {:else if care.status === 'nodata'}
        <p class="nd">{t('No data: enter km and record a check or service, then the app can tell.')}</p>
      {/if}
      {#if order?.rows.length}<button type="button" class="btn sm" onclick={onorder}>{t('Workshop order · about CHF {chf}', { chf: order.total })}</button>{/if}
    </div>
  {/if}
  <!-- v0.22.0 (Noah 4b): the Excel preparation only for events. -->
  <label class="ev"><input type="checkbox" checked={isEvent(trip)} onchange={(e) => onevent?.(e.currentTarget.checked)} /> {t('Event (race or organised ride): show the event preparation')}</label>
  {#if rows.length || rules.length}
    <details class="prep" class:late={sum.overdue || sum.needed} bind:open={prepOpen}>
      <summary>
        <span class="pt">{eventPrepLine(prep)}</span>
        <small>{t('{done} of {total} done · from the Excel list', { done: sum.done, total: sum.total })}{sum.needed ? ` · ${t('{n} work needed', { n: sum.needed })}` : ''}</small>
      </summary>
      {#if prepOpen}
        {#each rules as r (r.task.id)}
          <p class="rule"><span class="lbl">{r.from <= today ? t('Rule now') : t('Rule from {date}', { date: dueLabel(r.from) })}</span>{r.task.task}</p>
        {/each}
        {#if onall && rows.filter((r) => !r.finished).length > 1}
          <p class="all"><button type="button" class="btn sm" onclick={onall}>{t('All {n} open tasks done', { n: rows.filter((r) => !r.finished).length })}</button></p>
        {/if}
        <ul class="rows">
          {#each rows as r (r.task.id)}
            <li class:done={r.finished} class:late={r.overdue} class:need={r.needed}>
              <span class="when num">{dueLabel(r.due)}</span>
              <span class="txt">{r.task.task}{#if r.state}<small>{r.needed ? t('Work needed') : r.state.result === 'ok' ? t('OK') : t('Done|task')} · {dateOf(r.state.date)}{r.state.by === 'shop' ? ` · ${t('bike shop')}` : ''}</small>{/if}</span>
              <span class="acts">
                {#if r.finished}
                  <button type="button" class="link" onclick={() => onundo(r)}>{t('Undo')}</button>
                {:else}
                  <button type="button" class="btn sm hi" onclick={() => onresult(r, 'done')}>{t('Done|task')}</button>
                  <MoreMenu label={r.task.task} actions={[{ name: t('Checked, all OK'), run: () => onresult(r, 'ok') }, { name: t('Work needed'), run: () => onresult(r, 'needed') }]} />
                {/if}
              </span>
            </li>
          {/each}
        </ul>
      {/if}
    </details>
  {/if}
  </div>
  {/if}
</details>

<style>
  .all {
    margin: 6px 0;
  }
  /* v0.27.0 (AP21): the whole line is the tap area (44 px), the box is bigger. */
  .ev {
    display: flex;
    gap: 10px;
    align-items: center;
    min-height: 44px;
    margin: 0 0 8px;
    font-size: 14px;
    cursor: pointer;
  }
  .ev input {
    flex: none;
    width: 22px;
    height: 22px;
    margin: 0;
  }
  .block {
    margin-bottom: 10px;
    border: 1px solid var(--line);
    background: var(--paper);
    border-radius: 12px;
  }
  .block > summary {
    display: flex;
    align-items: center;
    gap: 10px;
    min-height: 56px;
    padding: 6px 14px;
    list-style: none;
    cursor: pointer;
  }
  .block > summary::-webkit-details-marker {
    display: none;
  }
  .block > summary > :global(svg) {
    color: var(--ink-3);
    flex: none;
  }
  .block[open] > summary .r :global(svg) {
    transform: rotate(90deg);
  }
  .title {
    font-size: 16px;
    font-weight: 600;
    margin: 0;
    min-width: 0;
  }
  .title small {
    font-family: var(--font-body);
    font-size: 13px;
  }
  .r {
    margin-left: auto;
    display: flex;
    align-items: center;
    gap: 8px;
    color: var(--ink-3);
    flex: none;
  }
  .badge {
    font-size: 13px;
    font-weight: 600;
    padding: 2px 8px;
    border-radius: 999px;
    background: var(--warn-soft);
    color: var(--warn);
    white-space: nowrap;
  }
  .in {
    padding: 0 14px 12px;
  }
  small {
    font-size: var(--fs-small);
    color: var(--ink-3);
    font-weight: 400;
  }
  .shop {
    margin: 0 0 10px;
    padding: 8px 12px;
    border-left: 4px solid var(--ink);
    background: var(--paper-2);
    border-radius: 6px;
  }
  .shop .nd {
    margin: 4px 0 0;
    font-size: 14px;
    color: var(--ink-2);
  }
  .shop ul {
    margin: 4px 0 0;
    padding-left: 18px;
  }
  .shop li.late b {
    color: var(--warn);
  }
  .shop .btn {
    margin-top: 6px;
  }
  /* One calm row for the whole Excel list; an orange edge when something is overdue. */
  .prep {
    border: 1.5px solid var(--line);
    border-radius: 6px;
    background: var(--paper);
  }
  .prep.late {
    border-left: 5px solid var(--hi);
  }
  .prep > summary {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    gap: 2px 10px;
    min-height: 44px;
    padding: 10px 12px;
    box-sizing: border-box;
    cursor: pointer;
  }
  .pt {
    font-weight: 700;
  }
  .prep[open] > summary {
    border-bottom: 1px solid var(--line);
  }
  .prep > :not(summary) {
    margin-left: 12px;
    margin-right: 12px;
  }
  .rule {
    margin: 8px 0;
    padding: 6px 10px;
    background: var(--paper-2);
    border-radius: 4px;
    font-size: 14px;
  }
  .rule .lbl {
    margin: 0 0 2px;
  }
  .rows {
    list-style: none;
    margin: 0;
    padding: 0;
  }
  .rows li {
    display: grid;
    grid-template-columns: 60px 1fr auto;
    gap: 6px 10px;
    align-items: center;
    padding: 7px 0;
    border-bottom: 1px solid var(--line);
  }
  .rows li:last-child {
    border-bottom: 0;
  }
  .rows li.done .txt {
    color: var(--ink-3);
    text-decoration: line-through;
  }
  .rows li.late .when {
    color: var(--ink);
    font-weight: 700;
  }
  .rows li.need .txt {
    border-left: 3px solid var(--hi);
    padding-left: 6px;
  }
  .when {
    font-size: var(--fs-small);
    color: var(--ink-3);
  }
  .txt {
    display: flex;
    flex-direction: column;
    min-width: 0;
  }
  .acts {
    display: flex;
    gap: 6px;
    flex-wrap: wrap;
    justify-content: end;
  }
  @media (max-width: 640px) {
    .rows li {
      grid-template-columns: 52px 1fr;
    }
    .rows .acts {
      grid-column: 2;
      justify-content: start;
    }
  }
  .btn.sm {
    padding: 3px 10px;
    font-size: var(--fs-small);
  }
  .link {
    border: 0;
    background: none;
    padding: 0;
    font: inherit;
    font-size: 14px;
    color: var(--ink);
    text-decoration: underline;
    cursor: pointer;
  }

  /* v0.47.0 (Noah: one type scale for the care tab): the trip as one title and one quiet sub line,
     the badge as the one small pill, no bold lists. */
  .title {
    display: flex;
    flex-direction: column;
    font: 500 17px/1.3 var(--font-body);
  }
  .title small {
    color: var(--ink-3);
    font: 400 14px/1.35 var(--font-body);
  }
  .badge {
    padding: 1px 9px;
    border: 0;
    border-radius: 999px;
    background: var(--warn-soft);
    color: var(--warn);
    font: 500 12.5px/1.6 var(--font-body);
  }
  .pt,
  .rows li.late .when,
  .shop li.late b {
    font-weight: 500;
  }
  .shop .rn {
    font-weight: 500;
  }
</style>
