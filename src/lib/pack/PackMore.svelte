<script module>
  // which groups are open, per trip: kept outside the component, because Planen draws the page anew after each save
  const opened = $state({});
</script>

<script>
  /**
   * «Vereinfachen ohne Verlust» step 2 (Noah 07.11.2026 «1a 2a 3a 4b 5a»): the packing page shows the packing list
   * first; everything else a trip can have sits in five closed groups under «More about this trip». Nothing is
   * left out: each group is a real <details>, its content stays on the page, and the search, the map of the app
   * and the catalogue still lead to every function (tests/verlust.test.js, `versteckt` in tests/fixtures/funktionen.json).
   *
   * A group opens by itself when you come from a link that points into it (the shopping list, «Bike care» of the
   * day), and it hides itself when it has nothing to show. 'pg.packmore' = 'open' in localStorage opens all
   * groups (the browser tests set it, playwright.config.js, like 'pg.windows'); the real default is closed.
   * The five snippets come from CalmPack: weather, before, others, easier, learn.
   */
  import MoreFold from '../ui/MoreFold.svelte';
  import { t } from '../i18n.svelte.js';

  let { trip, jumpBefore = false, weather = null, before = null, others = null, easier = null, learn = null } = $props();

  const allOpen = (() => { try { return localStorage.getItem('pg.packmore') === 'open'; } catch { return false; } })();
  const wantsShop = (() => { try { return /^#\/pack\?(?:.*&)?(?:shop|charge)\b/.test(location.hash); } catch { return false; } })();
  const key = (k) => `${trip.id}:${k}`;
  // the first time a trip is drawn: closed, unless a link points into a group
  $effect.pre(() => {
    for (const [k, on] of [['weather', allOpen], ['before', allOpen || wantsShop || jumpBefore], ['others', allOpen], ['easier', allOpen], ['learn', allOpen]]) {
      if (opened[key(k)] === undefined) opened[key(k)] = on;
    }
  });
  // a link to «Bike care» of the trip (Heute, the push) opens its group at any time
  $effect(() => { if (jumpBefore) opened[key('before')] = true; });

  const groups = $derived([
    { k: 'weather', title: t('Weather and warnings'), sub: t('Plan B for bad weather'), body: weather },
    { k: 'before', title: t('Before and the evening before'), sub: t('Bike care, charging, papers, check-in, shopping list'), body: before },
    { k: 'others', title: t('With others'), sub: t('Packing for two'), body: others },
    { k: 'easier', title: t('Packing made easier'), sub: t('Start list by sport'), body: easier },
    { k: 'learn', title: t('Learn from it'), sub: t('Ballast, earlier tours, packing time'), body: learn },
  ].filter((g) => g.body));

  // a group with nothing in it is hidden (the content of a closed <details> is still in the page)
  function hideIfEmpty(node) {
    const body = () => node.querySelector('.mf-body');
    const check = () => { const b = body(); node.hidden = !!b && b.children.length === 0; };
    const mo = new MutationObserver(check);
    mo.observe(node, { childList: true, subtree: true });
    check();
    return { destroy: () => mo.disconnect() };
  }
</script>

{#if groups.length}
  <section class="pm" aria-labelledby="pm-h" data-pack-more>
    <h2 id="pm-h">{t('More about this trip')}</h2>
    {#each groups as g (g.k)}
      <div class="pmg" use:hideIfEmpty>
        <MoreFold title={g.title} sub={g.sub} id={g.k} bind:open={opened[key(g.k)]}>{@render g.body()}</MoreFold>
      </div>
    {/each}
  </section>
{/if}

<style>
  .pm { margin: 18px 0 8px; }
  h2 { margin: 0 0 8px; font: 600 var(--fs-h3, 1.05rem) / 1.3 var(--font-body); color: var(--ink-2, var(--ink)); }
</style>
