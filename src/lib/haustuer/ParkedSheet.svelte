<script>
  /**
   * Paket W 1119 «Velo abgestellt» / «Wo steht mein Velo?» (Noah 20.10.2026 «4a»): the window from
   * Unterwegs. Note where the bike stands: a photo, the place (GPS, read only on the tap) and the lock
   * (the locks from Material, or typed). Later the same window shows it again with a map link.
   * Everything stays on this device only (settings 'veloParked' is a device row: no backup, no sync).
   */
  import { liveQuery } from 'dexie';
  import { db } from '../db.js';
  import { t, tn, nameOf, locale } from '../i18n.svelte.js';
  import { backClose } from '../ui/backclose.js';
  import { offerDone } from '../ui/rename.svelte.js';
  import { shrinkImage } from '../photo.js';
  import PhotoPick from '../ui/PhotoPick.svelte';
  import { whereAmI } from '../unterwegs/here.js';
  import { PARKED_KEY, parkedOf, lockItems, mapsAt, agoOf, PARKED_OFF } from './haustuer.js';
  import { X, Bike, MapPin, Lock, Check, Navigation, Trash2, KeyRound, Package } from '@lucide/svelte';
  import '../bikes/velo-dlg.css';
  import '../unterwegs/unterwegs.css';

  let { onclose } = $props();
  const parkedQ = liveQuery(() => db.settings.get(PARKED_KEY));
  const itemsQ = liveQuery(() => db.items.toArray());
  const parked = $derived(parkedOf($parkedQ?.value));
  const locks = $derived(lockItems($itemsQ ?? []));

  let dialog;
  $effect(() => {
    if (dialog && !dialog.open) dialog.showModal();
  });

  let anew = $state(false);
  const form = $derived(!parked || anew);
  let photo = $state('');
  let busy = $state(false);
  let lock = $state('');
  let lockText = $state('');
  let note = $state('');
  // Paket B, UC-101-I2: which key belongs to the lock, and what came off the bike
  let key = $state('');
  let off = $state([]);
  let ownOff = $state('');
  const toggleOff = (x) => (off = off.includes(x) ? off.filter((y) => y !== x) : [...off, x]);
  function addOwnOff() {
    const v = ownOff.trim();
    if (v && !off.includes(v)) off = [...off, v];
    ownOff = '';
  }
  const offName = (x) => (PARKED_OFF.includes(x) ? t(x) : x);
  let withPlace = $state(true);
  let msg = $state('');

  async function onfile(file) {
    busy = true;
    msg = '';
    try {
      photo = await shrinkImage(file, 900, 0.7);
    } catch (e) {
      msg = e?.message ?? String(e);
    }
    busy = false;
  }
  async function save() {
    busy = true;
    msg = '';
    const here = withPlace ? await whereAmI() : null;
    const item = locks.find((i) => i.id === lock);
    const value = { at: new Date().toISOString(), lat: here?.lat ?? null, lon: here?.lon ?? null, acc: here?.acc ?? null, lock: item ? item.id : '', lockName: item ? nameOf(item) : lockText.trim(), note: note.trim(), photo, key: key.trim(), off: $state.snapshot(off) };
    await db.settings.put({ key: PARKED_KEY, value });
    busy = false;
    anew = false;
    photo = note = lockText = lock = key = '';
    off = [];
    if (withPlace && !here) msg = t('Saved without the place: your location is not available.');
  }
  async function pickedUp() {
    const before = $state.snapshot($parkedQ?.value);
    await db.settings.delete(PARKED_KEY);
    offerDone(t('Bike picked up. The note is gone.'), async () => {
      await db.settings.put({ key: PARKED_KEY, value: before });
    });
  }
  const ago = $derived(parked ? agoOf(parked.at) : null);
  const agoText = $derived(!ago ? '' : ago.unit === 'min' ? tn(ago.n, '{n} minute ago', '{n} minutes ago') : ago.unit === 'h' ? tn(ago.n, '{n} hour ago', '{n} hours ago') : tn(ago.n, '{n} day ago', '{n} days ago'));
  const whenText = $derived(parked ? new Date(parked.at).toLocaleString(locale(), { weekday: 'short', hour: '2-digit', minute: '2-digit' }) : '');
</script>

