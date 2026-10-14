<script>
  /**
   * Merken (Kal1, mockup PL2, Noah «PL1-PL3 freigeben» 14.10.2026): a to-do or a reminder in one window.
   * Only «What?» is needed; date, reminder and repeat are suggestions, each one tap. A reminder is the
   * same window with «Remind» already chosen (reminder = true). Saving offers Undo (ondone(result)).
   * ER3 (Ich › Erinnerungen): with todo set, the window changes that to-do or reminder.
   */
  import { tick } from 'svelte';
  import { liveQuery } from 'dexie';
  import { X, CalendarDays, Bell, Repeat2 } from '@lucide/svelte';
  import { backClose } from '../ui/backclose.js';
  import DateInput from '../ui/DateInput.svelte';
  import { db } from '../db.js';
  import { sortBikes } from '../bikes.js';
  import { localDay } from '../localday.js';
  import { addDays } from '../merken.js';
  import { addTodo, updateTodo, removeTodo } from '../merkendb.js';
  import { t } from '../i18n.svelte.js';

  let { text: start = '', reminder = false, todo = null, onclose, ondone } = $props();

  const today = localDay();
  // svelte-ignore state_referenced_locally
  const from = todo;
  const remindOf = (r) => (!r ? 'no' : r.before ? 'before' : r.at === '08:00' ? 'day' : 'time');
  // svelte-ignore state_referenced_locally
  let text = $state(from?.text ?? start);
  // svelte-ignore state_referenced_locally
  let due = $state(from ? (from.due ?? '') : reminder ? addDays(today, 1) : '');
  // svelte-ignore state_referenced_locally
  let remind = $state(from ? remindOf(from.remind) : reminder ? 'day' : 'no'); // no · day · before · time
  let time = $state(from?.remind?.at ?? '08:00');
  let repeat = $state(from?.repeat?.every === 'rain' ? 'no' : (from?.repeat?.every ?? 'no')); // no · day · week · month · km
  let km = $state(from?.repeat?.km ?? 300);
  let bikeId = $state(from?.repeat?.bikeId ?? '');
  let error = $state('');
  let dialog;
  let input;

  const bikesQ = liveQuery(() => db.bikes.toArray());
  const bikes = $derived(sortBikes($bikesQ ?? []));
  const bike = $derived(bikes.find((b) => b.id === bikeId) ?? bikes[0] ?? null);

  $effect(() => {
    dialog.showModal();
    tick().then(() => input?.focus());
  });

  const DUE = [
    ['', 'No date'],
    [today, 'Today'],
    [addDays(today, 1), 'Tomorrow'],
  ];
  const custom = $derived(!!due && !DUE.some(([d]) => d === due));

  async function del() {
    const undo = await removeTodo(db, from.id);
    dialog.close();
    ondone?.({ undo, removed: true });
  }

  async function save(e) {
    e?.preventDefault();
    if (!text.trim()) {
      error = t('Write what you want to remember.');
      return input?.focus();
    }
    const fields = {
      text,
      due: due || null,
      remind: due && remind !== 'no' ? { at: remind === 'day' ? '08:00' : time, before: remind === 'before' ? 1 : 0 } : null,
      repeat: repeat === 'km' ? (bike ? { every: 'km', km: Math.max(1, Math.round(+km || 300)), bikeId: bike.id, fromKm: bike.km ?? 0 } : null) : repeat === 'no' ? null : { every: repeat },
    };
    if (from?.repeat?.every === 'rain' && repeat === 'no') fields.repeat = from.repeat; // «after rain» stays
    if (from?.repeat?.every === 'month' && repeat === 'month') fields.repeat = from.repeat; // keeps «every 6 months»
    if (from?.repeat?.every === 'km' && repeat === 'km' && fields.repeat && fields.repeat.bikeId === from.repeat.bikeId) fields.repeat.fromKm = from.repeat.fromKm;
    const r = from ? { undo: await updateTodo(db, from.id, fields) } : await addTodo(db, fields);
    dialog.close();
    ondone?.(r);
  }
</script>

