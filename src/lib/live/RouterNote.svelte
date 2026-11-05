<script>
  /**
   * The one sentence that says what the bike router gets (Noah 05.11.2026 «ok bauen», Sicherheitsnetz): brouter.de
   * keeps the requests (IP and coordinates) for two weeks, so the app says that where it asks.
   * round: a round from home (the home place goes out), otherwise a way from where you are.
   */
  import { t } from '../i18n.svelte.js';
  let { round = false, cls = 'rc-note' } = $props();
</script>

<p class={cls} data-router-note>
  {round
    ? t('To plan a round, the app sends your home place and the points of the round to brouter.de (free, no account). The service keeps such requests for two weeks. Nothing else leaves the device.')
    : t('To plan a way, the app sends your position and the goal to brouter.de (free, no account). The service keeps such requests for two weeks. Nothing else leaves the device.')}
</p>
