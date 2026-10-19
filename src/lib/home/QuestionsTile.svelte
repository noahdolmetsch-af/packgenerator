<script>
  /**
   * v0.127.0 «Tages-Check» 2 (mockup T3, Noah «b»: T4 as a folded tile on Heute): «Deine 15 Fragen» in
   * one line: how many of today's questions are answered (morning, from 20:30 evening) and when question
   * 15 comes.
   * Back with Noah 18.10.2026 «3 a und b» (mockup T3c): folded one line; «Aufklappen» shows the questions as
   * chips by when they come (morning 7:00, evening from 20:30, Sunday), the rotating ones in a quiet line, and
   * «Fragen anpassen ›» to the page (#/check/questions). The questions also stay in «Wi gaht's?».
   */
  import { List, ChevronRight, ChevronDown, ChevronUp } from '@lucide/svelte';
  import { balanceQuery } from '../flow/data.svelte.js';
  import { answeredToday, isEvening, isSunday, isOn, mindfulFound, QUESTIONS } from '../flowcheck.js';
  import { t } from '../i18n.svelte.js';

  let { today, isnew = false } = $props();
  const q = $derived(balanceQuery(today));
  const data = $derived($q);
  let evening = $state(isEvening());
  $effect(() => {
    const id = setInterval(() => (evening = isEvening()), 60_000);
    return () => clearInterval(id);
  });
  let open = $state(false);
  const a = $derived(data ? answeredToday(data.checks.find((x) => x.day === today), { day: today, off: data.off, evening, pool: data.pool, mindfulAuto: !!mindfulFound(data.log, today) }) : null);
  const line = $derived.by(() => {
    if (!a) return '';
    const parts = [];
    if (a.of) parts.push(t(evening ? '{n} of {m} this evening' : '{n} of {m} this morning', { n: a.done, m: a.of }));
    if (isOn(data.off, 15)) parts.push(isSunday(today) ? t('today comes question 15') : t('Sunday comes question 15'));
    return parts.join(' · ');
  });
  const on = $derived(QUESTIONS.filter((x) => isOn(data?.off ?? [], x.n)));
  const fixed = (part) => on.filter((x) => x.part === part && !x.often.startsWith('rotating'));
  const rotating = $derived(on.filter((x) => x.often.startsWith('rotating')));
  const GROUPS = [
    { part: 'morning', label: 'Morning · 7:00' },
    { part: 'evening', label: 'Evening · from 20:30' },
    { part: 'sunday', label: 'Sunday' },
  ];
</script>

<section class="qt surf" class:open aria-labelledby="qt-h" data-section="questions" data-open={open || undefined}>
  <div class="hd">
    <span class="ico" aria-hidden="true"><List size={18} /></span>
    <span class="tx"><b id="qt-h">{t('Your 15 questions')}</b>{#if line && !open}<span class="ln"> · {line}</span>{/if}</span>
    {#if isnew}<span class="nw">{t('new|tile')}</span>{/if}
    <button type="button" class="go" aria-expanded={open} aria-controls="qt-body" onclick={() => (open = !open)} data-questions-toggle>
      {open ? t('Fold|questions') : t('Unfold|questions')}{#if open}<ChevronUp size={16} aria-hidden="true" />{:else}<ChevronDown size={16} aria-hidden="true" />{/if}
    </button>
  </div>
  {#if open}
    <div id="qt-body" class="bd">
      <div class="grp">
        {#each GROUPS as g (g.part)}
          {@const list = fixed(g.part)}
          {#if list.length}
            <div class="g" data-part={g.part}>
              <small class="gl">{t(g.label)}</small>
              <ul class="chips">
                {#each list as x (x.n)}<li class="chip" data-q={x.n}><span class="num">{x.n}</span> {t(x.short)}</li>{/each}
              </ul>
            </div>
          {/if}
        {/each}
      </div>
      <div class="ft">
        <small class="rot">{#if rotating.length}{t('rotating: {list}', { list: rotating.map((x) => `${x.n} ${t(x.short)}`).join(', ') })} · {/if}{t('all can be switched off')}</small>
        <a class="lk" href="#/check/questions" data-questions-page>{t('Adjust questions')}<ChevronRight size={16} aria-hidden="true" /></a>
      </div>
    </div>
  {/if}
</section>

<style>
  .qt {
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 12px;
    height: 100%;
    padding: 10px 18px;
    box-sizing: border-box;
    color: var(--ink);
  }
  .qt.open {
    justify-content: flex-start;
    padding-bottom: 16px;
  }
  .hd {
    display: flex;
    align-items: center;
    gap: 12px;
    min-height: 44px;
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
    min-height: 44px;
    padding: 0 4px;
    border: 0;
    background: none;
    color: var(--ink-2);
    font: inherit;
    font-size: var(--fs-small);
    cursor: pointer;
  }
  .grp {
    display: flex;
    flex-wrap: wrap;
    gap: 12px 32px;
  }
  .g {
    display: flex;
    flex-direction: column;
    gap: 6px;
    min-width: 0;
  }
  .gl {
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .chips {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .chip {
    padding: 4px 10px;
    border: 1px solid var(--line-strong);
    border-radius: 999px;
    font-size: var(--fs-small);
  }
  .ft {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 4px 16px;
  }
  .rot {
    flex: 1 1 240px;
    min-width: 0;
    color: var(--ink-3);
    font-size: var(--fs-small);
    overflow-wrap: break-word;
  }
  .lk {
    display: inline-flex;
    align-items: center;
    gap: 2px;
    min-height: 44px;
    color: var(--ink);
    font-weight: 500;
    font-size: var(--fs-small);
    text-decoration: none;
  }
</style>
