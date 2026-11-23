<script>
  /**
   * «Weiter zu …» (Noah 23.11.2026 «ja», Punkt 3 «Keine Sackgassen»): at the end of a page whose only link led back to its place, one quiet
   * line with the way on (src/lib/nav/weiter.js). Never above the content (Content first). Nothing is shown where the list has no entry.
   */
  import { t } from '../i18n.svelte.js';
  import { weiterOf } from './weiter.js';

  let { hash = '' } = $props();
  const steps = $derived(weiterOf(hash));
</script>

{#if steps.length}
  <nav class="weiter" aria-label={t('Continue to')} data-weiter>
    <span class="weiter-t">{t('Continue to')}</span>
    <ul>
      {#each steps as s (s.href)}
        <li><a href={s.href}>{t(s.label)}</a></li>
      {/each}
    </ul>
  </nav>
{/if}

<style>
  .weiter {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.5rem 0.75rem;
    margin: 1.25rem 0 0.5rem;
    padding-top: 0.75rem;
    border-top: 1px solid var(--line, rgba(0, 0, 0, 0.12));
    font-size: 0.95rem;
  }
  .weiter-t { color: var(--muted, #667); }
  ul { display: flex; flex-wrap: wrap; gap: 0.5rem; margin: 0; padding: 0; list-style: none; }
  a {
    display: inline-flex;
    align-items: center;
    min-height: 44px;
    padding: 0 0.9rem;
    border: 1px solid var(--line, rgba(0, 0, 0, 0.18));
    border-radius: 999px;
    color: inherit;
    text-decoration: none;
  }
  a:hover, a:focus-visible { border-color: var(--accent, currentColor); }
</style>
