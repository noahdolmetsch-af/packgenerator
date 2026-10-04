<script>
  /**
   * Edit a template directly, without a trip (Noah, 4.10.2026, templates answer 7b):
   * add items from "Not packed" (+ or drag onto a place), change the amount, move or remove
   * them, and edit the name, the kind of ride, the riding hours and the ready check.
   * Every change is saved right away.
   */
  import { liveQuery } from 'dexie';
  import { db } from '../lib/db.js';
  import { TEMPLATES_KEY, updateTemplate } from '../lib/templates.js';
  import { ZONE, NIGHT_SETS } from '../lib/trips.js';
  import { FIXED_ZONES, SLOTS } from '../lib/bikes.js';
  import { CATEGORY, CATEGORIES, formatWeight, isInventory, matches } from '../lib/gear.js';
  import { RIDES } from '../lib/layers.js';
  import { phone } from '../lib/media.svelte.js';
  import NotPacked from '../lib/pack/NotPacked.svelte';

  let { id } = $props();

  const tplQ = liveQuery(() => db.settings.get(TEMPLATES_KEY));
  const itemsQ = liveQuery(() => db.items.toArray());
  const bagsQ = liveQuery(() => db.containers.toArray());
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
      const grams = entries.reduce((sum, e) => sum + (itemsById[e.itemId]?.weightG ?? 0) * (e.qty || 1), 0);
      return { key, name: bag ? bag.name : ZONE[key]?.name ?? key, place: ZONE[key]?.name ?? key, entries, grams };
    });
  });
  let target = $state('seat');
  const targetPlace = $derived(places.find((p) => p.key === target) ?? places.find((p) => p.key === 'seat') ?? places[0]);

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
  const setEntries = (fn) => edit((t) => ({ ...t, entries: fn(t.entries) }));
  function addTo(key, itemId) {
    if (!itemsById[itemId]) return;
    setEntries((es) => (es.some((e) => e.itemId === itemId) ? es.map((e) => (e.itemId === itemId ? { ...e, slot: key } : e)) : [...es, { itemId, slot: key, qty: 1 }]));
  }
  const add = (itemId) => addTo(targetPlace.key, itemId);
  const remove = (itemId) => setEntries((es) => es.filter((e) => e.itemId !== itemId));
  const setQty = (itemId, qty) => setEntries((es) => es.map((e) => (e.itemId === itemId ? { ...e, qty: Math.max(1, Math.min(20, qty)) } : e)));
  const moveTo = (itemId, slot) => setEntries((es) => es.map((e) => (e.itemId === itemId ? { ...e, slot } : e)));

  function rename(value) {
    const clean = value.trim();
    if (clean && clean !== tpl.name) edit((t) => ({ ...t, name: clean }));
  }
  function typedHours(value) {
    const n = value.trim() === '' ? null : Number(value.replace(',', '.'));
    if (n === null || (n > 0 && n <= 24)) edit((t) => ({ ...t, hours: n }));
  }
  let newCheck = $state('');
  function addCheck(event) {
    event.preventDefault();
    const label = newCheck.trim();
    if (!label) return;
    newCheck = '';
    edit((t) => ({ ...t, ready: [...t.ready, { id: `own-${Date.now().toString(36)}`, label }] }));
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
  const tagOf = (i) => (i.always ? 'every trip' : i.role === 'standard' || i.role === 'worn' ? 'standard' : '');
  const totalG = $derived(places.reduce((s, p) => s + p.grams, 0));
</script>

<div class="te">
  <p class="back"><a href="#/pack/templates">← Templates</a></p>
  {#if !tpl}
    <p class="card">{$tplQ ? 'This template does not exist any more.' : 'Loading…'}</p>
  {:else}
    <header class="head">
      <label class="nm"><span class="lbl">Template</span><input class="inp big-inp" value={tpl.name} onchange={(e) => rename(e.currentTarget.value)} aria-label="Template name" /></label>
      <p class="meta num">{tpl.entries.length} items · {formatWeight(totalG)} without bike and bags {#if saved}<span class="ok" role="status">Saved ✓</span>{/if}</p>
    </header>

    <div class="cols">
      <div class="c-np">
        <NotPacked items={candidates} {tagOf} target={targetPlace?.name ?? ''} onadd={add} drag={!phone.matches} bind:q>
          <label class="target">
            <span>Adding to</span>
            <select class="sel" bind:value={target} aria-label="Place that + adds to">
              {#each places as p (p.key)}<option value={p.key}>{p.name}</option>{/each}
            </select>
          </label>
        </NotPacked>
      </div>

      <div class="c-main">
        {#each places as p (p.key)}
          <section class="place" class:over={over === p.key} aria-label={p.name} ondragover={(e) => dragover(e, p.key)} ondragleave={() => over === p.key && (over = null)} ondrop={(e) => drop(e, p.key)}>
            <h2 class="ph"><span class="title">{p.name}</span>{#if p.name !== p.place}<small>{p.place}</small>{/if}<span class="m num">{p.entries.length} · {formatWeight(p.grams)}</span></h2>
            <ul>
              {#each p.entries as e (e.itemId)}
                {@const it = itemsById[e.itemId]}
                <li style:--c={CATEGORY[it?.category]?.color ?? 'var(--line)'} draggable={!phone.matches} ondragstart={(ev) => ev.dataTransfer.setData('text/plain', e.itemId)}>
                  <span class="in">{it?.name ?? e.itemId}</span>
                  <span class="w num" class:nw={it?.weightG == null}>{it?.weightG == null ? 'not weighed' : formatWeight(it.weightG * (e.qty || 1))}</span>
                  <span class="qty">
                    <button type="button" aria-label="One less {it?.name}" disabled={(e.qty || 1) <= 1} onclick={() => setQty(e.itemId, (e.qty || 1) - 1)}>−</button>
                    <span class="num">{e.qty || 1}×</span>
                    <button type="button" aria-label="One more {it?.name}" onclick={() => setQty(e.itemId, (e.qty || 1) + 1)}>+</button>
                  </span>
                  <select class="sel mv" aria-label="Move {it?.name} to" value={e.slot} onchange={(ev) => moveTo(e.itemId, ev.currentTarget.value)}>
                    {#each places as o (o.key)}<option value={o.key}>{o.name}</option>{/each}
                  </select>
                  <button type="button" class="minus" aria-label="Take {it?.name} out of the template" onclick={() => remove(e.itemId)}>−</button>
                </li>
              {:else}
                <li class="empty">Empty</li>
              {/each}
            </ul>
          </section>
        {/each}
      </div>

      <aside class="c-side">
        <section class="box-s">
          <h2 class="title">Ride</h2>
          <div class="chips" role="group" aria-label="Kind of ride">
            {#each RIDES as r (r.key)}
              <button type="button" class="toggle" aria-pressed={tpl.ride === r.key} onclick={() => edit((t) => ({ ...t, ride: t.ride === r.key ? null : r.key }))}>{r.name.replace(' ride', '')}</button>
            {/each}
          </div>
          <label class="hours"><span class="lbl">Riding hours</span><input class="inp num" type="text" inputmode="decimal" value={tpl.hours ?? ''} onchange={(e) => typedHours(e.currentTarget.value)} placeholder="e.g. 6" /></label>
          {#if NIGHT_SETS.some((n) => tpl.sets?.[n.key])}<p class="hint">Night: {NIGHT_SETS.filter((n) => tpl.sets?.[n.key]).map((n) => n.name).join(', ')} (their items are in the list)</p>{/if}
        </section>
        <section class="box-s">
          <h2 class="title">Ready check</h2>
          <ul class="checks">
            {#each tpl.ready as r (r.id)}
              <li><span>{r.label}</span><button type="button" class="minus" aria-label="Remove {r.label}" onclick={() => edit((t) => ({ ...t, ready: t.ready.filter((x) => x.id !== r.id) }))}>−</button></li>
            {/each}
          </ul>
          <form class="addcheck" onsubmit={addCheck}>
            <input class="inp" bind:value={newCheck} placeholder="Add a check" aria-label="Add a check" />
            <button type="submit" class="btn">Add</button>
          </form>
        </section>
        <p class="hint">Bags come from the trip the template was saved from. To change which bags it uses, start a trip from it, change "Bags for this trip" and update the template.</p>
      </aside>
    </div>
  {/if}
</div>

<style>
  .back {
    margin: 0 0 6px;
  }
  .head {
    display: flex;
    flex-wrap: wrap;
    align-items: end;
    gap: 8px 20px;
    border-bottom: 3px solid var(--ink);
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
    font: 900 32px/1.1 var(--font-title);
    text-transform: uppercase;
  }
  .meta {
    margin: 0;
    color: var(--ink-3);
    font-size: 14px;
  }
  .ok {
    color: #2f7a4f;
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
    font-size: 13px;
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
    border-bottom: 2px solid var(--ink);
  }
  .ph .title {
    font-size: 22px;
  }
  .ph small {
    color: var(--ink-3);
    font-size: 12px;
    font-weight: 400;
  }
  .ph .m {
    margin-left: auto;
    font-size: 13px;
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
    font-size: 13px;
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
    font-size: 13px;
  }
  .mv {
    padding: 2px 6px;
    font-size: 13px;
    min-width: 0;
  }
  .box-s {
    background: var(--paper);
    border: 1px solid var(--line);
    padding: 10px;
  }
  .box-s .title {
    font-size: 24px;
    border-bottom: 3px solid var(--ink);
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
