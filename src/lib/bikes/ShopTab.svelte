<script>
  /**
   * v0.48.0 «Werkstatt & Belege» (Noah 9a: no own filing page; everything for the workshop lives
   * under Bikes, and per bike in Care): what waits for the bike shop (open problems marked «Velomech»),
   * the visits by month with their receipt photo, the cost per year. A receipt filed in the Eingang
   * lands here as a visit; &visit=<id> opens it. Manuals are not built yet (docs/roadmap.md).
   */
  import { liveQuery } from 'dexie';
  import Empty from '../ui/Empty.svelte';
  import { db } from '../db.js';
  import { sortBikes, bikesHash } from '../bikes.js';
  import { visitTotal } from '../workshop.js';
  import VisitDialog from '../care/VisitDialog.svelte';
  import BikeQuickDialog from '../hubs/BikeQuickDialog.svelte';
  import { t, tn, locale } from '../i18n.svelte.js';
  import { ReceiptText, Wrench, ChevronRight, ClipboardList, ListChecks, Plus, Lightbulb, Image as ImageIcon } from '@lucide/svelte';
  import VeloHead from './VeloHead.svelte';
  import '../ui/daumen.css'; // FE1

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

<!-- Design-Refresh P7 (V13, Noah 12.10.2026 «v11-v14 freigegeben»): «‹ Velo › Pflege › Werkstatt & Belege»,
     the bikes as chips; left what waits for the bike shop and the visits with their receipts, right
     «+ Log a workshop visit» and the receipts. -->
