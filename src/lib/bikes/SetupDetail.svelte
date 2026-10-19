<script>
  /**
   * Taschen-Setups TS2 (Noah 14.10.2026 «TS0–TS5 freigegeben»): one bag setup of a bike.
   * Left: the bike with its numbered bags and the weight front / middle / rear, the total weight
   * (bike from the bike data + empty bags and contents from Gear + water apart), and which bag sits
   * in which place (changeable). Right: one card per bag with its empty weight, contents, litres, a
   * fill bar and its things with grams; «+ Material dazu» and «verschieben» change only this setup.
   * New trips with this setup take it over; planned trips keep their own list (Noah 2a).
   */
  import { bikesHash, SLOT, placesOf } from '../bikes.js';
  import { setupsOf, setupOf, setupCalc, usageOf, lastUsedId, copySetup, copyToBike, freeName, moveItem, addItems, removeItem, setBag } from '../setups.js';
  import { writeSetup, deleteSetup, newSetupId } from './setupdb.js';
  import { offerRename } from '../ui/rename.svelte.js';
  import { formatWeight } from '../gear.js';
  import { Pencil, Copy, Plus, ArrowRight, X, Bike, Trash2, Clock3 } from '@lucide/svelte';
  import VeloHead from './VeloHead.svelte';
  import RigBike from './RigBike.svelte';
  import SetupBar from './SetupBar.svelte';
  import SetupDialog from './SetupDialog.svelte';
  import SetupItemPick from './SetupItemPick.svelte';
  import RenameSheet from '../ui/RenameSheet.svelte';
  import MoreActions from '../ui/MoreActions.svelte';
  import { t, tn, num, dateOf, nameOf, bagName } from '../i18n.svelte.js';

  let { bike, bikes = [], setupId, trips = [], items = [], containers = [] } = $props();

  const setups = $derived(setupsOf(bike, trips));
  const setup = $derived(setupOf(bike, setupId, trips));
  const calc = $derived(setupCalc(setup, bike, items, containers));
  const used = $derived(usageOf(bike, trips)[setup.id] ?? null);
  const isLast = $derived(lastUsedId(bike, trips) === setup.id);
  const others = $derived(bikes.filter((b) => b.id !== bike.id));
  const byId = $derived(Object.fromEntries(items.map((i) => [i.id, i])));
  const nm = (s) => (s.std ? t('Standard|setup') : s.name);
  const kg = (g) => `${num(Math.round(g / 100) / 10)} kg`;
  const kgOrG = (g) => (g == null ? '–' : g >= 1000 ? `${num(Math.round(g / 10) / 100)} kg` : `${num(Math.round(g))} g`);
  const place = (key) => t(SLOT[key]?.name ?? key);
  const bagLabel = (b) => (b.bag ? bagName(b.bag.name) : place(b.key));
  const places = $derived(placesOf(bike).filter((s) => !s.worn));
  const bagsFor = (key) => containers.filter((c) => c.slot === key);
  const taken = $derived(Object.fromEntries((setup.items ?? []).filter((x) => x.slot && setup.bags?.[x.slot]).map((x) => [x.itemId, bagLabel(calc.list.find((b) => b.key === x.slot) ?? { key: x.slot })])));
  const TAG = { handy: 'within reach', low: 'low and central' };

  const save = (next) => writeSetup(bike.id, next);
  let moving = $state(null); // place whose things show «move to»
  let picking = $state(null); // the bag row adding things
  let dialog = $state.raw(null);
  let renaming = $state(false);

  async function rename(name) {
    const old = setup.name;
    await save({ ...setup, name });
    offerRename(name, () => save({ ...setup, name: old }));
  }
  async function copy() {
    const made = copySetup(setup, { id: newSetupId(), name: freeName(nm(setup), setups, t('copy')) });
    await writeSetup(bike.id, made, t('Copied as «{name}».', { name: made.name }));
    location.hash = bikesHash({ tab: 'rig', view: 'setup', bike: bike.id, setup: made.id });
  }
  async function toBike({ name, bikeId }) {
    const target = others.find((b) => b.id === bikeId);
    if (!target) return;
    const made = copyToBike(setup, target, { id: newSetupId(), name: freeName(name, setupsOf(target, trips), t('copy')) });
    await writeSetup(target.id, made, t('Copied to {bike} as «{name}».', { bike: target.name, name: made.name }));
  }
  async function remove() {
    location.hash = bikesHash({ tab: 'rig', bike: bike.id });
    await deleteSetup(bike.id, setup.id, t('«{name}» deleted.', { name: setup.name }));
  }
  const actions = $derived([
    ...(others.length ? [{ name: t('Copy to another bike …'), icon: Bike, run: () => (dialog = { kind: 'tobike' }) }] : []),
    ...(setup.std ? [] : [{ name: t('Delete …'), icon: Trash2, run: () => (dialog = { kind: 'delete' }) }]),
  ]);
  const whenText = $derived(used ? [t('Last: {trip}, {date}', { trip: used.last.title, date: dateOf(used.last.startDate) }), tn(used.n, '{n} trip with this setup', '{n} trips with this setup')].join(' · ') : t('No trip with this setup yet'));
