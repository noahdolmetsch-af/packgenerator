<script>
  /**
   * Paket D «Foto als Gesprächsraum» (UC-265): a photo with numbered points. With onadd, a tap on the
   * photo sets a new point there; the photo itself is never drawn on.
   * marks: [{ id, x, y, text }] (x, y from 0 to 1); extra: points a friend added (shown as letters).
   */
  import { t } from '../i18n.svelte.js';

  let { photo, marks = [], extra = [], onadd = null } = $props();

  function tap(e) {
    if (!onadd) return;
    const r = e.currentTarget.getBoundingClientRect();
    onadd(Math.round(((e.clientX - r.left) / r.width) * 1000) / 1000, Math.round(((e.clientY - r.top) / r.height) * 1000) / 1000);
  }
  const letter = (i) => String.fromCharCode(65 + (i % 26));
</script>

<div class="fr-photo" class:edit={!!onadd} data-fr-photo>
  {#if onadd}
    <button type="button" class="fr-photo-tap" onclick={tap} aria-label={t('Tap the photo to set a point')}><img src={photo} alt="" /></button>
  {:else}
    <img src={photo} alt={t('The photo')} />
  {/if}
  {#each marks as m, i (m.id)}
    <span class="fr-pin" style:left="{m.x * 100}%" style:top="{m.y * 100}%" aria-hidden="true">{i + 1}</span>
  {/each}
  {#each extra as m, i (m.id)}
    <span class="fr-pin them" style:left="{m.x * 100}%" style:top="{m.y * 100}%" aria-hidden="true">{letter(i)}</span>
  {/each}
</div>
