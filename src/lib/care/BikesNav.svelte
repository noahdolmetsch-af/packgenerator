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
</nav>

<style>
  .subnav {
    display: inline-flex;
    border: 1.5px solid var(--line-strong);
    border-radius: 6px;
    overflow: hidden;
  }
  /* v0.27.0 (AP21): 44 px high for a thumb (were 30 px). */
  a {
    display: inline-flex;
    align-items: center;
    min-height: 44px;
    padding: 6px 16px;
    font: 700 15px var(--font-body);
    color: var(--ink);
    text-decoration: none;
    background: var(--paper);
  }
  a + a {
    border-left: 1px solid var(--line);
  }
  a[aria-current='page'] {
    background: var(--ink);
    color: var(--paper);
  }
</style>
