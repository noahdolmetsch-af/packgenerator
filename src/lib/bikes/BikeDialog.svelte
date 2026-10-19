<script>
  import CameraButton from '../ui/CameraButton.svelte'; // P3b Teil 3: the camera wherever a photo is added
  import { closeKeep } from '../ui/keeptyped.js';
  import { backClose } from '../ui/backclose.js';
  import { db } from '../db.js';
  import { SLOTS, renameBike, sortBikes } from '../bikes.js';
  import { withNewBike, saveOrder } from '../tourbike.svelte.js';
  import { shrinkImage } from '../photo.js';
  import { t, tn, num } from '../i18n.svelte.js';
  import { X, Bike, TriangleAlert, Mountain, Building2, Zap, Image, SlidersHorizontal } from '@lucide/svelte';
  import OptionButton from '../ui/OptionButton.svelte';
  import FoldRow from '../ui/FoldRow.svelte';
  import Btn from '../ui/Btn.svelte';
  import './velo-dlg.css';
  import { SURFACES } from '../review/werte.js';
  import '../ui/daumen.css'; // FE1: Save stays at the bottom edge of the window on a phone
  import { weiter } from '../daumen.js'; // FE16: «Weiter» to the next field, the number keyboard
  import { deleteWithUndo, saveFailed, once } from '../ui/ask.js';
  import GroupDeleteSheet from '../ui/GroupDeleteSheet.svelte';
  import { bikeLinks, deleteBike, undoDeleteBike } from '../bikedelete.js'; // «Rückmeldungen» 19.10.2026
  import { offerDone } from '../ui/rename.svelte.js';

  /** bike: the bike to edit, or null for "Add bike". */
  let { bike, bikes, oncreated, onsaved = null, onclose } = $props();

  // svelte-ignore state_referenced_locally
  const isNew = !bike;
  // svelte-ignore state_referenced_locally
  // SN2+ SN2h (answer 3 «a und sonst b»): the bike's fixed surface, for rides without a Strava sport type
  let draft = $state(bike ? { name: bike.name, type: bike.type ?? '', use: bike.use ?? '', photo: bike.photo ?? null, surface: bike.surface ?? '' } : { name: '', type: '', use: '', photo: null, surface: '' });
  // svelte-ignore state_referenced_locally
  const startText = JSON.stringify(draft); // as the window opened: «Save» and ✕ say «saved» only after a change
  const changed = () => JSON.stringify($state.snapshot(draft)) !== startText;
  let reading = $state(false);
  async function pickPhoto(event) {
    const file = event.currentTarget.files[0];
    event.currentTarget.value = '';
    if (!file) return;
    reading = true;
    error = '';
    try {
      draft.photo = await shrinkImage(file);
    } catch (err) {
      error = err.message || t('This photo could not be read.');
    } finally {
      reading = false;
    }
  }
  // SN7 «Seiten neu» (answer 5a): the kind of bike as option buttons (it fills «Type», tap again to
  // clear it); the photo and the rare details (type in your own words, what for) fold away. Editing a
  // bike (reached by «Type, use and photo») opens the details.
  const KINDS = [
    { word: 'Gravel|kind', icon: Bike },
    { word: 'Road bike', icon: Bike },
    { word: 'MTB', icon: Mountain },
    { word: 'City bike', icon: Building2 },
    { word: 'E-bike', icon: Zap },
  ];
  const kindOn = (k) => draft.type.trim().toLowerCase() === t(k.word).toLowerCase();
  const pickKind = (k) => (draft.type = kindOn(k) ? '' : t(k.word));
  // svelte-ignore state_referenced_locally
  let moreOpen = $state(!isNew);
  let error = $state('');
  // «Alles selbst bearbeiten» (coordinator 19.10.2026): rides find their bike by its name (Garmin profile,
  // Strava bike, kmbook.js), so a new name says so once, right under the field.
  const renamed = $derived(!isNew && draft.name.trim() !== '' && draft.name.trim() !== bike.name);
  let dialog;

  $effect(() => {
    dialog.showModal();
  });

  function newId(name) {
    const base = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 30) || 'bike';
    let id = base;
    for (let n = 2; bikes.some((b) => b.id === id); n++) id = `${base}-${n}`;
    return id;
  }

  // «Rückmeldungen» (Noah 19.10.2026 «2a»): «Save», ✕, back and Escape say what was saved; a second tap
  // while it saves does nothing; a failed save keeps the window and says why.
  async function write(snap) {
    const name = snap.name.trim();
    await db.bikes.update(bike.id, { type: snap.type.trim(), use: snap.use.trim(), photo: snap.photo, surface: snap.surface || null });
    if (name !== bike.name) await renameBike(db, bike.id, name);
  }
  const save = once(async (event) => {
    event.preventDefault();
    error = '';
    const name = draft.name.trim();
    if (!name) return (error = t('Give the bike a name.'));
    try {
      await store(name);
    } catch (err) {
      return (error = saveFailed(err));
    }
    dialog.close();
  });
  async function store(name) {
    if (isNew) {
      const id = newId(name);
      const rec = { id, name, type: draft.type.trim(), use: draft.use.trim(), gearing: [], openPoints: '', weightG: null, slots: SLOTS.map((s) => s.key), setup: {}, fixtures: [], photo: draft.photo, surface: draft.surface || null };
      await db.bikes.put(rec);
      // VS4: a new bike stands last in the order (the first one ever is the standard bike)
      await saveOrder(db, bikes, withNewBike(bikes, rec));
      oncreated?.(id);
      offerDone(t('"{name}" saved.', { name }));
    } else {
      const was = changed();
      await write($state.snapshot(draft));
      onsaved?.(bike.id);
      if (was) offerDone(t('Changes to "{name}" saved.', { name }));
    }
  }
  // «Discard» (Noah 19.10.2026 «3a»): goes at once; changes to a bike come back with 4 s «Undo».
  function discard() {
    if (!isNew && changed() && draft.name.trim()) {
      const snap = $state.snapshot(draft);
      offerDone(t('Changes to "{name}" discarded.', { name: bike.name }), () => write(snap));
    }
    dialog.close();
  }

  // v0.67.0 (Ü7a, U070): back closes this window first and keeps what was typed (saved like «Save»);
  // without a name there is nothing to keep. v0.72.0: also Android's own back (CloseWatcher) and Escape.
  const keepOnBack = () => (draft.name.trim() ? save({ preventDefault() {} }) : dialog.close());

  // «Alles selbst bearbeiten» (Noah 19.10.2026): a bike can always be deleted. The one delete window
  // (GroupDeleteSheet) asks where its trips go, «Ohne Velo» first; its km book, workshop visits, photos and
  // care tasks go with it. Then 4 s «Undo» (rule «Löschen» 14.10.2026).
  let asking = $state(null); // { links, targets } while the delete window is open
  const remove = once(async () => {
    error = '';
    const links = await bikeLinks(db, bike.id);
    asking = { links, targets: sortBikes(bikes).filter((b) => b.id !== bike.id).map((b) => ({ id: b.id, name: b.name })) };
  });
  const goesWith = (l) => [l.km ? tn(l.km, '{n} entry in the km book', '{n} entries in the km book') : '', l.visits ? tn(l.visits, '{n} workshop visit', '{n} workshop visits') : '', l.photos ? tn(l.photos, '{n} photo', '{n} photos') : '', l.tasks ? tn(l.tasks, '{n} care task', '{n} care tasks') : ''].filter(Boolean).join(', ');
  async function doDelete(to) {
    const name = bike.name;
    const ok = await deleteWithUndo({
      run: () => deleteBike(db, bike.id, to),
      undo: (snap) => undoDeleteBike(db, snap),
      text: t('"{name}" deleted.', { name }),
      name,
    });
    if (ok) dialog.close();
  }