</script>

<VeloHead crumbs={[{ label: t('My setup|tab'), href: bikesHash({ tab: 'rig', bike: bike.id }) }]} here={`${bike.name} · ${nm(setup)}`} title={nm(setup)} sub={whenText}>
  {#if isLast}<span class="badge ok"><Clock3 size={12} aria-hidden="true" />{t('last used')}</span>{/if}
  {#if !setup.std}<button type="button" class="btn" onclick={() => (renaming = true)}><Pencil size={16} aria-hidden="true" />{t('Rename')}</button>{/if}
  <button type="button" class="btn" onclick={copy}><Copy size={16} aria-hidden="true" />{t('Copy')}</button>
  {#if actions.length}<MoreActions title={nm(setup)} label={t('More for {name}', { name: nm(setup) })} {actions} />{/if}
</VeloHead>

<div class="sd">
  <div class="lcol">
    <section class="card blk" aria-labelledby="sd-sit">
      <header class="bh"><h2 id="sd-sit">{t('How your luggage sits')}</h2><p>{tn(calc.list.length, '{n} bag', '{n} bags')}</p></header>
      <RigBike bags={calc.list} label={t('Bike with {n} bags', { n: calc.list.length })} />
      <div class="sides">
        <div><b class="num">{kg(calc.sides.front)}</b><small>{t('front · {p} %', { p: calc.shares.front })}</small></div>
        <div><b class="num">{kg(calc.sides.middle)}</b><small>{t('middle · {p} %', { p: calc.shares.middle })}</small></div>
        <div><b class="num">{kg(calc.sides.rear)}</b><small>{t('rear · {p} %', { p: calc.shares.rear })}</small></div>
      </div>
    </section>

    <section class="card blk" aria-labelledby="sd-tot">
      <header class="bh"><h2 id="sd-tot">{t('Total weight')}</h2><p>{t('with this setup')}</p></header>
      <p class="tot"><b class="num">{kg(calc.baseG)}</b> <span>{t('Base weight: bike + bags + gear')}</span></p>
      <p class="tot2">{t('With food and water: {kg}', { kg: kg(calc.totalG) })}</p>
      <SetupBar {calc} legend />
      <p class="hint">{calc.missing ? tn(calc.missing, 'Only a hint, not a goal. Without a weight: {n} thing.', 'Only a hint, not a goal. Without a weight: {n} things.') : t('Only a hint, not a goal.')}</p>
    </section>

    <section class="card blk" aria-labelledby="sd-bags">
      <header class="bh"><h2 id="sd-bags">{t('Bags on the bike')}</h2><p>{t('from your bag list')}</p></header>
      {#each places as p (p.key)}
        <label class="pl">
          <span>{t(p.name)}</span>
          <select class="sel" value={setup.bags?.[p.key] ?? ''} onchange={(e) => save(setBag(setup, p.key, e.currentTarget.value || null))}>
            <option value="">{t('No bag')}</option>
            {#each bagsFor(p.key) as c (c.id)}<option value={c.id}>{bagName(c.name)}</option>{/each}
          </select>
        </label>
      {/each}
      <p class="hint">{t('A place without a bag of its own: add the bag in Gear › Bags with this place.')}</p>
    </section>

    {#if calc.loose.length}
      <div class="loose">
        <b>{t('Still without a bag ({n}):', { n: calc.loose.length })}</b>
        {#each calc.loose as x (x.itemId)}
          <span class="lz">{x.item ? nameOf(x.item) : x.itemId}<button type="button" class="ix" aria-label={t('Remove {name}', { name: x.item ? nameOf(x.item) : x.itemId })} onclick={() => save(removeItem(setup, x.itemId))}><X size={14} aria-hidden="true" /></button></span>
        {/each}
      </div>
    {/if}
  </div>

  <div class="rcol">
    {#each calc.list as b (b.key)}
      <section class="card bg" aria-labelledby="sb-{b.key}">
        <div class="h"><span class="n" aria-hidden="true">{b.n}</span><h3 id="sb-{b.key}">{bagLabel(b)}</h3><b class="num">{kgOrG(b.sumG)}</b></div>
        <p class="meta">
          <span>{place(b.key)}</span>
          <span>{t('empty {w}', { w: kgOrG(b.emptyG) })}</span>
          <span>{t('contents {w}', { w: kgOrG(b.contentG + b.waterG) })}</span>
          {#if b.cap}<span>{b.fill != null ? `${num(b.vol)} / ${num(b.cap)} L` : `${num(b.cap)} L`}</span>{/if}
          {#each b.tags as tag (tag)}<span class="tag">{t(TAG[tag])}</span>{/each}
        </p>
        {#if b.fill != null}<div class="fill" role="img" aria-label={t('{p} % full', { p: b.fill })}><i class:full={b.full} style:width="{b.fill}%"></i></div>{/if}
        <ul class="its">
          {#each b.items as x (x.itemId)}
            <li>
              <span class="in">{#if x.water}<i class="wd" aria-hidden="true"></i>{/if}{x.item ? nameOf(x.item) : x.itemId}{x.qty > 1 ? ` ×${x.qty}` : ''}</span>
              {#if moving === b.key}
                <select class="sel sm" aria-label={t('Move {name} to', { name: x.item ? nameOf(x.item) : x.itemId })} value={b.key} onchange={(e) => save(moveItem(setup, x.itemId, e.currentTarget.value))}>
                  {#each calc.list as o (o.key)}<option value={o.key}>{o.n} {bagLabel(o)}</option>{/each}
                </select>
                <button type="button" class="ix" aria-label={t('Remove {name}', { name: x.item ? nameOf(x.item) : x.itemId })} onclick={() => save(removeItem(setup, x.itemId))}><X size={16} aria-hidden="true" /></button>
              {:else}
                <span class="num g">{x.grams == null ? t('no weight') : formatWeight(x.grams)}</span>
              {/if}
            </li>
          {:else}
            <li class="quiet">{t('empty')}</li>
          {/each}
        </ul>
        <div class="bf">
          <button type="button" class="lk" onclick={() => (picking = b)}><Plus size={16} aria-hidden="true" />{t('Add gear|setup')}</button>
          {#if b.items.length}<button type="button" class="lk q" aria-pressed={moving === b.key} onclick={() => (moving = moving === b.key ? null : b.key)}><ArrowRight size={16} aria-hidden="true" />{moving === b.key ? t('Done') : t('move')}</button>{/if}
        </div>
      </section>
    {:else}
      <p class="card hint">{t('No bags in this setup yet. Choose a bag for a place on the left.')}</p>
    {/each}
    <p class="hint">{t('Fill from the litres in Gear. A change here counts for new trips with this setup; planned trips keep their own list.')}</p>
  </div>
</div>

{#if picking}
  <SetupItemPick {items} {containers} {taken} bag={bagLabel(picking)} onsave={(ids) => save(addItems(setup, ids, picking.key))} onclose={() => (picking = null)} />
{/if}
{#if dialog}
  <SetupDialog kind={dialog.kind} {setup} setups={setups.map((s) => ({ id: s.id, name: nm(s) }))} bikes={others} name={nm(setup)} onsave={(v) => (dialog.kind === 'tobike' ? toBike(v) : remove())} onclose={() => (dialog = null)} />
{/if}
{#if renaming}
  <RenameSheet kicker={t('Bag setup')} title={t('Rename setup')} value={setup.name} hint={t('Bags and places stay as they are.')} onsave={rename} onclose={() => (renaming = false)} />
{/if}

<style>
  .badge {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 2px 8px;
    border-radius: 999px;
    font: 600 var(--fs-tiny) / 1.4 var(--font-body);
  }
  .badge.ok {
    background: var(--ok-soft);
    color: var(--ok);
  }
  .sd {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
    gap: 16px;
    align-items: start;
  }
  .lcol,
  .rcol {
    display: flex;
    flex-direction: column;
    gap: 14px;
    min-width: 0;
  }
  .blk {
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
  .bh p,
  .hint {
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
  .tot {
    margin: 0;
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    gap: 4px 10px;
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .tot b {
    font-size: var(--fs-title);
    color: var(--ink);
  }
  .tot2 {
    margin: -4px 0 0;
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .pl {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(0, 1.4fr);
    align-items: center;
    gap: 10px;
  }
  .loose {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 6px 10px;
    padding: 10px 12px;
    border: 1.5px dashed var(--line-strong);
    border-radius: 12px;
    font-size: var(--fs-small);
  }
  .lz {
    display: inline-flex;
    align-items: center;
    gap: 2px;
  }
  .bg {
    display: flex;
    flex-direction: column;
    gap: 8px;
    min-width: 0;
  }
  .h {
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .n {
    display: inline-grid;
    place-items: center;
    flex: none;
    width: 26px;
    height: 26px;
    border-radius: 50%;
    background: var(--ink);
    color: var(--paper);
    font: 700 var(--fs-small) / 1 var(--font-body);
  }
  .h h3 {
    flex: 1;
    min-width: 0;
    margin: 0;
    font-size: var(--fs-body);
    overflow-wrap: break-word;
  }
  .meta {
    display: flex;
    flex-wrap: wrap;
    gap: 2px 10px;
    margin: 0;
    font-size: var(--fs-small);
    color: var(--ink-3);
  }
  .tag {
    padding: 0 8px;
    border-radius: 999px;
    background: var(--paper-2);
    color: var(--ink-2);
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
    background: var(--ok);
  }
  .fill i.full {
    background: var(--l2);
  }
  .its {
    list-style: none;
    margin: 0;
    padding: 0;
  }
  .its li {
    display: flex;
    align-items: center;
    gap: 8px;
    min-height: 36px;
    border-top: 1px solid var(--line);
  }
  .its li:first-child {
    border-top: 0;
  }
  .in {
    flex: 1;
    min-width: 0;
    overflow-wrap: break-word;
  }
  .wd {
    display: inline-block;
    width: 8px;
    height: 8px;
    margin-right: 6px;
    border-radius: 50%;
    background: var(--l3);
  }
  .g {
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .its .sel {
    max-width: 50%;
  }
  .quiet {
    color: var(--ink-3);
  }
  .ix {
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
  .bf {
    display: flex;
    justify-content: space-between;
    gap: 8px;
  }
  .lk {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    min-height: 40px;
    padding: 0 4px;
    border: 0;
    background: none;
    color: var(--ok);
    font: 600 var(--fs-small) / 1 var(--font-body);
    cursor: pointer;
  }
  .lk.q {
    color: var(--ink-2);
  }
  @media (max-width: 899px) {
    .sd {
      grid-template-columns: minmax(0, 1fr);
    }
  }
</style>
