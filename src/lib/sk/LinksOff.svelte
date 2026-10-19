<script>
  /**
   * SK: Ich › Darstellung «Links nach aussen»: the kinds of outside links you switched off
   * («Diesen Link nicht mehr zeigen», «Nicht mehr vorschlagen») come back here. Every link is a suggestion.
   * Impeccable Runde 2: the section shows only while at least one link is switched off («2 links switched off»
   * › «Switch on again»); with all links shown there is nothing to do here.
   */
  import { Eye } from '@lucide/svelte';
  import { LINKS } from './links.js';
  import { setLinkOff } from './store.js';
  import { skLinks, watchLinks } from './linkstore.svelte.js';
  import { t, tn } from '../i18n.svelte.js';

  watchLinks();
  const off = $derived(skLinks.off.filter((k) => LINKS[k]));
</script>

{#if off.length}
<section aria-labelledby="look-links" data-sk-linksoff>
  <h2 id="look-links">{t('Links to other sites')}</h2>
  <p class="sk-note">{tn(off.length, '{n} link switched off', '{n} links switched off')}</p>
  <ul class="sk-offs">
    {#each off as k (k)}
      <li><span>{t(LINKS[k].label)}</span><button type="button" class="btn sk-act" onclick={() => setLinkOff(k, false)}><Eye size={16} aria-hidden="true" />{t('Switch on again')}</button></li>
    {/each}
  </ul>
</section>
{/if}

<style>
  h2 {
    margin: 0;
    font: 600 var(--fs-sub) / 1.3 var(--font-body);
  }
  .sk-note {
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
