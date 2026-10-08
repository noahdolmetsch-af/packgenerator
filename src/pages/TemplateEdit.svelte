<script>
  /**
   * Edit a template directly, without a trip (Noah, 4.10.2026, templates answer 7b):
   * add items from "Other gear" (+ or drag onto a place), change the amount, move or remove
   * them, and edit the name, the kind of ride, the riding hours and the ready check.
   * Every change is saved right away.
   */
  import { liveQuery } from 'dexie';
  import { db } from '../lib/db.js';
  import { TEMPLATES_KEY, updateTemplate } from '../lib/templates.js';
  import { ZONE, NIGHT_SETS, addEntries } from '../lib/trips.js';
  import { FIXED_ZONES, SLOTS, sortBikes } from '../lib/bikes.js';
  import { CATEGORY, CATEGORIES, formatWeight, knownWeight, weightText, sumKnown, isInventory, matches } from '../lib/gear.js';
  import { RIDES } from '../lib/layers.js';
  import { phone } from '../lib/media.svelte.js';
  import NotPacked from '../lib/pack/NotPacked.svelte';
  import ItemDialog from '../lib/gear/ItemDialog.svelte';
  import { t, tn, nameOf, bagName } from '../lib/i18n.svelte.js';
  import { comesOf } from '../lib/gear/comes.js';

  let { id } = $props();

  const tplQ = liveQuery(() => db.settings.get(TEMPLATES_KEY));
  const itemsQ = liveQuery(() => db.items.toArray());
  const bagsQ = liveQuery(() => db.containers.toArray());
  // v0.26.1 (AP18, Noah 17b): a template keeps days, overnight stay and bike, shown and changed here.
  const bikesQ = liveQuery(() => db.bikes.toArray());
  const bikes = $derived(sortBikes($bikesQ ?? []));
  const NIGHTS = [
    { key: 'none', name: 'None|overnight' },
    { key: 'lodging', name: 'Lodging' },
    { key: 'outdoor', name: 'Outdoor (tent, bivvy)' },
  ];
  function typedDays(value) {
    const n = Math.round(Number(value));
    if (n >= 1 && n <= 60) edit((x) => ({ ...x, days: n }));
  }
  const tpl = $derived(($tplQ?.value ?? []).find((t) => t.id === id) ?? null);
  const items = $derived($itemsQ ?? []);
  const itemsById = $derived(Object.fromEntries(items.map((i) => [i.id, i])));
  const bagById = $derived(Object.fromEntries(($bagsQ ?? []).map((b) => [b.id, b])));

  // Places: on me, mounted, every place with a bag, and any place an item still sits in.
  const places = $derived.by(() => {
    if (!tpl) return [];
    const used = new Set(tpl.entries.map((e) => e.slot));
    const keys = [...FIXED_ZONES.map((z) => z.key), ...SLOTS.filter((s) => tpl.setup?.[s.key] || used.has(s.key)).map((s) => s.key)];
    return keys.map((key) => {
      const bag = bagById[tpl.setup?.[key]];
      const entries = tpl.entries.filter((e) => e.slot === key);
      // v0.22.0 (AP04): unknown is not zero: known grams and the count of items without a weight.
      const { g: grams, missing } = sumKnown(entries.map((e) => (itemsById[e.itemId]?.weightG == null ? null : itemsById[e.itemId].weightG * (e.qty || 1))));
      return { key, name: bag ? bagName(bag.name) : ZONE[key] ? t(ZONE[key].name) : key, place: ZONE[key] ? t(ZONE[key].name) : key, entries, grams, missing };
    });
  });
  let target = $state('seat');
  const targetPlace = $derived(places.find((p) => p.key === target) ?? places.find((p) => p.key === 'seat') ?? places[0]);
  // v0.24.1: a template without a seat pack showed an empty "Adding to"; show the place + really uses.
  $effect(() => {
    if (targetPlace && targetPlace.key !== target) target = targetPlace.key;
  });

  let q = $state('');
  const candidates = $derived.by(() => {
    if (!tpl) return [];
    const on = new Set(tpl.entries.map((e) => e.itemId));
    const order = Object.fromEntries(CATEGORIES.map((c, n) => [c.key, n]));
    return items
      .filter((i) => isInventory(i) && i.category !== 'bags' && !on.has(i.id) && matches(i, { q }))
      .sort((a, b) => (order[a.category] ?? 99) - (order[b.category] ?? 99) || a.name.localeCompare(b.name));
  });

  let saved = $state(false);
  let timer;
  async function edit(fn) {
    await updateTemplate(db, id, fn);
    saved = true;
    clearTimeout(timer);
    timer = setTimeout(() => (saved = false), 2000);
  }
  const setEntries = (fn) => edit((x) => ({ ...x, entries: fn(x.entries) }));
  function addTo(key, itemId) {
    if (!itemsById[itemId]) return;
    setEntries((es) => (es.some((e) => e.itemId === itemId) ? es.map((e) => (e.itemId === itemId ? { ...e, slot: key } : e)) : [...es, { itemId, slot: key, qty: 1 }]));
  }
  const add = (itemId) => addTo(targetPlace.key, itemId);
  // v0.24.1 (Noah 6a): every ticked item into the chosen place, one write.
  const addMany = (itemIds) => setEntries((es) => addEntries(es, itemIds.filter((i) => itemsById[i]), targetPlace.key));
  // v0.24.0 (Noah): an item that is not in your gear yet, added from the search into this template.
  let newItem = $state(null); // { name, key }
  function createAndAdd(name) {
    const have = items.find((i) => isInventory(i) && i.name.toLowerCase() === name.toLowerCase());
    if (have) return addTo(targetPlace.key, have.id);
    newItem = { name, key: targetPlace.key };
  }
  const addNew = (record) => {
    q = '';
    return setEntries((es) => (es.some((e) => e.itemId === record.id) ? es : [...es, { itemId: record.id, slot: newItem.key, qty: 1 }]));
  };
  const remove = (itemId) => setEntries((es) => es.filter((e) => e.itemId !== itemId));
  const setQty = (itemId, qty) => setEntries((es) => es.map((e) => (e.itemId === itemId ? { ...e, qty: Math.max(1, Math.min(20, qty)) } : e)));
  const moveTo = (itemId, slot) => setEntries((es) => es.map((e) => (e.itemId === itemId ? { ...e, slot } : e)));

  function rename(value) {
    const clean = value.trim();
    if (clean && clean !== tpl.name) edit((x) => ({ ...x, name: clean }));
  }
  function typedHours(value) {
    const n = value.trim() === '' ? null : Number(value.replace(',', '.'));
    if (n === null || (n > 0 && n <= 24)) edit((x) => ({ ...x, hours: n }));
  }
  let newCheck = $state('');
  function addCheck(event) {
    event.preventDefault();
    const label = newCheck.trim();
    if (!label) return;
    newCheck = '';
    edit((x) => ({ ...x, ready: [...x.ready, { id: `own-${Date.now().toString(36)}`, label }] }));
  }

  let over = $state(null);
  function drop(event, key) {
    event.preventDefault();
    over = null;
    const itemId = event.dataTransfer.getData('text/plain');
    if (itemId) addTo(key, itemId);
  }
  function dragover(event, key) {
    if (phone.matches) return;
    event.preventDefault();
    over = key;
  }
  const tagOf = (i) => (comesOf(i).standard ? t('Standard|block') : ''); // v0.32.0 (finding 5): one word, the block Standard
  const totalG = $derived(places.reduce((s, p) => s + p.grams, 0));
  const totalMissing = $derived(places.reduce((s, p) => s + p.missing, 0));
