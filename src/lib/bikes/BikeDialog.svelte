<script>
  import CameraButton from '../ui/CameraButton.svelte'; // P3b Teil 3: the camera wherever a photo is added
  import { closeKeep } from '../ui/keeptyped.js';
  import { backClose } from '../ui/backclose.js';
  import { db } from '../db.js';
  import { SLOTS, renameBike } from '../bikes.js';
  import { shrinkImage } from '../photo.js';
  import { t, tn, num } from '../i18n.svelte.js';
  import { liveQuery } from 'dexie';
  import { X, Bike, TriangleAlert, Mountain, Building2, Zap, Image, SlidersHorizontal } from '@lucide/svelte';
  import OptionButton from '../ui/OptionButton.svelte';
  import FoldRow from '../ui/FoldRow.svelte';
  import Btn from '../ui/Btn.svelte';
  import './velo-dlg.css';
  import { SURFACES } from '../review/werte.js';
  import '../ui/daumen.css'; // FE1: Save stays at the bottom edge of the window on a phone
  import { weiter } from '../daumen.js'; // FE16: «Weiter» to the next field, the number keyboard

  /** bike: the bike to edit, or null for "Add bike". */
  let { bike, bikes, oncreated, onsaved = null, onclose } = $props();

  // svelte-ignore state_referenced_locally
  const isNew = !bike;
  // svelte-ignore state_referenced_locally
  // SN2+ SN2h (answer 3 «a und sonst b»): the bike's fixed surface, for rides without a Strava sport type
  let draft = $state(bike ? { name: bike.name, type: bike.type ?? '', use: bike.use ?? '', photo: bike.photo ?? null, surface: bike.surface ?? '' } : { name: '', type: '', use: '', photo: null, surface: '' });
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
  // V2: «Delete» works only once no trip uses the bike; the window says so up front.
  const usedQ = liveQuery(() => (bike ? db.trips.filter((x) => x.bikeId === bike.id).count() : 0));
  const used = $derived($usedQ ?? 0);
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

  async function save(event) {
    event.preventDefault();
    const name = draft.name.trim();
    if (!name) return (error = t('Give the bike a name.'));
    if (isNew) {
      const id = newId(name);
      await db.bikes.put({ id, name, type: draft.type.trim(), use: draft.use.trim(), gearing: [], openPoints: '', weightG: null, slots: SLOTS.map((s) => s.key), setup: {}, fixtures: [], photo: draft.photo, surface: draft.surface || null });
      oncreated?.(id);
    } else {
      await db.bikes.update(bike.id, { type: draft.type.trim(), use: draft.use.trim(), photo: draft.photo, surface: draft.surface || null });
      if (name !== bike.name) await renameBike(db, bike.id, name);
      onsaved?.(bike.id);
    }
    dialog.close();
  }

  // v0.67.0 (Ü7a, U070): back closes this window first and keeps what was typed (saved like «Save»);
  // without a name there is nothing to keep. v0.72.0: also Android's own back (CloseWatcher) and Escape.
  const keepOnBack = () => (draft.name.trim() ? save({ preventDefault() {} }) : dialog.close());

  async function remove() {
    const n = await db.trips.filter((x) => x.bikeId === bike.id).count();
    if (n) return (error = t('{n} trip(s) use this bike. Give them another bike first (Pack → Edit trip).', { n }));
    if (!confirm(t('Delete the bike "{name}"? A backup file can bring it back.', { name: bike.name }))) return;
    await db.bikes.delete(bike.id);
    dialog.close();
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
    {#if !isNew && used}<p class="vd-note"><TriangleAlert size={16} aria-hidden="true" />{tn(used, 'You can delete it once no trip uses this bike. {n} trip uses it.', 'You can delete it once no trip uses this bike. {n} trips use it.')}</p>{/if}
    <p class="err" role="alert">{error}</p>
    <div class="vd-foot sn7 daumen-foot">
      {#if !isNew}<button type="button" class="btn del" onclick={remove}>{t('Delete bike')}</button>{/if}
      <Btn kind="quiet" label={t('Discard')} onclick={() => dialog.close()} />
      <Btn kind="hi" type="submit" label={isNew ? t('Add|bike') : t('Save')} />
    </div>
  </form>
</dialog>

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
