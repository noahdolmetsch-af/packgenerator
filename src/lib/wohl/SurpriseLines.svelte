<script>
  /**
   * Paket P #256 «Überraschungen der Woche» in Sunday's Wochenrückblick window (HomeWindow, Paket C): at most
   * two answers of this week far from your normal of the 30 days before. Observation only; without one, nothing.
   */
  import { CalendarSearch } from '@lucide/svelte';
  import { historyQuery } from '../abdb.js';
  import { weekOf } from '../abauswertung.js';
  import { QUESTION } from '../abfragen.js';
  import { surprises } from '../wohl.js';
  import { t, locale } from '../i18n.svelte.js';

  let { today } = $props();
  const hist = historyQuery();
  const week = $derived(weekOf(today).filter((d) => d <= today));
  const list = $derived(surprises($hist?.rows ?? [], week).slice(0, 2));
  const f1 = (v) => Number(v).toLocaleString(locale(), { maximumFractionDigits: 1 });
  const qName = (qid) => {
    const q = QUESTION[qid];
    return q?.was ? t(q.was) : q ? t(q.text) : qid;
  };
</script>

{#if list.length}
  <div class="sl" data-window-surprises>
    <b>{t('Surprises this week')}</b>
    {#each list as s (s.qid)}
      <p><CalendarSearch size={16} aria-hidden="true" /><span>{qName(s.qid)}: {s.dir === 'up' ? t('higher than usual: {a} instead of {b}', { a: f1(s.week), b: f1(s.normal) }) : t('lower than usual: {a} instead of {b}', { a: f1(s.week), b: f1(s.normal) })}</span></p>
    {/each}
  </div>
{/if}

<style>
  .sl {
    margin-top: 10px;
    display: grid;
    gap: 4px;
    font-size: var(--fs-small);
    min-width: 0;
  }
  p {
    margin: 0;
    display: flex;
    gap: 8px;
    align-items: flex-start;
    color: var(--ink-2);
    overflow-wrap: break-word;
  }
  p :global(svg) {
    flex: none;
    margin-top: 2px;
  }
</style>
