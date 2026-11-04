<script>
  /**
   * «Beat your Ghost» (Noah 04.11.2026 «2a»): one slim line right under the numbers of a ride, so the result is
   * seen without scrolling to the card: «Ghost beaten · 7 % more watts per beat than your ghost». A tap goes to
   * the card and lights it. It shows only where the card shows (not hidden in «Analyses», a ghost exists).
   */
  import { Ghost, ChevronRight } from '@lucide/svelte';
  import { ana } from '../analyses.svelte.js';
  import { keysOf } from '../analyses.js';
  import { ghostCase } from './ghost.js';
  import { light } from '../../know/spot.js';
  import { t, tn, num, locale } from '../../i18n.svelte.js';

  let { act = null, all = [] } = $props();
  const gc = $derived(keysOf(ana, 'act').includes('ghost') ? ghostCase(all, act) : null);
  const HEAD = { beat: 'Ghost beaten|gh', level: 'Level with your ghost|gh', behind: 'Not beaten this time|gh' };
  const day = $derived(gc ? new Date(`${gc.ghost.act.day}T12:00:00Z`).toLocaleDateString(locale(), { timeZone: 'UTC', day: 'numeric', month: 'numeric' }) : '');
  const line = $derived.by(() => {
    const v = gc?.cmp.verdict;
    if (!v) return '';
    if (v.key === 'samepower-less') return tn(v.n, 'Same power as {day}, {n} beat less heart rate|gh', 'Same power as {day}, {n} beats less heart rate|gh', { day });
    if (v.key === 'samepower-more') return tn(v.n, 'Same power as {day}, {n} beat more heart rate|gh', 'Same power as {day}, {n} beats more heart rate|gh', { day });
    if (v.key === 'ahead') return t('{p} % more watts per beat than on {day}|gh', { p: num(v.n), day });
    if (v.key === 'behind') return t('{p} % fewer watts per beat than on {day}|gh', { p: num(v.n), day });
    return t('Nearly the same watts per beat as on {day}|gh', { day });
  });
  const go = () => {
    const el = document.querySelector('[data-ana="ghost"]');
    if (el) light(el, 'ghost');
  };
</script>

{#if gc}
  <button type="button" class="gst {gc.result}" data-ghost-strip={gc.result} onclick={go}>
    <span class="ic" aria-hidden="true"><Ghost size={18} /></span>
    <span class="tx"><b>{t(HEAD[gc.result])}</b><small>{line}</small></span>
    <span class="more">{t('Show|gh')}<ChevronRight size={16} aria-hidden="true" /></span>
  </button>
{/if}

<style>
  .gst {
    display: flex;
    align-items: center;
    gap: 12px;
    width: 100%;
    min-height: 48px;
    padding: 10px 14px;
    border: 1px solid var(--line);
    border-radius: 16px;
    background: var(--paper);
    color: var(--ink);
    font: inherit;
    text-align: left;
    cursor: pointer;
  }
  .ic {
    display: grid;
    place-items: center;
    flex: none;
    width: 34px;
    height: 34px;
    border-radius: 50%;
    background: var(--paper-2);
    color: var(--ink-2);
  }
  .beat .ic {
    background: var(--ok-soft);
    color: var(--ok);
  }
  .tx {
    display: grid;
    min-width: 0;
  }
  .tx small {
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .more {
    display: inline-flex;
    align-items: center;
    margin-left: auto;
    color: var(--hi);
    font-weight: 600;
    white-space: nowrap;
  }
</style>
