<script>
  /**
   * «Neue Ordnung» V4b2 (Noah 22.11.2026 «1a»): one row on top of Training › Woche: «Suggest the week», «Lighter», «Harder»,
   * «Rainy week», «Ski tour week». The last four switch the kind of this week (the same switches as in the weekly plan);
   * everything is a suggestion, a tap again takes it back, and Undo is offered. They need a saved weekly plan.
   * With a weekly plan «Suggest the week» is a link to it (Noah 23.11.2026 «3a»: one proposal, the weekly plan); without one it opens the older suggestion.
   */
  import { Sparkles } from '@lucide/svelte';
  import { t } from '../i18n.svelte.js';

  let { mode = {}, hasPlan = false, canChange = true, onmode, onsuggest } = $props();

  const MODES = [
    { key: 'light', name: 'Lighter|week' },
    { key: 'hard', name: 'Harder' },
    { key: 'rain', name: 'Rainy week' },
    { key: 'ski', name: 'Ski tour week' },
  ];
</script>

<div class="wm" role="group" aria-label={t('Kind of week')} data-week-modes>
  {#if hasPlan}
    <a class="chip sug" href="#/flow/wochenplan" data-wm-suggest><Sparkles size={15} aria-hidden="true" />{t('Suggest the week')}</a>
  {:else}
    <button type="button" class="chip sug" onclick={onsuggest} data-wm-suggest><Sparkles size={15} aria-hidden="true" />{t('Suggest the week')}</button>
  {/if}
  {#if hasPlan && canChange}
    {#each MODES as m (m.key)}
      <button type="button" class="chip" aria-pressed={!!mode[m.key]} onclick={() => onmode?.(m.key)} data-wm-mode={m.key}>{t(m.name)}</button>
    {/each}
  {:else if canChange}
    <a class="chip" href="#/flow/wochenplan" data-wm-plan>{t('Set up a weekly plan')} ›</a>
  {/if}
</div>

<style>
  .wm {
    display: flex;
    flex-wrap: wrap;
    gap: var(--sp-2);
    margin: 0 0 var(--sp-3);
  }
  .chip {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    min-height: 44px;
    padding: 0 var(--sp-3);
    border: 1px solid var(--line);
    border-radius: 999px;
    background: var(--paper);
    color: var(--ink);
    font: inherit;
    text-decoration: none;
    cursor: pointer;
  }
  .chip[aria-pressed='true'] {
    border-color: var(--hi);
    background: var(--hi-soft);
    font-weight: 600;
  }
  .sug {
    color: var(--hi);
    font-weight: 600;
  }
</style>
