<script>
  /**
   * Paket Q #74 «Tipp der Woche» (Noah 19.10.2026 «4a und als Kachel in der Spielwiese»): one tip of
   * «Good to know» per week, the unused ones first (tipweek.js), with its button. On Today as a tile
   * and in the playground window.
   */
  import { Lightbulb } from '@lucide/svelte';
  import { t } from '../i18n.svelte.js';
  import { localDay } from '../localday.js';
  import { TIPS } from '../tips.js';
  import { weekTip } from './tipweek.js';

  let { used = new Set(), compact = false } = $props();
  const tip = $derived(weekTip(TIPS, localDay(), used));
</script>

{#if tip}
  <div class="tw" class:compact data-tile-tipweek={tip.id}>
    <p class="tw-h"><Lightbulb size={16} aria-hidden="true" />{t('Tip of the week')}</p>
    <b>{t(tip.title)}</b>
    <p class="tw-t">{t(tip.text)}</p>
    <a class="btn sm" href={tip.go.href}>{t(tip.button)}</a>
  </div>
{/if}

<style>
  .tw {
    display: grid;
    gap: 6px;
    justify-items: start;
    padding: var(--sp-3);
    border-radius: var(--radius-card);
    background: var(--paper);
    box-shadow: var(--card-shadow);
  }
  .tw.compact {
    box-shadow: none;
    background: var(--paper-2);
  }
  .tw-h {
    display: flex;
    gap: 6px;
    align-items: center;
    margin: 0;
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .tw-t {
    margin: 0;
    color: var(--ink-2);
  }
</style>
