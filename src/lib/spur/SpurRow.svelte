<script>
  /** Paket S «Reise-Spur»: one quiet line to a tour's map and days (Rückblick of a trip). */
  import { Map as MapIcon, ChevronRight } from '@lucide/svelte';
  import { t } from '../i18n.svelte.js';

  let { trip } = $props();
</script>

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
  }
</style>
