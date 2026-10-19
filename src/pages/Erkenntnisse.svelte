<script>
  /**
   * «Erkenntnisse», Ich › Erkenntnisse (#/me/insights). Noah 19.10.2026 «4b» + «zusätzlich eine eigene Seite»:
   * the same insights as in the Auswertung, here all of them and what is still collecting days.
   */
  import VeloHead from '../lib/bikes/VeloHead.svelte';
  import Insights from '../lib/erkenntnisse/Insights.svelte';
  import { t } from '../lib/i18n.svelte.js';
  import '../lib/ich/ich.css';
</script>

<div class="ich-page ekpage">
  <VeloHead crumbs={[{ label: t('Me|place'), href: '#/me' }, { label: t('Data'), href: '#/me/data' }]} here={t('Insights')} title={t('Insights')} sub={t('Your answers, Fitbit, Strava, meditation, weather and calendar side by side: what goes together, in one sentence each.')} />
  <Insights idp="ekp" />
  <p class="lks"><a class="btn" href="#/me/analysis">{t('How it is analysed')}</a> <a class="btn" href="#/me/history">{t('History')}</a></p>
</div>

<style>
  .ekpage {
    max-width: 900px;
  }
  .lks {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
</style>
