<script>
  /**
   * «Heute-Check» step 3 (Noah 30.10.2026 «1-5a», thread «Tagescheck optimieren»): the tab «Alle Antworten» of the daily
   * check (#/check/history): the history of Ich › Daten › Verlauf (answers, Fitbit, Strava; change an answer) under the
   * head and the row of tabs of the daily check.
   */
  import Crumb from '../lib/flow/kit/Crumb.svelte';
  import CheckTabs from '../lib/flow/check/CheckTabs.svelte';
  import Verlauf from './Verlauf.svelte';
  import { isEvening } from '../lib/flowcheck.js';
  import { t } from '../lib/i18n.svelte.js';
</script>

<div class="ck" data-check="history">
  <header class="ph">
    <Crumb path={[{ href: '#/', label: t('Today|place') }]} here={t('All answers')} />
    <h1 class="h1" tabindex="-1" data-page-title>{t('All answers')}</h1>
    <p class="sub">{t('All values in one place: your answers, Fitbit and Strava. Only to look at, stays on this device.')}</p>
    <CheckTabs here="history" evening={isEvening()} />
  </header>
  <Verlauf embedded />
</div>
