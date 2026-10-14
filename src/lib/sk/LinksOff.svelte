<script>
  /**
   * SK: Ich › Darstellung «Links nach aussen»: the kinds of outside links you switched off
   * («Diesen Link nicht mehr zeigen», «Nicht mehr vorschlagen») come back here. Every link is a suggestion.
   */
  import { Eye } from '@lucide/svelte';
  import { LINKS } from './links.js';
  import { setLinkOff } from './store.js';
  import { skLinks, watchLinks } from './linkstore.svelte.js';
  import { t } from '../i18n.svelte.js';

  watchLinks();
  const off = $derived(skLinks.off.filter((k) => LINKS[k]));
  const ownN = $derived(Object.keys(skLinks.own).length);
</script>

<section aria-labelledby="look-links" data-sk-linksoff>
  <h2 id="look-links">{t('Links to other sites')}</h2>
  <p class="sk-note">{ownN ? t('{n} own links, only on this device', { n: ownN }) : t('Only links: the app sends nothing along')}</p>
  {#if off.length}
    <ul class="sk-offs">
      {#each off as k (k)}
        <li><span>{t(LINKS[k].label)}</span><button type="button" class="btn sk-act" onclick={() => setLinkOff(k, false)}><Eye size={16} aria-hidden="true" />{t('Show again')}</button></li>
      {/each}
    </ul>
  {:else}
    <p class="sk-none">{t('All links are shown.')}</p>
  {/if}
</section>

<style>
  h2 {
    margin: 0;
    font: 600 var(--fs-sub) / 1.3 var(--font-body);
  }
  .sk-note,
  .sk-none {
    margin: 2px 0 8px;
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .sk-offs {
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .sk-offs li {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    min-height: 52px;
    border-bottom: 1px solid var(--line);
  }
  .sk-act {
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }
</style>
