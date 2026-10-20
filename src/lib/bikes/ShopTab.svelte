<script>
  /**
   * v0.48.0 «Werkstatt & Belege» (Noah 9a: no own filing page; everything for the workshop lives
   * under Bikes, and per bike in Care): the order for the bike shop (the same as in Care, care/orders.js),
   * the visits by month with their receipt photo, the cost per year. A receipt filed in the Eingang
   * lands here as a visit; &visit=<id> opens it. Manuals are not built yet (docs/roadmap.md).
   */
  import HintCard from '../pageinfo/HintCard.svelte';
  import PageMore from '../pageinfo/PageMore.svelte';
  import TipLine from '../pageinfo/TipLine.svelte';
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
  import OrderDialog from '../care/OrderDialog.svelte';
  import BikeChips from './BikeChips.svelte';
  // Impeccable Runde 2 (18.10.2026, Werkstatt 1-3): the same «Auftrag für den Velomech» as in Care,
  // amounts written one way, the year's sum of the chosen bike in the head line.
  import { shopOrders } from '../care/orders.js';
  import { chfText } from '../money.js';
  import { localDay } from '../localday.js';
  import { phone } from '../media.svelte.js';
  import { PHONE_ROWS } from '../touren/kurz.js';
  import { ChevronDown } from '@lucide/svelte';
  import '../ui/daumen.css'; // FE1

  let { bikeId = null, visitId = null, onbike } = $props();

  const bikesQ = liveQuery(() => db.bikes.toArray());
  const visitsQ = liveQuery(() => db.visits.toArray());
  const tasksQ = liveQuery(() => db.maintenance.toArray());
  const tripsQ = liveQuery(() => db.trips.toArray());

  const bikes = $derived(sortBikes($bikesQ ?? []));
  const names = $derived(Object.fromEntries(bikes.map((b) => [b.id, b.name])));
  const pick = $derived(bikeId && names[bikeId] ? bikeId : null);
  const visits = $derived(($visitsQ ?? []).filter((v) => !pick || v.bikeId === pick).sort((a, b) => (b.date ?? '').localeCompare(a.date ?? '')));
  const today = localDay();
  const allOrders = $derived(shopOrders(bikes, $tripsQ ?? [], $tasksQ ?? [], $visitsQ ?? [], today));
  const orders = $derived(allOrders.filter((c) => !pick || c.bike.id === pick));
  let orderOpen = $state(null); // bike id
  const shownOrder = $derived(allOrders.find((c) => c.bike.id === orderOpen) ?? null);
  // «Handy kürzer» (Noah 20.10.2026 «4b»): on a phone the newest PHONE_ROWS visits, then «Show n more»
  let visitsAll = $state(false);
  const visitsShown = $derived(phone.matches && !visitsAll ? visits.slice(0, PHONE_ROWS) : visits);
  const months = $derived.by(() => {
    const by = new Map();
    for (const v of visitsShown) {
      const k = (v.date ?? '').slice(0, 7);
      if (!by.has(k)) by.set(k, []);
      by.get(k).push(v);
    }
    return [...by].map(([key, rows]) => ({ key, rows }));
  });
  const year = today.slice(0, 4);
  const yearCost = $derived(visits.filter((v) => (v.date ?? '').startsWith(String(year))).reduce((s, v) => s + (visitTotal(v) ?? 0), 0));

  // svelte-ignore state_referenced_locally
  let open = $state(visitId);
  let adding = $state(false);
  const shown = $derived(($visitsQ ?? []).find((v) => v.id === open) ?? null);

  const monthName = (k) => (k ? new Date(`${k}-15T12:00:00`).toLocaleDateString(locale(), { month: 'long', year: 'numeric' }) : t('No date'));
  const dayName = (d) => (d ? new Date(`${d}T12:00:00`).toLocaleDateString(locale(), { weekday: 'short', day: 'numeric', month: 'short' }) : '');
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
    sub={`${tn(visits.length, '{n} visit', '{n} visits')}${yearCost ? ` · ${pick ? t('{year}: {chf} for {bike}', { year, chf: chfText(yearCost), bike: names[pick] }) : t('{year}: {chf}|cost', { year, chf: chfText(yearCost) })}` : ''}`}
  />
  <!-- «Mehr Inhalt» (Noah 15.10.2026, 1a–5a): the card, at the end the fold; the Einstieg carries the tip of
    the day (as on Aktiv), the tip line only when the Einstieg is taken away -->
  <!-- Noah 19.10 «2a»: one card per page; the Einstieg lives in the card «Was hier steht» (its own card only while the page is empty) -->
  <HintCard page="workshop" intro="workshop" />

  <!-- Impeccable Runde 2 (Ausstattung 2): the same bike choice as on every Velo page, one row to swipe on a phone -->
  {#if bikes.length > 1}<BikeChips {bikes} current={pick} all={t('All bikes')} onpick={choose} />{/if}

  <div class="scols">
    <div class="smain">
      <section class="ssec" aria-labelledby="forshop-h">
        <div class="shead">
          <h2 id="forshop-h" class="sh">{t('Order for the bike shop')}</h2>
          {#if orders.length}<button type="button" class="sh-a" onclick={() => (orderOpen = orders[0].bike.id)}>{t('Share the order')}<ChevronRight size={16} aria-hidden="true" /></button>{/if}
        </div>
        {#if orders.length}
          <ul class="card srows">
            {#each orders as c (c.bike.id)}
              <li>
                <button type="button" class="lrow" onclick={() => (orderOpen = c.bike.id)}>
                  <span class="ic"><Wrench size={18} aria-hidden="true" /></span>
                  <span class="m"><span class="t">{t('Order for {bike}', { bike: c.bike.name })}</span><span class="s">{c.order.rows.slice(0, 3).map((r) => r.name).join(', ')}{c.order.rows.length > 3 ? ` + ${c.order.rows.length - 3}` : ''}</span></span>
                  <ChevronRight class="chev" size={18} aria-hidden="true" />
                </button>
              </li>
            {/each}
          </ul>
        {:else}
          <p class="quiet">{t('No order for the bike shop right now. Due work and problems marked «bike shop» come here by themselves.')}</p>
        {/if}
        {#if pick}
          <!-- v0.69.0 «Velo-Blätter» (V1 a): the order as a sheet before the visit, the check at the pick-up -->
          <ul class="card srows sheets">
            <li><a class="lrow" href={bikesHash({ tab: 'setup', bike: pick, sheet: 'order', from: 'shop' })}><span class="ic"><ClipboardList size={18} aria-hidden="true" /></span><span class="m"><span class="t">{t('Workshop order|sheet')}</span><span class="s">{names[pick]}</span></span><ChevronRight class="chev" size={18} aria-hidden="true" /></a></li>
            <li><a class="lrow" href={bikesHash({ tab: 'setup', bike: pick, sheet: 'pickup', from: 'shop' })}><span class="ic"><ListChecks size={18} aria-hidden="true" /></span><span class="m"><span class="t">{t('Pick-up check')}</span><span class="s">{names[pick]}</span></span><ChevronRight class="chev" size={18} aria-hidden="true" /></a></li>
          </ul>
        {/if}
      </section>
      <!-- Gesamttest 20.10.2026 Design 2: the tip of the day under the first part of the page, not above it -->
      <TipLine page="workshop" name={t('Workshop & receipts')} />

      <section class="ssec" aria-labelledby="visits-h">
        <h2 id="visits-h" class="sh">{t('Visits and receipts')}</h2>
        {#if !visits.length}
          <Empty icon={ReceiptText} text={t('No visit yet. A photo of a receipt in the Inbox becomes one with «File as … Receipt».')} action={{ label: t('To the Inbox'), href: '#/inbox' }} />
        {:else}
          <ul class="card srows">
            {#each months as m (m.key)}
              <li class="mon">{monthName(m.key)}</li>
              {#each m.rows as v (v.id)}
                <li>
                  <button type="button" class="lrow" data-visit-id={v.id} onclick={() => (open = v.id)}>
                    {#if v.photos?.[0]}<img class="rc" src={v.photos[0]} alt="" loading="lazy" />{:else}<span class="ic"><ReceiptText size={18} aria-hidden="true" /></span>{/if}
                    <span class="m"><span class="t">{v.shop || t('Workshop')}</span><span class="s">{dayName(v.date)}{pick ? '' : ` · ${names[v.bikeId] ?? ''}`}{v.km != null ? ` · ${v.km.toLocaleString('de-CH')} km` : ''}{(v.parts ?? []).length ? ` · ${tn(v.parts.length, '{n} job', '{n} jobs')}` : ''}</span></span>
                    <span class="v num">{chfText(visitTotal(v))}</span>
                    <ChevronRight class="chev" size={18} aria-hidden="true" />
                  </button>
                </li>
              {/each}
            {/each}
          </ul>
          {#if visitsShown.length < visits.length}
            <button type="button" class="phone-more" onclick={() => (visitsAll = true)} data-visits-more><ChevronDown size={16} aria-hidden="true" />{tn(visits.length - visitsShown.length, 'Show {n} more visit', 'Show {n} more visits')}</button>
          {/if}
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
  <PageMore page="workshop" name={t('Workshop & receipts')} />
</section>
{#if shown}
  <VisitDialog visit={shown} bike={bikes.find((b) => b.id === shown.bikeId)} onclose={() => (open = null)} />
{/if}
{#if shownOrder}
  <OrderDialog order={shownOrder.order} bike={shownOrder.bike} trip={shownOrder.orderTrip} bikeNames={names} onclose={() => (orderOpen = null)} />
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
  .shead {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: 4px 12px;
    margin: 0 2px 10px;
  }
  .shead .sh {
    min-width: 0;
    margin: 0;
  }
  .sh-a {
    flex: none;
    display: inline-flex;
    align-items: center;
    gap: 2px;
    min-height: 44px;
    padding: 0 4px;
    border: 0;
    background: none;
    color: var(--ink);
    font: 500 var(--fs-small) / 1.3 var(--font-body);
    cursor: pointer;
  }
  .sh-a:hover {
    text-decoration: underline;
    text-underline-offset: 3px;
  }
  .srows.sheets {
    margin-top: 12px;
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
  /* «Handy kürzer» (Noah 20.10.2026 «4b»): the older visits after one tap */
  .phone-more {
    display: flex;
    align-items: center;
    gap: 6px;
    width: 100%;
    min-height: 44px;
    margin: var(--sp-2) 0 0;
    padding: 10px 14px;
    border: 1px solid var(--card-line);
    border-radius: var(--radius-card);
    background: var(--paper);
    color: var(--ink);
    font: 600 var(--fs-body) / 1.3 var(--font-body);
    text-align: left;
    cursor: pointer;
  }
</style>
