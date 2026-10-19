<script>
  /**
   * Paket V «Alltag» (Noah 19.10.2026 «3a oder b 4a 5a»): Ich › Alltag (#/me/alltag) with the shopping
   * list, contracts and subscriptions (also from Ich › Dokumente) and «Not seen for a while». Each page
   * loads on its first visit (LazyPage). Everything is a suggestion: switch it off, change or delete it.
   */
  import { ChevronRight, ShoppingCart, FileText, Users } from '@lucide/svelte';
  import Crumb from '../lib/flow/kit/Crumb.svelte';
  import LazyPage from '../lib/nav/LazyPage.svelte';
  import { PARTS, alltagPart, ALLTAG_HASH } from '../lib/alltag.js';
  import { syncReminders } from '../lib/alltagdb.js';
  import { t } from '../lib/i18n.svelte.js';
  import '../lib/frei/frei.css';

  let { hash = '' } = $props();
  const LOAD = {
    einkauf: () => import('../lib/alltag/Einkauf.svelte'),
    abos: () => import('../lib/alltag/Abos.svelte'),
    menschen: () => import('../lib/alltag/Menschen.svelte'),
  };
  const ICONS = { cart: ShoppingCart, file: FileText, people: Users };
  const part = $derived(alltagPart(hash));
  // contracts roll on to their next term: the to-dos in Merken follow on each visit (no write when nothing changed)
  syncReminders().catch(() => {});
</script>

{#if part}
  {#key part}<LazyPage load={LOAD[part]} {hash} />{/key}
{:else}
  <div class="fz" data-page="alltag">
    <Crumb path={[{ href: '#/me', label: t('Me|place') }]} here={t('Everyday life')} />
    <h1 class="fz-h1" tabindex="-1" data-page-title>{t('Everyday life')}</h1>
    <p class="fz-intro">{t('Small helpers for the days at home: what to buy, what runs and when to cancel it, and who you have not seen for a while.')}</p>
    <ul class="fz-box fz-list" aria-label={t('Everyday life')}>
      {#each PARTS as p (p.key)}
        {@const Icon = ICONS[p.icon]}
        <li>
          <a class="fz-row" href="{ALLTAG_HASH}/{p.key}" data-alltag-page={p.key}>
            <span class="fz-icon" aria-hidden="true"><Icon size={20} /></span>
            <span class="fz-row-main"><b>{t(p.title)}</b><small>{t(p.sub)}</small></span>
            <ChevronRight size={18} aria-hidden="true" />
          </a>
        </li>
      {/each}
    </ul>
  </div>
{/if}

<style>
  a.fz-row {
    color: var(--ink);
    text-decoration: none;
  }
</style>
