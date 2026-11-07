<script>
  /**
   * «Quelle-Zeile» (UI-Prüfung 07.11.2026, Rang 1): where a value comes from, as a way: «Source: Fitbit ›». src: the source key of
   * the Analyse catalogue (fitbit, strava, check, aktiv); stand: an optional short text after the name («today 07:12»).
   * An own calculation has no page: then the line shows nothing (the page keeps its own sentence).
   */
  import { ChevronRight } from '@lucide/svelte';
  import { t } from '../i18n.svelte.js';
  import { sourceLink } from '../analyse/zahlweg.js';

  let { src = '', stand = '', ...rest } = $props();
  const s = $derived(sourceLink(src));
</script>

{#if s}
  <p class="sourceline" {...rest}>
    <span class="lbl">{t('Source|weg')}</span>
    <a href={s.href}>{s.name}{#if stand}<span class="stand"> · {stand}</span>{/if}<ChevronRight size={16} strokeWidth={2.5} aria-hidden="true" /></a>
  </p>
{/if}

<style>
  .sourceline {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0 var(--sp-2);
    margin: 0;
    font-size: var(--fs-small);
    color: var(--ink-3);
  }
  .sourceline a {
    display: inline-flex;
    align-items: center;
    gap: 2px;
    min-height: 44px;
    color: var(--accent);
    font-weight: 600;
    text-decoration: underline;
    text-decoration-thickness: 1px;
    text-underline-offset: 3px;
  }
  .sourceline a:hover {
    text-decoration-thickness: 2px;
  }
  .sourceline a :global(svg) {
    color: var(--ink);
  }
  .stand {
    font-weight: 400;
    color: var(--ink-3);
  }
</style>