<dialog class="sheet vdlg from-below uw-dlg" bind:this={dialog} use:backClose {onclose} aria-labelledby="pk-h" data-parked>
  <div class="vd-head">
    <div class="vd-t">
      <h2 id="pk-h"><Bike size={20} aria-hidden="true" />&nbsp;{form ? t('Bike parked') : t('Where is my bike?')}</h2>
      <p class="vd-sub">{form ? t('Photo, place and lock: so you find it again. Stays on this device only.') : `${whenText} · ${agoText}`}</p>
    </div>
    <button type="button" class="vd-x" aria-label={t('Close')} onclick={() => dialog.close()}><X size={20} aria-hidden="true" /></button>
  </div>

  {#if !form}
    {#if parked.photo}<img class="pk-photo" src={parked.photo} alt={t('Photo of where the bike stands')} />{/if}
    <ul class="vd-panel pk-facts" data-parked-facts>
      <li><MapPin size={16} aria-hidden="true" />{#if parked.here}<a href={mapsAt(parked.here)} target="_blank" rel="noopener" data-parked-map>{t('Show on the map')}</a>{#if parked.here.acc}<small> · {t('to about {n} m', { n: Math.round(parked.here.acc) })}</small>{/if}{:else}<span>{t('No place saved')}</span>{/if}</li>
      <li><Lock size={16} aria-hidden="true" /><span>{parked.lockName || t('No lock noted')}</span></li>
      {#if parked.key}<li data-parked-key><KeyRound size={16} aria-hidden="true" /><span>{parked.key}</span></li>{/if}
      {#if parked.off.length}<li data-parked-off><Package size={16} aria-hidden="true" /><span>{t('Taken off, with you: {list}', { list: parked.off.map(offName).join(', ') })}</span></li>{/if}
      {#if parked.note}<li><span class="pk-note">{parked.note}</span></li>{/if}
    </ul>
    <div class="vd-foot">
      <button type="button" class="btn" onclick={pickedUp} data-parked-done><Trash2 size={16} aria-hidden="true" />{t('Picked up')}</button>
      <button type="button" class="btn" onclick={() => (anew = true)}>{t('Park anew')}</button>
      {#if parked.here}<a class="btn hi" href={mapsAt(parked.here)} target="_blank" rel="noopener"><Navigation size={16} aria-hidden="true" />{t('Way to the bike')}</a>{/if}
    </div>
  {:else}
    <div class="vd-field">
      <span class="vd-lbl tp-small">{t('Photo|parked')}</span>
      {#if photo}<img class="pk-photo" src={photo} alt={t('Photo of where the bike stands')} />{/if}
      <PhotoPick {onfile} {busy} has={!!photo} />
    </div>
    <div class="vd-field">
      <span class="vd-lbl tp-small" id="pk-lock">{t('Lock')}</span>
      <div class="tp-chips" role="group" aria-labelledby="pk-lock">
        <button type="button" class="tp-chip" aria-pressed={!lock && !lockText} onclick={() => ((lock = ''), (lockText = ''))}>{t('No lock')}</button>
        {#each locks as i (i.id)}<button type="button" class="tp-chip" aria-pressed={lock === i.id} onclick={() => ((lock = i.id), (lockText = ''))} data-parked-lock={i.id}>{nameOf(i)}</button>{/each}
      </div>
      <input class="inp" bind:value={lockText} oninput={() => (lock = '')} placeholder={locks.length ? t('Or another lock, e.g. the code lock') : t('Which lock? e.g. folding lock')} aria-label={t('Lock')} />
      {#if !locks.length}<small class="tp-muted">{t('Locks in Material (a name with «lock») show up here as a choice.')}</small>{/if}
    </div>
    <div class="vd-field">
      <label class="vd-lbl tp-small" for="pk-key">{t('Key|parked')}</label>
      <input id="pk-key" class="inp" bind:value={key} maxlength="60" placeholder={t('e.g. small key on the red ring')} data-parked-keyin />
    </div>
    <div class="vd-field">
      <span class="vd-lbl tp-small" id="pk-off">{t('Taken off and with you')}</span>
      <div class="tp-chips" role="group" aria-labelledby="pk-off">
        {#each [...PARKED_OFF, ...off.filter((x) => !PARKED_OFF.includes(x))] as x (x)}<button type="button" class="tp-chip" aria-pressed={off.includes(x)} onclick={() => toggleOff(x)} data-parked-offpick={x}>{offName(x)}</button>{/each}
      </div>
      <input class="inp" bind:value={ownOff} maxlength="40" placeholder={t('Something else, e.g. saddle')} aria-label={t('Something else that came off')} onkeydown={(e) => e.key === 'Enter' && (e.preventDefault(), addOwnOff())} onblur={addOwnOff} />
    </div>
    <div class="vd-field">
      <label class="vd-lbl tp-small" for="pk-note">{t('Note|parked')}</label>
      <input id="pk-note" class="inp" bind:value={note} placeholder={t('e.g. level 2, next to the lift')} />
    </div>
    <label class="pk-place"><input type="checkbox" bind:checked={withPlace} /><MapPin size={16} aria-hidden="true" /> {t('Save the place (GPS, read once now)')}</label>
    <p class="uw-fine" role="status">{msg}</p>
    <div class="vd-foot">
      {#if parked}<button type="button" class="btn" onclick={() => (anew = false)}>{t('Cancel')}</button>{/if}
      <button type="button" class="btn hi" onclick={save} disabled={busy} data-parked-save><Check size={16} aria-hidden="true" />{t('Save|parked')}</button>
    </div>
  {/if}
  {#if !form && msg}<p class="uw-fine" role="status">{msg}</p>{/if}
</dialog>

<style>
  .pk-photo {
    display: block;
    width: 100%;
    max-height: 260px;
    object-fit: cover;
    border-radius: 14px;
    margin: 0 0 10px;
  }
  .pk-facts li {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 8px;
    min-height: 44px;
    overflow-wrap: break-word;
  }
  .pk-note {
    overflow-wrap: break-word;
  }
  .pk-place {
    display: flex;
    align-items: center;
    gap: 6px;
    min-height: 44px;
  }
  .vd-field .inp {
    margin-top: 8px;
  }
  .vd-foot .btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }
</style>
