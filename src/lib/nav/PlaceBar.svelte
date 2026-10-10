<script>
  /**
   * v0.71.0 «Fünf Orte» 1 (Noah 10.10.2026, all a): on a phone (and a narrow window) the five places
   * sit at the bottom, in reach of the thumb: Heute, Touren, Material, Velos, Aktiv. The chosen place
   * shows its colour as a pill behind the icon and in bold, not by colour alone. «+ Neu» is a round
   * button bottom right, above the bar (O1.3a); on the trip pages it sits higher, above their own main
   * button at the bottom (rule U1), never on it. Before: four places with the + in the middle (v0.23.0).
   */
  import { PLACES } from '../nav.js';
  import { t } from '../i18n.svelte.js';
  import PlaceIcon from './PlaceIcon.svelte';
  import { Plus } from '@lucide/svelte';

  let { place = null, due = 0, onnew, fab = true, high = false } = $props();
</script>

<nav class="bottom" aria-label={t('Sections')}>
  {#each PLACES as p (p.key)}
    <a href={p.href} data-place={p.key} aria-current={place === p.key ? 'page' : undefined}>
      <span class="pi"><PlaceIcon place={p.key} />{#if p.key === 'bikes' && due}<span class="due num" aria-hidden="true">{due}</span>{/if}</span>
      <span class="pn">{t(p.label)}</span>{#if p.key === 'bikes' && due}<span class="sr">, {t('{n} due', { n: due })}</span>{/if}
    </a>
  {/each}
</nav>
{#if fab}
  <button type="button" class="fab" class:high aria-label={t('New')} aria-haspopup="dialog" onclick={onnew}><Plus size={28} strokeWidth={2.4} aria-hidden="true" /></button>
{/if}

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
    background: var(--pc-soft);
    color: var(--pc);
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
  .fab {
    position: fixed;
    right: var(--gut);
    bottom: calc(80px + env(safe-area-inset-bottom));
    z-index: 4;
    display: grid;
    place-items: center;
    width: 58px;
    height: 58px;
    border: 0;
    border-radius: 50%;
    background: var(--hi);
    color: var(--hi-ink);
    box-shadow: 0 6px 16px var(--shadow);
    cursor: pointer;
  }
  /* above the trip pages' main button (MainBar: 62 px from the bottom, about 74 px high) */
  .fab.high {
    bottom: calc(148px + env(safe-area-inset-bottom));
  }
  .fab:hover {
    background: var(--hi-hover);
  }
  .fab:focus-visible {
    outline: 3px solid var(--focus);
    outline-offset: 3px;
  }
  /* A phone turned sideways: one 44 px row, icon next to the label, a smaller + higher up. */
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
    .fab {
      bottom: calc(60px + env(safe-area-inset-bottom));
      width: 48px;
      height: 48px;
    }
    .fab.high {
      bottom: calc(134px + env(safe-area-inset-bottom));
    }
  }
  @media print {
    .bottom,
    .fab {
      display: none;
    }
  }
</style>
