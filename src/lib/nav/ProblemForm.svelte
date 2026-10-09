<script>
  /**
   * v0.45.2 (Noah on the bike): "Problem with a bike" in the + menu. Big bike buttons, one problem
   * per line (or quick buttons), an optional photo; each line becomes an open repair in Bike care.
   * After saving a calm "3 problems saved for Factor LS ✓" with Undo. Pure part in problems.js.
   */
  import { liveQuery } from 'dexie';
  import { db } from '../db.js';
  import { rideContext, runningTrip } from '../notes.js';
  import { localDay } from '../localday.js';
  import { shrinkImage } from '../photo.js';
  import { QUICK_PROBLEMS, FIXES, PRIORITIES, PRIORITY_NAME, splitProblems, addLine, startBike, buildProblems, stepFor, repeats } from '../problems.js';
  import { wishForProblem, setFix } from '../problemsdb.js';
  import { t, tn, dateOf } from '../i18n.svelte.js';

  let { bikes = [], ondone } = $props();

  const LAST = 'problem.lastBike';
  const readLast = () => {
    try {
      return localStorage.getItem(LAST);
    } catch {
      return null;
    }
  };
  const tripsQ = liveQuery(() => db.trips.toArray());
  const today = localDay();

  let picked = $state('');
  const bike = $derived(bikes.find((b) => b.id === picked) ?? bikes.find((b) => b.id === startBike(bikes, { last: readLast(), trip: runningTrip($tripsQ ?? [], today) })) ?? null);
  let text = $state('');
  let photo = $state(null);
  let reading = $state(false);
  let busy = $state(false);
  let msg = $state('');
  // Noah: a priority is required, a deadline is optional ('none' | 'ride' | 'date').
  let priority = $state(null);
  let when = $state('none');
  let dueDate = $state('');
  let saved = $state(null); // { count, name, bikeId, noteIds, repairIds }
  const repairsQ = liveQuery(() => db.maintenance.toArray());
  const savedRows = $derived(saved ? ($repairsQ ?? []).filter((r) => saved.repairIds.includes(r.id)) : []);
  const again = $derived(saved ? repeats(($repairsQ ?? []).filter((r) => r.status !== 'gone' || saved.repairIds.includes(r.id)), saved.bikeId, today) : []);
  let area = $state();

  const lines = $derived(splitProblems(text));

  function quick(q) {
    text = addLine(text, t(q));
    area?.focus();
  }

  async function addPhoto(event) {
    const file = event.currentTarget.files[0];
    event.currentTarget.value = '';
    if (!file) return;
    reading = true;
    msg = '';
    try {
      photo = await shrinkImage(file, 1200, 0.8);
    } catch (err) {
      msg = err.message || t('This photo could not be read.');
    } finally {
      reading = false;
    }
  }

  async function save(event) {
    event.preventDefault();
    if (!bike) return (msg = t('Choose a bike.'));
    const list = lines.length ? lines : photo ? [t('Photo')] : [];
    if (!list.length) return (msg = t('Write a few words or add a photo.'));
    if (!priority) return (msg = t('Choose a priority.'));
    if (when === 'date' && !/^\d{4}-\d{2}-\d{2}$/.test(dueDate)) return (msg = t('Choose the date of the deadline.'));
    busy = true;
    msg = '';
    try {
      const ctx = rideContext($tripsQ ?? [], today);
      let out;
      await db.transaction('rw', db.notes, db.maintenance, db.items, async () => {
        out = buildProblems(list, { bike, photo, ctx, priority, dueDate: when === 'date' ? dueDate : null, beforeRide: when === 'ride', rows: await db.maintenance.toArray() });
        // "Part needed" goes on the wishlist straight away (the shopping list).
        for (const r of out.repairs) if (r.fix === 'part') r.wishId = await wishForProblem(r, bike);
        await db.maintenance.bulkPut(out.repairs);
        await db.notes.bulkPut(out.notes);
      });
      try {
        localStorage.setItem(LAST, bike.id);
      } catch {
        /* the next start just picks the first bike */
      }
      saved = { count: list.length, name: bike.name, bike: $state.snapshot(bike), bikeId: bike.id, noteIds: out.notes.map((n) => n.id), repairIds: out.repairs.map((r) => r.id) };
      text = '';
      photo = null;
      priority = null;
      when = 'none';
      dueDate = '';
    } catch (err) {
      msg = err.message || t('This could not be saved.');
    } finally {
      busy = false;
    }
  }

  async function undo() {
    const s = saved;
    saved = null;
    await db.transaction('rw', db.notes, db.maintenance, db.items, async () => {
      const wishes = (await db.maintenance.bulkGet(s.repairIds)).map((r) => r?.wishId).filter(Boolean);
      for (const id of wishes) if ((await db.items.get(id))?.ownership === 'wishlist') await db.items.delete(id);
      await db.maintenance.bulkDelete(s.repairIds);
      await db.notes.bulkDelete(s.noteIds);
    });
    msg = t('Undone.');
  }
