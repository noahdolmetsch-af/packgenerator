<script>
  /**
   * What a trip needs before it starts (Bike care). v0.21.0 (Noah 2b): the tasks from the Excel
   * preparation list stay on every trip but fold into one row "Preparation: n open (m overdue)";
   * the bike's own rows (workshop, repairs) stay as they are. The rules are hints inside that row.
   */
  import MoreMenu from './MoreMenu.svelte';
  import { prepSummary } from '../care.js';
  import { t, locale } from '../i18n.svelte.js';

  let { trip, rows, rules, list, bikeRows, bikeName, today, order = null, onorder, onresult, onundo } = $props();

  const sum = $derived(prepSummary(rows));
  let prepOpen = $state(false); // the rows are only drawn when the row is opened
  const dueLabel = (iso) => new Date(`${iso}T00:00:00`).toLocaleDateString(locale(), { day: 'numeric', month: 'short' });
</script>

<section class="block" aria-labelledby="trip-{trip.id}" id="before-{trip.id}">
  <h2 id="trip-{trip.id}" class="title">{t('Before {trip}', { trip: trip.title })} <small>{trip.startDate} · {bikeName ?? t('no bike')} · {list.rows.length ? t('{n} to do', { n: list.rows.length }) : t('all done')}</small></h2>
  {#if bikeRows.length}
    <div class="shop">
      <span class="lbl">{t('The bike')}</span>
      <ul>{#each bikeRows as r (r.key)}<li class:late={r.late}><b>{r.name}</b> <small>{r.when === 'during' ? `${t('on the trip')} · ` : ''}{r.detail}</small></li>{/each}</ul>
      {#if order?.rows.length}<button type="button" class="btn sm" onclick={onorder}>{t('Workshop order · about CHF {chf}', { chf: order.total })}</button>{/if}
    </div>
  {/if}
  {#if rows.length || rules.length}
    <details class="prep" class:late={sum.overdue || sum.needed} bind:open={prepOpen}>
      <summary>
        <span class="pt">{sum.open ? (sum.overdue ? t('Preparation: {n} open ({m} overdue)', { n: sum.open, m: sum.overdue }) : t('Preparation: {n} open', { n: sum.open })) : t('Preparation: all done')}</span>
        <small>{t('{done} of {total} done · from the Excel list', { done: sum.done, total: sum.total })}{sum.needed ? ` · ${t('{n} work needed', { n: sum.needed })}` : ''}</small>
      </summary>
      {#if prepOpen}
        {#each rules as r (r.task.id)}
          <p class="rule"><span class="lbl">{r.from <= today ? t('Rule now') : t('Rule from {date}', { date: dueLabel(r.from) })}</span>{r.task.task}</p>
        {/each}
        <ul class="rows">
          {#each rows as r (r.task.id)}
            <li class:done={r.finished} class:late={r.overdue} class:need={r.needed}>
              <span class="when num">{dueLabel(r.due)}</span>
              <span class="txt">{r.task.task}{#if r.state}<small>{r.needed ? t('Work needed') : r.state.result === 'ok' ? t('OK') : t('Done|task')} · {r.state.date}{r.state.by === 'shop' ? ` · ${t('bike shop')}` : ''}</small>{/if}</span>
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
</section>

<style>
  .block {
    margin-bottom: 24px;
  }
  .title {
    font-size: 28px;
    margin: 0 0 8px;
    border-bottom: 3px solid var(--ink);
    padding-bottom: 4px;
  }
  .title small {
    font-family: var(--font-body);
    font-size: 14px;
  }
  small {
    font-size: 13px;
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
  .shop ul {
    margin: 4px 0 0;
    padding-left: 18px;
  }
  .shop li.late b {
    color: #a03a00;
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
    font-size: 13px;
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
    font-size: 13px;
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
</style>
