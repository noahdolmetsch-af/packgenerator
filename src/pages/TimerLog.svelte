<script>
  /**
   * «Timer» › Timer-Log (mockup Z5, approved 13.10.2026). #/timer/log: every timer by day (date, start,
   * kind, duration, note), with the meditation sessions beside them; filter by kind; a tap on a row
   * changes its note or deletes it (a meditation row opens its session on the meditation page). At the
   * side: this week in numbers and «Im Backup» (db.timerLog is in the backup, nothing is shared).
   */
  import { Pencil, Trash2, Flower2, Check, X } from '@lucide/svelte';
  import Crumb from '../lib/flow/kit/Crumb.svelte';
  import { timerLogQuery } from '../lib/timer/data.js';
  import { setNote, removeRow } from '../lib/timer/run.svelte.js';
  import { MODES, filterLog, byDay, weekStats, modeOf, rowName, hmOf, dur, short } from '../lib/timer.js';
  import { dayWord, artName } from '../lib/flow/hobby/words.js';
  import { wd } from '../lib/flow/words.js';
  import { localDay } from '../lib/localday.js';
  import { t } from '../lib/i18n.svelte.js';

  const today = localDay();
  const logQ = timerLogQuery();
  const rows = $derived($logQ ?? []);
  let kind = $state('all');
  let editing = $state(null);
  let text = $state('');
  const shown = $derived(filterLog(rows, kind));
  const days = $derived(byDay(shown));
  const week = $derived(weekStats(rows, today));
  const w = (x) => (x?.key ? t(x.key, x.vars) : '');
  const nameOf = (r) => (r.med ? t('Meditation') : rowName(r) === r.label ? r.label : t(rowName(r)));
  // 0.136.0: a meditation shows its kind (Om Ah Hung …), not the timer mode «Countdown»
  const subOf = (r) => [r.med ? artName(r.art) : t(modeOf(r.mode).label), r.note ? `«${r.note}»` : ''].filter(Boolean).join(' · ');

  function edit(r) {
    if (r.med) {
      location.hash = `#/flow/act/meditation/s/${encodeURIComponent(r.medId)}`;
      return;
    }
    editing = r.id;
    text = r.note ?? '';
  }
  async function save(e) {
    e?.preventDefault();
    await setNote(editing, text);
    editing = null;
  }
  async function del(r) {
    await removeRow(r.id);
    editing = null;
  }
</script>

