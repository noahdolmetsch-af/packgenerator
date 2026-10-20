<script>
  /**
   * Paket S «Reise-Spur»: one quiet line to a tour's map and days (Rückblick of a trip).
   * Gesamttest 20.10.2026 (journey): a second quiet line to the trip's page «Tour» (#/tour/t:<id>), which links
   * back with «Rückblick ›»; so the two pages of a finished trip always lead to each other.
   */
  import { Map as MapIcon, ChevronRight, Route } from '@lucide/svelte';
  import { t } from '../i18n.svelte.js';
  import { tourHref } from '../touren/tour.js';

  let { trip } = $props();
</script>

<a class="spurrow" href={tourHref(`t:${trip.id}`)} data-to-tour-page><Route size={18} aria-hidden="true" /><span><b>{t('See the tour page')}</b> · {t('values, map, gear and diary of this trip')}</span><ChevronRight size={16} aria-hidden="true" /></a>
<a class="spurrow" href="#/spur/{trip.id}"><MapIcon size={18} aria-hidden="true" /><span><b>{t('Travel track')}</b> · {t('map, days, link for your family, travel book')}</span><ChevronRight size={16} aria-hidden="true" /></a>

<style>
  .spurrow {
    display: flex;
    align-items: center;
    gap: 8px;
    min-height: 44px;
    padding: 8px 12px;
    border-radius: var(--radius-card, 12px);
    background: var(--paper);
    border: 1px solid var(--card-line, var(--line));
    color: var(--ink);
    text-decoration: none;
    margin: 0 0 12px;
  }
  .spurrow span {
    flex: 1;
    min-width: 0;
    overflow-wrap: break-word;
  }
  .spurrow :global(svg) {
    flex: none;
  }
</style>
