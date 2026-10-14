<script>
  /**
   * Velos › Setup › Taschen-Plan (UC3-2, Noah 14.10.2026 «1 ja und weiter ausbauen»): how the luggage of
   * a packing list sits on the bike. The bike with numbered bags, the weight front / middle / rear,
   * at most two hints to move an item (each with «Why?», never applied by itself), the items that sit
   * in a place without a bag, and one card per bag: weight, fill (only when every litre is known),
   * what is in it. The bags, places and weights come from Gear and Pack; moving an item here moves it
   * in that trip's packing list, as «Move to» in Pack does.
   */
  import { liveQuery } from 'dexie';
  import { db } from '../db.js';
  import { bikesHash, SLOT } from '../bikes.js';
  import { touched } from '../trips.js';
  import { openTrip } from '../nav.js';
  import { localDay } from '../localday.js';
  import { formatWeight } from '../gear.js';
  import { planTrips, bagPlan, sideShares, planHints, moveEntry, dismissHint } from '../rig.js';
  import { Lightbulb, X, Package } from '@lucide/svelte';
  import VeloHead from './VeloHead.svelte';
  import RigBike from './RigBike.svelte';
  import { t, num, nameOf, bagName } from '../i18n.svelte.js';

  let { bike } = $props();

  const tripsQ = liveQuery(() => db.trips.toArray());
  const itemsQ = liveQuery(() => db.items.toArray());
  const bagsQ = liveQuery(() => db.containers.toArray());
  const today = localDay();

  const choices = $derived(planTrips($tripsQ ?? [], bike.id, today));
  let pick = $state(null);
  const trip = $derived(choices.find((x) => x.id === pick) ?? choices[0] ?? null);
  const items = $derived($itemsQ ?? []);
  const byId = $derived(Object.fromEntries(items.map((i) => [i.id, i])));
  const plan = $derived(trip ? bagPlan(trip, items, $bagsQ ?? [], bike) : null);
  const shares = $derived(plan ? sideShares(plan.sides) : null);
  const hints = $derived(plan ? planHints(plan, trip, items) : []);
  let why = $state(null);

  const kg = (g) => `${num(Math.round(g / 100) / 10)} kg`;
  const place = (key) => t(SLOT[key]?.name ?? key);
  const nm = (id) => nameOf(byId[id]) || id;
  const g = (x) => (x == null ? '' : formatWeight(x));
  const TAG = { handy: 'within reach', low: 'low and central' };

  async function move(h) {
    await db.trips.update(trip.id, touched({ entries: moveEntry(trip, h.itemId, h.to) }));
  }
  async function dismiss(h) {
    await db.trips.update(trip.id, touched({ planDismissed: dismissHint(trip, h) }));
  }
  const toPack = () => {
    openTrip(trip.id);
    location.hash = '#/pack';
  };
</script>

<VeloHead
  crumbs={[{ label: t('Bike'), href: bikesHash({ tab: 'setup', bike: bike.id }) }, { label: t('Setup|tab'), href: bikesHash({ tab: 'rig', bike: bike.id }) }]}
  here={t('Bag plan')}
  title={t('Bag plan')}
  sub={`${bike.name} · ${t('weights and places from Gear and Pack')}`}
