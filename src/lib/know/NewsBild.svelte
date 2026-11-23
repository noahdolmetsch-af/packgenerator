<script>
  /**
   * «Bilder bei jeder Neuheit» (Noah 23.11.2026 «1b 2a 3a 4b 5a»): the picture of one line of «What is new». With a
   * «before» picture it is a slider (drag, or the arrow keys on the slider): before on the left, after on the right.
   * Without one it shows only «after». The pictures come from tests/e2e/news-bilder.spec.js (public/news/<id>/), fictional
   * data only; they load when the card scrolls in. A picture that does not load (offline, not yet cached) leaves nothing
   * behind: the card then reads as it did before.
   *
   *   <NewsBild id="kleider-sets" line={1} vorher text="Pick a set" />
   */
  import { t } from '../i18n.svelte.js';

  let { id, line, vorher = false, text = '' } = $props();
  let hasV = $state(vorher); // false again when the «before» picture does not load
  const url = (kind) => `${import.meta.env.BASE_URL}news/${id}/${line}-${kind}.webp`;
  let pos = $state(50); // where the slider stands, percent from the left
  let gone = $state(false);
  const alt = $derived(t('After: {text}', { text: t(text) }));
</script>

{#if !gone}
  <figure class="nb" class:slide={hasV} data-news-bild={line}>
    <div class="nb-img" style:--pos="{pos}%">
      <img class="nb-n" src={url('nachher')} alt={alt} loading="lazy" decoding="async" onerror={() => (gone = true)} />
      {#if hasV}
        <img class="nb-v" src={url('vorher')} alt={t('Before: {text}', { text: t(text) })} loading="lazy" decoding="async" onerror={() => (hasV = false)} />
        <span class="nb-h" aria-hidden="true"></span>
        <input type="range" min="0" max="100" step="1" bind:value={pos} aria-label={t('Slide between before and after')} />
      {/if}
      {#if hasV}<span class="nb-tag nb-tl">{t('Before|picture')}</span>{/if}
      <span class="nb-tag nb-tr">{t('After|picture')}</span>
    </div>
    <figcaption>{t(text)}</figcaption>
  </figure>
{/if}

<style>
  .nb {
    margin: 4px 0 10px;
  }
  .nb-img {
    position: relative;
    overflow: hidden;
    border: 1px solid var(--line);
    border-radius: var(--r-ctl, 10px);
    background: var(--paper-2);
    min-height: 120px;
    touch-action: pan-y;
  }
  .nb-img img {
    display: block;
    width: 100%;
    height: auto;
  }
  /* before lies on top of after and shows only left of the handle */
  .nb-v {
    position: absolute;
    inset: 0;
    height: 100%;
    object-fit: cover;
    object-position: top;
    clip-path: inset(0 calc(100% - var(--pos)) 0 0);
  }
  .nb-h {
    position: absolute;
    top: 0;
    bottom: 0;
    left: var(--pos);
    width: 3px;
    margin-left: -1.5px;
    background: var(--hi);
    pointer-events: none;
  }
  .nb-h::after {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    width: 28px;
    height: 28px;
    margin: -14px 0 0 -14px;
    border-radius: 50%;
    background: var(--hi);
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.35);
  }
  .nb input[type='range'] {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    margin: 0;
    opacity: 0;
    cursor: ew-resize;
  }
  .nb-img:has(input:focus-visible) {
    outline: var(--focus-ring, 3px solid var(--focus));
    outline-offset: 2px;
  }
  .nb-tag {
    position: absolute;
    bottom: 8px;
    padding: 2px 9px;
    border-radius: 999px;
    background: var(--paper);
    color: var(--ink);
    font-size: var(--fs-tiny);
    font-weight: 600;
    pointer-events: none;
  }
  .nb-tl {
    left: 8px;
  }
  .nb-tr {
    right: 8px;
  }
  figcaption {
    margin-top: 4px;
    color: var(--ink-3);
    font-size: var(--fs-small);
    overflow-wrap: break-word;
  }
</style>
