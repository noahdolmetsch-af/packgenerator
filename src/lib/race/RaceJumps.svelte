<script>
  /**
   * «Rennen sichtbar» (Noah 25.10.2026 «bitte fortfahren»): a race part is a long page of boxes (RaceBox). Right under
   * the tabs, the boxes of this part as one row of chips («Auf dieser Seite»); a chip scrolls to its box. The names
   * are the boxes' own titles, read from the page, so a box that is off or hidden has no chip.
   */
  import QuickLinks from '../ui/QuickLinks.svelte';
  import { t } from '../i18n.svelte.js';

  let { part = '' } = $props();
  let links = $state([]);
  $effect(() => {
    void part;
    const look = () => {
      const next = [...document.querySelectorAll('[data-race-box]:not([data-race-hidden])')]
        .map((el) => ({ key: el.dataset.raceBox, label: el.querySelector('.rc-h2')?.textContent?.trim() ?? '', jump: `[data-race-box="${el.dataset.raceBox}"]` }))
        .filter((x) => x.label);
      if (next.map((x) => x.key + x.label).join() !== links.map((x) => x.key + x.label).join()) links = next;
    };
    look();
    let raf = 0;
    const obs = new MutationObserver(() => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(look);
    });
    obs.observe(document.querySelector('main') ?? document.body, { childList: true, subtree: true });
    return () => {
      obs.disconnect();
      cancelAnimationFrame(raf);
    };
  });
</script>

{#if links.length > 1}<QuickLinks label={t('On this page')} {links} />{/if}
