<script>
  /**
   * «Sporttasche» (mockup AK3, Noah 13.10.2026 «4a»): on Heute, the evening before a fixed date (from
   * 17:00), «Morgen Yoga 07:00: Tasche packen», one row per bag not yet packed; a tap opens the bag.
   * Switched off under Aktiv › Sporttasche (flow.bagRemind). The rules are in lib/flowbag.js.
   */
  import { liveQuery } from 'dexie';
  import { ShoppingBag, ChevronRight } from '@lucide/svelte';
  import { db } from '../db.js';
  import { BAGS_KEY, PACK_KEY, REMIND_KEY, bagsOf, packsOf, reminders } from '../flowbag.js';
  import { FIXED_KEY, fixedList } from '../flowweek.js';
  import { bagName } from '../flow/bagwords.js';
  import { t } from '../i18n.svelte.js';

  let { today, now = Date.now() } = $props();
  const q = liveQuery(async () => {
    const [b, p, r, f] = await Promise.all([db.settings.get(BAGS_KEY), db.settings.get(PACK_KEY), db.settings.get(REMIND_KEY), db.settings.get(FIXED_KEY)]);
    return { bags: bagsOf(b?.value), packs: packsOf(p?.value), on: r?.value !== false, fixed: fixedList(f?.value) };
  });
  const rows = $derived($q ? reminders({ ...$q, today, now }) : []);
</script>

{#if rows.length}
  <div class="bagr" data-section="bag-reminder">
    {#each rows as r (r.bag.id)}
      <a class="row" href="#/flow/bags?b={encodeURIComponent(r.bag.id)}" data-bag-reminder={r.bag.id}>
        <ShoppingBag size={20} aria-hidden="true" />
        <span class="tx"><b>{t('Tomorrow {name} {time}: pack the bag', { name: bagName(r.bag), time: r.time })}</b><small>{t('{n} of {m} in the bag', { n: r.n, m: r.of })}</small></span>
        <ChevronRight size={18} aria-hidden="true" />
      </a>
    {/each}
  </div>
{/if}

<style>
  /* the look of «Weitermachen» (Continue.svelte) */
  .bagr {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    gap: 8px;
    margin: 0 0 14px;
  }
  .row {
    display: flex;
    align-items: center;
    gap: 12px;
    min-height: 56px;
    padding: 8px 14px;
    border: 1px solid var(--hi-soft);
    border-radius: var(--radius-card);
    background: var(--hi-soft);
    color: var(--ink);
    text-decoration: none;
  }
  .row :global(svg) {
    flex: none;
    color: var(--ink-3);
  }
  .tx {
    display: grid;
    flex: 1;
    min-width: 0;
    gap: 2px;
    overflow-wrap: break-word;
  }
  b {
    font-size: var(--fs-body);
    font-weight: 600;
  }
  small {
    font-size: var(--fs-small);
    color: var(--ink-2);
  }
</style>