<dialog class="sheet from-below todo" bind:this={dialog} use:backClose onclose={() => onclose?.()} aria-labelledby="td-h">
  <form onsubmit={save} novalidate>
    <div class="head">
      <div>
        <h2 id="td-h">{reminder || from?.remind ? t('Reminder') : t('To-do')}</h2>
        <p class="lead">{t('Only «What?» is needed.')}</p>
      </div>
      <button type="button" class="x" onclick={() => dialog.close()} aria-label={t('Close')}><X size={20} aria-hidden="true" /></button>
    </div>

    <label class="fld"><span class="lbl">{t('What?')}</span>
      <input class="inp" bind:this={input} bind:value={text} maxlength="160" enterkeyhint="done" placeholder={t('e.g. Order a spare derailleur hanger')} aria-invalid={!!error} />
    </label>
    {#if error}<p class="err" role="alert">{error}</p>{/if}

    <fieldset class="fld"><legend class="lbl"><CalendarDays size={16} aria-hidden="true" />{t('By when?')}</legend>
      <div class="chips">
        {#each DUE as [d, label] (label)}<button type="button" class="chip" aria-pressed={due === d} onclick={() => (due = d)}>{t(label)}</button>{/each}
        <span class="chip date" class:on={custom}><DateInput class="din" bind:value={due} min={today} aria-label={t('Choose a date')} /></span>
      </div>
    </fieldset>

    {#if due}
      <fieldset class="fld"><legend class="lbl"><Bell size={16} aria-hidden="true" />{t('Remind')}</legend>
        <div class="chips">
          <button type="button" class="chip" aria-pressed={remind === 'no'} onclick={() => (remind = 'no')}>{t('No')}</button>
          <button type="button" class="chip" aria-pressed={remind === 'day'} onclick={() => (remind = 'day')}>{t('On the day, 08:00')}</button>
          <button type="button" class="chip" aria-pressed={remind === 'before'} onclick={() => (remind = 'before')}>{t('1 day before')}</button>
          <button type="button" class="chip" aria-pressed={remind === 'time'} onclick={() => (remind = 'time')}>{t('Time …')}</button>
          {#if remind === 'time' || remind === 'before'}<input class="inp time" type="time" bind:value={time} aria-label={t('Time')} />{/if}
        </div>
        <p class="hint">{t('It then shows at the top of Today.')}</p>
      </fieldset>
    {/if}

    <fieldset class="fld"><legend class="lbl"><Repeat2 size={16} aria-hidden="true" />{t('Repeat')}</legend>
      <div class="chips">
        <button type="button" class="chip" aria-pressed={repeat === 'no'} onclick={() => (repeat = 'no')}>{t('Never')}</button>
        {#if repeat === 'day'}<button type="button" class="chip" aria-pressed="true">{t('Every day')}</button>{/if}
        <button type="button" class="chip" aria-pressed={repeat === 'week'} onclick={() => (repeat = 'week')}>{t('Every week')}</button>
        <button type="button" class="chip" aria-pressed={repeat === 'month'} onclick={() => (repeat = 'month')}>{t('Every month')}</button>
        {#if bikes.length}<button type="button" class="chip" aria-pressed={repeat === 'km'} onclick={() => (repeat = 'km')}>{t('Every {km} km', { km })}</button>{/if}
      </div>
      {#if repeat === 'km' && bikes.length}
        <div class="kmrow">
          <select class="inp" value={bike?.id ?? ''} onchange={(e) => (bikeId = e.currentTarget.value)} aria-label={t('Bike')}>
            {#each bikes as b (b.id)}<option value={b.id}>{b.name}</option>{/each}
          </select>
          <input class="inp num" type="number" min="10" step="10" inputmode="numeric" bind:value={km} aria-label={t('km')} />
        </div>
      {/if}
    </fieldset>

    <div class="acts">
      <button type="submit" class="btn hi">{t('Save')}</button>
      <button type="button" class="btn" onclick={() => dialog.close()}>{t('Cancel')}</button>
      {#if from}<button type="button" class="btn del" onclick={del}>{t('Delete')}</button>{/if}
    </div>
  </form>
</dialog>

<style>
  .todo {
    width: min(600px, calc(100vw - 24px));
  }
  .head {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 12px;
  }
  .head h2 {
    margin: 0;
  }
  .lead {
    margin: 2px 0 0;
    color: var(--ink-2);
  }
  .x {
    display: grid;
    flex: none;
    place-items: center;
    width: 44px;
    height: 44px;
    border: 0;
    border-radius: 50%;
    background: none;
    color: var(--ink);
    cursor: pointer;
  }
  .fld {
    display: block;
    margin: 14px 0 0;
    padding: 0;
    border: 0;
    min-width: 0;
  }
  .fld .lbl {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-bottom: 6px;
    padding: 0;
  }
  .chips {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    align-items: center;
  }
  .chip {
    display: inline-flex;
    align-items: center;
    min-height: 44px;
    padding: 0 14px;
    border: 1.5px solid var(--line);
    border-radius: 99px;
    background: var(--paper);
    color: var(--ink);
    font: inherit;
    cursor: pointer;
  }
  .chip[aria-pressed='true'],
  .chip.on {
    background: var(--ink);
    border-color: var(--ink);
    color: var(--paper);
  }
  .chip.date {
    padding: 0;
    min-width: 170px;
    overflow: hidden;
  }
  .chip.date :global(.din) {
    border: 0;
    background: transparent;
    min-height: 41px;
  }
  .chip.date.on :global(.shown) {
    color: var(--paper);
  }
  .time {
    width: 120px;
  }
  .hint {
    margin: 6px 0 0;
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .kmrow {
    display: grid;
    grid-template-columns: 1fr 110px;
    gap: 8px;
    margin-top: 8px;
  }
  .err {
    margin: 6px 0 0;
    color: var(--bad);
  }
  .del {
    margin-left: auto;
  }
  .acts {
    display: flex;
    gap: 10px;
    margin-top: 18px;
    flex-wrap: wrap;
  }
  @media (max-width: 560px) {
    .acts .btn {
      flex: 1 1 100%;
    }
  }
</style>
