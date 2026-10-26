<script>
  /**
   * Merken: a birthday or a plant in one window (Noah 15.10.2026 «plus geburtstag, pflanzen»).
   * Birthday: name + day (+ year → «wird 40»), reminders the day before 18:00 and on the day 08:00,
   * each one tap off and its time changeable. Plant: name + «every N days» (+ place), last watered,
   * a reminder on the due day (time changeable, can be off). With todo set, the window changes it;
   * «Delete» deletes at once and the page offers Undo for 4 s (ondone({ undo, removed })).
   * Content (Noah «1a» 18.10.2026): a gift idea with 5 examples to tap; 12 common plants that fill
   * «every N days»; «Longer in winter» (Nov–Feb ×1.5, on by default); the finger test as a tip.
   */
  import { moveTo } from './plantpass.js'; // Pflanzenpass (996 Ideen 10)
  import { tick } from 'svelte';
  import { X, Cake, Sprout, Bell, Gift, Snowflake } from '@lucide/svelte';
  import { backClose } from '../ui/backclose.js';
  import DateInput from '../ui/DateInput.svelte';
  import { db } from '../db.js';
  import { localDay } from '../localday.js';
  import { addKind, updateTodo, removeTodo } from '../merkendb.js';
  import { BDAY_REMINDS, PLANT_AT, PLANT_EVERY, GIFT_IDEAS, PLANT_SUGGESTIONS, WINTER_FACTOR, daysInMonth, validMd, toggleRemind, remindAt } from './kinds.js';
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
  let gift = $state(from?.gift ?? '');
  // plant
  let every = $state(from?.plant?.every ?? PLANT_EVERY);
  let place = $state(from?.plant?.place ?? '');
  let last = $state(from?.plant?.last ?? today);
  let remindOn = $state(from ? !!from.remind : true);
  let plantAt = $state(from?.remind?.at ?? PLANT_AT);
  let winter = $state(from?.plant?.winter !== false);
  const winterEvery = $derived(Math.round(Math.max(1, Math.round(+every || PLANT_EVERY)) * WINTER_FACTOR));
  function suggest(s) {
    name = t(s.name);
    every = s.every;
    error = '';
  }

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
      const fields = { text: name.trim(), bday: { md, year: y }, reminds: $state.snapshot(reminds), gift: gift.trim() || undefined };
      r = from ? { undo: await updateTodo(db, from.id, fields) } : await addKind(db, 'birthday', { name, md, year: y, reminds: fields.reminds, gift });
    } else {
      const n = Math.max(1, Math.round(+every || PLANT_EVERY));
      const fields = { text: name.trim(), plant: { every: n, place: place.trim() || null, last: last || today, ...(winter ? {} : { winter: false }), ...(from?.plant?.pass ? { pass: from.plant.pass } : {}) }, remind: remindOn ? { at: plantAt || PLANT_AT, before: 0 } : null };
      // Pflanzenpass (996 Ideen 10): a new place stays in the plant's history as a move
      const moved = from && place.trim() && place.trim() !== (from.plant?.place ?? '');
      if (moved) fields.plant = moveTo({ ...from, plant: { ...fields.plant, place: from.plant?.place ?? null } }, { place: place.trim(), day: today }).plant;
      r = from ? { undo: await updateTodo(db, from.id, fields) } : await addKind(db, 'plant', { name, every: n, place, last: fields.plant.last, remind: fields.remind, winter }, { today });
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
    {#if k === 'plant' && !from}
      <div class="fld" role="group" aria-label={t('Suggestions')}>
        <span class="lbl">{t('Suggestions')}</span>
        <div class="rrow sugg">
          {#each PLANT_SUGGESTIONS as s (s.name)}<button type="button" class="chip" aria-pressed={name === t(s.name)} onclick={() => suggest(s)}>{t(s.name)}</button>{/each}
        </div>
      </div>
    {/if}

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
      <div class="fld">
        <label class="lbl" for="kd-gift"><Gift size={16} aria-hidden="true" />{t('Gift idea (optional)')}</label>
        <input id="kd-gift" class="inp" bind:value={gift} maxlength="120" />
        <div class="rrow sugg" role="group" aria-label={t('Gift ideas')}>
          {#each GIFT_IDEAS as g (g)}<button type="button" class="chip" aria-pressed={gift === t(g)} onclick={() => (gift = t(g))}>{t(g)}</button>{/each}
        </div>
      </div>
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
      <div class="fld wrow">
        <span class="wtx"><b><Snowflake size={16} aria-hidden="true" />{t('Longer in winter')}</b><small>{t('November to February every {n} days instead of {m}', { n: winterEvery, m: Math.max(1, Math.round(+every || PLANT_EVERY)) })}</small></span>
        <button type="button" class="switch" role="switch" aria-checked={winter} aria-label={t('Longer in winter')} onclick={() => (winter = !winter)}><span class="knob"></span></button>
      </div>
      <p class="hint">{t('Finger test: if the soil is dry 2 cm deep, it needs water.')}</p>
      {#if from}<p class="hint"><a href={`#/calendar/pflanzen?plant=${encodeURIComponent(from.id)}`} onclick={() => dialog.close()} data-plant-pass-link>{t('Plant passport')}</a> · {t('photos and your observations of the spot, with every move')}</p>{/if}
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
  .sugg {
    gap: 6px;
  }
  .wrow {
    display: flex;
    align-items: center;
    gap: 12px;
  }
  .wtx {
    flex: 1;
    min-width: 0;
  }
  .wtx b {
    display: flex;
    align-items: center;
    gap: 6px;
    font-weight: 500;
  }
  .wtx small {
    color: var(--ink-2);
  }
  .switch {
    position: relative;
    flex: none;
    width: 48px;
    height: 28px;
    border: 0;
    border-radius: 99px;
    background: var(--line-strong, var(--line));
    cursor: pointer;
  }
  .switch::before {
    content: '';
    position: absolute;
    inset: -8px;
  }
  .switch .knob {
    position: absolute;
    top: 3px;
    left: 3px;
    width: 22px;
    height: 22px;
    border-radius: 50%;
    background: var(--paper);
    box-shadow: 0 1px 2px var(--shadow);
    transition: left 0.15s;
  }
  .switch[aria-checked='true'] {
    background: var(--accent);
  }
  .switch[aria-checked='true'] .knob {
    left: 23px;
  }
  @media (prefers-reduced-motion: reduce) {
    .switch .knob {
      transition: none;
    }
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
