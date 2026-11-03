<script>
  /**
   * «Was die App noch wissen sollte» (idea D3 «App denkt mit», Noah 02.11.2026 «3b»): on Me › Alerts and news.
   * The few things the app does not know yet and what each is for, with one link to where you fill it in.
   * Everything is optional; a filled-in thing is gone from the list. Nothing is changed here.
   */
  import { liveQuery } from 'dexie';
  import { CircleHelp, ChevronRight, Check } from '@lucide/svelte';
  import { db } from '../db.js';
  import { t, tn } from '../i18n.svelte.js';
  import { needsToKnow } from '../needs.js';

  const homeQ = liveQuery(() => db.settings.get('homePlace'));
  const bikesQ = liveQuery(() => db.bikes.toArray());
  const itemsQ = liveQuery(() => db.items.toArray());
  const list = $derived(needsToKnow({ homePlace: $homeQ?.value ?? null, bikes: $bikesQ ?? [], items: $itemsQ ?? [] }));
  const WORDS = {
    home: () => [t('Your home place'), t('Then Today shows the weather and ride tips for where you live.')],
    bikeweight: (n) => [tn(n, '{n} bike without a weight', '{n} bikes without a weight'), t('Then the bike comparison can tell which bike is lighter for a trip.')],
    partstart: (n) => [tn(n, '{n} wear part without a start point', '{n} wear parts without a start point'), t('Then the wear forecast can say how many km are left.')],
    gearweight: (n) => [tn(n, '{n} item without a weight', '{n} items without a weight'), t('Then the packing list can show what a trip weighs.')],
  };
</script>

<section class="card nd" aria-labelledby="nd-h" data-needs>
  <h2 id="nd-h"><CircleHelp size={18} aria-hidden="true" />{t('What the app still needs to know')}</h2>
  {#if list.length}
    <p class="quiet">{t('Only if you want: each one makes a function work better.')}</p>
    <ul>
      {#each list as x (x.key)}
        {@const w = WORDS[x.key](x.n)}
        <li data-need={x.key}><a href={x.href}><span><b>{w[0]}</b><small>{w[1]}</small></span><ChevronRight size={18} aria-hidden="true" /></a></li>
      {/each}
    </ul>
  {:else}
    <p class="quiet" data-needs-none><Check size={14} aria-hidden="true" /> {t('Nothing open: the app knows what it needs.')}</p>
  {/if}
</section>

<style>
  .nd {
    margin: 0 0 14px;
    padding: 14px 16px;
  }
  h2 {
    display: flex;
    align-items: center;
    gap: 8px;
    margin: 0 0 6px;
    font-size: var(--fs-section);
  }
  .quiet {
    color: var(--ink-2);
    font-size: var(--fs-small);
    margin: 0 0 8px;
  }
  ul {
    list-style: none;
    margin: 0;
    padding: 0;
  }
  li {
    border-top: 1px solid var(--line);
  }
  li:first-child {
    border-top: 0;
  }
  a {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    min-height: 44px;
    padding: 8px 0;
    color: inherit;
    text-decoration: none;
  }
  small {
    display: block;
    color: var(--ink-2);
  }
</style>