</script>

<dialog class="sheet vdlg from-below" bind:this={dialog} use:backClose={keepOnBack} {onclose} aria-labelledby="bike-dlg-h">
  <form onsubmit={save} novalidate use:weiter>
    <!-- Design-Refresh P7 (V2): title and a quiet line, ✕ top right, «Delete bike» next to «Cancel». -->
    <div class="vd-head">
      <div class="vd-t">
        <h2 id="bike-dlg-h">{isNew ? t('Add bike') : t('Bike details')}</h2>
        <p class="vd-sub num">{isNew ? t('Only the name is needed, everything else later.') : [bike.name, bike.km != null ? `${num(bike.km)} km` : ''].filter(Boolean).join(' · ')}</p>
      </div>
      <button type="button" class="vd-x" aria-label={t('Close')} onclick={() => closeKeep(dialog)}><X size={18} aria-hidden="true" /></button>
    </div>
    <label class="vd-field"><span class="lbl">{t('Name')}</span><input class="inp" bind:value={draft.name} required enterkeyhint="done" placeholder={t('e.g. Gravel Grinder')} /></label>
    <!-- SN7: the kind as option buttons; a suggestion only: tap again and it is empty -->
    <span class="lbl vd-lbl" id="bike-kind-l">{t('Kind|bike')}</span>
    <div class="vd-opts" role="group" aria-labelledby="bike-kind-l">
      {#each KINDS as k (k.word)}<OptionButton pressed={kindOn(k)} icon={k.icon} label={t(k.word)} onclick={() => pickKind(k)} />{/each}
    </div>
    <div class="vd-folds">
      <FoldRow icon={Image} label={t('Photo')} summary={draft.photo ? t('chosen|photo') : t('side view works best')}>
        <div class="prow">
          <span class="pthumb">{#if draft.photo}<img src={draft.photo} alt={draft.name} />{:else}<Bike size={22} aria-hidden="true" />{/if}</span>
          <div class="pside">
            <small>{t('shown in Pack behind the bags; side view works best')}</small>
            <div class="pacts">
              <CameraButton onchange={pickPhoto} disabled={reading} />
              <label class="btn sm">{reading ? t('Reading…') : draft.photo ? t('Other photo') : t('Choose photo')}<input type="file" accept="image/*" onchange={pickPhoto} hidden /></label>
              {#if draft.photo}<button type="button" class="btn sm" onclick={() => (draft.photo = null)}>{t('Remove photo')}</button>{/if}
            </div>
          </div>
        </div>
      </FoldRow>
      <FoldRow icon={SlidersHorizontal} label={t('More details')} summary={[draft.type.trim(), draft.use.trim()].filter(Boolean).join(' · ') || t('Type, what for')} bind:open={moreOpen}>
        <div class="grid">
          <label class="wide"><span class="lbl">{t('Type')}</span><input class="inp" bind:value={draft.type} placeholder={t('e.g. Full suspension')} /></label>
          <label class="wide"><span class="lbl">{t('What you use it for')}</span><input class="inp" bind:value={draft.use} /></label>
          <label class="wide"><span class="lbl">{t('Surface|bike')}</span><select class="inp" bind:value={draft.surface}><option value="">{t('From the Strava sport type')}</option>{#each SURFACES as x (x.key)}<option value={x.key}>{t(x.name)}</option>{/each}</select><small class="hint">{t('Counts for rides without a Strava sport type. Each ride can be changed in Your pace.')}</small></label>
        </div>
      </FoldRow>
    </div>
    {#if renamed}<p class="vd-note" data-testid="bike-rename-hint"><TriangleAlert size={16} aria-hidden="true" />{t('Rides are matched to a bike by its name. Name the Garmin profile and the Strava bike the same, or rides with the old name wait in Strava › To check.')}</p>{/if}
    <p class="err" role="alert">{error}</p>
    <div class="vd-foot sn7 daumen-foot">
      {#if !isNew}<button type="button" class="btn del" onclick={remove}>{t('Delete bike')}</button>{/if}
      <Btn kind="quiet" label={t('Discard')} onclick={discard} />
      <Btn kind="hi" type="submit" label={isNew ? t('Add|bike') : t('Save')} />
    </div>
  </form>
</dialog>
{#if asking}
  <GroupDeleteSheet
    title={t('Delete the bike "{name}"?', { name: bike.name })}
    count={asking.links.trips}
    what={(n) => tn(n, '{n} trip', '{n} trips')}
    none={t('No bike')}
    noneHint={t('The trips stay, just without a bike and its bags.')}
    targets={asking.targets}
    empty={t('No trip uses it.')}
    note={goesWith(asking.links) ? t('Goes with the bike: {what}.', { what: goesWith(asking.links) }) : ''}
    onconfirm={doDelete}
    onclose={() => (asking = null)}
  />
{/if}

<style>
  .grid {
    display: grid;
    gap: 12px;
  }
  .prow {
    display: flex;
    align-items: center;
    gap: 12px;
  }
  .pthumb {
    flex: none;
    display: grid;
    place-items: center;
    width: 120px;
    height: 56px;
    border-radius: var(--r-ctl);
    background: var(--paper-2);
    color: var(--ink-2);
    overflow: hidden;
  }
  .pthumb img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  .pside {
    flex: 1;
    min-width: 0;
    display: grid;
    gap: 6px;
  }
  .pside small {
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .pacts {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
  .wide .hint {
    display: block;
    margin-top: 4px;
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .err {
    color: var(--bad);
    margin: 8px 0 0;
    font-size: var(--fs-small);
  }
  .err:empty {
    display: none;
  }
  .del {
    color: var(--bad);
  }
</style>
