<script>
  /** Switch between the bike setup and Bike care (both live under "Bikes"). */
  // v0.21.0 (Noah 6a): one page #/bikes with the tabs Setup and Care; the chosen bike stays.
  import { t } from '../i18n.svelte.js';
  import { bikesHash } from '../bikes.js';

  let { current, bike = null } = $props();
</script>

<nav class="subnav" aria-label={t('Bikes')}>
  <a href={bikesHash({ tab: 'setup', bike })} aria-current={current === 'setup' ? 'page' : undefined}>{t('Setup')}</a>
  <a href={bikesHash({ tab: 'care', bike })} aria-current={current === 'care' ? 'page' : undefined}>{t('Care')}</a>
  <!-- v0.48.0 (Noah 9a): «Werkstatt & Belege» under Bikes: orders, visits, receipts. -->
  <a href={bikesHash({ tab: 'shop', bike })} aria-current={current === 'shop' ? 'page' : undefined}>{t('Workshop|tab')}</a>
</nav>

<style>
  /* v0.47.0 (style sheet «Gletscher»): the same soft segmented control as every toggle (ui/Seg). */
  .subnav {
    display: inline-flex;
    gap: 2px;
    padding: 3px;
    border-radius: 12px;
    background: var(--paper-2);
  }
  /* v0.27.0 (AP21): 44 px high for a thumb (were 30 px). */
  a {
    display: inline-flex;
    align-items: center;
    min-height: 44px;
    padding: 6px 16px;
    border-radius: 9px;
    font: 500 15px var(--font-body);
    color: var(--ink-2);
    text-decoration: none;
  }
  a:visited {
    color: var(--ink-2);
  }
  a[aria-current='page'] {
    background: var(--paper);
    color: var(--ink);
    font-weight: 600;
    box-shadow: 0 1px 3px var(--shadow);
  }
</style>
