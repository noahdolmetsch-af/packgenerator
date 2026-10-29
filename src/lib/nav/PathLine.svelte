<script>
  /**
   * «Pfad auf jeder Seite» (Noah 28.10.2026 «1a»): a quiet line above the page, «Plan › Week › Title»,
   * built from the place and tab the app already knows (the same names as «Anpassen»), plus the page's own
   * title once it is drawn. Pages that draw their own path (PathHead, Crumbs, VeloHead, a trip band) keep it:
   * this line stays away when `main` holds one. Switch in Ich › Darstellung › Bedienung (ops.path).
   */
  import { ChevronRight } from '@lucide/svelte';
  import { t } from '../i18n.svelte.js';
  import { ALL_PLACES, PLACE_TABS, tabOf } from '../nav.js';
  import { placeLabel, tabLabel } from '../anpassen.svelte.js';

  let { place, hash } = $props();

  const steps = $derived.by(() => {
    const p = ALL_PLACES.find((x) => x.key === place);
    if (!p) return [];
    const out = [{ label: placeLabel(p), href: p.href }];
    const tab = (PLACE_TABS[place] ?? []).find((x) => x.key === tabOf(place, hash));
    if (tab) out.push({ label: tabLabel(place, tab), href: tab.href });
    return out;
  });

  // the title the page draws itself (the pages load later, so watch until it is there)
  let title = $state('');
  // a page that draws its own path (PathHead, Crumbs, VeloHead, a trip band) keeps it: no second line
  let own = $state(false);
  $effect(() => {
    void hash;
    title = '';
    own = false;
    const main = document.querySelector('main');
    if (!main) return;
    const read = () => {
      const h = main.querySelector('[data-page-title], h1');
      title = h?.textContent?.trim() ?? '';
      own = !!main.querySelector('nav.pcrumbs, nav.crumbs, nav.crumb');
    };
    read();
    const mo = new MutationObserver(read);
    mo.observe(main, { childList: true, subtree: true, characterData: true });
    return () => mo.disconnect();
  });

  const last = $derived(title && title !== steps.at(-1)?.label ? title : '');
</script>

{#if !own && steps.length && (steps.length > 1 || last)}
  <nav class="pathline" aria-label={t('Where you are')} data-pathline>
    {#each steps as s, n (n)}
      {#if n > 0}<ChevronRight class="sep" size={12} aria-hidden="true" />{/if}
      {#if n === steps.length - 1 && !last}<span aria-current="page">{s.label}</span>{:else}<a href={s.href}>{s.label}</a>{/if}
    {/each}
    {#if last}<ChevronRight class="sep" size={12} aria-hidden="true" /><span aria-current="page">{last}</span>{/if}
  </nav>
{/if}

<style>
  .pathline {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0 2px;
    margin: 0 0 var(--sp-2, 8px);
    font-size: var(--fs-small);
    color: var(--ink-3);
    min-width: 0;
  }
  .pathline a {
    position: relative;
    display: inline-flex;
    align-items: center;
    min-width: 44px; /* a short word («Alles») still gets a full tap target */
    color: var(--ink-3);
    text-decoration: none;
  }
  .pathline a:visited {
    color: var(--ink-3);
  }
  .pathline a:hover {
    color: var(--ink);
    text-decoration: underline;
    text-underline-offset: 3px;
  }
  /* 44 px tap area around the small words, without moving the layout */
  .pathline a::after {
    content: '';
    position: absolute;
    left: -4px;
    right: -4px;
    top: 50%;
    height: 44px;
    transform: translateY(-50%);
  }
  .pathline :global(.sep) {
    color: var(--ink-3);
  }
  .pathline span {
    min-width: 0;
    overflow-wrap: break-word;
  }
</style>
