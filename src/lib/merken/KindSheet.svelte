<script>
  /**
   * Merken: a birthday or a plant in one window (Noah 15.10.2026 «plus geburtstag, pflanzen»).
   * Birthday: name + day (+ year → «wird 40»), reminders the day before 18:00 and on the day 08:00,
   * each one tap off and its time changeable. Plant: name + «every N days» (+ place), last watered,
   * a reminder on the due day (time changeable, can be off). With todo set, the window changes it;
   * «Delete» deletes at once and the page offers Undo for 4 s (ondone({ undo, removed })).
   */
  import { tick } from 'svelte';
  import { X, Cake, Sprout, Bell } from '@lucide/svelte';
  import { backClose } from '../ui/backclose.js';
  import DateInput from '../ui/DateInput.svelte';
  import { db } from '../db.js';
  import { localDay } from '../localday.js';
  import { addKind, updateTodo, removeTodo } from '../merkendb.js';
  import { BDAY_REMINDS, PLANT_AT, PLANT_EVERY, daysInMonth, validMd, toggleRemind, remindAt } from './kinds.js';
  import { t, locale } from '../i18n.svelte.js';

  let { kind = 'birthday', todo = null, onclose, ondone } = $props();

  const today = localDay();
  // svelte-ignore state_referenced_locally
  const from = todo;
  // svelte-ignore state_referenced_locally
  const k = from?.kind ?? kind;
  const pad = (n) => String(n).padStart(2, '0');
  const md0 = from?.bday?.md?.split('-').map(Number) ?? [0, 0];

  let name = $state(from?.text ?? '');
  // birthday
  let month = $state(md0[0] || '');
  let day = $state(md0[1] || '');
  let year = $state(from?.bday?.year ?? '');
  let reminds = $state((from?.reminds ?? BDAY_REMINDS).map((r) => ({ ...r })));
  // plant
  let every = $state(from?.plant?.every ?? PLANT_EVERY);
  let place = $state(from?.plant?.place ?? '');
  let last = $state(from?.plant?.last ?? today);
  let remindOn = $state(from ? !!from.remind : true);
  let plantAt = $state(from?.remind?.at ?? PLANT_AT);

  let error = $state('');
  let dialog;
  let input;

  $effect(() => {
    dialog.showModal();
    tick().then(() => input?.focus());
  });

  const MONTHS = Array.from({ length: 12 }, (_, i) => new Date(Date.UTC(2000, i, 15)).toLocaleDateString(locale(), { month: 'long', timeZone: 'UTC' }));
  const days = $derived(Array.from({ length: month ? daysInMonth(+month) : 31 }, (_, i) => i + 1));
  const rOf = (before) => reminds.find((r) => r.before === before);

  async function del() {
    const undo = await removeTodo(db, from.id);
    dialog.close();
    ondone?.({ undo, removed: true, name: from.text });
  }

  async function save(e) {
    e?.preventDefault();
    if (!name.trim()) {
      error = k === 'birthday' ? t('Write whose birthday it is.') : t('Write the name of the plant.');
      return input?.focus();
    }
    let r;
    if (k === 'birthday') {
      const md = month && day ? `${pad(+month)}-${pad(Math.min(+day, daysInMonth(+month)))}` : '';
      if (!validMd(md)) return (error = t('Choose the day and the month.'));
      const y = Number.isInteger(+year) && +year > 1900 && +year <= +today.slice(0, 4) ? +year : null;
      const fields = { text: name.trim(), bday: { md, year: y }, reminds: $state.snapshot(reminds) };
      r = from ? { undo: await updateTodo(db, from.id, fields) } : await addKind(db, 'birthday', { name, md, year: y, reminds: fields.reminds });
    } else {
      const n = Math.max(1, Math.round(+every || PLANT_EVERY));
      const fields = { text: name.trim(), plant: { every: n, place: place.trim() || null, last: last || today }, remind: remindOn ? { at: plantAt || PLANT_AT, before: 0 } : null };
      r = from ? { undo: await updateTodo(db, from.id, fields) } : await addKind(db, 'plant', { name, every: n, place, last: fields.plant.last, remind: fields.remind }, { today });
    }
    dialog.close();
    ondone?.(r);
  }
</script>

