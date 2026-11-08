<script>
  /**
   * v0.105.0 Design-Refresh P8 «Aktiv»: the path above the title of an Aktiv page, «‹ Aktiv › Ziele»:
   * the places above as links, the page itself last (not a link). On a phone only the place one step up
   * («‹ Meditation»), so the line stays short. path: [{ href, label }], here: this page's name.
   */
  import { ChevronLeft, ChevronRight } from '@lucide/svelte';
  import { phone } from '../../media.svelte.js';
  import { t } from '../../i18n.svelte.js';

  let { path = [], here = '', back = null } = $props(); // back: { href, label } = «‹ Back to Heute», the page you came from (UI-Prüfung A2)
  const shown = $derived(phone.matches ? path.slice(-1) : path);
</script>

<nav class="crumb" aria-label={t('Where you are')}>
  {#if back}<a class="back" href={back.href} data-crumb-back><ChevronLeft size={16} aria-hidden="true" />{t('Back to {place}', { place: back.label })}</a>{#if shown.length}<span class="sep" aria-hidden="true">·</span>{/if}{/if}
  {#each shown as p, i (p.href)}
    {#if i > 0}<ChevronRight size={14} aria-hidden="true" />{/if}
    <a class:first={i === 0 && !back} href={p.href}>{#if i === 0 && !back}<ChevronLeft size={16} aria-hidden="true" />{/if}{p.label}</a>
  {/each}
  {#if here && !phone.matches}<ChevronRight size={14} aria-hidden="true" /><span class="here" aria-current="page">{here}</span>{/if}
</nav>

<style>
  .crumb {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0 4px;
    margin: 0 0 2px;
    color: var(--ink-3);
    font: 400 var(--fs-small) / 1.3 var(--font-body);
  }
  a {
    display: inline-flex;
    align-items: center;
    min-height: 44px;
    color: var(--ink-3);
    text-decoration: none;
  }
  a.first {
    min-width: 44px;
  }
  a:hover {
    color: var(--ink);
  }
  .back {
    color: var(--ink);
    font-weight: 600;
  }
  .sep {
    margin: 0 4px;
  }
  .here {
    color: var(--ink);
  }
</style>
