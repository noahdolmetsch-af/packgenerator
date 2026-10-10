<script>
  /**
   * v0.73.0 «Ruhige Startseite + Fotoband» (Noah 10.10.2026, Foto auf Heute 1a 2a 3a 4a, Heute ruhiger 1a 4a):
   * the photo of the trip on Today, always sharp (no pale layer).
   * - band (phone): 140 px over the trip card, place and month on the left, «Album ›» on the right;
   *   the trip card lies over its lower edge (Home.svelte).
   * - side (computer): on the right inside the trip card, 300 px, place and month on top.
   * A tap opens the bike's photos (Bikes → Setup → Photos), where a photo is chosen, renamed or kept
   * for one trip. Without a photo nothing is drawn.
   */
  import { MapPin, ChevronRight } from '@lucide/svelte';
  import { t } from '../i18n.svelte.js';
  import { bikesHash } from '../bikes.js';

  let { photo, caption = '', mode = 'band' } = $props();

  // Bikes → Setup opens its «Photos» fold once for this bike (SetupTab reads the wish).
  const href = $derived(photo?.bikeId ? bikesHash({ bike: photo.bikeId }) : null);
  function wish() {
    try {
      localStorage.setItem('bikes.photos', photo.bikeId);
    } catch {
      /* private mode: Setup opens without the fold */
    }
  }
</script>

{#if photo}
  <svelte:element
    this={href ? 'a' : 'div'}
    class="tp {mode}"
    href={href ?? undefined}
    onclick={href ? wish : undefined}
    aria-label={href ? (caption ? t('Photo album: {caption}', { caption }) : t('Photo album')) : undefined}
    data-photo={mode}
  >
    <img src={photo.src} alt="" />
    {#if caption}<span class="cap"><MapPin size={14} aria-hidden="true" /><span class="ct">{caption}</span></span>{/if}
    {#if href && mode === 'band'}<span class="alb" aria-hidden="true">{t('Album')}<ChevronRight size={14} /></span>{/if}
  </svelte:element>
{/if}

<style>
  .tp {
    position: relative;
    display: block;
    overflow: hidden;
    background: var(--paper-2);
    color: var(--ink);
    text-decoration: none;
  }
  .tp img {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  .band {
    height: 140px;
    border-radius: var(--radius-card);
  }
  .side {
    min-height: 100%;
  }
  .cap,
  .alb {
    position: absolute;
    top: var(--sp-2);
    display: inline-flex;
    align-items: center;
    gap: var(--sp-1);
    max-width: calc(100% - 110px);
    padding: var(--sp-1) 10px;
    border-radius: 999px;
    font-size: var(--fs-small);
    line-height: var(--lh-title);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .cap {
    left: var(--sp-2);
    background: var(--brand);
    color: var(--brand-ink);
  }
  .cap :global(svg) {
    flex: none;
  }
  .ct {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .side .cap {
    left: auto;
    right: var(--sp-3);
    top: var(--sp-3);
    max-width: calc(100% - 24px);
  }
  .alb {
    right: var(--sp-2);
    max-width: none;
    background: var(--paper);
    color: var(--ink);
    font-weight: 600;
  }
  .tp:focus-visible {
    outline: var(--focus-ring);
    outline-offset: 2px;
  }
</style>