<dialog class="sheet from-below kind" bind:this={dialog} use:backClose onclose={() => onclose?.()} aria-labelledby="kd-h">
  <form onsubmit={save} novalidate>
    <div class="head">
      <div>
        <h2 id="kd-h">{#if k === 'birthday'}<Cake size={20} aria-hidden="true" />{t('Birthday')}{:else}<Sprout size={20} aria-hidden="true" />{t('Plant')}{/if}</h2>
        <p class="lead">{k === 'birthday' ? t('Comes back every year.') : t('Shows when it needs water.')}</p>
      </div>
      <button type="button" class="x" onclick={() => dialog.close()} aria-label={t('Close')}><X size={20} aria-hidden="true" /></button>
    </div>

    <label class="fld"><span class="lbl">{t('Name')}</span>
      <input class="inp" bind:this={input} bind:value={name} maxlength="80" enterkeyhint="done" placeholder={k === 'birthday' ? t('e.g. Grandpa') : t('e.g. Basil')} aria-invalid={!!error} />
    </label>

    {#if k === 'birthday'}
      <fieldset class="fld"><legend class="lbl">{t('Date')}</legend>
        <div class="dmy">
          <select class="inp" bind:value={day} aria-label={t('Day')}>
            <option value="">{t('Day')}</option>
            {#each days as n (n)}<option value={n}>{n}</option>{/each}
          </select>
          <select class="inp" bind:value={month} aria-label={t('Month')}>
            <option value="">{t('Month')}</option>
            {#each MONTHS as m, i (i)}<option value={i + 1}>{m}</option>{/each}
          </select>
          <input class="inp" type="number" inputmode="numeric" min="1900" max={today.slice(0, 4)} bind:value={year} placeholder={t('Year')} aria-label={t('Year (optional)')} />
        </div>
        <p class="hint">{t('With the year the app shows the age.')}</p>
      </fieldset>
      {#if error}<p class="err" role="alert">{error}</p>{/if}

      <fieldset class="fld"><legend class="lbl"><Bell size={16} aria-hidden="true" />{t('Remind')}</legend>
        {#each [[1, 'The day before'], [0, 'On the day']] as [before, label] (before)}
          {@const r = rOf(before)}
          <div class="rrow">
            <button type="button" class="chip" aria-pressed={!!r} onclick={() => (reminds = toggleRemind(reminds, before))}>{t(label)}</button>
            {#if r}<input class="inp time" type="time" value={r.at} oninput={(e) => (reminds = remindAt(reminds, before, e.currentTarget.value))} aria-label={t('Time: {what}', { what: t(label) })} />{/if}
          </div>
        {/each}
      </fieldset>
    {:else}
      {#if error}<p class="err" role="alert">{error}</p>{/if}
      <div class="two">
        <label class="fld"><span class="lbl">{t('Water every … days')}</span>
          <input class="inp" type="number" min="1" max="365" inputmode="numeric" bind:value={every} />
        </label>
        <label class="fld"><span class="lbl">{t('Place (optional)')}</span>
          <input class="inp" bind:value={place} maxlength="40" placeholder={t('e.g. Balcony')} />
        </label>
      </div>
      <label class="fld"><span class="lbl">{t('Last watered')}</span>
        <DateInput class="inp" bind:value={last} max={today} aria-label={t('Last watered')} />
      </label>
      <fieldset class="fld"><legend class="lbl"><Bell size={16} aria-hidden="true" />{t('Remind')}</legend>
        <div class="rrow">
          <button type="button" class="chip" aria-pressed={!remindOn} onclick={() => (remindOn = false)}>{t('No')}</button>
          <button type="button" class="chip" aria-pressed={remindOn} onclick={() => (remindOn = true)}>{t('On the due day')}</button>
          {#if remindOn}<input class="inp time" type="time" bind:value={plantAt} aria-label={t('Time')} />{/if}
        </div>
      </fieldset>
    {/if}
    <p class="hint">{t('Shows in Calendar › Remember and on Me › Reminders, not on Today.')}</p>

    <div class="acts">
      <button type="submit" class="btn hi">{t('Save')}</button>
      <button type="button" class="btn" onclick={() => dialog.close()}>{t('Cancel')}</button>
      {#if from}<button type="button" class="btn del" onclick={del}>{t('Delete')}</button>{/if}
    </div>
  </form>
</dialog>

<style>
  .kind {
    width: min(600px, calc(100vw - 24px));
  }
  .head {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 12px;
  }
  .head h2 {
    display: flex;
    align-items: center;
    gap: 8px;
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
  .dmy {
    display: grid;
    grid-template-columns: 80px 1fr 100px;
    gap: 8px;
  }
  .two {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0 10px;
  }
  .rrow {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    align-items: center;
    margin-bottom: 8px;
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
  .chip[aria-pressed='true'] {
    background: var(--ink);
    border-color: var(--ink);
    color: var(--paper);
  }
  .rrow .time {
    width: 140px;
  }
  .hint {
    margin: 6px 0 0;
    color: var(--ink-2);
    font-size: var(--fs-small);
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
    .two {
      grid-template-columns: 1fr;
    }
    .acts .btn {
      flex: 1 1 100%;
    }
  }
</style>
