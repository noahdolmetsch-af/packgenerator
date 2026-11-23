<script>
  /**
   * «Neue Ordnung» V4b2 (Noah 22.11.2026 «2a»): the card «Your status» on Training › Woche: up to four quiet lines, each one
   * a tap to where it is looked at (Auswerten). Lines without data are left out; no data at all: the card does not stand.
   */
  import { ChevronRight } from '@lucide/svelte';
  import { t } from '../i18n.svelte.js';
  import { levelWord, answerLine } from '../flow/form/words.js';
  import { dayAnswer } from '../flow/form/tagesantwort.js';

  let { ready = null, week = null, rest = null, race = null } = $props();
  const ans = $derived(dayAnswer(ready)); // the answer of the page «Form» (Noah 23.11.2026 «ja»)
  const any = $derived(!!ready || !!week || !!rest || !!race);
</script>

{#if any}
  <section class="card stand" aria-labelledby="stand-h" data-section="stand">
    <h2 id="stand-h" class="sh">{t('Your status')}</h2>
    <ul>
      {#if ready}
        <li><a href="#/flow/form" data-stand="ready"><span><b>{t('Readiness')} · {levelWord(ans.level)}</b><small>{answerLine(ans.level)}</small></span><ChevronRight size={16} aria-hidden="true" /></a></li>
      {/if}
      {#if week}
        <li><a href="#/flow/review" data-stand="hours"><span><b>{week.goal ? t('This week {a} of {b} h', { a: week.done, b: week.goal }) : t('This week {a} h', { a: week.done })}</b><small>{t('Week in review')}</small></span><ChevronRight size={16} aria-hidden="true" /></a></li>
      {/if}
      {#if rest}
        <li><a href="#/flow/stats/hr" data-stand="rest"><span><b>{t('Resting pulse {n}', { n: rest.now })}</b><small>{rest.diff === 0 ? t('as usual ({m})', { m: rest.usual }) : rest.diff > 0 ? t('{n} above your usual {m}', { n: rest.diff, m: rest.usual }) : t('{n} below your usual {m}', { n: -rest.diff, m: rest.usual })}</small></span><ChevronRight size={16} aria-hidden="true" /></a></li>
      {/if}
      {#if race}
        <li><a href={race.href} data-stand="race"><span><b>{t('Your race: {name} · {when}', { name: race.name, when: race.when })}</b></span><ChevronRight size={16} aria-hidden="true" /></a></li>
      {/if}
    </ul>
  </section>
{/if}

<style>
  .stand {
    display: grid;
    gap: var(--sp-2);
  }
  .sh {
    margin: 0;
    font-size: var(--fs-section);
  }
  ul {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
  }
  a {
    display: flex;
    align-items: center;
    gap: var(--sp-2);
    min-height: 44px;
    padding: var(--sp-2) 0;
    border-top: 1px solid var(--line);
    color: var(--ink);
    text-decoration: none;
  }
  a span {
    flex: 1;
    display: grid;
    gap: 2px;
  }
  small {
    font-size: var(--fs-small);
    color: var(--ink-3);
  }
</style>
