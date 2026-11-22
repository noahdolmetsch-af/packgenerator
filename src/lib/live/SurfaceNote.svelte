<script>
  /**
   * «Belag und Schwierigkeit» (Noah 05.11.2026 «4a»): what the way is made of (share paved and unpaved) and, where it
   * matters for the way of riding, a warning (unpaved for a road bike, steps, rough stretches). The numbers come
   * from the map data BRouter sends along (belag.js); without them (a reserve router, an old saved detour)
   * nothing is shown.
   */
  import { t, num } from '../i18n.svelte.js';
  import { surfaceLine, warnOf } from './belag.js';
  let { surface = null, profile = 'trekking', cls = 'rc-note' } = $props();
  const line = $derived(surfaceLine(surface));
  const warns = $derived(warnOf(surface, profile));
  const fmt = (v) => (typeof v === 'number' ? num(v < 10 ? Math.round(v * 10) / 10 : Math.round(v)) : v);
  const vars = (o) => Object.fromEntries(Object.entries(o ?? {}).map(([k, v]) => [k, fmt(v)]));
</script>

{#if line}
  <small class={cls} data-surface>{t(line.key, vars(line.vars))}</small>
  {#each warns as w (w.key)}<small class="{cls} sf-warn" role="status" data-surface-warn>{t(w.key, vars(w.vars))}</small>{/each}
{/if}

<style>
  small {
    display: block;
  }
  .sf-warn {
    color: var(--warn);
  }
</style>
