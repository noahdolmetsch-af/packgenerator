<script>
  /**
   * The «how sure» label of a statement (Noah 21.11.2026): Sure / Tendency / Too little data. A small word with a
   * dot, calm colours (no red), so it never reads as an alarm. level: 'sure' | 'trend' | 'few'.
   */
  import { t } from '../../i18n.svelte.js';

  let { level = 'few' } = $props();
  const NAME = { sure: 'Sure', trend: 'Tendency', few: 'Too little data' };
</script>

<span class="sg {level}" data-sure={level}><i aria-hidden="true"></i>{t(NAME[level] ?? NAME.few)}</span>

<style>
  .sg {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 2px 10px;
    border: 1px solid var(--line-strong);
    border-radius: 999px;
    color: var(--ink-2);
    font: 600 var(--fs-small) / 1.4 var(--font-body);
    white-space: nowrap;
  }
  i {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--ink-3);
  }
  .sure i {
    background: var(--accent);
  }
  .trend i {
    background: var(--warn);
  }
</style>