<section class="shop">
  <VeloHead
    crumbs={[{ label: t('Bike'), href: bikesHash({ tab: 'setup', bike: pick }) }, { label: t('Care|tab'), href: bikesHash({ tab: 'care', bike: pick, open: !!pick }) }]}
    title={t('Workshop & receipts')}
    sub={`${tn(visits.length, '{n} visit', '{n} visits')}${yearCost ? ` · ${t('{year}: CHF {chf}', { year, chf: chf(yearCost) })}` : ''}`}
  />

  {#if bikes.length > 1}
    <div class="fchips" role="group" aria-label={t('Bike')}>
      <button type="button" class="fchip" aria-pressed={!pick} onclick={() => choose(null)}>{t('All bikes')}</button>
      {#each bikes as b (b.id)}<button type="button" class="fchip" aria-pressed={pick === b.id} onclick={() => choose(b.id)}>{b.name}</button>{/each}
    </div>
  {/if}

  <div class="scols">
    <div class="smain">
      <section class="ssec" aria-labelledby="forshop-h">
        <h2 id="forshop-h" class="sh">{t('For the bike shop')}</h2>
        {#if pick || orders.length}
          <ul class="card srows">
            {#if pick}
              <!-- v0.69.0 «Velo-Blätter» (V1 a): the order as a sheet before the visit, the check at the pick-up -->
              <li><a class="lrow" href={bikesHash({ tab: 'setup', bike: pick, sheet: 'order', from: 'shop' })}><span class="ic"><ClipboardList size={18} aria-hidden="true" /></span><span class="m"><span class="t">{t('Workshop order|sheet')}</span><span class="s">{names[pick]}</span></span><ChevronRight class="chev" size={18} aria-hidden="true" /></a></li>
              <li><a class="lrow" href={bikesHash({ tab: 'setup', bike: pick, sheet: 'pickup', from: 'shop' })}><span class="ic"><ListChecks size={18} aria-hidden="true" /></span><span class="m"><span class="t">{t('Pick-up check')}</span><span class="s">{names[pick]}</span></span><ChevronRight class="chev" size={18} aria-hidden="true" /></a></li>
            {/if}
            {#each orders as o (o.id)}
              <li><a class="lrow" href={bikesHash({ tab: 'care', bike: o.bikeId, open: true })}><span class="ic"><Wrench size={18} aria-hidden="true" /></span><span class="m"><span class="t">{o.task}</span><span class="s">{names[o.bikeId] ?? ''}</span></span><ChevronRight class="chev" size={18} aria-hidden="true" /></a></li>
            {/each}
          </ul>
        {/if}
        {#if !orders.length}<p class="quiet">{t('Nothing waits for the bike shop. A problem marked «bike shop» in Care shows here.')}</p>{/if}
      </section>

      <section class="ssec" aria-labelledby="visits-h">
        <h2 id="visits-h" class="sh">{t('Visits and receipts')}</h2>
        {#if !visits.length}
          <Empty icon={ReceiptText} text={t('No visit yet. A photo of a receipt in the Inbox becomes one with «File as … Receipt».')} />
        {:else}
          <ul class="card srows">
            {#each months as m (m.key)}
              <li class="mon">{monthName(m.key)}</li>
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
            {/each}
          </ul>
        {/if}
      </section>
    </div>

    <aside class="sside">
      <!-- FE1: on a phone «Log a workshop visit» sits at the bottom, in reach of the thumb -->
      <span class="daumen"><button type="button" class="btn hi addv" onclick={() => (adding = true)}><Plus size={16} aria-hidden="true" />{t('Log a workshop visit')}</button></span>
      {#if visits.length}
        <section class="ssec" aria-labelledby="rc-h">
          <h2 id="rc-h" class="sh">{t('Receipts')}</h2>
          <ul class="card srows">
            <li><span class="lrow still"><span class="ic"><ImageIcon size={18} aria-hidden="true" /></span><span class="m"><span class="t">{t('Receipts with a photo')}</span></span><span class="v">{t('{n} of {all}', { n: visits.filter((v) => v.photos?.length).length, all: visits.length })}</span></span></li>
          </ul>
        </section>
      {/if}
      <p class="tip"><Lightbulb size={16} aria-hidden="true" />{t('A photo of a receipt in the Inbox becomes a visit with «File as … Receipt».')}</p>
    </aside>
  </div>
</section>
{#if shown}
  <VisitDialog visit={shown} bike={bikes.find((b) => b.id === shown.bikeId)} onclose={() => (open = null)} />
{/if}
{#if adding}
  <BikeQuickDialog kind="visit" {bikes} bikeId={pick ?? bikes[0]?.id ?? null} onclose={() => (adding = false)} />
{/if}

<style>
  .shop {
    min-width: 0;
  }
  .scols,
  .smain,
  .sside {
    min-width: 0;
  }
  @media (min-width: 1000px) {
    .scols {
      display: grid;
      grid-template-columns: minmax(0, 3fr) minmax(0, 2fr);
      gap: 24px;
      align-items: start;
    }
  }
  .ssec {
    margin: 0 0 24px;
  }
  .sh {
    margin: 0 2px 10px;
    font: 600 var(--fs-sub) / 1.25 var(--font-body);
  }
  .srows {
    list-style: none;
    margin: 0;
    padding: 4px 16px;
  }
  .srows > li + li {
    border-top: 1px solid var(--line);
  }
  .srows .lrow {
    width: 100%;
    padding: 8px 0;
  }
  .srows .mon {
    padding: 12px 0 2px;
    color: var(--ink-3);
    font: 600 var(--fs-tiny) / 1.3 var(--font-body);
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }
  .srows .mon + li {
    border-top: 0;
  }
  .fchips {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin: 0 0 20px;
  }
  .fchip {
    min-height: 44px;
    padding: 0 16px;
    border: 1px solid var(--line-strong);
    border-radius: 999px;
    background: var(--paper);
    color: var(--ink);
    font: 500 var(--fs-small) var(--font-body);
    cursor: pointer;
  }
  .fchip:hover {
    background: var(--paper-2);
  }
  .fchip[aria-pressed='true'] {
    border-color: var(--ink);
    background: var(--ink);
    color: var(--paper);
  }
  .addv {
    margin: 0 0 20px;
  }
  .quiet {
    margin: 4px 2px 8px;
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .tip {
    display: flex;
    align-items: flex-start;
    gap: 8px;
    margin: 0 2px;
    color: var(--ink-2);
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
