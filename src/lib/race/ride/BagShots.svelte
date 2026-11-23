<script>
  /**
   * K1 «Taschen-Fotos»: race mode, the box «What lies where»: the bags that have a photo (taken in Pack on the
   * packing day), one tap per bag shows it big. No picture is shown until you tap (race mode saves power).
   */
  import { liveQuery } from 'dexie';
  import { Image as ImageIcon } from '@lucide/svelte';
  import { db } from '../../db.js';
  import { t, dateOf } from '../../i18n.svelte.js';
  import { bagShotList } from '../../pack/bagshot.js';
  import Lightbox from '../../ui/Lightbox.svelte';
  import Box from './Box.svelte';

  let { ctx } = $props();
  // svelte-ignore state_referenced_locally
  const q = liveQuery(() => db.photos.where('tripId').equals(ctx.trip.id).toArray());
  const rows = $derived(bagShotList($q ?? [], ctx.trip.id));
  let at = $state(null);
  const day = (p) => dateOf(p.day || p.addedAt.slice(0, 10));
</script>

<Box id="ride-bags" title={t('What lies where')} what="Shows the photo you took of each bag on the packing day, one tap per bag." why="At night, tired or in the rain you see at once which bag holds what, without opening all of them." from="Your own photos from «Pack» (a bag opens there with «Photo of this bag»); they stay on this device.">
  {#if rows.length}
    <ul class="rc-list">
      {#each rows as r, i (r.slot)}
        <li class="rc-row"><button type="button" class="btn" onclick={() => (at = i)} data-race-bag-shot={r.slot}><ImageIcon size={18} aria-hidden="true" />{r.name || t('Bag')}<small> · {day(r.photo)}</small></button></li>
      {/each}
    </ul>
  {:else}
    <p class="rc-empty">{t('No bag photo yet. Open a bag under «Pack» and take one on the packing day.')}</p>
  {/if}
</Box>
{#if at != null && rows.length}<Lightbox list={rows.map((r) => ({ id: r.photo.id, src: r.photo.data, name: r.name || t('Bag'), sub: day(r.photo) }))} start={at} onclose={() => (at = null)} />{/if}
