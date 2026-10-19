<script>
  import { askDelete, deleteWithUndo } from '../ui/ask.js'; // «Rückmeldungen» 19.10.2026: the app's own question, then 4 s «Undo»
  import { closeKeep } from '../ui/keeptyped.js';
  import { backClose } from '../ui/backclose.js';
  import { offerRename } from '../ui/rename.svelte.js';
  import RenameSheet from '../ui/RenameSheet.svelte';
  import { Pencil, X, Link, StickyNote, MapPin } from '@lucide/svelte';
  import OptionButton from '../ui/OptionButton.svelte';
  import FoldRow from '../ui/FoldRow.svelte';
  import Btn from '../ui/Btn.svelte';
  import './velo-dlg.css';
  import { db } from '../db.js';
  import { SLOTS, SLOT, isWornSlot } from '../bikes.js';
  import { formatWeight, parseGrams } from '../gear.js';
  import { TRIP_DOMAINS } from '../domains.js';
  import { t, nameOf } from '../i18n.svelte.js';
  import '../ui/daumen.css'; // FE1: Save stays at the bottom edge of the window on a phone
  import { weiter } from '../daumen.js'; // FE16: «Weiter» to the next field, the number keyboard

  /** bag: the bag to edit, or null for "Add bag" (slot: the place it is for, v0.31.0). Weight comes from the linked gear item. */
  let { bag, slot = null, items, bags, bikes, onclose } = $props();

  // The dialog edits a copy of the bag as it was when it opened, so reading `bag` once is intended.
  // svelte-ignore state_referenced_locally
  const isNew = !bag;
  // svelte-ignore state_referenced_locally
  let draft = $state(bag ? { ...bag, volumeL: bag.volumeL ?? '', itemId: bag.itemId ?? '', grams: bag.weightG ?? '', domains: [...(bag.domains ?? [])] } : { id: '', name: '', slot: slot && SLOT[slot] ? slot : 'seat', volumeL: '', itemId: '', pieces: 1, note: '', grams: '', domains: [] });
  // v0.37.0 (Noah 1a): a worn bag (Back, Hip) has its areas and, without a gear item, its own weight.
  const worn = $derived(isWornSlot(draft.slot));
  // SN7 «Seiten neu» (answer 5a): the place as option buttons: the common ones (and the place the bag
  // has now) in front, every other place in the fold «More places». One place, always one chosen.
  const COMMON = ['seat', 'frame', 'top', 'bar', 'fork', 'carry'];
  // svelte-ignore state_referenced_locally
  const firstPlaces = SLOTS.filter((s) => COMMON.includes(s.key) || s.key === draft.slot);
  const otherPlaces = SLOTS.filter((s) => !firstPlaces.includes(s));
  // svelte-ignore state_referenced_locally
  let linkOpen = $state(!!draft.itemId);
  // svelte-ignore state_referenced_locally
  let noteOpen = $state(!!draft.note);
  let error = $state('');
  let dialog;
  // The bikes this bag sits on («am Gravel Blau»).
  // svelte-ignore state_referenced_locally
  const onBikes = bag ? bikes.filter((b) => Object.values(b.setup ?? {}).includes(bag.id)).map((b) => b.name) : [];

  // Gear items that can hold the weight of a bag: bags first, then bike parts.
  // v0.23.0 (AP09): the item already linked stays in the list, also after its category changed,
  // so saving the bag never drops the link (and the weight) without being asked.
  const linkable = $derived(
    items
      .filter((i) => i.category === 'bags' || i.category === 'bike' || (bag?.itemId && i.id === bag.itemId))
      .sort((a, b) => (a.category ?? '').localeCompare(b.category ?? '') || a.name.localeCompare(b.name)),
  );
  const linked = $derived(items.find((i) => i.id === draft.itemId));

  $effect(() => {
    dialog.showModal();
  });

  function newId(name) {
    const base = 'bag-' + name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 24);
    let id = base;
    for (let n = 2; bags.some((b) => b.id === id); n++) id = `${base}-${n}`;
    return id;
  }

  async function save(event) {
    event.preventDefault();
    if (!draft.name.trim()) return (error = t('Give the bag a name.'));
    const vol = String(draft.volumeL).trim() === '' ? null : Number(String(draft.volumeL).replace(',', '.'));
    if (vol != null && !(vol > 0 && vol <= 100)) return (error = t('Volume: litres from 0.1 to 100, or leave it empty.'));
    let weightG = null;
    if (!draft.itemId && String(draft.grams ?? '').trim() !== '') {
      weightG = parseGrams(String(draft.grams));
      if (weightG == null) return (error = t('Weight: whole grams from 1 to 30,000, or leave it empty.'));
    }
    const { grams, ...d } = $state.snapshot(draft);
    const record = {
      ...d,
      id: isNew ? newId(d.name) : d.id,
      name: d.name.trim(),
      volumeL: vol,
      itemId: d.itemId || null,
      pieces: Math.max(1, Number(d.pieces) || 1),
      weightG: d.itemId ? (bag?.weightG ?? null) : weightG,
      domains: isWornSlot(d.slot) ? d.domains ?? [] : bag?.domains ?? [],
    };
    if (record.weightG == null) delete record.weightG;
    if (!record.domains.length) delete record.domains;
    await db.transaction('rw', db.containers, db.bikes, async () => {
      await db.containers.put(record);
      // A bag that moves to another place leaves the bikes where it sat at the old place.
      // v0.37.0: Back and Hip take every worn bag, so a move between them leaves it where it is.
      if (!isNew && bag.slot !== record.slot && !(isWornSlot(bag.slot) && isWornSlot(record.slot))) {
        for (const b of bikes) if (b.setup?.[bag.slot] === bag.id) await db.bikes.update(b.id, { [`setup.${bag.slot}`]: null });
      }
    });
    dialog.close();
  }

  // v0.72.0 «Feinschliff» (Umbenennen 2a, 4a): Android back and Escape keep what was typed (saved
  // like «Save»); untouched, or a new bag without a name, it only closes.
  // svelte-ignore state_referenced_locally
  const openedAs = JSON.stringify(draft);
  const keepOnBack = () => (JSON.stringify($state.snapshot(draft)) === openedAs || !draft.name.trim() ? dialog.close() : save({ preventDefault() {} }));

  // v0.72.0 (Umbenennen 1a): the pencil next to the name opens the one rename sheet.
  let renaming = $state(false);
  async function rename(name) {
    const old = bag.name;
    await db.containers.update(bag.id, { name });
    draft.name = name;
    shownName = name;
    offerRename(name, async () => {
      await db.containers.update(bag.id, { name: old });
      if (dialog?.open) (draft.name = old), (shownName = old);
    });
  }
  // svelte-ignore state_referenced_locally
  let shownName = $state(bag?.name ?? '');

  async function remove() {
    const name = bag.name;
    if ((await askDelete({ title: t('Delete the bag "{name}"?', { name }), text: t('It is taken off every bike. The gear item stays. You can bring it back for 4 seconds afterwards.') })) !== 'delete') return;
    const ok = await deleteWithUndo({
      run: () =>
        db.transaction('rw', db.containers, db.bikes, async () => {
          const rec = await db.containers.get(bag.id);
          const places = [];
          await db.containers.delete(bag.id);
          // Off every place of every bike (a worn bag can sit on Back or Hip).
          for (const b of await db.bikes.toArray())
            for (const [k, v] of Object.entries(b.setup ?? {}))
              if (v === bag.id) {
                places.push([b.id, k]);
                await db.bikes.update(b.id, { [`setup.${k}`]: null });
              }
          return { rec, places };
        }),
      undo: ({ rec, places }) =>
        db.transaction('rw', db.containers, db.bikes, async () => {
          if (rec) await db.containers.put(rec);
          for (const [id, k] of places) await db.bikes.update(id, { [`setup.${k}`]: rec.id });
        }),
      text: t('"{name}" deleted.', { name }),
      name,
    });
    if (ok) dialog.close();
  }
