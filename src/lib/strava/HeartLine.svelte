<script>
  /** Heart rate of rides as one quiet line: «♥ Ø 142 · max 171» (observation only, no rating). */
  import { HeartPulse } from '@lucide/svelte';
  import { t } from '../i18n.svelte.js';
  let { heart, label = '', size = 14 } = $props();
</script>

{#if heart}
  <span class="hr"><HeartPulse {size} aria-hidden="true" />{label ? `${label} ` : ''}{heart.max ? t('Ø {avg} · max {max} bpm', { avg: heart.avg, max: heart.max }) : t('Ø {avg} bpm', { avg: heart.avg })}</span>
{/if}

<style>
  .hr { display: inline-flex; align-items: center; gap: 4px; color: var(--ink-2); font-variant-numeric: tabular-nums; }
</style>
