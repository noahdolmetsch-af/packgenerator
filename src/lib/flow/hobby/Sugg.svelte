<script>
  /** Hobby pages: the small tag «Vorschlag» on everything the app suggests (Noah 10.10.2026, 15:37). */
  import { t } from '../../i18n.svelte.js';
</script>

<span class="sgtag">{t('Suggestion|tag')}</span>

<style>
  .sgtag {
    display: inline-block;
    margin-left: 6px;
    padding: 0 6px;
    border: 1px solid var(--l2);
    border-radius: 6px;
    background: var(--warn-soft);
    color: var(--warn);
    font: 500 var(--fs-tiny)/1.5 var(--font-body);
    vertical-align: middle;
    white-space: nowrap;
  }
</style>
