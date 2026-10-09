<script>
  /**
   * v0.48.0 «Werkstatt & Belege» (Noah 9a: no own filing page; everything for the workshop lives
   * under Bikes, and per bike in Care): what waits for the bike shop (open problems marked «Velomech»),
   * the visits by month with their receipt photo, the cost per year. A receipt filed in the Eingang
   * lands here as a visit; &visit=<id> opens it. Manuals are not built yet (docs/roadmap.md).
   */
  import { liveQuery } from 'dexie';
  import { db } from '../db.js';
  import { sortBikes, bikesHash } from '../bikes.js';
  import { visitTotal } from '../workshop.js';
  import VisitDialog from '../care/VisitDialog.svelte';
  import BikeQuickDialog from '../hubs/BikeQuickDialog.svelte';
  import { t, tn, locale } from '../i18n.svelte.js';
  import { ReceiptText, Wrench, ChevronRight } from '@lucide/svelte';

  let { bikeId = null, visitId = null, onbike } = $props();

  const bikesQ = liveQuery(() => db.bikes.toArray());
  const visitsQ = liveQuery(() => db.visits.toArray());
  const tasksQ = liveQuery(() => db.maintenance.toArray());

  const bikes = $derived(sortBikes($bikesQ ?? []));
  const names = $derived(Object.fromEntries(bikes.map((b) => [b.id, b.name])));
  const pick = $derived(bikeId && names[bikeId] ? bikeId : null);
  const visits = $derived(($visitsQ ?? []).filter((v) => !pick || v.bikeId === pick).sort((a, b) => (b.date ?? '').localeCompare(a.date ?? '')));
  const orders = $derived(($tasksQ ?? []).filter((x) => x.area === 'Bike' && x.fix === 'shop' && !['done', 'gone'].includes(x.status) && (!pick || x.bikeId === pick)));
  const months = $derived.by(() => {
    const by = new Map();
    for (const v of visits) {
      const k = (v.date ?? '').slice(0, 7);
      if (!by.has(k)) by.set(k, []);
      by.get(k).push(v);
    }
    return [...by].map(([key, rows]) => ({ key, rows }));
  });
  const year = new Date().getFullYear();
  const yearCost = $derived(visits.filter((v) => (v.date ?? '').startsWith(String(year))).reduce((s, v) => s + (visitTotal(v) ?? 0), 0));

  // svelte-ignore state_referenced_locally
  let open = $state(visitId);
  let adding = $state(false);
  const shown = $derived(($visitsQ ?? []).find((v) => v.id === open) ?? null);

  const monthName = (k) => (k ? new Date(`${k}-15T12:00:00`).toLocaleDateString(locale(), { month: 'long', year: 'numeric' }) : t('No date'));
  const dayName = (d) => (d ? new Date(`${d}T12:00:00`).toLocaleDateString(locale(), { weekday: 'short', day: 'numeric', month: 'short' }) : '');
  const chf = (n) => (n == null ? '' : n.toLocaleString('de-CH', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
  const choose = (id) => {
    onbike?.(id);
    history.replaceState(null, '', bikesHash({ tab: 'shop', bike: id }));
  };
</script>

<section class="shop" aria-labelledby="shop-h">
  <div class="top">
    <div>
      <h2 id="shop-h" class="title">{t('Workshop & receipts')}</h2>
      <p class="page-sub">{tn(visits.length, '{n} visit', '{n} visits')}{yearCost ? ` · ${t('{year}: CHF {chf}', { year, chf: chf(yearCost) })}` : ''}</p>
    </div>
    <button type="button" class="btn hi" onclick={() => (adding = true)}>+ {t('Log a workshop visit')}</button>
  </div>

  {#if bikes.length > 1}
    <div class="fchips" role="group" aria-label={t('Bike')}>
      <button type="button" class="fchip" aria-pressed={!pick} onclick={() => choose(null)}>{t('All bikes')}</button>
      {#each bikes as b (b.id)}<button type="button" class="fchip" aria-pressed={pick === b.id} onclick={() => choose(b.id)}>{b.name}</button>{/each}
    </div>
  {/if}

  <h3 class="zlabel">{t('For the bike shop')}</h3>
  {#if orders.length}
    <ul class="rowlist">
      {#each orders as o (o.id)}
        <li><a class="lrow" href={bikesHash({ tab: 'care', bike: o.bikeId, open: true })}><span class="ic"><Wrench size={18} aria-hidden="true" /></span><span class="m"><span class="t">{o.task}</span><span class="s">{names[o.bikeId] ?? ''}</span></span><ChevronRight class="chev" size={18} aria-hidden="true" /></a></li>
      {/each}
    </ul>
  {:else}
    <p class="quiet">{t('Nothing waits for the bike shop. A problem marked «bike shop» in Care shows here.')}</p>
  {/if}

  <h3 class="zlabel">{t('Visits and receipts')}</h3>
  {#if !visits.length}
    <p class="quiet">{t('No visit yet. A photo of a receipt in the Inbox becomes one with «File as … Receipt».')}</p>
  {/if}
  {#each months as m (m.key)}
    <p class="mon">{monthName(m.key)}</p>
    <ul class="rowlist">
      {#each m.rows as v (v.id)}
        <li>
          <button type="button" class="lrow" data-visit-id={v.id} onclick={() => (open = v.id)}>
            {#if v.photos?.[0]}<img class="rc" src={v.photos[0]} alt="" loading="lazy" />{:else}<span class="ic"><ReceiptText size={18} aria-hidden="true" /></span>{/if}
            <span class="m"><span class="t">{v.shop || t('Workshop')}</span><span class="s">{dayName(v.date)}{pick ? '' : ` · ${names[v.bikeId] ?? ''}`}{v.km != null ? ` · ${v.km.toLocaleString('de-CH')} km` : ''}{(v.parts ?? []).length ? ` · ${tn(v.parts.length, '{n} job', '{n} jobs')}` : ''}</span></span>
            <span class="v">{visitTotal(v) == null ? '' : chf(visitTotal(v))}</span>
            <ChevronRight class="chev" size={18} aria-hidden="true" />
          </button>
        </li>
      {/each}
    </ul>
  {/each}
</section>

{#if shown}
  <VisitDialog visit={shown} bike={bikes.find((b) => b.id === shown.bikeId)} onclose={() => (open = null)} />
{/if}
{#if adding}
  <BikeQuickDialog kind="visit" {bikes} bikeId={pick ?? bikes[0]?.id ?? null} onclose={() => (adding = false)} />
{/if}

<style>
  .shop {
    max-width: 880px;
  }
  .top {
    display: flex;
    flex-wrap: wrap;
    align-items: flex-start;
    justify-content: space-between;
    gap: 8px 16px;
  }
  .top .title {
    margin: 0;
    font-size: var(--fs-section);
  }
  .fchips {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin: 4px 0 6px;
  }
  .fchip {
    min-height: 44px;
    padding: 4px 14px;
    border: 1.5px solid var(--line);
    border-radius: 999px;
    background: var(--paper);
    color: var(--ink);
    font: 500 var(--fs-small) var(--font-body);
    cursor: pointer;
  }
  .fchip[aria-pressed='true'] {
    border-color: var(--hi);
    background: var(--hi-soft);
  }
  .quiet {
    margin: 4px 0 8px;
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .mon {
    margin: 10px 0 4px;
    color: var(--ink-2);
    font-weight: 600;
    font-size: var(--fs-small);
  }
  .rc {
    flex: none;
    width: 34px;
    height: 44px;
    object-fit: cover;
    border-radius: 4px;
    border: 1px solid var(--line);
  }
</style>
