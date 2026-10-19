<script>
  /**
   * Paket U «Rennen» › Vorbereiten: everything before the start, one box per idea: route and stops,
   * countdown and dress rehearsal, training, mandatory kit, stomach test, rig comparison, weight along the
   * route, spares, tool, paperwork, drop bags, my why, bad weather, laundry and the briefing sheet.
   * Gets `ctx` from RaceDetail; the boxes live in prep/*.svelte.
   */
  import RouteBox from './prep/RouteBox.svelte';
  import Build from './prep/Build.svelte';
  import Kit from './prep/Kit.svelte';
  import Load from './prep/Load.svelte';
  import Papers from './prep/Papers.svelte';
  import { t } from '../i18n.svelte.js';

  let { ctx } = $props();
</script>

<p class="rc-note" data-race-part="prepare">{t('Everything here is a suggestion: change, add or delete what does not fit.')}</p>
<RouteBox {ctx} />
<div class="rc-grid">
  <Build {ctx} />
  <Kit {ctx} />
  <Load {ctx} />
  <Papers {ctx} />
</div>
