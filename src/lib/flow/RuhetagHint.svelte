<script>
  /**
   * «Ruhetag-Hinweis» (Noah 05.11.2026, Ideen für alle Bereiche, Aktiv 4a): on Aktiv, after three hard days in a row,
   * one gentle line «Heute locker?». It only watches (the load of your Strava activities), never decides: «Nicht
   * heute» hides it for the day, and «Performance tips» (Me › Look › Suggestions) switches it off. Rules: ruhetag.js.
   */
  import { Leaf, ChevronRight } from '@lucide/svelte';
  import { ruhetagQuery } from '../ruhetag-data.js';
  import { RUHETAG_NO_KEY } from '../ruhetag.js';
  import { putSetting } from '../flowdb.js';
  import { db } from '../db.js';
  import { suggest, watchSuggest } from '../clear/suggest.svelte.js';
  import { t, tn } from '../i18n.svelte.js';

  let { today } = $props();
  watchSuggest();
  const q = ruhetagQuery(today);
  const hint = $derived($q);
  const title = $derived(
    hint
      ? hint.todayHard
        ? tn(hint.n, '{n} hard day in a row. Easy tomorrow?', '{n} hard days in a row. Easy tomorrow?')
        : tn(hint.n, '{n} hard day in a row. Easy today?', '{n} hard days in a row. Easy today?')
      : '',
  );
</script>

{#if hint && suggest.on.performance}
  <section class="rt" data-ruhetag aria-label={t('A gentle hint')}>
    <Leaf size={18} aria-hidden="true" />
    <div class="tx">
      <b data-ruhetag-title>{title}</b>
      <span>{t('Only a hint from your activities. You decide, a hard day is fine too.')}</span>
      <span class="acts">
        <a class="btn btn-link sm" href="#/flow/rest" data-ruhetag-rest>{t('See recovery')}<ChevronRight size={16} aria-hidden="true" /></a>
        <button type="button" class="btn sm" data-ruhetag-no onclick={() => putSetting(db, RUHETAG_NO_KEY, today)}>{t('Not today')}</button>
      </span>
      <small>{t('Switch off: Me › Look › Suggestions › Performance tips.')}</small>
    </div>
  </section>
{/if}

<style>
  .rt {
    display: flex;
    gap: 10px;
    align-items: flex-start;
    padding: 12px 14px;
    border: 1px solid var(--line);
    border-radius: 14px;
    background: var(--paper-2);
    color: var(--ink-2);
  }
  .rt > :global(svg) {
    flex: none;
    margin-top: 2px;
    color: var(--l3);
  }
  .tx {
    display: flex;
    flex-direction: column;
    gap: 4px;
    min-width: 0;
  }
  .tx b {
    color: var(--ink);
  }
  .acts {
    display: flex;
    flex-wrap: wrap;
    gap: var(--sp-2) var(--sp-4);
    align-items: center;
    margin-top: var(--sp-1);
  }
  small {
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
</style>
