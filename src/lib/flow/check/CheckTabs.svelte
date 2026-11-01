<script>
  /**
   * «Heute-Check» (Noah 30.10.2026 «1-5a»): the three ways of the daily check, one row on top of its pages:
   * Heute (the questionnaire of the round), Was zusammenpasst (the insights) and Alle Antworten (the history).
   * here: 'today' | 'insights' | 'history'.
   */
  import { t } from '../../i18n.svelte.js';

  let { here = 'today', evening = false } = $props();
</script>

<nav class="ctabs" aria-label={t('Daily check')} data-check-tabs>
  <a href={evening ? '#/check/evening' : '#/check/morning'} aria-current={here === 'today' ? 'page' : undefined}>{t('Today|check tab')}</a>
  <a href="#/check/insights" aria-current={here === 'insights' ? 'page' : undefined} data-tab-insights>{t('What goes together')}</a>
  <a href="#/me/history" aria-current={here === 'history' ? 'page' : undefined}>{t('All answers')}</a>
</nav>

<style>
  .ctabs {
    display: flex;
    flex-wrap: wrap;
    gap: 4px 6px;
    margin-top: var(--sp-2);
  }
  .ctabs a {
    display: inline-flex;
    align-items: center;
    min-height: 44px;
    padding: 0 var(--sp-3);
    border: 1px solid var(--line-strong);
    border-radius: var(--r-ctl);
    color: var(--ink-2);
    font-size: var(--fs-small);
    font-weight: 600;
    text-decoration: none;
  }
  .ctabs a[aria-current='page'] {
    border-color: var(--hi);
    background: var(--hi);
    color: var(--hi-ink);
  }
</style>
