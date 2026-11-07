<script>
  /**
   * «Training verbessern» 8 (Noah 03.11.2026): the look back suggests the next week: «Keep on like this», «A little more»
   * or «Easier». A tap opens the suggestion of next week with those hours; nothing is taken over before the tap there.
   */
  import { CalendarArrowUp } from '@lucide/svelte';
  import { t } from '../../i18n.svelte.js';

  // last: hours trained last week (or the plan if nothing was done)
  let { last = 0, onpick, hours = (h) => `${h} h` } = $props();
  const half = (h) => Math.max(1, Math.round(h * 2) / 2);
  const opts = $derived([
    { key: 'same', label: t('Keep on like this'), h: half(last) },
    { key: 'more', label: t('A little more|next week'), h: Math.max(half(last * 1.1), half(last) + 0.5) },
    { key: 'less', label: t('Easier|next week'), h: half(last * 0.6) },
  ]);
</script>

{#if last >= 1}
  <div class="nw" data-section="next-week">
    <p class="nh"><CalendarArrowUp size={16} aria-hidden="true" />{t('Next week|look back')}</p>
    <p class="np">{t('Last week {h}. What do you want for next week?', { h: hours(Math.round(last * 10) / 10) })}</p>
    <div class="nb">
      {#each opts as o (o.key)}<button type="button" class="btn sm" onclick={() => onpick(o.h)} data-next-pick={o.key}>{o.label} · {hours(o.h)}</button>{/each}
    </div>
  </div>
{/if}

<style>
  .nw { display: flex; flex-direction: column; gap: 4px; margin-top: 12px; padding-top: 12px; border-top: 1px solid var(--line); }
  .nh { margin: 0; display: flex; gap: 6px; align-items: center; font-weight: 600; }
  .np { margin: 0; color: var(--ink-2); font-size: var(--fs-small); }
  .nb { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 4px; }
</style>
