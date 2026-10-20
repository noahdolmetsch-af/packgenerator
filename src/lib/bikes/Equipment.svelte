<script>
  import { backClose } from '../ui/backclose.js'; // Regeln der App (14.10.2026): back closes this window first
  /**
   * v0.83.0 «Ausstattung» (Noah 11.10.2026, A1–A5 a; model: Canyon «Ausstattung · Alle Komponenten»):
   * the Bikes tab «Ausstattung». One bike at a time: Noah's four measurements on top as tiles (the
   * rest behind «+ n more», FitCard compact), then every part in groups like Canyon (frame set,
   * drivetrain, brakes, wheels, cockpit, accessories): category, name, details, weight, price.
   * Parts without a name fold into one line per group (A2a); a group sums its weight and price
   * (A3a); weight per area and the most expensive parts sit on the right, on a phone below (A4a).
   * A tap on a part opens a small sheet for name, weight and price. «Compare bikes» is one tap away.
   */
  import { keepTyped } from '../ui/keeptyped.js';
  import { liveQuery } from 'dexie';
  import Empty from '../ui/Empty.svelte';
  import { db } from '../db.js';
  import { sortBikes, bikesHash, bikeTypeName } from '../bikes.js';
  import { equipmentGroups, equipmentTotals, setPartBasics } from '../equipment.js';
  import { readValue } from '../bikespecs.js';
  import { formatWeight } from '../gear.js';
  import { t } from '../i18n.svelte.js';
  import FitCard from './FitCard.svelte';
  import SitPosCard from '../vision/SitPosCard.svelte';
  import Seg from '../ui/Seg.svelte';
  import { Columns3, ChevronRight, ChevronDown, PencilLine, Bike as BikeIcon } from '@lucide/svelte';
  import { wantBike } from '../nav.js';
  import VeloHead from './VeloHead.svelte';
  import HintCard from '../pageinfo/HintCard.svelte';
  import TipLine from '../pageinfo/TipLine.svelte';
  // Impeccable Runde 2 (18.10.2026, Ausstattung 1+2, Werkstatt 2): the bike choice as one row to swipe on a
  // phone, the short title «Ausstattung», empty measures and weights as a sentence, CHF one way.
  import BikeChips from './BikeChips.svelte';
  import { chfText } from '../money.js';

  let { bikeId = null, onbike } = $props();

  const bikesQ = liveQuery(() => db.bikes.toArray());
  const bikes = $derived(sortBikes($bikesQ ?? []));
  const bike = $derived(bikes.find((b) => b.id === bikeId) ?? bikes[0] ?? null);
  const groups = $derived(bike ? equipmentGroups(bike) : []);
  const totals = $derived(equipmentTotals(groups));

  let area = $state('all');
  const shown = $derived(area === 'all' ? groups : groups.filter((g) => g.area === area));
  let openEmpty = $state(new Set());
  const toggleEmpty = (a) => {
    const s = new Set(openEmpty);
    if (s.has(a)) s.delete(a);
    else s.add(a);
    openEmpty = s;
  };

  const chf = (n) => chfText(n);
  const kg = (g) => formatWeight(g);
  const maxArea = $derived(Math.max(1, ...groups.map((g) => g.weightG)));

  /* ---------- one part: name, weight, price in a small sheet ---------- */
  let edit = $state(null); // { key, cat, model, weight, price }
  let dialog = $state();
  let error = $state('');
  $effect(() => {
    if (edit && dialog && !dialog.open) dialog.showModal();
  });
  function open(r) {
    error = '';
    edit = { key: r.key, cat: r.cat, model: r.model, weight: r.weightG == null ? '' : String(r.weightG), price: r.priceChf == null ? '' : String(r.priceChf) };
  }
  async function save() {
    const w = edit.weight.trim() === '' ? null : readValue(edit.weight, true);
    const p = edit.price.trim() === '' ? null : readValue(edit.price, true);
    if ((w != null && typeof w !== 'number') || (p != null && typeof p !== 'number')) {
      error = t('Type a number, e.g. {n}', { n: '250' });
      return;
    }
    const stored = await db.bikes.get(bike.id);
    if (stored) await db.bikes.update(stored.id, setPartBasics(stored, edit.key, { model: edit.model, weightG: w, priceChf: p }));
    dialog?.close();
  }
</script>

