<script>
  import { t } from '../i18n.svelte.js';
  /**
   * v0.40.0 (Noah 7a): an explanation that is really needed sits behind a small "?" instead of a
   * paragraph under the title. A tap (or Enter) shows the text right below; again hides it.
   * label: what the explanation is about (for screen readers), children: the text.
   */
  let { label = '', children } = $props();
  let open = $state(false);
  const id = `help-${Math.random().toString(36).slice(2, 9)}`;
</script>

<button type="button" class="q" aria-expanded={open} aria-controls={id} aria-label={label ? t('Explain: {what}', { what: label }) : t('Explain')} onclick={() => (open = !open)}>?</button>
{#if open}<div class="help" {id} role="note">{@render children()}</div>{/if}

<style>
  .q {
    display: inline-grid;
    place-items: center;
    width: 26px;
    height: 26px;
    margin: 0 2px;
    padding: 0;
    border: 1px solid var(--line-strong);
    border-radius: 50%;
    background: var(--paper);
    color: var(--ink-2);
    font: 600 14px/1 var(--font-body);
    vertical-align: middle;
    cursor: pointer;
    position: relative;
  }
  /* a 44 px touch area around the small circle */
  .q::after {
    content: '';
    position: absolute;
    inset: -9px;
  }
  .q[aria-expanded='true'] {
    background: var(--ink);
    color: var(--paper);
  }
  .help {
    flex: 1 1 100%;
    margin: 6px 0 8px;
    padding: 8px 12px;
    border-left: 3px solid var(--line-strong);
    background: var(--paper-2);
    border-radius: 0 6px 6px 0;
    color: var(--ink-2);
    font-size: 14px;
    line-height: 1.45;
  }
  .help :global(p) {
    margin: 0 0 6px;
  }
  .help :global(p:last-child) {
    margin: 0;
  }
</style>
