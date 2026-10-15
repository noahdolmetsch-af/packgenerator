<script>
  /**
   * «Training» (TR1–TR3): the time in the five heart rate zones as one thin bar (Z1 left … Z5 right),
   * with an optional legend (bar={false}: the legend alone). Observation only. secs: [s1 … s5] or null (no heart rate: a quiet line).
   */
  import { ZONE_NAMES } from '../training.js';
  import { t } from '../i18n.svelte.js';

  let { secs = null, legend = false, bar = true, h = 8 } = $props();
  const all = $derived(secs ? secs.reduce((s, x) => s + x, 0) : 0);
  const label = $derived(secs ? `${t('Time in heart rate zones')}: ${secs.map((s, i) => `Z${i + 1} ${t('{n} min', { n: Math.round(s / 60) })}`).join(', ')}` : t('No heart rate'));
</script>

{#if bar}<span class="zb" role="img" aria-label={label} style:--h="{h}px" data-zones>
  {#if all}
    {#each secs as s, i (i)}{#if s}<i class="z{i + 1}" style:flex-grow={s}></i>{/if}{/each}
  {:else}
    <i class="none"></i>
  {/if}
</span>{/if}
{#if legend}
  <span class="lg">
    {#each ZONE_NAMES as n, i (n)}<span><i class="z{i + 1}"></i>Z{i + 1} {t(n)}</span>{/each}
  </span>
{/if}

<style>
  .zb {
    display: flex;
    gap: 1px;
    width: 100%;
    min-width: 60px;
    height: var(--h);
    border-radius: 99px;
    overflow: hidden;
  }
  .zb i {
    flex: 1 1 0;
  }
  .none {
    background: var(--paper-2);
  }
  .z1 {
    background: var(--z1);
  }
  .z2 {
    background: var(--z2);
  }
  .z3 {
    background: var(--z3);
  }
  .z4 {
    background: var(--z4);
  }
  .z5 {
    background: var(--z5);
  }
  .lg {
    display: flex;
    flex-wrap: wrap;
    gap: 2px 12px;
    margin-top: 6px;
    color: var(--ink-2);
    font-size: var(--fs-tiny);
  }
  .lg span {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    white-space: nowrap;
  }
  .lg i {
    width: 9px;
    height: 9px;
    border-radius: 2px;
  }
</style>
