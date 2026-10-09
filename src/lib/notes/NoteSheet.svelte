<script>
  /**
   * v0.48.0 one note, open (Noah 12a-16a): topic, pin (at most 3), title, text, link, photo,
   * checklist (tick, add, remove), what it is linked to, and «Aus Notiz wird …»: a trip idea, a wish
   * or a bike problem. The note stays and links to what it became. Changes are saved when the sheet
   * closes; «Fertig» is the one main button.
   */
  import { db } from '../db.js';
  import { TOPICS, MAX_PINNED, addLink, noteTitle } from '../notebook.js';
  import { fileNote } from '../inbox.js';
  import { newTrip } from '../trips.js';
  import { nextNumber } from '../notes.js';
  import { nextId } from '../gear.js';
  import { switchTrip } from '../nav.js';
  import { t } from '../i18n.svelte.js';
  import { Pin, PinOff, X, Route, Heart, Wrench, Link2, Plus, Trash2, Check, ChevronLeft } from '@lucide/svelte';

  let { note, bikes = [], pinnedCount = 0, onclose, onmade } = $props();

  let dialog;
  // svelte-ignore state_referenced_locally
  let draft = $state(structuredClone($state.snapshot(note)));
  let point = $state('');
  let make = $state(null); // 'trip' | 'wish' | 'problem'
  // svelte-ignore state_referenced_locally
  let name = $state(noteTitle(note));
  let start = $state('');
  let days = $state('2');
  // svelte-ignore state_referenced_locally
  let bike = $state(note.bikeId ?? bikes[0]?.id ?? null);
  let msg = $state('');
  let busy = $state(false);

  $effect(() => {
    dialog.showModal();
  });

  function togglePin() {
    if (!draft.pinned && pinnedCount >= MAX_PINNED) return (msg = t('At most {n} notes can be pinned. Unpin one first.', { n: MAX_PINNED }));
    msg = '';
    draft.pinned = !draft.pinned;
  }
  function addPoint() {
    if (!point.trim()) return;
    draft.checklist = [...(draft.checklist ?? []), { text: point.trim(), done: false }];
    point = '';
  }
  async function saveAndClose() {
    const now = new Date().toISOString();
    const before = JSON.stringify(note);
    const after = $state.snapshot(draft);
    if (JSON.stringify({ ...after }) !== before) await db.notes.put({ ...after, editedAt: now });
  }
  async function closeIt() {
    await saveAndClose();
    dialog.close();
  }
  async function remove() {
    if (!confirm(t('Delete the note "{text}"?', { text: noteTitle(draft).slice(0, 40) }))) return;
    await db.notes.delete(note.id);
    dialog.close();
  }

  const MAKES = [
    { key: 'trip', name: 'Trip idea', icon: Route },
    { key: 'wish', name: 'Wish', icon: Heart },
    { key: 'problem', name: 'Problem', icon: Wrench },
  ];
  const SAVE = { trip: 'Create trip idea', wish: 'Onto the wishlist', problem: 'Into bike care' };

  async function makeIt() {
    msg = '';
    const b = bikes.find((x) => x.id === bike) ?? null;
    if ((make === 'trip' || make === 'problem') && !b) return (msg = t('Choose a bike.'));
    if (make !== 'problem' && !name.trim()) return (msg = t('Give it a name.'));
    busy = true;
    const now = new Date().toISOString();
    const src = { ...$state.snapshot(draft), text: [noteTitle(draft), draft.text !== noteTitle(draft) ? draft.text : ''].filter(Boolean).join(' – ') };
    let link = null;
    try {
      await db.transaction('rw', db.notes, db.trips, db.items, db.maintenance, async () => {
        if (make === 'trip') {
          const trip = { ...newTrip({ title: name, startDate: start || null, days, bike: b }, await db.trips.toArray(), await db.items.toArray()), idea: true, fromNote: note.id, note: draft.link?.url ? `${draft.link.title} ${draft.link.url}` : '' };
          await db.trips.put(trip);
          link = { kind: 'trip', ref: trip.id, label: name.trim() };
        } else if (make === 'wish') {
          const out = fileNote(src, 'wish', { name, ids: { item: nextId(await db.items.toArray(), 'lux') }, now });
          await db.items.put(out.item);
          link = { kind: 'wish', ref: out.item.id, label: out.item.name };
        } else {
          const out = fileNote(src, 'problem', { bike: b, ids: { task: nextNumber(await db.maintenance.toArray()) }, now });
          await db.maintenance.put({ ...out.repair, source: 'Note' });
          link = { kind: 'problem', ref: out.repair.id, label: b.name, bikeId: b.id };
        }
        draft = addLink($state.snapshot(draft), link, now);
        await db.notes.put($state.snapshot(draft));
      });
      onmade?.({ kind: make, link });
      make = null;
    } catch (err) {
      msg = err.message || t('This could not be saved.');
    } finally {
      busy = false;
    }
  }
  const LINK_ICON = { trip: Route, wish: Heart, problem: Wrench };
  const linkHref = (l) => (l.kind === 'trip' ? '#/pack' : l.kind === 'wish' ? `#/gear?item=${encodeURIComponent(l.ref)}` : `#/bikes?tab=care&bike=${encodeURIComponent(l.bikeId ?? '')}&open=1`);
  const LINK_NAME = { trip: 'Trip idea', wish: 'Wish', problem: 'Problem' };