<div class="tl">
  <Crumb path={[{ href: '#/', label: t('Today|place') }, { href: '#/timer', label: t('Timer') }]} here={t('Timer log')} />
  <h1 class="h1" tabindex="-1" data-page-title>{t('Timer log')}</h1>
  <p class="sub">{t('Date, start, kind, duration and note. Tap to change or delete.')}</p>

  <div class="cols">
    <div class="main">
      <div class="seg" role="radiogroup" aria-label={t('Kind of timer')}>
        <button type="button" role="radio" class:on={kind === 'all'} aria-checked={kind === 'all'} onclick={() => (kind = 'all')} data-kind="all">{t('All|log')}</button>
        {#each MODES as m (m.id)}<button type="button" role="radio" class:on={kind === m.id} aria-checked={kind === m.id} onclick={() => (kind = m.id)} data-kind={m.id}>{t(m.label)}</button>{/each}
      </div>
      <section class="surf pad" aria-labelledby="tl-rows">
        <div class="sh"><h2 id="tl-rows" class="h2">{t('Entries')}</h2><small>{t('{n} this week', { n: week.n })}</small></div>
        {#if days.length}
          {#each days as d (d.day)}
            <h3 class="dh">{wd(d.day)} · {dayWord(d.day, today)}</h3>
            <ul class="rows">
              {#each d.rows as r (r.id)}
                <li data-row={r.id}>
                  {#if editing === r.id}
                    <form class="ed" onsubmit={save}>
                      <input class="inp" bind:value={text} maxlength="300" aria-label={t('Note')} placeholder={t('Note (optional)')} />
                      <button type="submit" class="btn hi sm"><Check size={16} aria-hidden="true" />{t('Save')}</button>
                      <button type="button" class="btn sm" onclick={() => del(r)} data-act="delete"><Trash2 size={16} aria-hidden="true" />{t('Delete')}</button>
                      <button type="button" class="btn sm k" onclick={() => (editing = null)} aria-label={t('Close')}><X size={16} aria-hidden="true" /></button>
                    </form>
                  {:else}
                    <button type="button" class="row" onclick={() => edit(r)} aria-label={t('Change {name}', { name: nameOf(r) })}>
                      <span class="tm">{r.at ? hmOf(Date.parse(r.at)) : ''}</span>
                      <span class="rt"><b>{#if r.med}<Flower2 size={14} aria-hidden="true" />{/if}{nameOf(r)}</b>{#if subOf(r)}<small>{subOf(r)}</small>{/if}</span>
                      <b class="num">{dur(r.sec)}</b>
                      <Pencil size={16} aria-hidden="true" />
                    </button>
                  {/if}
                </li>
              {/each}
            </ul>
          {/each}
        {:else}
          <p class="sm">{t('Nothing in the log yet. Every timer comes in here by itself.')} <a href="#/timer">{t('Start a timer')}</a></p>
        {/if}
      </section>
    </div>

    <aside class="side">
      <section class="surf pad" aria-labelledby="tl-week">
        <h2 id="tl-week" class="h2">{t('This week')}</h2>
        <div class="st4">
          <div><b class="num">{week.n}×</b><small>{t('this week')}</small></div>
          <div><b class="num">{w(short(week.sec))}</b><small>{t('together')}</small></div>
          <div><b>{week.top ? t(modeOf(week.top).label) : '–'}</b><small>{t('most often')}</small></div>
          <div><b class="num">{week.medAvgMin != null ? t('{n} min', { n: week.medAvgMin }) : '–'}</b><small>{t('meditation on average')}</small></div>
        </div>
      </section>
      <section class="surf pad" aria-labelledby="tl-backup">
        <h2 id="tl-backup" class="h2">{t('In the backup')}</h2>
        <p class="sm">{t('The log goes into the backup and so moves to the phone. Nothing is shared.')}</p>
      </section>
    </aside>
  </div>
</div>

<style>
  .tl {
    display: flex;
    flex-direction: column;
    gap: 14px;
    max-width: 1328px;
    margin: 0 auto;
    min-width: 0;
  }
  .h1 {
    margin: 0;
    font: 800 var(--fs-page)/1.1 var(--font-brand);
  }
  .sub {
    margin: -6px 0 0;
    color: var(--ink-2);
  }
  .h2 {
    margin: 0;
    font: 700 var(--fs-sub)/1.2 var(--font-brand);
  }
  .pad {
    padding: 16px 18px;
    min-width: 0;
  }
  .cols {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    gap: 18px;
    align-items: start;
  }
  @media (min-width: 1100px) {
    .cols {
      grid-template-columns: minmax(0, 1.5fr) minmax(0, 1fr);
    }
  }
  @media (max-width: 1099px) {
    .side {
      order: -1;
    }
  }
  .main,
  .side {
    display: flex;
    flex-direction: column;
    gap: 14px;
    min-width: 0;
  }
  .sh {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    gap: 8px;
  }
  .sh small,
  .sm {
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .seg {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }
  .seg button {
    min-height: 44px;
    padding: 0 14px;
    border: 1px solid var(--line-strong);
    border-radius: 999px;
    background: var(--paper);
    color: var(--ink);
    font: 500 var(--fs-body)/1.2 var(--font-body);
    cursor: pointer;
  }
  .seg button.on {
    background: var(--ink);
    border-color: var(--ink);
    color: var(--paper);
  }
  .dh {
    margin: 14px 0 2px;
    color: var(--ink-2);
    font-size: var(--fs-small);
    font-weight: 600;
  }
  .rows {
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .rows li + li {
    border-top: 1px solid var(--line);
  }
  .row {
    display: flex;
    align-items: center;
    gap: 12px;
    width: 100%;
    min-height: 56px;
    padding: 6px 0;
    border: 0;
    background: none;
    color: var(--ink);
    font: inherit;
    text-align: left;
    cursor: pointer;
  }
  .row > :global(svg) {
    flex: none;
    color: var(--ink-3);
  }
  .tm {
    flex: none;
    width: 46px;
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .rt {
    flex: 1;
    min-width: 0;
  }
  .rt b {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    font-weight: 600;
  }
  .rt small {
    display: block;
    color: var(--ink-2);
    font-size: var(--fs-small);
    overflow-wrap: break-word;
  }
  .ed {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    padding: 8px 0;
  }
  .ed .inp {
    flex: 1 1 200px;
    width: auto;
    min-height: 44px;
  }
  .st4 {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 12px;
    margin-top: 10px;
  }
  .st4 b {
    display: block;
    font: 700 var(--fs-sub)/1.2 var(--font-brand);
  }
  .st4 small {
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
</style>
