<script>
  /**
   * AB6 «So wird ausgewertet», Ich › Daten › Auswertung (#/me/analysis). Noah 14.10. 00:52:22 1a 2a 3b 4ab —
   * 4ab: here as drawn AND on «Deine Abfragen» (the same component, lib/abfragen/Auswertung.svelte).
   */
  import VeloHead from '../lib/bikes/VeloHead.svelte';
  import Auswertung from '../lib/abfragen/Auswertung.svelte';
  import DataWidget from '../lib/wohl/DataWidget.svelte'; // Paket P #293 (Noah 19.10.2026 «2 beides»)
  import Messwerte from '../lib/abfragen/Messwerte.svelte'; // «Aktiv neu» 20.10.2026: Fitbit and Strava values
  import { t } from '../lib/i18n.svelte.js';
  import '../lib/ich/ich.css';
</script>

<div class="ich-page awpage">
  <VeloHead crumbs={[{ label: t('Me|place'), href: '#/me' }, { label: t('Data'), href: '#/me/data' }]} here={t('Analysis')} title={t('How it is analysed')} sub={t('Everything reads from the one history under Data. Only to look at, without grades.')} />
  <DataWidget idp="awdw" />
  <Messwerte idp="awmw" />
  <Auswertung idp="awp" />
  <a class="btn" href="#/me/history">{t('History')}</a>
</div>

<style>
  .awpage {
    max-width: 900px;
  }
</style>