</script>

<dialog class="sheet nsheet" bind:this={dialog} onclose={onclose} oncancel={(e) => (e.preventDefault(), closeIt())} aria-labelledby="note-h">
  {#if !make}
    <div class="top">
      <div class="chips topics" role="group" aria-label={t('Topic')}>
        {#each TOPICS as x (x.key)}<button type="button" class="chip sm" aria-pressed={(draft.topic ?? 'general') === x.key} onclick={() => (draft.topic = x.key)}><i class="dot t-{x.key}" aria-hidden="true"></i>{t(x.name)}</button>{/each}
      </div>
      <button type="button" class="ib" aria-pressed={!!draft.pinned} aria-label={draft.pinned ? t('Unpin') : t('Pin')} onclick={togglePin}>{#if draft.pinned}<PinOff size={18} aria-hidden="true" />{:else}<Pin size={18} aria-hidden="true" />{/if}</button>
      <button type="button" class="ib" aria-label={t('Close')} onclick={closeIt}><X size={20} aria-hidden="true" /></button>
    </div>
    <h2 id="note-h" class="sr">{noteTitle(draft) || t('Note')}</h2>
    <label class="fld"><span class="sr">{t('Title')}</span><input class="inp ttl" type="text" bind:value={draft.title} placeholder={t('Title')} /></label>
    <label class="fld"><span class="sr">{t('Text')}</span><textarea class="inp" rows="4" bind:value={draft.text} placeholder={t('Text')}></textarea></label>
    {#if draft.link?.url}
      <p class="lk"><Link2 size={16} aria-hidden="true" /><span><b>{draft.link.title}</b><a href={draft.link.url} target="_blank" rel="noopener noreferrer">{draft.link.url}</a></span></p>
    {/if}
    {#if draft.photo}<img class="ph" src={draft.photo} alt={t('Photo of the note')} />{/if}

    <p class="lbl">{t('Checklist')}{#if (draft.checklist ?? []).length}<span class="q"> · {(draft.checklist ?? []).filter((c) => c.done).length}/{draft.checklist.length}</span>{/if}</p>
    <ul class="cl">
      {#each draft.checklist ?? [] as c, i (i)}
        <li>
          <label class="ck"><input type="checkbox" bind:checked={c.done} /><span class:done={c.done}>{c.text}</span></label>
          <button type="button" class="ib sm" aria-label={t('Remove {name}', { name: c.text })} onclick={() => (draft.checklist = draft.checklist.filter((_, j) => j !== i))}><Trash2 size={16} aria-hidden="true" /></button>
        </li>
      {/each}
    </ul>
    <form class="addp" onsubmit={(e) => (e.preventDefault(), addPoint())}>
      <input class="inp" type="text" bind:value={point} placeholder={t('Add a point')} aria-label={t('Add a point')} />
      <button type="submit" class="ib" aria-label={t('Add')}><Plus size={18} aria-hidden="true" /></button>
    </form>

    {#if (draft.links ?? []).length}
      <p class="zlabel">{t('Linked')}</p>
      <div class="chips">
        {#each draft.links as l, i (i)}{@const I = LINK_ICON[l.kind] ?? Link2}<a class="lchip" href={linkHref(l)} onclick={(e) => { if (l.kind === 'trip') { e.preventDefault(); switchTrip(l.ref, '#/pack'); } }}><I size={14} aria-hidden="true" />{l.label} · {t(LINK_NAME[l.kind] ?? 'Linked')}</a>{/each}
      </div>
    {/if}

    <p class="zlabel">{t('Turn the note into …')}</p>
    <div class="tiles">
      {#each MAKES as m (m.key)}{@const I = m.icon}<button type="button" class="tile" data-make={m.key} onclick={() => ((make = m.key), (msg = ''))}><span class="ic m-{m.key}"><I size={18} aria-hidden="true" /></span>{t(m.name)}</button>{/each}
    </div>
    {#if msg}<p class="err" role="alert">{msg}</p>{/if}
    <div class="foot">
      <button type="button" class="lnk" onclick={remove}>{t('Delete')}</button>
      <button type="button" class="btn hi" onclick={closeIt}>{t('Done')}</button>
    </div>
  {:else}
    <div class="top">
      <h2 id="note-h" class="title">{t(MAKES.find((m) => m.key === make).name)}</h2>
      <button type="button" class="ib" aria-label={t('Close')} onclick={closeIt}><X size={20} aria-hidden="true" /></button>
    </div>
    <p class="q">{t('From the note «{name}»', { name: noteTitle(draft) })}</p>
    {#if make !== 'problem'}
      <label class="fld"><span class="lbl">{t('Name')}</span><input class="inp" type="text" bind:value={name} /></label>
    {/if}
    {#if make === 'trip'}
      <div class="two">
        <label class="fld"><span class="lbl">{t('When')} <span class="q">{t('optional')}</span></span><input class="inp" type="date" bind:value={start} /></label>
        <label class="fld"><span class="lbl">{t('Days')}</span><input class="inp num" type="number" min="1" max="60" bind:value={days} /></label>
      </div>
    {/if}
    {#if make === 'trip' || make === 'problem'}
      <p class="lbl">{t('Bike')}</p>
      <div class="chips" role="group" aria-label={t('Bike')}>
        {#each bikes as b (b.id)}<button type="button" class="chip" aria-pressed={bike === b.id} onclick={() => (bike = b.id)}>{#if bike === b.id}<Check size={14} aria-hidden="true" />{/if}{b.name}</button>{/each}
      </div>
    {/if}
    {#if msg}<p class="err" role="alert">{msg}</p>{/if}
    <button type="button" class="btn hi wide" disabled={busy} onclick={makeIt}>{t(SAVE[make])}</button>
    <button type="button" class="lnk wide" onclick={() => (make = null)}><ChevronLeft size={16} aria-hidden="true" />{t('Back to the note')}</button>
  {/if}
</dialog>

<style>
  .nsheet {
    padding: 16px;
  }
  .top {
    display: flex;
    align-items: flex-start;
    gap: 6px;
    margin-bottom: 8px;
  }
  .top .title {
    flex: 1;
    margin: 0;
    font-size: var(--fs-section);
  }
  .topics {
    flex: 1;
    margin: 0;
  }
  .ib {
    flex: none;
    display: grid;
    place-items: center;
    width: 44px;
    height: 44px;
    border: 0;
    border-radius: 10px;
    background: var(--paper-2);
    color: var(--ink-2);
    cursor: pointer;
  }
  .ib[aria-pressed='true'] {
    color: var(--hi);
  }
  .ib.sm {
    background: none;
  }
  .fld {
    display: block;
    margin: 0 0 10px;
    min-width: 0;
  }
  .ttl {
    font-weight: 600;
  }
  textarea.inp {
    resize: vertical;
  }
  .chips {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin: 0 0 10px;
  }
  .chip {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    min-height: 44px;
    padding: 4px 12px;
    border: 1.5px solid var(--line);
    border-radius: 10px;
    background: var(--paper);
    color: var(--ink);
    font: 500 var(--fs-small) var(--font-body);
    cursor: pointer;
  }
  .chip[aria-pressed='true'] {
    border-color: var(--hi);
    background: var(--hi-soft);
  }
  .dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--ink-3);
  }
  .t-bike {
    background: var(--ink-2);
  }
  .t-trips {
    background: var(--accent);
  }
  .t-gear {
    background: var(--hi);
  }
  .t-training {
    background: var(--warn);
  }
  .lk {
    display: flex;
    gap: 8px;
    align-items: flex-start;
    padding: 10px 12px;
    border-radius: 10px;
    background: var(--paper-2);
  }
  .lk span {
    display: grid;
    min-width: 0;
  }
  .lk a {
    color: var(--accent);
    font-size: var(--fs-small);
    overflow-wrap: break-word;
  }
  .ph {
    display: block;
    max-width: 100%;
    max-height: 220px;
    border-radius: 8px;
    margin: 0 0 10px;
  }
  .q {
    color: var(--ink-3);
    font-weight: 400;
  }
  .cl {
    list-style: none;
    margin: 0;
    padding: 0;
  }
  .cl li {
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .ck {
    flex: 1;
    display: flex;
    align-items: center;
    gap: 10px;
    min-height: 44px;
    min-width: 0;
    cursor: pointer;
  }
  .ck input {
    width: 20px;
    height: 20px;
    accent-color: var(--accent);
    flex: none;
  }
  .ck span {
    overflow-wrap: break-word;
    min-width: 0;
  }
  .done {
    color: var(--ink-3);
    text-decoration: line-through;
  }
  .addp {
    display: flex;
    gap: 6px;
    margin: 4px 0 6px;
  }
  .lchip {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    min-height: 44px;
    padding: 2px 12px;
    border: 1px solid var(--line);
    border-radius: 999px;
    color: var(--ink-2);
    font-size: var(--fs-small);
    text-decoration: none;
  }
  .tiles {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 8px;
    margin-bottom: 12px;
  }
  .tile {
    display: grid;
    justify-items: center;
    gap: 6px;
    min-height: 72px;
    padding: 10px 6px;
    border: 1.5px solid var(--line);
    border-radius: 12px;
    background: var(--paper);
    color: var(--ink);
    font: 500 var(--fs-small) var(--font-body);
    cursor: pointer;
  }
  .tile .ic {
    display: grid;
    place-items: center;
    width: 34px;
    height: 34px;
    border-radius: 8px;
    background: var(--paper-2);
  }
  .m-trip {
    color: var(--accent);
  }
  .m-problem {
    color: var(--hi);
  }
  .foot {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 10px;
  }
  .lnk {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 4px;
    min-height: 44px;
    border: 0;
    background: none;
    color: var(--ink-2);
    font: inherit;
    text-decoration: underline;
    cursor: pointer;
  }
  .two {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
  }
  .wide {
    width: 100%;
  }
  .err {
    color: var(--bad);
  }
</style>
