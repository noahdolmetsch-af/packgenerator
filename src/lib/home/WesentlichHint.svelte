<script>
  /**
   * «Was mir wesentlich ist» (Noah 05.11.2026): once a quarter one quiet row on Heute asks to look at what
   * mattered to you again. «Later» waits 14 days; the switch on the page turns it off for good.
   */
  import { Heart } from '@lucide/svelte';
  import { cfgQuery, changeCfg, rowsQuery } from '../freidb.js';
  import { essentialDue, monthsSince, addDaysTo, SNOOZE_DAYS } from '../frei/wesentlich-rueckblick.js';
  import { t, tn } from '../i18n.svelte.js';

  let { today } = $props();
  const q = cfgQuery();
  const essQ = rowsQuery('essential');
  const due = $derived($q === undefined || $essQ === undefined ? null : essentialDue({ entries: $essQ, cfg: $q, today }));
  const later = () => changeCfg((c) => ({ ...c, essSnooze: addDaysTo(today, SNOOZE_DAYS) }));
</script>

{#if due}
  <div class="ih" data-ess-due>
    <Heart size={20} aria-hidden="true" />
    <span class="it">{tn(monthsSince(due.days), 'It has been {n} month since you wrote what matters to you. Look at it again?', 'It has been {n} months since you wrote what matters to you. Look at it again?')}</span>
    <a class="btn" href="#/me/frei/wesentlich" data-ess-look>{t('Take a look')}</a>
    <button type="button" class="linkq" onclick={later} data-ess-later>{t('Later')}</button>
  </div>
{/if}

<style>
  .ih {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 6px 12px;
    padding: 10px 14px;
    border: 1px solid var(--card-line);
    border-radius: var(--radius-card);
    background: var(--paper);
    box-shadow: var(--card-shadow);
    color: var(--ink-2);
  }
  .it {
    flex: 1 1 200px;
    min-width: 0;
    color: var(--ink);
    font-size: var(--fs-body);
    overflow-wrap: break-word;
  }
  .linkq {
    padding: 12px 4px;
    margin-block: -12px;
    border: 0;
    background: none;
    color: var(--ink-2);
    font: inherit;
    font-size: var(--fs-small);
    cursor: pointer;
  }
</style>