</script>

<div class="te">
  <p class="back"><a href="#/pack/templates">← {t('Templates')}</a></p>
  {#if !tpl}
    <p class="card">{$tplQ ? t('This template does not exist any more.') : t('Loading…')}</p>
  {:else}
    <header class="head">
      <label class="nm"><span class="lbl">{t('Template')}</span><input class="inp big-inp" value={tpl.name} onchange={(e) => rename(e.currentTarget.value)} aria-label={t('Template name')} /></label>
      <p class="meta num">{tn(tpl.entries.length, '{n} item', '{n} items')} · {t('{weight} without bike and bags', { weight: knownWeight(totalG, totalMissing) })}{#if totalMissing}{' · '}{t('{n} not weighed', { n: totalMissing })}{/if} {#if saved}<span class="ok" role="status">{t('Saved ✓')}</span>{/if}</p>
    </header>

    <div class="cols">
      <div class="c-np">
        <NotPacked items={candidates} {tagOf} target={targetPlace?.name ?? ''} onadd={add} onaddmany={addMany} drag={!phone.matches} bind:q oncreate={createAndAdd}>
          <label class="target">
            <span>{t('Adding to')}</span>
            <select class="sel" bind:value={target} aria-label={t('Place that + adds to')}>
              {#each places as p (p.key)}<option value={p.key}>{p.name}</option>{/each}
            </select>
          </label>
        </NotPacked>
      </div>

      <div class="c-main">
        {#each places as p (p.key)}
          <section class="place" class:over={over === p.key} aria-label={p.name} ondragover={(e) => dragover(e, p.key)} ondragleave={() => over === p.key && (over = null)} ondrop={(e) => drop(e, p.key)}>
            <h2 class="ph"><span class="title">{p.name}</span>{#if p.name !== p.place}<small>{p.place}</small>{/if}<span class="m num">{p.entries.length} · {p.entries.length && p.missing === p.entries.length ? t('not weighed') : weightText(p.grams, p.missing)}</span></h2>
            <ul>
              {#each p.entries as e (e.itemId)}
                {@const it = itemsById[e.itemId]}
                <li style:--c={CATEGORY[it?.category]?.color ?? 'var(--line)'} draggable={!phone.matches} ondragstart={(ev) => ev.dataTransfer.setData('text/plain', e.itemId)}>
                  <span class="in">{it ? nameOf(it) : e.itemId}</span>
                  <span class="w num" class:nw={it?.weightG == null}>{it?.weightG == null ? t('not weighed') : formatWeight(it.weightG * (e.qty || 1))}</span>
                  <span class="qty">
                    <button type="button" aria-label={t('One less {name}', { name: nameOf(it) })} disabled={(e.qty || 1) <= 1} onclick={() => setQty(e.itemId, (e.qty || 1) - 1)}>−</button>
                    <span class="num">{e.qty || 1}×</span>
                    <button type="button" aria-label={t('One more {name}', { name: nameOf(it) })} onclick={() => setQty(e.itemId, (e.qty || 1) + 1)}>+</button>
                  </span>
                  <select class="sel mv" aria-label={t('Move {name} to', { name: nameOf(it) })} value={e.slot} onchange={(ev) => moveTo(e.itemId, ev.currentTarget.value)}>
                    {#each places as o (o.key)}<option value={o.key}>{o.name}</option>{/each}
                  </select>
                  <button type="button" class="minus" aria-label={t('Take {name} out of the template', { name: nameOf(it) })} onclick={() => remove(e.itemId)}>−</button>
                </li>
              {:else}
                <li class="empty">{t('Empty')}</li>
              {/each}
            </ul>
          </section>
        {/each}
      </div>

      <aside class="c-side">
        <section class="box-s">
          <h2 class="title">{t('Ride')}</h2>
          <div class="chips" role="group" aria-label={t('Kind of ride')}>
            {#each RIDES as r (r.key)}
              <button type="button" class="toggle" aria-pressed={tpl.ride === r.key} onclick={() => edit((x) => ({ ...x, ride: x.ride === r.key ? null : r.key }))}>{t(r.name.replace(' ride', ''))}</button>
            {/each}
          </div>
          <label class="hours"><span class="lbl">{t('Riding hours per day')}</span><input class="inp num" type="text" inputmode="decimal" value={tpl.hours ?? ''} onchange={(e) => typedHours(e.currentTarget.value)} placeholder={t('e.g. 6')} /></label>
          <label class="hours"><span class="lbl">{t('Days')}</span><input class="inp num" type="number" min="1" max="60" value={tpl.days ?? 1} onchange={(e) => typedDays(e.currentTarget.value)} /></label>
          <div class="chips night" role="group" aria-label={t('Overnight')}>
            <span class="lbl">{t('Overnight')}</span>
            {#each NIGHTS as o (o.key)}
              <button type="button" class="toggle" aria-pressed={tpl.overnight === o.key} onclick={() => edit((x) => ({ ...x, overnight: x.overnight === o.key ? null : o.key, cook: o.key === 'outdoor' ? !!x.cook : false }))}>{t(o.name)}</button>
            {/each}
          </div>
          {#if tpl.overnight === 'outdoor'}<label class="ck"><input type="checkbox" checked={!!tpl.cook} onchange={(e) => edit((x) => ({ ...x, cook: e.currentTarget.checked }))} /> {t('Cooking')}</label>{/if}
          <label class="hours bikesel"><span class="lbl">{t('Bike')}</span>
            <select class="sel" value={tpl.bikeId ?? ''} onchange={(e) => edit((x) => ({ ...x, bikeId: e.currentTarget.value || null }))}>
              <option value="">{t('The bike you choose')}</option>
              {#each bikes as b (b.id)}<option value={b.id}>{b.name}</option>{/each}
            </select>
          </label>
          <p class="hint">{t('A new trip from this template starts with these values; you can still change them there.')}</p>
          {#if NIGHT_SETS.some((n) => tpl.sets?.[n.key])}<p class="hint">{t('Night: {sets} (their items are in the list)', { sets: NIGHT_SETS.filter((n) => tpl.sets?.[n.key]).map((n) => t(n.name)).join(', ') })}</p>{/if}
        </section>
        <section class="box-s">
          <h2 class="title">{t('Ready check')}</h2>
          <ul class="checks">
            {#each tpl.ready as r (r.id)}
              <li><span>{t(r.label)}</span><button type="button" class="minus" aria-label={t('Remove {name}', { name: t(r.label) })} onclick={() => edit((x) => ({ ...x, ready: x.ready.filter((y) => y.id !== r.id) }))}>−</button></li>
            {/each}
          </ul>
          <form class="addcheck" onsubmit={addCheck}>
            <input class="inp" bind:value={newCheck} placeholder={t('Add a check')} aria-label={t('Add a check')} />
            <button type="submit" class="btn">{t('Add')}</button>
          </form>
        </section>
        <p class="hint">{t('Bags come from the trip the template was saved from. To change which bags it uses, start a trip from it, change "Bags for this trip" and update the template.')}</p>
      </aside>
    </div>
  {/if}
</div>

{#if newItem}<ItemDialog item={null} {items} preset={{ name: newItem.name }} onsaved={addNew} onkept={addNew} onclose={() => (newItem = null)} />{/if}

<style>
  .back {
    margin: 0 0 6px;
  }
  .head {
    display: flex;
    flex-wrap: wrap;
    align-items: end;
    gap: 8px 20px;
    border-bottom: 1px solid var(--line-strong);
    padding-bottom: 8px;
    margin-bottom: 14px;
  }
  .nm {
    display: grid;
    gap: 2px;
    flex: 1;
    min-width: min(100%, 280px);
  }
  .big-inp {
    font: 900 var(--fs-section)/1.1 var(--font-title);
  }
  .meta {
    margin: 0;
    color: var(--ink-3);
    font-size: 14px;
  }
  .ok {
    color: var(--ok);
    font-weight: 700;
    margin-left: 8px;
  }
  .cols {
    display: grid;
    gap: 16px;
  }
  .c-np,
  .c-main,
  .c-side {
    min-width: 0;
  }
  .c-side {
    display: grid;
    gap: 12px;
    align-content: start;
  }
  @media (min-width: 720px) {
    .cols {
      grid-template-columns: minmax(260px, 320px) minmax(0, 1fr);
      align-items: start;
    }
    .c-np {
      position: sticky;
      top: 60px;
      height: calc(100vh - 76px);
      display: flex;
      flex-direction: column;
    }
    .c-np :global(.np) {
      flex: 1;
    }
    .c-side {
      grid-column: 2;
    }
  }
  @media (min-width: 1180px) {
    .cols {
      grid-template-columns: minmax(270px, 330px) minmax(0, 1fr) minmax(260px, 320px);
    }
    .c-side {
      grid-column: auto;
    }
  }
  .target {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: var(--fs-small);
    font-weight: 700;
    color: var(--ink-3);
  }
  .target .sel {
    flex: 1;
    min-width: 0;
    border-color: var(--hi);
    background: var(--hi-soft);
    font-weight: 700;
  }
  .place {
    margin-bottom: 14px;
  }
  .place.over {
    outline: 3px dashed var(--hi);
    outline-offset: 3px;
  }
  .ph {
    display: flex;
    align-items: baseline;
    gap: 8px;
    margin: 0 0 4px;
    border-bottom: 1px solid var(--line-strong);
  }
  .ph .title {
    font-size: var(--fs-sub);
  }
  .ph small {
    color: var(--ink-3);
    font-size: var(--fs-small);
    font-weight: 400;
  }
  .ph .m {
    margin-left: auto;
    font-size: var(--fs-small);
    font-weight: 400;
    color: var(--ink-3);
  }
  ul {
    list-style: none;
    margin: 0;
    padding: 0;
  }
  .place li {
    display: grid;
    grid-template-columns: 1fr auto auto minmax(0, 150px) auto;
    gap: 8px;
    align-items: center;
    padding: 4px 8px;
    background: var(--paper);
    border-bottom: 1px solid var(--line);
    border-left: 4px solid var(--c);
  }
  .place li[draggable='true'] {
    cursor: grab;
  }
  .place li.empty {
    display: block;
    color: var(--ink-3);
    border-left-color: var(--line);
  }
  @media (max-width: 719px) {
    .place li {
      grid-template-columns: 1fr auto auto;
    }
    .place li .mv {
      grid-column: 1 / 3;
    }
  }
  .in {
    min-width: 0;
    overflow-wrap: anywhere;
  }
  .w {
    font-size: var(--fs-small);
    font-weight: 700;
  }
  .nw {
    color: var(--ink-3);
    font-weight: 400;
  }
  .qty {
    display: inline-flex;
    align-items: center;
    gap: 2px;
  }
  .qty button,
  .minus {
    width: 26px;
    height: 26px;
    border: 1.5px solid var(--ink-3);
    border-radius: 4px;
    background: var(--paper);
    color: var(--ink);
    font: 700 16px/1 var(--font-body);
    cursor: pointer;
  }
  .qty button:disabled {
    opacity: 0.35;
  }
  .qty .num {
    min-width: 24px;
    text-align: center;
    font-size: var(--fs-small);
  }
  .mv {
    padding: 2px 6px;
    font-size: var(--fs-small);
    min-width: 0;
  }
  .box-s {
    background: var(--paper);
    border: 1px solid var(--line);
    padding: 10px;
  }
  .box-s .title {
    font-size: var(--fs-sub);
    border-bottom: 1px solid var(--line-strong);
    margin: 0 0 8px;
  }
  .chips {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin-bottom: 8px;
  }
  .toggle {
    border: 1.5px solid var(--ink-3);
    background: var(--paper);
    border-radius: 999px;
    padding: 5px 12px;
    font: 600 14px var(--font-body);
    color: var(--ink);
    cursor: pointer;
  }
  .toggle[aria-pressed='true'] {
    background: var(--ink);
    border-color: var(--ink);
    color: var(--paper);
  }
  .hours {
    display: grid;
    grid-template-columns: auto 90px;
    align-items: center;
    gap: 10px;
  }
  /* v0.26.1 (Noah 17b): days, overnight stay and bike of the template. */
  .hours + .hours {
    margin-top: 8px;
  }
  .bikesel {
    grid-template-columns: auto minmax(0, 1fr);
    margin-top: 8px;
  }
  .night {
    margin-top: 10px;
    align-items: center;
  }
  .night .lbl {
    flex-basis: 100%;
  }
  .ck {
    display: flex;
    align-items: center;
    gap: 8px;
    min-height: 40px;
  }
  .hint {
    color: var(--ink-3);
    font-size: 14px;
  }
  .checks li {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 8px;
    padding: 6px 0;
    border-bottom: 1px solid var(--line);
  }
  .addcheck {
    display: grid;
    grid-template-columns: 1fr auto;
    gap: 8px;
    margin-top: 10px;
  }
</style>
