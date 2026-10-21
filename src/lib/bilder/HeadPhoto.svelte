<script>
  /**
   * «Bilder in der App» 1b (Noah 20.10.2026 «sehr dezent im Hintergrund»): when one bike is chosen in
   * Bike care or Workshop, its photo shows pale behind the head of the page (the photo «behind the
   * bike», else the newest). A quiet button opens the setup photos as a timeline (2a), where a photo of
   * a past setup is added with one tap. Without a photo only the quiet button shows.
   */
  import { Camera } from '@lucide/svelte';
  import { liveQuery } from 'dexie';
  import SetupPhotos from './SetupPhotos.svelte';
  import { headPhoto, bikePhotos } from '../photo.js';
  import { db } from '../db.js';
  import { t, tn } from '../i18n.svelte.js';

  let { bike } = $props();
  const photosQ = liveQuery(() => db.photos.toArray());
  const pic = $derived(headPhoto(bike, $photosQ ?? []));
  const count = $derived(bikePhotos(bike, $photosQ ?? []).length);
  let open = $state(false);
</script>

{#if pic}<img class="hp-bg" src={pic.src} alt="" aria-hidden="true" data-head-photo />{/if}
<button type="button" class="hp-btn" onclick={() => (open = true)} data-head-photos aria-label={count ? tn(count, 'Setup photos of {bike}: {n} photo', 'Setup photos of {bike}: {n} photos', { bike: bike.name }) : t('Add a setup photo of {bike}', { bike: bike.name })}>
  <Camera size={16} aria-hidden="true" /><span>{count ? t('Setup photos') : t('+ Setup photo')}</span>{#if count}<span class="n num">{count}</span>{/if}
</button>
{#if open}<SetupPhotos {bike} onclose={() => (open = false)} />{/if}

<style>
  /* pale, on the right, fading out to the left so the title stays easy to read */
  .hp-bg {
    position: absolute;
    z-index: 0;
    top: -8px;
    right: 0;
    width: min(46%, 420px);
    height: calc(100% + 8px);
    object-fit: cover;
    border-radius: 18px;
    opacity: 0.22;
    pointer-events: none;
    -webkit-mask-image: linear-gradient(to left, var(--ink) 35%, transparent);
    mask-image: linear-gradient(to left, var(--ink) 35%, transparent);
  }
  .hp-btn {
    position: relative;
    z-index: 1;
    float: right;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    min-height: 44px;
    min-width: 44px;
    justify-content: center;
    margin: -6px 0 0 8px;
    padding: 0 10px;
    border: 1px solid var(--line);
    border-radius: 999px;
    background: color-mix(in srgb, var(--paper) 82%, transparent);
    color: var(--ink-2);
    font: inherit;
    font-size: var(--fs-small);
    cursor: pointer;
  }
  .hp-btn:hover {
    color: var(--ink);
  }
  .n {
    color: var(--ink-3);
  }
  @media (max-width: 719px) {
    .hp-bg {
      width: 62%;
      opacity: 0.16;
    }
    .hp-btn span:not(.n) {
      display: none;
    }
  }
  @media print {
    .hp-bg,
    .hp-btn {
      display: none;
    }
  }
</style>
