<script>
  import { activeBikes } from '../bikeretire.js';
  /**
   * Merken (Kal1, mockup PL2, Noah «PL1-PL3 freigeben» 14.10.2026): a to-do or a reminder in one window.
   * Only «What?» is needed; date, reminder and repeat are suggestions, each one tap. A reminder is the
   * same window with «Remind» already chosen (reminder = true). Saving offers Undo (ondone(result)).
   * ER3 (Ich › Erinnerungen): with todo set, the window changes that to-do or reminder.
   * PL2 (Noah «2a»): «Auch in Google-Kalender» saves a calendar file with an alarm (remind.js remindIcs).
   */
  import { tick } from 'svelte';
  import { liveQuery } from 'dexie';
  import { X, CalendarDays, Bell, Repeat2, ListChecks, Link2, Plus } from '@lucide/svelte';
  import { backClose } from '../ui/backclose.js';
  import DateInput from '../ui/DateInput.svelte';
  import { db } from '../db.js';
  import { sortBikes } from '../bikes.js';
  import { localDay } from '../localday.js';
  import { addDays } from '../merken.js';
  import { addTodo, updateTodo, removeTodo } from '../merkendb.js';
  import { t } from '../i18n.svelte.js';
  import { remindIcs } from '../remind.js';
  import { icsCalendar } from '../flowmed.js';
  import { CalendarPlus } from '@lucide/svelte';
  import WaitPick from '../stand/WaitPick.svelte'; // Paket A part 1: «Waiting for something?»
  import { parseWhen } from './parse.js'; // N1: «morgen 18 Uhr, jeden Sonntag» in the words
  import { addStep, moveStep, removeStep, renameStep, stepsOf, MAX_STEPS } from './steps.js'; // N2
  import { addLink, removeLink, linksOf, linkName } from './links.js'; // N3
  import { noteTitle } from '../notebook.js';
  import SortGrip from '../ui/SortGrip.svelte';
  import SortArrows from '../ui/SortArrows.svelte';
  import { sortable } from '../ui/sortable.js';

  // preset: { due, remind, repeat } from the quick field (F1) when the window opens with «More …»
  let { text: start = '', reminder = false, todo = null, preset = null, onclose, ondone } = $props();

  const today = localDay();
  // svelte-ignore state_referenced_locally
  const from = todo;
  const remindOf = (r) => (!r ? 'no' : r.before ? 'before' : r.at === '08:00' ? 'day' : 'time');
  // N1: words in the start text («morgen 18 Uhr») are taken over as date, reminder and repeat
  // svelte-ignore state_referenced_locally
  const p0 = !from && start && !preset ? parseWhen(start, today) : null;
  const fromWords = !!p0?.found.length;
  // svelte-ignore state_referenced_locally
  let text = $state(from?.text ?? (fromWords ? p0.text : start));
  // svelte-ignore state_referenced_locally
  let due = $state(from ? (from.due ?? '') : (p0?.due ?? preset?.due ?? (reminder ? addDays(today, 1) : '')));
  // svelte-ignore state_referenced_locally
  let remind = $state(from ? remindOf(from.remind) : p0?.remind ? remindOf(p0.remind) : preset?.remind ? remindOf(preset.remind) : reminder ? 'day' : 'no'); // no · day · before · time
  let time = $state(from?.remind?.at ?? p0?.remind?.at ?? preset?.remind?.at ?? '08:00');
  let repeat = $state(from?.repeat?.every === 'rain' ? 'no' : (from?.repeat?.every ?? p0?.repeat?.every ?? preset?.repeat?.every ?? 'no')); // no · day · week · month · km
  let km = $state(from?.repeat?.km ?? 300);
  let bikeId = $state(from?.repeat?.bikeId ?? '');
  let google = $state(false);
  // svelte-ignore state_referenced_locally
  let wait = $state(from?.wait ?? null);
  // N2 steps and N3 «belongs to» are edited here and saved with the to-do
  // svelte-ignore state_referenced_locally
  let steps = $state(stepsOf(from).map((x) => ({ ...x })));
  // svelte-ignore state_referenced_locally
  let links = $state(linksOf(from).map((x) => ({ ...x })));
  let newStep = $state('');
  let error = $state('');
  let dialog;
  let input;

  const tripsQ = liveQuery(() => db.trips.toArray());
  const notesQ = liveQuery(() => db.notes.toArray());
  const trips = $derived($tripsQ ?? []);
  const notes = $derived(($notesQ ?? []).filter((n) => n.status !== 'open').sort((a, b) => (b.editedAt ?? b.at ?? '').localeCompare(a.editedAt ?? a.at ?? '')).slice(0, 40));
  const bikesQ = liveQuery(() => db.bikes.toArray());
  const bikes = $derived(sortBikes(activeBikes($bikesQ ?? [])));
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

  /** The calendar file of this one reminder (2a: free, no Google account in the app). */
  function download(todo) {
    const url = URL.createObjectURL(new Blob([remindIcs([todo], icsCalendar)], { type: 'text/calendar' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = 'erinnerung.ics';
    document.body.append(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  const stepList = (fn) => (steps = stepsOf(fn({ steps })));
  function pushStep() {
    stepList((td) => addStep(td, newStep, { id: `st-${Date.now().toString(36)}-${steps.length}` }));
    newStep = '';
  }
  function pickLink(e) {
    const [kind, ref] = e.currentTarget.value.split('|');
    e.currentTarget.value = '';
    if (!kind || !ref) return;
    const label = kind === 'trip' ? trips.find((x) => x.id === ref)?.title : kind === 'bike' ? bikes.find((x) => x.id === ref)?.name : noteTitle(notes.find((x) => x.id === ref));
    links = linksOf(addLink({ links }, { kind, ref, label }));
  }
  const linkText = (l) => linkName(l, { trips, bikes: $bikesQ ?? [], notes: $notesQ ?? [] }, noteTitle) || t('Note');
  async function save(e) {
    e?.preventDefault();
    if (!text.trim()) {
      error = t('Write what you want to remember.');
      return input?.focus();
    }
    let words = null;
    if (!from && due === '' && repeat === 'no' && remind === 'no') {
      // N1: nothing chosen above, but the words say «morgen 18 Uhr» → take it over
      const p = parseWhen(text, today);
      if (p.found.length) words = p;
    }
    if (newStep.trim()) pushStep(); // a step typed but not added yet is not lost
    const fields = {
      text: words ? words.text : text,
      steps: $state.snapshot(steps),
      links: $state.snapshot(links),
      wait: wait ? $state.snapshot(wait) : null,
      due: words ? words.due : due || null,
      remind: words ? words.remind : due && remind !== 'no' ? { at: remind === 'day' ? '08:00' : time, before: remind === 'before' ? 1 : 0 } : null,
      repeat: words ? words.repeat : repeat === 'km' ? (bike ? { every: 'km', km: Math.max(1, Math.round(+km || 300)), bikeId: bike.id, fromKm: bike.km ?? 0 } : null) : repeat === 'no' ? null : { every: repeat },
    };
    if (from?.repeat?.every === 'rain' && repeat === 'no') fields.repeat = from.repeat; // «after rain» stays
    if (from?.repeat?.every === 'month' && repeat === 'month') fields.repeat = from.repeat; // keeps «every 6 months»
    if (from?.repeat?.every === 'km' && repeat === 'km' && fields.repeat && fields.repeat.bikeId === from.repeat.bikeId) fields.repeat.fromKm = from.repeat.fromKm;
    const r = from ? { undo: await updateTodo(db, from.id, fields), todo: { ...from, ...fields } } : await addTodo(db, fields);
    if (google && fields.remind && r?.todo) download(r.todo);
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
        <p class="hint">{t('Shows in Calendar › Remember and on Me › Reminders, not on Today.')}</p>
        {#if remind !== 'no'}<button type="button" class="chip gcal" aria-pressed={google} onclick={() => (google = !google)}><CalendarPlus size={16} aria-hidden="true" />{t('Also in Google Calendar (file with alarm)')}</button>{/if}
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

    <WaitPick bind:wait {today} />

    <!-- N2 (Noah 05.11.2026): steps inside a to-do; N3: where it belongs -->
    <fieldset class="fld" data-todo-steps><legend class="lbl"><ListChecks size={16} aria-hidden="true" />{t('Steps')}</legend>
      {#if steps.length}
        <ul class="stl" use:sortable={{ onmove: (a, b) => (steps = moveStep({ steps }, a, b).steps) }}>
          {#each steps as s, i (s.id)}
            <li data-sort-id={s.id}>
              <SortGrip name={s.text} onstep={(d) => (steps = moveStep({ steps }, i, i + d).steps)} />
              <input class="inp" value={s.text} maxlength="160" aria-label={t('Step')} onchange={(e) => (steps = renameStep({ steps }, s.id, e.currentTarget.value || s.text).steps)} />
              <SortArrows name={s.text} {i} n={steps.length} onstep={(d) => (steps = moveStep({ steps }, i, i + d).steps)} />
              <button type="button" class="sx" aria-label={t('Remove step: {name}', { name: s.text })} onclick={() => (steps = removeStep({ steps }, s.id).steps)}><X size={16} aria-hidden="true" /></button>
            </li>
          {/each}
        </ul>
      {/if}
      {#if steps.length < MAX_STEPS}
        <div class="stadd">
          <input class="inp" bind:value={newStep} maxlength="160" enterkeyhint="done" placeholder={t('Add a step')} aria-label={t('Add a step')} onkeydown={(e) => e.key === 'Enter' && (e.preventDefault(), pushStep())} data-step-new />
          <button type="button" class="btn sm" onclick={pushStep} disabled={!newStep.trim()}><Plus size={14} aria-hidden="true" />{t('Add')}</button>
        </div>
      {/if}
      <p class="hint">{t('Small points inside this to-do. The list shows «3 of 6».')}</p>
    </fieldset>

    <fieldset class="fld" data-todo-links><legend class="lbl"><Link2 size={16} aria-hidden="true" />{t('Belongs to')}</legend>
      <div class="chips">
        {#each links as l (l.kind + l.ref)}
          <button type="button" class="chip on" onclick={() => (links = removeLink({ links }, l.kind, l.ref).links)} aria-label={t('Remove «{name}»', { name: linkText(l) })}>{t(l.kind === 'trip' ? 'Trip' : l.kind === 'bike' ? 'Bike' : 'Note')}: {linkText(l)} <X size={14} aria-hidden="true" /></button>
        {/each}
        <select class="inp pick" onchange={pickLink} aria-label={t('Belongs to')} data-link-pick>
          <option value="">{t('Add a trip, bike or note …')}</option>
          {#if trips.length}<optgroup label={t('Trips')}>{#each trips as x (x.id)}<option value={`trip|${x.id}`}>{x.title}</option>{/each}</optgroup>{/if}
          {#if bikes.length}<optgroup label={t('Bikes')}>{#each bikes as b (b.id)}<option value={`bike|${b.id}`}>{b.name}</option>{/each}</optgroup>{/if}
          {#if notes.length}<optgroup label={t('Notes')}>{#each notes as n (n.id)}<option value={`note|${n.id}`}>{noteTitle(n) || t('Note')}</option>{/each}</optgroup>{/if}
        </select>
      </div>
      <p class="hint">{t('Then the trip, the bike or the note shows this to-do too. Always optional.')}</p>
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
  .gcal {
    gap: 6px;
    margin-top: 8px;
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
  .stl {
    list-style: none;
    margin: 0 0 8px;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  .stl li {
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .stl .inp {
    flex: 1;
    min-width: 0;
  }
  .sx {
    display: grid;
    flex: none;
    place-items: center;
    width: 44px;
    height: 44px;
    border: 0;
    border-radius: 50%;
    background: none;
    color: var(--ink-2);
    cursor: pointer;
  }
  .stadd {
    display: flex;
    gap: 8px;
    align-items: center;
  }
  .stadd .inp {
    flex: 1;
    min-width: 0;
  }
  .pick {
    min-height: 44px;
    max-width: 100%;
    width: auto;
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
