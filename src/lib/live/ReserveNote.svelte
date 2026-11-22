<script>
  /**
   * Says that a reserve router planned the way (Noah 05.11.2026 «2a und b»): brouter.de did not answer, so
   * Valhalla or OSRM (FOSSGIS) did. Their answer has no climb and hardly knows the kind of way.
   */
  import { t } from '../i18n.svelte.js';
  let { cls = 'rc-note' } = $props();
</script>

<p class={cls} data-reserve-note>{t('The usual bike router did not answer, so a reserve router planned this. It can differ, hardly cares about road, gravel or MTB, and gives no climb.')}</p>
