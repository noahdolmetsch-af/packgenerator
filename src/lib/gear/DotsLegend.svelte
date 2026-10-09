<script>
  /** v0.47.2: what the dots mean, once under a list of cards or a dot row. */
  import { t } from '../i18n.svelte.js';
</script>

<p class="legend">
  <span><i class="used"></i>{t('used')}</span>
  <span><i class="unused"></i>{t('along, not used')}</span>
  <span><i class="home"></i>{t('at home')}</span>
</p>

<style>
  .legend {
    display: flex;
    flex-wrap: wrap;
    gap: 4px 14px;
    margin: 8px 0 0;
    color: var(--ink-3);
    font-size: 13px;
  }
  span {
    display: inline-flex;
    align-items: center;
    gap: 5px;
  }
  i {
    width: 9px;
    height: 9px;
    border-radius: 2px;
    box-sizing: border-box;
  }
  .used {
    background: var(--accent);
  }
  .unused {
    border: 1.5px solid var(--accent);
  }
  .home {
    background: var(--paper-2);
    border: 1px solid var(--line);
  }
</style>