</script>

{#if saved}
  <div class="done" role="status">
    <p class="ok"><span aria-hidden="true">✓</span> {tn(saved.count, '1 problem saved for {bike}', '{n} problems saved for {bike}', { bike: saved.name })}</p>
    <ul class="sorted">
      {#each savedRows as r (r.id)}
        <li>
          <b>{r.task}</b>
          <div class="seg" role="group" aria-label={t('How to fix: {task}', { task: r.task })}>
            {#each Object.keys(FIXES) as f (f)}
              <button type="button" aria-pressed={r.fix === f} onclick={() => setFix(r, f, saved.bike)}>{t(FIXES[f])}</button>
            {/each}
          </div>
          {#if stepFor(r)}<small>{t(stepFor(r))}</small>{/if}
          <small>{t('Priority')}: {t(PRIORITY_NAME[r.priority] ?? 'Medium')}{#if r.dueDate} · {t('by {date}', { date: dateOf(r.dueDate) })}{:else if r.beforeRide} · {t('Before the next ride')}{/if}</small>
        </li>
      {/each}
    </ul>
    {#each again as a (a.topic)}<p class="again" role="note"><b>{t('{n}× in 30 days.', { n: a.count })}</b> {t(a.text)}</p>{/each}
    <p class="small">{t('They are open repairs in Bike care now. The app sorted them; one tap changes it.')}</p>
    <div class="foot">
      <button type="button" class="btn hi" onclick={ondone}>{t('Done')}</button>
      <button type="button" class="btn" onclick={() => (saved = null)}>{t('One more')}</button>
      <a class="link" href="#/bikes?tab=care" onclick={ondone}>{t('Open Bike care')}</a>
      <button type="button" class="link" onclick={undo}>{t('Undo')}</button>
    </div>
  </div>
{:else}
  <form class="pf" onsubmit={save}>
    <fieldset class="bikes">
      <legend class="lbl">{t('Which bike?')}</legend>
      <div class="chips">
        {#each bikes as b (b.id)}
          <button type="button" class="chip" aria-pressed={bike?.id === b.id} onclick={() => (picked = b.id)}>{b.name}</button>
        {/each}
      </div>
    </fieldset>

    <label class="field">
      <span class="lbl">{t('What is wrong? One problem per line')}</span>
      <!-- svelte-ignore a11y_autofocus -->
      <textarea class="inp" bind:this={area} bind:value={text} rows="4" placeholder={`${t('e.g. Too little air in the tyres')}\n${t('Saddle too low')}`} autofocus></textarea>
    </label>

    <div class="quick" aria-label={t('Quick')}>
      {#each QUICK_PROBLEMS as q (q)}
        <button type="button" class="q" onclick={() => quick(q)}>+ {t(q)}</button>
      {/each}
    </div>

    <fieldset class="bikes">
      <legend class="lbl">{t('Priority')} <span class="req">({t('required')})</span></legend>
      <div class="seg">
        {#each PRIORITIES as p (p)}<button type="button" aria-pressed={priority === p} onclick={() => ((priority = p), (msg = ''))}>{t(PRIORITY_NAME[p])}</button>{/each}
      </div>
    </fieldset>
    <fieldset class="bikes">
      <legend class="lbl">{t('Deadline')}</legend>
      <div class="seg">
        <button type="button" aria-pressed={when === 'none'} onclick={() => (when = 'none')}>{t('None|deadline')}</button>
        <button type="button" aria-pressed={when === 'ride'} onclick={() => (when = 'ride')}>{t('Before the next ride')}</button>
        <button type="button" aria-pressed={when === 'date'} onclick={() => (when = 'date')}>{t('Date')}</button>
      </div>
      {#if when === 'date'}<input class="inp due" type="date" min={today} bind:value={dueDate} aria-label={t('Deadline')} />{/if}
    </fieldset>

    <div class="row">
      <label class="btn sm">{reading ? t('Reading…') : photo ? t('Other photo') : `+ ${t('Photo')}`}<input type="file" accept="image/*" onchange={addPhoto} hidden disabled={reading} /></label>
      {#if photo}<img class="th" src={photo} alt={t('Photo of the problem')} /><button type="button" class="link" onclick={() => (photo = null)}>{t('Remove photo')}</button>{/if}
    </div>

    {#if msg}<p class="err" role="alert">{msg}</p>{/if}
    <div class="foot">
      <button type="submit" class="btn hi" disabled={busy || reading || !bike} aria-describedby={priority ? undefined : 'pf-need'}>
        {lines.length > 1 ? t('Save {n} problems', { n: lines.length }) : t('Save problem')}
      </button>
      <span class="small" id="pf-need">{priority ? t('Each line becomes an open repair in Bike care.') : t('Choose a priority first.')}</span>
    </div>
  </form>
{/if}

<style>
  .pf,
  .done {
    display: grid;
    gap: 12px;
  }
  .sorted {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    gap: 12px;
  }
  .sorted li {
    display: grid;
    gap: 6px;
    min-width: 0;
  }
  .sorted small {
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .seg {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }
  .seg button {
    min-height: 44px;
    padding: 6px 12px;
    border: 1px solid var(--line);
    border-radius: 999px;
    background: var(--paper);
    color: var(--ink);
    font: 14px/1.2 var(--font-body);
    cursor: pointer;
  }
  .seg button[aria-pressed='true'] {
    border-color: var(--ink);
    background: var(--ink);
    color: var(--paper);
    font-weight: 600;
  }
  .req {
    font-weight: 400;
  }
  .due {
    margin-top: 8px;
    max-width: 220px;
  }
  .again {
    margin: 0;
    padding: 10px 12px;
    border-left: 3px solid var(--warn, var(--hi));
    background: var(--paper-2, transparent);
    font-size: 15px;
  }
  .bikes {
    border: 0;
    margin: 0;
    padding: 0;
    min-width: 0;
  }
  .lbl {
    display: block;
    font: 600 var(--fs-small)/1.3 var(--font-body);
    color: var(--ink-3);
    margin-bottom: 6px;
    padding: 0;
  }
  .chips,
  .quick {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
  .chip {
    min-height: 48px;
    padding: 8px 16px;
    border: 2px solid var(--line);
    border-radius: 999px;
    background: var(--paper);
    color: var(--ink);
    font: 600 16px/1.2 var(--font-body);
    cursor: pointer;
  }
  .chip[aria-pressed='true'] {
    border-color: var(--ink);
    background: var(--ink);
    color: var(--paper);
  }
  .field {
    display: grid;
    min-width: 0;
  }
  textarea {
    width: 100%;
    box-sizing: border-box;
    font: 16px/1.5 var(--font-body);
    resize: vertical;
  }
  .q {
    min-height: 44px;
    padding: 6px 12px;
    border: 1px dashed var(--line);
    border-radius: 10px;
    background: none;
    color: var(--ink);
    font: 15px/1.2 var(--font-body);
    cursor: pointer;
  }
  .q:hover,
  .q:focus-visible,
  .chip:hover,
  .chip:focus-visible {
    border-color: var(--ink);
  }
  .row,
  .foot {
    display: flex;
    align-items: center;
    gap: 12px;
    flex-wrap: wrap;
  }
  .th {
    width: 56px;
    height: 56px;
    object-fit: cover;
    border-radius: 6px;
  }
  .ok {
    margin: 0;
    font: 600 18px/1.35 var(--font-body);
  }
  .ok span {
    color: var(--good, var(--ink));
  }
  .small {
    margin: 0;
    font-size: var(--fs-small);
    color: var(--ink-3);
  }
  .err {
    color: var(--bad);
    font-size: 14px;
    margin: 0;
  }
  .link {
    border: 0;
    background: none;
    min-height: 44px;
    padding: 0 4px;
    font: inherit;
    font-size: 15px;
    color: var(--ink);
    text-decoration: underline;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
  }
</style>
