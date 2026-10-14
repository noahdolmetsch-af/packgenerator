<script>
  /**
   * Kleine Apps (Noah 14.10.2026): in a small app (miniapps.js) the bottom bar shows only the tabs of
   * that app, on a phone and on a computer, and last «Whole app», which opens the big app with all
   * five places. It replaces the bar with the five places and the sidebar; the data stays the same.
   */
  import { Leaf, Timer, BookOpen, Ellipsis, Backpack, Route, Copy, Wrench, Store, Bike, LayoutGrid } from '@lucide/svelte';
  import { miniTabOf, wholeAppPath } from '../miniapps.js';
  import { t } from '../i18n.svelte.js';

  let { app, hash = '#/' } = $props();
  const ICONS = { start: Leaf, timer: Timer, log: BookOpen, more: Ellipsis, pack: Backpack, trips: Route, templates: Copy, lookback: BookOpen, care: Wrench, shop: Store, bikes: Bike };
  const current = $derived(miniTabOf(app, hash));
  const whole = $derived(`${wholeAppPath(location.pathname)}#/`);
</script>

<nav class="mini" aria-label={t(app.name)} data-mini={app.key}>
  {#each app.tabs as tb (tb.key)}
    {@const Icon = ICONS[tb.key] ?? Leaf}
    <a href={tb.href} data-tab={tb.key} aria-current={current === tb.key ? 'page' : undefined}>
      <span class="pi"><Icon size={22} strokeWidth={2} aria-hidden="true" /></span>
      <span class="pn">{t(tb.label)}</span>
    </a>
  {/each}
  <a class="whole" href={whole} data-tab="whole">
    <span class="pi"><LayoutGrid size={22} strokeWidth={2} aria-hidden="true" /></span>
    <span class="pn">{t('Whole app')}</span>
  </a>
</nav>

<style>
  .mini {
    position: fixed;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 6;
    display: grid;
    grid-auto-columns: minmax(0, 1fr);
    grid-auto-flow: column;
    max-width: 720px;
    margin: 0 auto;
    padding: var(--sp-1) var(--sp-1) calc(6px + env(safe-area-inset-bottom));
    border-top: 1px solid var(--line);
    background: var(--paper);
  }
  @media (min-width: 720px) {
    .mini {
      border: 1px solid var(--line);
      border-bottom: 0;
      border-radius: 14px 14px 0 0;
    }
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
  }
  .whole {
    border-left: 1px solid var(--line);
  }
  @media print {
    .mini {
      display: none;
    }
  }
</style>