</script>

<dialog class="sheet vdlg from-below" bind:this={dialog} use:backClose={keepOnBack} {onclose} aria-labelledby="bag-h">
  <form onsubmit={save} novalidate use:weiter>
    <!-- Design-Refresh P7 (V3): the name as the title, place and bikes in the quiet line, ✕ top right. -->
    <div class="vd-head">
      <div class="vd-t">
        <h2 id="bag-h">{#if isNew}{t('Add bag')}{:else}<span>{shownName}</span><button type="button" class="pen" aria-label={t('Rename {name}', { name: shownName })} title={t('Rename')} onclick={() => (renaming = true)}><Pencil size={16} aria-hidden="true" /></button>{/if}</h2>
        <p class="vd-sub meta">{[t(SLOT[draft.slot]?.name ?? 'Bag'), onBikes.length ? t('on {bike}', { bike: onBikes.join(', ') }) : ''].filter(Boolean).join(' · ')}</p>
      </div>
      <button type="button" class="vd-x" aria-label={t('Close')} onclick={() => closeKeep(dialog)}><X size={18} aria-hidden="true" /></button>
    </div>
    <label class="vd-field"><span class="lbl">{t('Name')}</span><input class="inp" bind:value={draft.name} required enterkeyhint="done" placeholder={t('e.g. Seat pack 10 L')} /></label>
    <!-- SN7: the place as option buttons (was a list); the rare places in a fold -->
    <span class="lbl vd-lbl" id="bag-place-l">{t('Place')}</span>
    <div class="vd-opts" role="group" aria-labelledby="bag-place-l">
      {#each firstPlaces as s (s.key)}<OptionButton pressed={draft.slot === s.key} label={t(s.name)} explain={t(s.where)} onclick={() => (draft.slot = s.key)} />{/each}
    </div>
    {#if otherPlaces.length}
      <div class="vd-folds">
        <FoldRow icon={MapPin} label={t('More places')} summary={otherPlaces.some((s) => s.key === draft.slot) ? t(SLOT[draft.slot].name) : otherPlaces.map((s) => t(s.name)).slice(0, 2).join(', ') + ' …'}>
          <div class="vd-opts">
            {#each otherPlaces as s (s.key)}<OptionButton pressed={draft.slot === s.key} label={t(s.name)} explain={t(s.where)} onclick={() => (draft.slot = s.key)} />{/each}
          </div>
        </FoldRow>
      </div>
    {/if}
    <div class="vd-pair">
      <label><span class="lbl">{t('Volume (L)')}</span><input class="inp num" type="text" inputmode="decimal" bind:value={draft.volumeL} placeholder={t('unknown')} /></label>
      {#if draft.itemId}<label><span class="lbl">{t('Weight')}</span><input class="inp num" type="text" readonly value={linked?.weightG == null ? t('not weighed') : formatWeight(linked.weightG * (Number(draft.pieces) || 1))} /></label>
      {:else}<label><span class="lbl">{t('Weight (g)')}</span><input class="inp num" type="text" inputmode="numeric" bind:value={draft.grams} placeholder={t('not weighed')} /></label>{/if}
    </div>
    {#if worn}
      <!-- v0.37.0 (Noah 3a): the areas a worn bag is made for; trips of that area suggest it. -->
      <fieldset class="areas">
        <legend class="lbl">{t('For these areas')}</legend>
        <div class="vd-chips">
          {#each TRIP_DOMAINS as d (d.key)}
            {@const on = draft.domains.includes(d.key)}
            <label class="vd-chip"><input type="checkbox" checked={on} onchange={(e) => (draft.domains = e.currentTarget.checked ? [...draft.domains, d.key] : draft.domains.filter((x) => x !== d.key))} /> {t(d.name)}</label>
          {/each}
        </div>
      </fieldset>
    {/if}
    <div class="vd-folds">
      <FoldRow icon={Link} label={t('Link to an item')} summary={linked ? nameOf(linked) : t('the weight then comes from the item')} bind:open={linkOpen} data-fold="link">
        <div class="grid">
          <label>
            <span class="lbl">{t('Weight from gear item')}</span>
            <select class="sel" bind:value={draft.itemId}>
              <option value="">{t('None')}</option>
              {#each linkable as i (i.id)}<option value={i.id}>{nameOf(i)} · {i.id}</option>{/each}
            </select>
          </label>
          {#if draft.itemId}<label><span class="lbl">{t('Pieces of that item')}</span><input class="inp num" type="number" inputmode="numeric" min="1" bind:value={draft.pieces} /></label>{/if}
        </div>
      </FoldRow>
      <FoldRow icon={StickyNote} label={t('Note')} summary={draft.note?.trim() || t('optional')} bind:open={noteOpen} data-fold="note">
        <label><span class="lbl sr">{t('Note')}</span><input class="inp" bind:value={draft.note} /></label>
      </FoldRow>
    </div>
    <!-- v0.26.1 (Noah 15b): litres are optional; Pack only talks about volume when everything has litres. -->
    <p class="note">{t('Litres are optional. Pack shows "used of litres" only when every bag in use and every item in it has litres.')}{#if worn}<br /><span class="quiet">{t('Worn bags count to On me, not to the bike.')}</span>{/if}</p>
    <p class="err" role="alert">{error}</p>
    <div class="vd-foot sn7 daumen-foot">
      {#if !isNew}<button type="button" class="btn del" onclick={remove}>{t('Delete')}</button>{/if}
      <Btn kind="quiet" label={t('Discard')} onclick={() => dialog.close()} />
      <Btn kind="hi" type="submit" label={t('Save')} />
    </div>
  </form>
</dialog>

{#if renaming}
  <RenameSheet kicker={t('Bag')} title={t('Rename bag')} value={shownName} hint={t('Place, volume and weight stay as they are.')} onsave={rename} onclose={() => (renaming = false)} />
{/if}

<style>
  h2 .pen {
    display: inline-grid;
    place-items: center;
    width: 44px;
    height: 44px;
    margin: -8px 0;
    border: 0;
    border-radius: var(--r-ctl);
    background: none;
    color: var(--ink-3);
    cursor: pointer;
  }
  h2 .pen:hover {
    background: var(--paper-2);
    color: var(--ink);
  }
  .grid {
    display: grid;
    gap: 12px;
  }
  .note {
    font-size: var(--fs-small);
    color: var(--ink-3);
    margin: 12px 0 0;
  }
  .err {
    color: var(--bad);
    margin: 8px 0 0;
    font-size: var(--fs-small);
  }
  .err:empty {
    display: none;
  }
  .areas {
    margin: 0 0 12px;
    padding: 0;
    border: 0;
  }
  .areas legend {
    margin-bottom: 6px;
  }
  .quiet {
    color: var(--ink-3);
  }
  .del {
    color: var(--bad);
  }
</style>