>
  {#if trip}<button type="button" class="btn" onclick={toPack}><Package size={16} aria-hidden="true" />{t('Open in Pack')}</button>{/if}
</VeloHead>

{#if !trip}
  <p class="card hint">{t('No packing list with this bike yet. Plan a trip with it: the plan then shows which bag sits where.')}</p>
{:else}
  {#if choices.length > 1}
    <div class="chips" role="group" aria-label={t('Packing list')}>
      {#each choices as c (c.id)}<button type="button" class="chip" aria-pressed={c.id === trip.id} onclick={() => (pick = c.id)}>{c.title}</button>{/each}
    </div>
  {/if}
  <div class="plan">
    <section class="card left" aria-labelledby="rp-h">
      <header class="bh"><h2 id="rp-h">{t('How your luggage sits')}</h2><p>{trip.title}</p></header>
      {#if plan.bags.length}
        <RigBike bags={plan.bags} label={t('Bike with {n} bags', { n: plan.bags.length })} />
      {/if}
      <div class="sides">
        <div><b class="num">{kg(plan.sides.front)}</b><small>{t('front · {p} %', { p: shares.front })}</small></div>
        <div><b class="num">{kg(plan.sides.middle)}</b><small>{t('middle · {p} %', { p: shares.middle })}</small></div>
        <div><b class="num">{kg(plan.sides.rear)}</b><small>{t('rear · {p} %', { p: shares.rear })}</small></div>
      </div>
      {#each hints as h (h.itemId + h.to)}
        <div class="sug">
          <Lightbulb size={18} aria-hidden="true" />
          <span class="t">
            {h.kind === 'heavy' ? t('{item} ({g}) could move from «{from}» to «{to}»: lower and more central.', { item: nm(h.itemId), g: g(h.grams), from: place(h.from), to: place(h.to) }) : t('{item} is in «{from}». You often need it on the way: within reach in «{to}»?', { item: nm(h.itemId), from: place(h.from), to: place(h.to) })}
            <span class="acts"><button type="button" class="lnk" onclick={() => move(h)}>{t('Move')}</button> · <button type="button" class="lnk" aria-expanded={why === h.itemId} onclick={() => (why = why === h.itemId ? null : h.itemId)}>{t('Why?')}</button></span>
            {#if why === h.itemId}<small class="why">{h.kind === 'heavy' ? t('Rule: an item of {g} or more in the seat pack, side bags or front roll, and the frame bag is not almost full. Heavy things low in the frame make the bike steadier.', { g: '300 g' }) : t('Rule: rain things in the seat pack, side bags or front roll, and the trip has a bag within reach. You get them out without stopping long.')}</small>{/if}
          </span>
          <button type="button" class="x" aria-label={t('Dismiss hint')} onclick={() => dismiss(h)}><X size={16} aria-hidden="true" /></button>
        </div>
      {/each}
      {#if plan.loose.length}
        <div class="loose">
          <b>{t('Still without a bag ({n}):', { n: plan.loose.length })}</b>
          {plan.loose.map((x) => [nm(x.itemId), g(x.grams)].filter(Boolean).join(' ')).join(' · ')}
          <button type="button" class="lnk" onclick={toPack}>{t('Assign in Pack')}</button>
        </div>
      {/if}
    </section>
    <div class="bagl">
      {#each plan.bags as b (b.key)}
        <section class="card bg" aria-labelledby="rb-{b.key}">
          <div class="h"><span class="n" aria-hidden="true">{b.n}</span><h3 id="rb-{b.key}">{place(b.key)}</h3><b class="num">{kg(b.grams)}</b></div>
          <p class="bn">{bagName(b.bagName)}</p>
          {#if b.fill != null}
            <div class="fill" role="img" aria-label={t('{p} % full', { p: b.fill })}><i class:full={b.full} style:width="{b.fill}%"></i></div>
          {/if}
          <div class="meta">
            {#if b.cap}<span>{b.fill != null ? t('{used} / {cap} L used', { used: num(b.vol), cap: num(b.cap) }) : t('{cap} L', { cap: num(b.cap) })}</span>{/if}
            {#each b.tags as tag (tag)}<span class="tag">{t(TAG[tag])}</span>{/each}
            {#if b.full}<span class="tag warn">{t('almost full')}</span>{/if}
            {#if b.unweighed}<span>{t('{n} not weighed', { n: b.unweighed })}</span>{/if}
          </div>
          <ul class="its">{#each b.items as x (x.itemId)}<li>{nm(x.itemId)}{x.qty > 1 ? ` ×${x.qty}` : ''}</li>{:else}<li class="quiet">{t('empty')}</li>{/each}</ul>
        </section>
      {/each}
      <p class="hint">{t('Fill from the litres in Gear. Everything is a suggestion: you move what you want.')}</p>
    </div>
  </div>
{/if}

<style>
  .hint {
    margin: 0;
    font-size: var(--fs-small);
    color: var(--ink-3);
  }
  .chips {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin: 0 0 16px;
  }
  .chip {
    min-height: 40px;
    padding: 0 14px;
    border: 1px solid var(--line);
    border-radius: 999px;
    background: var(--paper);
    color: var(--ink);
    font: inherit;
    cursor: pointer;
  }
  .chip[aria-pressed='true'] {
    background: var(--ink);
    border-color: var(--ink);
    color: var(--paper);
  }
  .plan {
    display: grid;
    grid-template-columns: minmax(0, 1.25fr) minmax(0, 1fr);
    gap: 16px;
    align-items: start;
  }
  .left {
    display: flex;
    flex-direction: column;
    gap: 10px;
    min-width: 0;
  }
  .bh {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    align-items: baseline;
    gap: 4px 12px;
  }
  .bh h2 {
    margin: 0;
    font-size: var(--fs-sub);
  }
  .bh p {
    margin: 0;
    font-size: var(--fs-small);
    color: var(--ink-3);
  }
  .sides {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 8px;
    text-align: center;
  }
  .sides div {
    background: var(--paper-2);
    border-radius: 12px;
    padding: 8px;
  }
  .sides b {
    display: block;
    font-size: var(--fs-sub);
  }
  .sides small {
    font-size: var(--fs-tiny);
    color: var(--ink-3);
  }
  .sug {
    display: flex;
    gap: 10px;
    align-items: flex-start;
    background: var(--warn-soft);
    border-radius: 12px;
    padding: 10px 12px;
    font-size: var(--fs-small);
    color: var(--ink);
  }
  .sug .t {
    flex: 1;
    min-width: 0;
  }
  .sug .acts {
    white-space: nowrap;
  }
  .why {
    display: block;
    margin-top: 6px;
    color: var(--ink-2);
  }
  .lnk {
    border: 0;
    background: none;
    padding: 0;
    min-height: 32px;
    font: inherit;
    font-weight: 600;
    color: var(--ink);
    text-decoration: underline;
    cursor: pointer;
  }
  .x {
    display: inline-grid;
    place-items: center;
    width: 36px;
    height: 36px;
    border: 0;
    border-radius: 8px;
    background: none;
    color: var(--ink-3);
    cursor: pointer;
  }
  .loose {
    border: 1.5px dashed var(--line-strong);
    border-radius: 12px;
    padding: 10px 14px;
    font-size: var(--fs-small);
    color: var(--ink-2);
  }
  .bagl {
    display: flex;
    flex-direction: column;
    gap: 12px;
    min-width: 0;
  }
  .bg {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  .bg .h {
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .bg .n {
    width: 28px;
    height: 28px;
    flex: none;
    border-radius: 50%;
    background: var(--ink);
    color: var(--paper);
    font-size: var(--fs-small);
    font-weight: 700;
    display: grid;
    place-items: center;
  }
  .bg h3 {
    flex: 1;
    margin: 0;
    font-size: var(--fs-body);
    min-width: 0;
  }
  .bn {
    margin: 0;
    font-size: var(--fs-small);
    color: var(--ink-3);
  }
  .fill {
    height: 6px;
    border-radius: 99px;
    background: var(--paper-2);
    overflow: hidden;
  }
  .fill i {
    display: block;
    height: 100%;
    background: var(--ink-2);
  }
  .fill i.full {
    background: var(--warn);
  }
  .meta {
    display: flex;
    flex-wrap: wrap;
    gap: 6px 10px;
    font-size: var(--fs-small);
    color: var(--ink-3);
  }
  .tag {
    background: var(--paper-2);
    color: var(--ink-2);
    border-radius: 6px;
    padding: 1px 8px;
    font-weight: 600;
  }
  .tag.warn {
    background: var(--warn-soft);
    color: var(--ink);
  }
  .its {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-wrap: wrap;
    gap: 2px 14px;
    font-size: var(--fs-small);
    color: var(--ink-2);
  }
  .quiet {
    color: var(--ink-3);
  }
  @media (max-width: 800px) {
    .plan {
      grid-template-columns: minmax(0, 1fr);
    }
  }
</style>
