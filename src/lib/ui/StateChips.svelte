<script>
  /**
   * SN2/SN4 «Seiten neu»: the filter chips of the trip states «Alle n · Abgeschlossen n · Bewertet n»,
   * each in its state's colour with its icon (the same look as the chips on Touren, TZ-1); the chosen
   * one is filled in ink, a second tap on it shows all again. value: 'all' or a state; counts:
   * { all, plan?, done?, rated? }; states: the states to offer. children: more chips in the same row
   * (e.g. «Art: Alle»).
   */
  import { Pencil, Flag, Star } from '@lucide/svelte';
  import { t } from '../i18n.svelte.js';
  import { STATE_NAMES } from '../tripstate.js';

  let { value = 'all', counts = {}, states = ['done', 'rated'], label = '', onchange, children = null } = $props();
  const ICON = { plan: Pencil, done: Flag, rated: Star };
</script>

<div class="stchips" role="group" aria-label={label || t('Show trips')}>
  <button type="button" class="sc" data-state="all" aria-pressed={value === 'all'} onclick={() => onchange?.('all')}>{t('All|trips')}<span class="num">{counts.all ?? 0}</span></button>
  {#each states as s (s)}
    {@const Icon = ICON[s]}
    <button type="button" class="sc st-{s}" data-state={s} aria-pressed={value === s} onclick={() => onchange?.(value === s ? 'all' : s)}><Icon size={14} fill={s === 'rated' ? 'currentColor' : 'none'} aria-hidden="true" />{t(STATE_NAMES[s])}<span class="num">{counts[s] ?? 0}</span></button>
  {/each}
  {@render children?.()}
</div>

<style>
  .stchips {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--sp-2);
  }
  .sc {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    min-height: 44px;
    padding: 0 var(--sp-3);
    border: 1px solid var(--line-strong);
    border-radius: 999px;
    background: var(--paper);
    color: var(--ink);
    font: 500 var(--fs-small) / 1.2 var(--font-body);
    white-space: nowrap;
    cursor: pointer;
  }
  .sc .num {
    color: var(--ink-2);
    font-weight: 400;
  }
  .sc.st-plan {
    border-color: color-mix(in srgb, var(--st-plan-line) 45%, transparent);
    background: var(--st-plan-soft);
    color: var(--st-plan);
  }
  .sc.st-done {
    border-color: color-mix(in srgb, var(--st-done-line) 45%, transparent);
    background: var(--st-done-soft);
    color: var(--st-done);
  }
  .sc.st-rated {
    border-color: color-mix(in srgb, var(--st-rated-line) 45%, transparent);
    background: var(--st-rated-soft);
    color: var(--st-rated);
  }
  .sc[aria-pressed='true'] {
    border-color: var(--ink);
    background: var(--ink);
    color: var(--paper);
  }
  .sc[aria-pressed='true'] .num {
    color: var(--paper);
  }
  .sc:focus-visible {
    outline: var(--focus-ring);
    outline-offset: 2px;
  }
</style>
