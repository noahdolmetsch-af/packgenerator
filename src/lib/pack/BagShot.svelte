<script>
  /**
   * K1 «Taschen-Fotos» (Noah 23.11.2026): in an open bag of the packing list, one photo of the packed bag.
   * Tap the small picture to see it big; «Other photo» replaces it, the bin deletes it (with Undo). The photo
   * stays on this device (db.photos, field `bagShot`, see bagshot.js). In race mode the box «What lies where»
   * shows it again.
   */
  import { liveQuery } from 'dexie';
  import { Trash2 } from '@lucide/svelte';
  import { db } from '../db.js';
  import { t, dateOf } from '../i18n.svelte.js';
  import { localDay } from '../localday.js';
  import { shrinkImage } from '../photo.js';
  import { newBagShot, bagShotsOf } from './bagshot.js';
  import { deleteWithUndo, askDelete } from '../ui/ask.js';
  import { offerDone } from '../ui/rename.svelte.js';
  import PhotoPick from '../ui/PhotoPick.svelte';
  import Lightbox from '../ui/Lightbox.svelte';

  let { trip, slot, name = '' } = $props();
  // svelte-ignore state_referenced_locally
  const q = liveQuery(() => db.photos.where('tripId').equals(trip.id).toArray());
  const shot = $derived(bagShotsOf($q ?? [], trip.id)[slot] ?? null);
  let busy = $state(false);
  let msg = $state('');
  let big = $state(false);

  async function take(file) {
    busy = true;
    msg = '';
    try {
      const data = await shrinkImage(file, 1400, 0.82);
      const old = shot ? await db.photos.get(shot.id) : null;
      const row = newBagShot({ tripId: trip.id, slot, name, data, day: localDay() });
      await db.transaction('rw', db.photos, async () => {
        if (old) await db.photos.delete(old.id);
        await db.photos.put(row);
      });
      offerDone(t('Photo of the bag saved.'), async () => {
        await db.photos.delete(row.id);
        if (old) await db.photos.put(old);
      });
    } catch (err) {
      msg = err?.message || t('This photo could not be read.');
    } finally {
      busy = false;
    }
  }
  async function remove() {
    if (!shot) return;
    if ((await askDelete({ title: t('Delete the photo of this bag?'), text: t('Only this photo goes. You can bring it back for 8 seconds afterwards.') })) !== 'delete') return;
    await deleteWithUndo({
      name: name || t('Photo'),
      text: t('Photo deleted.'),
      run: async () => {
        const r = await db.photos.get(shot.id);
        await db.photos.delete(shot.id);
        return r;
      },
      undo: (r) => r && db.photos.put(r),
    });
  }
</script>

<div class="bs" data-bag-shot={slot}>
  {#if shot}
    <button type="button" class="bs-img" onclick={() => (big = true)} aria-label={t('Show the photo of this bag, {date}', { date: dateOf(shot.day || shot.addedAt.slice(0, 10)) })} data-bag-shot-open><img src={shot.data} alt="" loading="lazy" /></button>
    <span class="bs-note">{t('Packed on {date}', { date: dateOf(shot.day || shot.addedAt.slice(0, 10)) })}</span>
  {:else}
    <span class="bs-note">{t('No photo of this bag yet. A photo on the packing day shows you later what lies where.')}</span>
  {/if}
  <span class="bs-row">
    <PhotoPick onfile={take} {busy} has={!!shot} camera="Photo of this bag" again="Other photo" choose="Choose photo" />
    {#if shot}<button type="button" class="ib" aria-label={t('Delete the photo of this bag')} onclick={remove} data-bag-shot-delete><Trash2 size={16} aria-hidden="true" /></button>{/if}
  </span>
  {#if msg}<p class="err" role="alert">{msg}</p>{/if}
</div>
{#if big && shot}<Lightbox list={[{ id: shot.id, src: shot.data, name: name || shot.name, sub: dateOf(shot.day || shot.addedAt.slice(0, 10)) }]} start={0} onclose={() => (big = false)} />{/if}

<style>
  .bs { display: flex; flex-wrap: wrap; align-items: center; gap: 8px 12px; margin-top: 10px; padding-top: 10px; border-top: 1px solid var(--line); }
  .bs-img { padding: 0; border: 1px solid var(--line); border-radius: 8px; overflow: hidden; background: none; line-height: 0; min-width: 44px; min-height: 44px; }
  .bs-img img { width: 72px; height: 72px; object-fit: cover; display: block; }
  .bs-note { flex: 1 1 12em; min-width: 0; font-size: var(--fs-small); color: var(--ink-2); overflow-wrap: break-word; }
  .bs-row { display: inline-flex; align-items: center; flex-wrap: wrap; gap: 8px; }
</style>