<div class="eq">
  {#if !bikes.length && $bikesQ}
    <h1 class="title">{t('Equipment|tab')}</h1>
    <!-- v0.127.0 A-U2: the one empty building block -->
    <Empty icon={BikeIcon} title={t('No bikes yet')} text={t('Add your bike, or bring your data along with a backup.')} action={{ label: t('Add bike'), href: '#/bikes', onclick: wantBike }}>{t('Or bring your data along from a backup:')} <a href="#/me/data">{t('Me › Data and backup')}</a>.</Empty>
  {:else if bike}
    <!-- Design-Refresh P7 (V14, Noah 12.10.2026 «v11-v14 freigegeben»): «‹ Velo › Gravel Blau › Ausstattung»,
         «Ausstattung Gravel Blau», the counts below, «Compare bikes» as a button; the other bikes as chips. -->
    <VeloHead
      crumbs={[{ label: t('Bike'), href: bikesHash({ tab: 'setup' }) }, { label: bike.name, href: bikesHash({ tab: 'setup', bike: bike.id }) }]}
      here={t('Equipment|tab')}
      title={t('Equipment|tab')}
      sub={[bike.name, bike.type ? t(bikeTypeName(bike.type)) : '', t('{n} parts recorded', { n: totals.count }), totals.weightG ? `${kg(totals.weightG)} ${t('parts|weight')}` : '', totals.priceChf ? `${chf(totals.priceChf)} ${t('purchase value')}` : ''].filter(Boolean).join(' · ')}
    >
      <a class="btn hi cmplink" href={bikesHash({ tab: 'compare', view: 'enter', bike: bike.id })}><PencilLine size={16} aria-hidden="true" />{t('Enter values')}</a>
      <a class="btn cmplink" href={bikesHash({ tab: 'compare', view: 'all' })}><Columns3 size={16} aria-hidden="true" />{t('Compare bikes')}</a>
    </VeloHead>
    <!-- Noah 19.10 «2a»: one card per page; the Einstieg «Ausstattung» lives in the card «Was hier steht» -->
    <HintCard page="equipment" intro="ausstattung" />
    {#if bikes.length > 1}<BikeChips {bikes} current={bike.id} onpick={(id) => onbike?.(id)} />{/if}

    {#key bike.id}<FitCard {bike} compact />{/key}
    <!-- Paket L2 «Sitzposition» (Noah 19.10.2026 «4a»): the measured sitting position with its history -->
    {#key bike.id}<SitPosCard {bike} />{/key}

    <div class="cols">
      <div class="parts">
        <h2 class="sh" id="eq-parts">{t('Components')}</h2>
        <Seg full={false} label={t('Part area|filter')} options={[{ key: 'all', name: t('All') }, ...groups.map((g) => ({ key: g.area, name: t(g.name) }))]} value={area} onchange={(k) => (area = k)} />
        {#each shown as g (g.area)}
          <section class="grp" aria-labelledby="eq-{g.area}">
            <header class="gh">
              <h3 id="eq-{g.area}">{t(g.name)}</h3>
              <span class="gsum">{t(g.count === 1 ? '{n} part' : '{n} parts', { n: g.count })}{#if g.weightG}{' · '}<b>{kg(g.weightG)}</b>{/if}{#if g.priceChf}{' · '}{chf(g.priceChf)}{/if}</span>
            </header>
            <ul class="rows">
              {#each g.rows as r (r.key)}
                <li>
                  <button type="button" class="prow" aria-label="{r.cat}: {r.model}" onclick={() => open(r)}>
                    <span class="cat">{r.cat}</span>
                    <span class="nm"><b>{r.model}</b>{#if r.details}<small>{r.details}</small>{/if}</span>
                    <span class="w num">{#if r.weightG != null}{kg(r.weightG)}{:else}<em>{t('Weight +')}</em>{/if}</span>
                    <span class="p num">{#if r.priceChf != null}{chf(r.priceChf)}{:else}<em>{t('Price +')}</em>{/if}</span>
                    <ChevronRight class="chev" size={16} aria-hidden="true" />
                  </button>
                </li>
              {/each}
              {#if g.empty.length}
                <li class="emptyrow">
                  <button type="button" class="prow fold" aria-expanded={openEmpty.has(g.area)} onclick={() => toggleEmpty(g.area)}>
                    <span class="cat add">+ {t('{n} without details', { n: g.empty.length })}</span>
                    <span class="nm"><small>{g.empty.map((r) => r.cat).join(', ')}</small></span>
                    {#if openEmpty.has(g.area)}<ChevronDown class="chev" size={16} aria-hidden="true" />{:else}<ChevronRight class="chev" size={16} aria-hidden="true" />{/if}
                  </button>
                </li>
                {#if openEmpty.has(g.area)}
                  {#each g.empty as r (r.key)}
                    <li>
                      <button type="button" class="prow" aria-label="{r.cat}: –" onclick={() => open(r)}>
                        <span class="cat">{r.cat}</span>
                        <span class="nm"><b class="none">–</b></span>
                        <span class="w num"></span>
                        <span class="p num"></span>
                        <ChevronRight class="chev" size={16} aria-hidden="true" />
                      </button>
                    </li>
                  {/each}
                {/if}
              {/if}
            </ul>
          </section>
        {/each}
        <!-- Gesamttest: the tip of the day comes after the parts, not under the help box -->
        <TipLine page="ausstattung" name={t('Equipment|tab')} />
      </div>

      <aside class="side">
        <section class="box" aria-labelledby="eq-w">
          <h3 id="eq-w">{t('Weight per area')}</h3>
          {#if !totals.weightG}
            <p class="quiet">{typeof bike.weightG === 'number' ? t('No part weights yet. The bike weighs {kg} measured. Tap a part to enter its weight.', { kg: kg(bike.weightG) }) : t('No part weights yet. Tap a part to enter its weight.')}</p>
          {:else}
          {#each groups as g (g.area)}
            <div class="bar">
              <span>{t(g.name)}</span>
              <span class="track"><i style:width="{Math.round((g.weightG / maxArea) * 100)}%"></i></span>
              <b class="num">{g.weightG ? kg(g.weightG) : '–'}</b>
            </div>
          {/each}
          <p class="tot">
            {t('Parts total')} <b>{kg(totals.weightG)}</b>{#if typeof bike.weightG === 'number'}{' · '}{t('bike weighed')} <b>{kg(bike.weightG)}</b>{/if}
          </p>
          {/if}
        </section>
        <section class="box" aria-labelledby="eq-p">
          <h3 id="eq-p">{t('Most expensive parts')}</h3>
          {#if totals.top.length}
            {#each totals.top as r (r.key)}
              <p class="row2"><span>{r.cat} · {r.model}</span><b class="num">{chf(r.priceChf)}</b></p>
            {/each}
          {:else}
            <p class="quiet">{t('No prices yet. Tap a part to add its price.')}</p>
          {/if}
          <p class="tot">
            {t('Parts total')} <b>{totals.priceChf ? chf(totals.priceChf) : '–'}</b>{#if totals.noPrice}{' · '}{t(totals.noPrice === 1 ? '{n} price missing' : '{n} prices missing', { n: totals.noPrice })}{/if}
          </p>
        </section>
      </aside>
    </div>
  {/if}
</div>

{#if edit}
  <dialog use:backClose use:keepTyped={'equip:' + (bikeId ?? '') + ':' + edit.key} class="sheet" bind:this={dialog} onclose={() => (edit = null)} aria-labelledby="eq-edit-h">
    <p class="meta">{bike?.name}</p>
    <h2 id="eq-edit-h" class="title">{edit.cat}</h2>
    <form method="dialog" onsubmit={(e) => (e.preventDefault(), save())}>
      <label class="fld">
        <span class="lbl">{t('Name')}</span>
        <!-- svelte-ignore a11y_autofocus -->
        <input class="inp" type="text" autocomplete="off" bind:value={edit.model} autofocus />
      </label>
      <div class="two">
        <label class="fld">
          <span class="lbl">{t('Weight')} (g)</span>
          <input class="inp num" type="text" inputmode="decimal" autocomplete="off" bind:value={edit.weight} />
        </label>
        <label class="fld">
          <span class="lbl">{t('Price')} (CHF)</span>
          <input class="inp num" type="text" inputmode="decimal" autocomplete="off" bind:value={edit.price} />
        </label>
      </div>
      {#if error}<p class="err" role="alert">{error}</p>{/if}
      <div class="acts">
        <button type="submit" class="btn hi">{t('Save')}</button>
        <button type="button" class="btn" onclick={() => dialog.close()}>{t('Cancel')}</button>
      </div>
    </form>
  </dialog>
{/if}

<style>
  .cmplink {
    gap: 6px;
    text-decoration: none;
  }
  /* Impeccable Runde 2 (Ausstattung 2): on a phone the two buttons stand side by side */
  @media (max-width: 599px) {
    .cmplink {
      flex: 1 1 0;
      min-width: 0;
      padding-left: 10px;
      padding-right: 10px;
      white-space: normal;
      text-align: center;
    }
    .cmplink :global(svg) {
      display: none;
    }
  }
  .cols {
    display: grid;
    gap: 16px;
  }
  @media (min-width: 1100px) {
    .cols {
      grid-template-columns: minmax(0, 1fr) 300px;
      align-items: start;
    }
  }
  .sh {
    margin: 8px 0 8px;
    color: var(--ink-3);
    font: 600 var(--fs-small) / 1.3 var(--font-body);
    letter-spacing: 0.06em;
    text-transform: uppercase;
  }
  .grp {
    margin: 12px 0 0;
    border: 1px solid var(--line);
    border-radius: 14px;
    background: var(--paper);
    overflow: hidden;
  }
  .gh {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    align-items: baseline;
    gap: 2px 12px;
    padding: 12px 16px 8px;
    border-bottom: 2px solid var(--ink);
  }
  .gh h3 {
    margin: 0;
    font: 600 var(--fs-sub) / 1.3 var(--font-body);
  }
  .gsum {
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .rows {
    list-style: none;
    margin: 0;
    padding: 0;
  }
  .rows li + li {
    border-top: 1px solid var(--line);
  }
  .prow {
    display: grid;
    grid-template-columns: 150px minmax(0, 1fr) 84px 96px 16px;
    gap: 12px;
    align-items: center;
    width: 100%;
    min-height: 52px;
    padding: 8px 16px;
    border: 0;
    background: none;
    font: inherit;
    color: var(--ink);
    text-align: left;
    cursor: pointer;
  }
  @media (hover: hover) {
    .prow:hover {
      background: var(--paper-2);
    }
  }
  .cat {
    color: var(--ink-3);
    font-size: var(--fs-small);
    overflow-wrap: break-word;
  }
  .cat.add {
    color: var(--hi);
    font-weight: 600;
  }
  .nm {
    min-width: 0;
  }
  .nm b {
    display: block;
    font-weight: 600;
    overflow-wrap: break-word;
  }
  .nm b.none {
    font-weight: 400;
    color: var(--ink-3);
  }
  .nm small {
    display: block;
    color: var(--ink-3);
    font-size: var(--fs-small);
    overflow-wrap: break-word;
  }
  .w,
  .p {
    text-align: right;
    white-space: nowrap;
  }
  .p {
    color: var(--ink-2);
  }
  /* v0.95.0 «Velo kurz» (App einfach D): a missing weight or price is a quiet hint, not orange on every part. */
  em {
    font-style: normal;
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .prow :global(.chev) {
    color: var(--ink-3);
  }
  .emptyrow {
    background: var(--paper-2);
  }
  .fold {
    grid-template-columns: 150px minmax(0, 1fr) 16px;
  }
  @media (max-width: 719px) {
    .prow {
      grid-template-columns: minmax(0, 1fr) auto 16px;
      grid-template-areas: 'cat w chev' 'nm p chev';
      gap: 2px 10px;
      padding: 10px 14px;
    }
    .prow .cat {
      grid-area: cat;
    }
    .prow .nm {
      grid-area: nm;
    }
    .prow .w {
      grid-area: w;
    }
    .prow .p {
      grid-area: p;
    }
    .prow :global(.chev) {
      grid-area: chev;
    }
    .fold {
      grid-template-areas: 'cat cat chev' 'nm nm chev';
    }
  }
  .box {
    margin: 0 0 12px;
    padding: 14px 16px;
    border: 1px solid var(--line);
    border-radius: 14px;
    background: var(--paper);
  }
  .box h3 {
    margin: 0 0 10px;
    font: 600 var(--fs-body) / 1.3 var(--font-body);
  }
  .bar {
    display: grid;
    grid-template-columns: 96px minmax(0, 1fr) 64px;
    align-items: center;
    gap: 8px;
    margin: 0 0 6px;
    font-size: var(--fs-small);
  }
  .track {
    display: block;
    height: 10px;
  }
  .track i {
    display: block;
    height: 10px;
    border-radius: 5px;
    background: var(--ok);
  }
  .bar b {
    text-align: right;
    font-weight: 500;
  }
  .tot {
    margin: 10px 0 0;
    padding-top: 8px;
    border-top: 1px solid var(--line);
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .row2 {
    display: flex;
    justify-content: space-between;
    gap: 8px;
    margin: 0;
    padding: 4px 0;
    font-size: var(--fs-small);
  }
  .row2 b {
    white-space: nowrap;
  }
  .quiet {
    margin: 0;
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .meta {
    margin: 0;
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .fld {
    display: block;
    margin: 12px 0;
  }
  .fld .inp {
    width: 100%;
  }
  .two {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0 12px;
  }
  .err {
    color: var(--bad);
    font-size: var(--fs-small);
  }
  .acts {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
</style>
