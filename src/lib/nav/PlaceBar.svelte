<script>
  /**
   * v0.76.0 «Fünf Orte» 1 (Noah 10.10.2026, all a): on a phone (and a narrow window) the five places
   * sit at the bottom, in reach of the thumb: Heute, Touren, Material, Velos, Aktiv. The chosen place
   * shows its colour as a pill behind the icon and in bold, not by colour alone. «+ Neu» is a round
   * button bottom right, above the bar (O1.3a); on the trip pages it sits higher, above their own main
   * button at the bottom (rule U1), never on it. Before: four places with the + in the middle (v0.23.0).
   * v0.98.0 Design-Refresh R2 (G4/G5 A★): the round + is gone, «Neu» sits in the top bar next to the
   * search; the chosen place is a soft pill behind the icon, the label in bold.
   */
  import { PLACES, placeHref } from '../nav.js';
  import { t } from '../i18n.svelte.js';
  import PlaceIcon from './PlaceIcon.svelte';

  let { place = null, hash = '#/', due = 0 } = $props();
</script>

<nav class="bottom" aria-label={t('Sections')}>
  {#each PLACES as p (p.key)}
    <a href={placeHref(p, place, hash)} data-place={p.key} aria-current={place === p.key ? 'page' : undefined}>
      <span class="pi"><PlaceIcon place={p.key} />{#if p.key === 'bikes' && due}<span class="due num" aria-hidden="true">{due}</span>{/if}</span>
      <span class="pn">{t(p.label)}</span>{#if p.key === 'bikes' && due}<span class="sr">, {t('{n} due', { n: due })}</span>{/if}
    </a>
  {/each}
</nav>

<style>
  .bottom {
    position: fixed;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 6;
    display: grid;
    grid-auto-columns: minmax(0, 1fr);
    grid-auto-flow: column;
    padding: var(--sp-1) var(--sp-1) calc(6px + env(safe-area-inset-bottom));
    border-top: 1px solid var(--line);
    background: var(--paper);
  }
  a {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 2px;
    min-width: 0;
    min-height: 52px;
    color: var(--ink-2);
    font: 500 var(--fs-small) / 1.2 var(--font-body);
    text-decoration: none;
  }
  .pn {
    max-width: 100%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .pi {
    position: relative;
    display: grid;
    place-items: center;
    width: 52px;
    height: 30px;
    border-radius: 15px;
  }
  a[aria-current='page'] {
    color: var(--ink);
    font-weight: 700;
  }
  a[aria-current='page'] .pi {
    background: var(--paper-2);
    color: var(--ink);
  }
  .due {
    position: absolute;
    top: -4px;
    left: calc(50% + 6px);
    min-width: 18px;
    height: 18px;
    padding: 0 4px;
    border-radius: 9px;
    box-shadow: 0 0 0 2px var(--paper);
    background: var(--hi);
    color: var(--hi-ink);
    font: 700 var(--fs-tiny) / 1.5 var(--font-body);
    text-align: center;
  }
  /* A phone turned sideways: one 44 px row, icon next to the label. */
  @media (max-height: 500px) {
    .bottom {
      padding: 2px max(6px, env(safe-area-inset-right)) calc(2px + env(safe-area-inset-bottom)) max(6px, env(safe-area-inset-left));
    }
    a {
      flex-direction: row;
      gap: 6px;
      min-height: 44px;
    }
    .pi {
      width: 40px;
      height: 28px;
    }
  }
  @media print {
    .bottom {
      display: none;
    }
  }
</style>
