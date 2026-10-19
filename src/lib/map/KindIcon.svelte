<script>
  /**
   * The symbol of a kind of stop as an inline icon (the same drawing as on the map, symbols.js), so the
   * list and the bottom sheet of the live map show what the map shows. kind, size (px).
   */
  import { ICON_SVG, KIND_ICON } from './symbols.js';

  let { kind = 'other', size = 20 } = $props();
  // the drawings are fixed strings of this app (symbols.js), never user text
  const svg = $derived(ICON_SVG[KIND_ICON[kind] ?? KIND_ICON.other] ?? '');
</script>

<span class="ki ki-{KIND_ICON[kind] ? kind : 'other'}" aria-hidden="true"
  ><svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">{@html svg}</svg></span
>

<style>
  .ki {
    display: inline-grid;
    place-items: center;
    flex: none;
    width: 36px;
    height: 36px;
    border-radius: 50%;
    border: 2px solid currentColor;
    background: var(--paper);
    color: var(--ink-3);
  }
  .ki-shop {
    color: var(--l2);
  }
  .ki-food {
    color: var(--hi);
  }
  .ki-water {
    color: var(--l3);
  }
  .ki-sleep,
  .ki-camp {
    color: var(--l4);
  }
  .ki-bike,
  .ki-repair {
    color: var(--ok);
  }
  .ki-station,
  .ki-atm,
  .ki-toilet {
    color: var(--ink-2);
  }
  .ki-fuel {
    color: var(--warn);
  }
  .ki-pharmacy,
  .ki-hospital,
  .ki-depot {
    color: var(--bad);
  }
  .ki-own {
    color: var(--accent);
  }
  .ki-view {
    color: var(--l1);
  }
</style>
