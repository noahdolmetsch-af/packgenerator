<script>
  /*
   * «Mit Claude besprechen» (Noah 19.10.2026 «1a»): on Packliste, Velo-Pflege and Rückblick one link opens
   * claude.ai with a question about this page, through your own Claude subscription (nothing is paid by
   * the app). The tick «Send what this page shows along» is off each time (Noah «2a»); only with it the
   * page's content (`lines`, a few short lines) goes along. `ask`: the question, already in the app's
   * language.
   */
  import { MessageCircle } from '@lucide/svelte';
  import { t } from '../i18n.svelte.js';
  import { claudeUrl } from './elsewhere.js';
  import LocalAsk from '../localai/LocalAsk.svelte'; // «KI im Gerät» (Noah 20.10.2026 «5b»)

  let { ask = '', lines = [], name = '' } = $props();
  let withPage = $state(false);
  const clean = $derived(lines.filter(Boolean));
  const href = $derived(claudeUrl(ask, withPage ? clean : []));
</script>

{#if ask}
  <div class="acl" data-ask-claude={name}>
    <a class="btn sm acl-go" {href} target="_blank" rel="noopener noreferrer"><MessageCircle size={16} aria-hidden="true" />{t('Talk it through with Claude')}</a>
    <label class="acl-tick"><input type="checkbox" bind:checked={withPage} data-ask-claude-page />{t('Send what this page shows along ({n} lines)', { n: clean.length })}</label>
    <p class="acl-note">{t('Opens claude.ai with your own subscription. The answer comes there.')}</p>
    <div class="acl-local"><LocalAsk q={ask} lines={clean} online={withPage ? clean : []} {name} /></div>
  </div>
{/if}

<style>
  .acl {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 6px 12px;
    margin: 12px 0;
  }
  .acl-go {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    text-decoration: none;
  }
  .acl-tick {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: var(--fs-small);
    color: var(--ink-2);
  }
  .acl-local {
    flex: 1 1 100%;
  }
  .acl-note {
    flex: 1 1 100%;
    margin: 0;
    font-size: var(--fs-small);
    color: var(--ink-3);
  }
</style>
