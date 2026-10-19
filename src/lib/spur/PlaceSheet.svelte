<script>
  /**
   * Paket S «Reise-Spur» (answer 1a): «Hier bin ich». The place now, by one tap, with an optional
   * sentence and photo. The photo stays on this device (answer 3a). It shows on the tour map and in
   * the day's timeline; on the family link only with its text, never the photo.
   */
  import { onMount } from 'svelte';
  import { MapPin } from '@lucide/svelte';
  import { t } from '../i18n.svelte.js';
  import { backClose } from '../ui/backclose.js';
  import PhotoPick from '../ui/PhotoPick.svelte';
  import { shrinkImage } from '../photo.js';
  import { getHere, savePlace } from './recorder.svelte.js';

  let { trip = null, onclose, onsaved = null } = $props();
  let dialog;
  let pos = $state(null);
  let finding = $state(true);
  let err = $state('');
  let text = $state('');
  let photo = $state(null);
  let busy = $state(false);
  let saved = $state(false);

  async function find() {
    finding = true;
    err = '';
    try {
      pos = await getHere();
    } catch (e) {
      err = t(e.message);
    } finally {
      finding = false;
    }
  }
  onMount(() => {
    dialog.showModal();
    find();
  });
  async function pick(file) {
    busy = true;
    try {
      photo = await shrinkImage(file);
    } catch (e) {
      err = e.message;
    } finally {
      busy = false;
    }
  }
  async function save(e) {
    e?.preventDefault();
    if (!pos) return;
    const p = await savePlace(trip, pos, { text, photo });
    saved = true;
    onsaved?.(p);
    setTimeout(() => dialog?.close(), 900);
  }
</script>

<dialog class="sheet from-below place" bind:this={dialog} use:backClose={() => dialog.close()} onclose={() => onclose?.()} aria-labelledby="pl-h">
  <form onsubmit={save}>
    <h2 id="pl-h"><MapPin size={20} aria-hidden="true" /> {t('I am here')}</h2>
    {#if saved}
      <p role="status">{t('Place saved. It is on the tour map.')}</p>
    {:else}
      <p class="tp-muted tp-small" role="status">{finding ? t('Finding the place …') : pos ? t('Found, ± {n} m.', { n: pos.acc }) : ''}</p>
      {#if err}<p class="warn" role="alert">{err} <button type="button" class="tp-link" onclick={find}>{t('Try again')}</button></p>{/if}
      <label class="lab" for="pl-text">{t('A sentence to it (optional)')}</label>
      <textarea id="pl-text" class="inp" rows="2" bind:value={text} placeholder={t('e.g. Lunch at the lake')}></textarea>
      <div class="ph">
        {#if photo}<img src={photo} alt={t('Photo of the place')} />{/if}
        <PhotoPick onfile={pick} {busy} has={!!photo} />
      </div>
      <p class="tp-muted tp-small">{t('The photo stays on this device.')}</p>
      <div class="acts">
        <button type="submit" class="btn hi" disabled={!pos}>{t('Save place')}</button>
        <button type="button" class="btn" onclick={() => dialog.close()}>{t('Cancel')}</button>
      </div>
    {/if}
  </form>
</dialog>

<style>
  h2 {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-top: 0;
  }
  .lab {
    display: block;
    font-weight: 600;
    margin: 8px 0 4px;
  }
  textarea {
    width: 100%;
  }
  .ph {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-top: 10px;
    flex-wrap: wrap;
  }
  .ph img {
    width: 72px;
    height: 72px;
    object-fit: cover;
    border-radius: 8px;
  }
  .acts {
    display: flex;
    gap: 8px;
    margin-top: 12px;
    flex-wrap: wrap;
  }
</style>
