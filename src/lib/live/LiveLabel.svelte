<script>
  /**
   * Live Navigation M10 (Noah 26.10.2026 «klar labeln»): the label of a ride recorded on the live map, in
   * Touren and after «Fahrt beenden». A name, the same in every language (saveride.js LIVE_LABEL).
   */
  import { Navigation } from '@lucide/svelte';
  import { LIVE_LABEL } from './saveride.js';
</script>

<span class="livelabel" data-live-label><Navigation size={13} aria-hidden="true" />{LIVE_LABEL}</span>

<style>
  .livelabel {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 1px 8px;
    border: 1px solid var(--brand);
    border-radius: 999px;
    color: var(--brand);
    background: var(--ok-soft);
    font-size: var(--fs-tiny);
    font-weight: 600;
    white-space: nowrap;
    vertical-align: middle;
  }
</style>
