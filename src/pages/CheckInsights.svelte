<script>
  /**
   * «Heute-Check» step 2 (Noah 30.10.2026 «1-5a», thread «Tagescheck optimieren»): the tab «Was zusammenpasst» of the daily
   * check (#/check/insights): the insights of your answers (Erkenntnisse.svelte shows the same on Ich › Erkenntnisse)
   * under the way back to the questionnaire. Only to look at: «goes together», never «is to blame».
   */
  import Crumb from '../lib/flow/kit/Crumb.svelte';
  import CheckTabs from '../lib/flow/check/CheckTabs.svelte';
  import Insights from '../lib/erkenntnisse/Insights.svelte';
  import { isEvening } from '../lib/flowcheck.js';
  import { t } from '../lib/i18n.svelte.js';
  import '../lib/abfragen/ab.css';
</script>

<div class="ck" data-check="insights">
  <header class="ph">
    <Crumb path={[{ href: '#/', label: t('Today|place') }]} here={t('What goes together')} />
    <h1 class="h1" tabindex="-1" data-page-title>{t('What goes together')}</h1>
    <p class="sub">{t('Your answers, Fitbit, Strava, meditation, weather and calendar side by side: what goes together, in one sentence each.')}</p>
    <CheckTabs here="insights" evening={isEvening()} />
  </header>
  <Insights idp="cki" />
  <p class="lks"><a class="btn" href="#/me/analysis">{t('How it is analysed')}</a></p>
</div>

<style>
  .ck {
    display: flex;
    flex-direction: column;
    gap: var(--sp-4);
    max-width: 900px;
  }
  .lks {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin: 0;
  }
</style>
