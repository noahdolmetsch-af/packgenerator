<script>
  /**
   * v0.127.0 «Tages-Check» 2 (mockup T3, Noah «b»: T4 as a folded tile on Heute): «Deine 15 Fragen» in
   * one line: how many of today's questions are answered (morning, from 20:30 evening) and when question
   * 15 comes. «Aufklappen» opens the catalogue (#/check/questions).
   */
  import { List, ChevronRight } from '@lucide/svelte';
  import { balanceQuery } from '../flow/data.svelte.js';
  import { answeredToday, isEvening, isSunday, isOn, mindfulFound } from '../flowcheck.js';
  import { t } from '../i18n.svelte.js';

  let { today, isnew = false } = $props();
  const q = $derived(balanceQuery(today));
  const data = $derived($q);
  let evening = $state(isEvening());
  $effect(() => {
    const id = setInterval(() => (evening = isEvening()), 60_000);
    return () => clearInterval(id);
  });
  const a = $derived(data ? answeredToday(data.checks.find((x) => x.day === today), { day: today, off: data.off, evening, pool: data.pool, mindfulAuto: !!mindfulFound(data.log, today) }) : null);
  const line = $derived.by(() => {
    if (!a) return '';
    const parts = [];
    if (a.of) parts.push(t(evening ? '{n} of {m} this evening' : '{n} of {m} this morning', { n: a.done, m: a.of }));
    if (isOn(data.off, 15)) parts.push(isSunday(today) ? t('today comes question 15') : t('Sunday comes question 15'));
    return parts.join(' · ');
  });
</script>

<a class="qt surf" href="#/check/questions" aria-labelledby="qt-h" data-section="questions">
  <span class="ico" aria-hidden="true"><List size={18} /></span>
  <span class="tx"><b id="qt-h">{t('Your 15 questions')}</b>{#if line}<span class="ln"> · {line}</span>{/if}</span>
  {#if isnew}<span class="nw">{t('new|tile')}</span>{/if}
  <span class="go">{t('Unfold|questions')}<ChevronRight size={16} aria-hidden="true" /></span>
</a>

<style>
  .qt {
    display: flex;
    align-items: center;
    gap: 12px;
    min-height: 56px;
    height: 100%;
    padding: 10px 18px;
    box-sizing: border-box;
    color: var(--ink);
    text-decoration: none;
  }
  .qt:hover {
    background: var(--paper-2);
  }
  .ico {
    display: grid;
    flex: none;
    place-items: center;
    color: var(--ink-2);
  }
  .tx {
    flex: 1;
    min-width: 0;
    overflow-wrap: break-word;
  }
  .tx b {
    font-weight: 600;
  }
  .ln {
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .nw {
    flex: none;
    padding: 0 8px;
    border-radius: 10px;
    background: var(--hi-soft);
    color: var(--badge-ink);
    font: 600 var(--fs-tiny) / 1.6 var(--font-body);
  }
  .go {
    display: inline-flex;
    flex: none;
    align-items: center;
    gap: 2px;
    font-size: var(--fs-small);
  }
</style>
