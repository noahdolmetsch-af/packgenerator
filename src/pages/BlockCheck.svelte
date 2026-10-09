<script>
  /**
   * v0.66.0 «Bausteine prüfen» (Noah 4a, #/blocks/check): one building block after the other, with a
   * progress line. Each block lists its items with weight and the block's total; per item «Keep»,
   * «Out» or «Elsewhere» (pick another block). At the bottom: items from the inventory that probably
   * belong there but are missing (blockcheck.js missingFor), one tap to add. Every action can be
   * undone (a stack, the last one first). First come what the update «Bausteine neu» left to check:
   * the items still to assign (old Lodging) and the temperature rules it set (old Warm, 10 °C).
   * Reached from the Blocks page and from Gear (••• menu) and in More.
   */
  import { liveQuery } from 'dexie';
  import { db } from '../lib/db.js';
  import { formatWeight, itemWeight, OWNERSHIP, isInventory, knownWeight } from '../lib/gear.js';
  import { SETS_KEY, allSets, qtyOf, setUse, blockLabel } from '../lib/sets.js';
  import { STANDARD } from '../lib/blocks2026.js';
  import { setStandard } from '../lib/gear/comes.js';
  import { REVIEW_KEY, settle } from '../lib/blocksplit.js';
  import { checkSteps, blockMembers, missingFor, blockTotal, suggestedIn, withBlock, inBlock } from '../lib/blockcheck.js';
  import { refreshSnapshots } from '../lib/templates.js';
  import { t, tn, nameOf } from '../lib/i18n.svelte.js';
  import { Check, X, ArrowRightLeft, Plus, ChevronLeft, ChevronRight, Undo2, Thermometer } from '@lucide/svelte';
  import { SvelteSet } from 'svelte/reactivity';

  const dataQ = liveQuery(async () => ({
    items: await db.items.toArray(),
    sets: (await db.settings.get(SETS_KEY))?.value ?? [],
    review: (await db.settings.get(REVIEW_KEY))?.value ?? null,
  }));
  const items = $derived($dataQ?.items ?? []);
  const setsValue = $derived($dataQ?.sets ?? []);
  const review = $derived($dataQ?.review ?? null);
  const sets = $derived(allSets(setsValue));

  // The steps are fixed when the page opens, so a settled list does not make the page jump.
  let steps = $state.raw(null);
  $effect(() => {
    if ($dataQ && !steps) steps = checkSteps($dataQ.items, $dataQ.sets, $dataQ.review).map(({ set, ...s }) => s);
  });
  let at = $state(0);
  const step = $derived(steps?.[at] ?? null);
  const setOf = (key) => sets.find((s) => s.key === key) ?? null;
  const nameOfBlock = (key) => (key === STANDARD ? t('Standard|block') : blockLabel(setOf(key) ?? { name: key }));
  const byId = $derived(new Map(items.map((i) => [i.id, i])));

  // A block step: its items (live), the total, the suggestions of the update, what is probably missing.
  const key = $derived(step?.kind === 'block' || step?.kind === 'unassigned' ? step.key : null);
  const members = $derived(step?.kind === 'block' && key ? blockMembers(key, items) : step?.kind === 'unassigned' ? step.ids.map((id) => byId.get(id)).filter(Boolean) : []);
  const total = $derived(key ? blockTotal(setOf(key), members.filter((i) => inBlock(i, key))) : null);
  const open = $derived(step?.kind === 'block' && key ? suggestedIn(review, key) : new Set());
  const missing = $derived(step?.kind === 'block' && key ? missingFor(key, items) : []);
  const openIn = (list) => new Set(review?.[list] ?? []);
  const targets = $derived([{ key: STANDARD, name: t('Standard|block') }, ...sets.map((s) => ({ key: s.key, name: blockLabel(s) }))]);

  // In memory: the items Noah kept in this visit (a tick), and the Undo stack.
  const marks = new SvelteSet();
  let stack = $state.raw([]); // [{ text, snap: { items, review }, mark }]
  const last = $derived(stack.at(-1) ?? null);

  /**
   * One action: change items (fn on each), settle ids in the review, remember the Undo.
   * change: [{ id, fn(item) → item }]; settleIds + how ({ key } or { list }); mark: the tick to set.
   */
  async function act(text, { change = [], settleIds = [], how = {}, mark = null } = {}) {
    const snap = await db.transaction('rw', db.items, db.settings, async () => {
      const before = (await db.items.bulkGet(change.map((c) => c.id))).filter(Boolean);
      const rec = (await db.settings.get(REVIEW_KEY)) ?? null;
      const now = new Date().toISOString();
      const out = before.map((i) => ({ ...change.find((c) => c.id === i.id).fn(i), updatedAt: now }));
      if (out.length) await db.items.bulkPut(out);
      if (settleIds.length && rec?.value) await db.settings.put({ key: REVIEW_KEY, value: settle(rec.value, settleIds, how) });
      return { items: before, review: rec };
    });
    if (change.length) await refreshSnapshots(db); // linked templates follow their blocks
    if (mark) marks.add(mark);
    stack = [...stack, { text, snap, mark }];
  }
  async function undo() {
    const u = stack.at(-1);
    if (!u) return;
    stack = stack.slice(0, -1);
    await db.transaction('rw', db.items, db.settings, async () => {
      if (u.snap.items.length) await db.items.bulkPut(u.snap.items);
      if (u.snap.review) await db.settings.put(u.snap.review);
    });
    if (u.snap.items.length) await refreshSnapshots(db);
    if (u.mark) marks.delete(u.mark);
  }

  // Standard writes its own fields (comes.js, the old ones in step); other blocks item.sets.
  const clean = (patch) => ({ ...patch, role: patch.role || null });
  const outOf = (k) => (i) => (k === STANDARD ? { ...i, ...clean(setStandard(i, false)) } : { ...i, sets: withBlock(i.sets, k, false) });
  const into = (k) => (i) => (k === STANDARD ? { ...i, ...clean(setStandard(i, true)) } : { ...i, sets: withBlock(i.sets, k, true) });
  const how = () => (step?.kind === 'unassigned' ? { list: 'unassigned' } : { key });

  const keep = (i) => act(t('{name} stays in {block}.', { name: nameOf(i), block: nameOfBlock(key) }), { settleIds: [i.id], how: how(), mark: `${key}:${i.id}` });
  const out = (i) => act(t('{name} taken out of {block}.', { name: nameOf(i), block: nameOfBlock(key) }), { change: [{ id: i.id, fn: outOf(key) }], settleIds: [i.id], how: how() });
  function move(i, to) {
    if (!to || to === key) return;
    const from = key;
    act(t('{name} moved to {block}.', { name: nameOf(i), block: nameOfBlock(to) }), { change: [{ id: i.id, fn: (x) => into(to)(outOf(from)(x)) }], settleIds: [i.id], how: how() });
  }
  const add = (i) => act(t('{name} added to {block}.', { name: nameOf(i), block: nameOfBlock(key) }), { change: [{ id: i.id, fn: into(key) }], mark: `${key}:${i.id}` });

  // The temperature rules of the old Warm: confirm or change the value (empty: no rule).
  let temps = $state({});
  const tempOf = (i) => temps[i.id] ?? (typeof i.coldBelow === 'number' ? String(i.coldBelow) : '');
  function confirmCold(i) {
    const raw = String(tempOf(i)).trim().replace(',', '.');
    const n = raw === '' ? null : Math.round(Number(raw));
    if (n !== null && !(Number.isFinite(n) && n >= -30 && n <= 40)) return;
    const text = n === null ? t('{name}: no temperature rule.', { name: nameOf(i) }) : t('{name}: comes below {n} °C.', { name: nameOf(i), n });
    act(text, { change: n === i.coldBelow ? [] : [{ id: i.id, fn: (x) => ({ ...x, coldBelow: n }) }], settleIds: [i.id], how: { list: 'cold' }, mark: `cold:${i.id}` });
  }

  const go = (n) => {
    at = Math.max(0, Math.min((steps?.length ?? 1) - 1, n));
    document.querySelector('main')?.scrollIntoView?.({ block: 'start' });
  };
  const weightText = (i, k) => (isInventory(i) ? formatWeight(itemWeight(i) == null ? null : itemWeight(i) * (k && k !== STANDARD ? qtyOf(setOf(k), i.id) : 1)) : `${t(OWNERSHIP[i.ownership] ?? i.ownership)} · ${t('never packed')}`);
  const pct = $derived(steps?.length ? Math.round(((at + 1) / steps.length) * 100) : 0);
</script>

{#snippet itemRow(i)}
  {@const k = key}
  {@const kept = marks.has(`${k}:${i.id}`)}
  {@const sug = open.has(i.id) || (step.kind === 'unassigned' && openIn('unassigned').has(i.id))}
  {@const gone = step.kind === 'block' ? !inBlock(i, k) : !openIn('unassigned').has(i.id) && !kept}
  <li class="irow" class:done={kept || gone}>
    <div class="in">
      <span class="iname">{nameOf(i)}{#if k !== STANDARD && qtyOf(setOf(k), i.id) !== 1}{' '}<b class="num">× {qtyOf(setOf(k), i.id)}</b>{/if}{#if sug}{' '}<i class="nbadge">{t('suggested|blocks')}</i>{/if}</span>
      <small class="num w">{weightText(i, k)}</small>
    </div>
    {#if kept}
      <span class="state"><Check size={16} aria-hidden="true" /> {t('Kept')}</span>
    {:else if gone}
      <span class="state">{t('Done|task')}</span>
    {:else}
      <span class="acts" role="group" aria-label={nameOf(i)}>
        <button type="button" class="btn sm" onclick={() => keep(i)} aria-label={t('Keep {name} in {block}', { name: nameOf(i), block: nameOfBlock(k) })}><Check size={16} aria-hidden="true" />{t('Keep')}</button>
        <button type="button" class="btn sm" onclick={() => out(i)} aria-label={t('Take {name} out of {block}', { name: nameOf(i), block: nameOfBlock(k) })}><X size={16} aria-hidden="true" />{t('Out|block')}</button>
        <label class="else">
          <ArrowRightLeft size={16} aria-hidden="true" />
          <span class="sr">{t('{name} belongs elsewhere', { name: nameOf(i) })}</span>
          <select class="sel" value="" onchange={(e) => move(i, e.currentTarget.value)}>
            <option value="">{t('Elsewhere…')}</option>
            {#each targets.filter((x) => x.key !== k) as x (x.key)}<option value={x.key}>{x.name}</option>{/each}
          </select>
        </label>
      </span>
    {/if}
  </li>
{/snippet}

<div class="bcheck">
  <p class="back"><a href="#/blocks"><ChevronLeft size={16} aria-hidden="true" />{t('Building blocks')}</a></p>
  <h1 class="title">{t('Check building blocks')}</h1>
  <p class="page-sub">{t('One block after the other: keep what belongs, take out what does not, move what belongs elsewhere.')}</p>

  {#if !steps}
    <p class="page-sub">{t('Loading…')}</p>
  {:else if step}
    <div class="progress">
      <span class="num">{t('Step {n} of {total}', { n: at + 1, total: steps.length })}</span>
      <div class="bar" role="progressbar" aria-label={t('Progress')} aria-valuemin="1" aria-valuemax={steps.length} aria-valuenow={at + 1}><span style:width="{pct}%"></span></div>
    </div>

    <section class="step" aria-labelledby="step-h">
      {#if step.kind === 'cold'}
        <h2 class="sec-head" id="step-h"><span><Thermometer size={16} aria-hidden="true" /> {step.name}</span><span class="n">{tn(step.ids.length, '{n} item', '{n} items')}</span></h2>
        <p class="note">{t('"Warm" is no building block any more: these items now come with the weather, below a temperature. Check the value or change it (empty: no rule).')}</p>
        <ul class="rowlist">
          {#each step.ids.map((id) => byId.get(id)).filter(Boolean) as i (i.id)}
            {@const done = marks.has(`cold:${i.id}`) || !openIn('cold').has(i.id)}
            <li class="irow" class:done>
              <div class="in"><span class="iname">{nameOf(i)}</span><small class="num w">{weightText(i, null)}</small></div>
              {#if done}
                <span class="state"><Check size={16} aria-hidden="true" /> {typeof i.coldBelow === 'number' ? t('below {n} °C', { n: i.coldBelow }) : t('no rule')}</span>
              {:else}
                <form class="acts" onsubmit={(e) => { e.preventDefault(); confirmCold(i); }}>
                  <label class="temp"><span class="sr">{t('Comes below (°C): {name}', { name: nameOf(i) })}</span><span aria-hidden="true">{t('below')}</span><input class="inp num" type="text" inputmode="numeric" value={tempOf(i)} oninput={(e) => (temps[i.id] = e.currentTarget.value)} /><span aria-hidden="true">°C</span></label>
                  <button type="submit" class="btn sm">{t('OK')}</button>
                </form>
              {/if}
            </li>
          {/each}
        </ul>
      {:else}
        <h2 class="sec-head" id="step-h">
          <span>{step.kind === 'unassigned' ? step.name : nameOfBlock(key)}</span>
          {#if total}<span class="n">{tn(total.n, '{n} item', '{n} items')}{#if total.n} · {knownWeight(total.g, total.missing)}{/if}{#if total.food.g || total.food.missing} · {t('food {w}', { w: knownWeight(total.food.g, total.food.missing) })}{/if}</span>{/if}
        </h2>
        <p class="note">{#if step.kind === 'unassigned'}{t('These items were in "Lodging". They are in Hotel/hut for now: keep them there, take them out or move them to another block.')}{:else if key === STANDARD}{t('Comes into every new trip')}{:else}{setUse(setOf(key)?.builtIn ? key : null)}{/if}</p>
        {#if members.length}
          <ul class="rowlist">
            {#each members as i (i.id)}{@render itemRow(i)}{/each}
          </ul>
        {:else}
          <p class="empty">{t('No items in this building block yet.')}</p>
        {/if}
        {#if missing.length}
          <h3 class="mh">{t('Probably missing here')}</h3>
          <ul class="rowlist">
            {#each missing as i (i.id)}
              <li class="irow">
                <div class="in"><span class="iname">{nameOf(i)}</span><small class="num w">{weightText(i, null)}</small></div>
                <span class="acts"><button type="button" class="btn sm" onclick={() => add(i)} aria-label={t('Add {name} to {block}', { name: nameOf(i), block: nameOfBlock(key) })}><Plus size={16} aria-hidden="true" />{t('Add')}</button></span>
              </li>
            {/each}
          </ul>
        {/if}
      {/if}
    </section>

    <nav class="stepnav" aria-label={t('Steps')}>
      <button type="button" class="btn" disabled={at === 0} onclick={() => go(at - 1)}><ChevronLeft size={18} aria-hidden="true" />{t('Back')}</button>
      {#if at < steps.length - 1}
        <button type="button" class="btn hi" onclick={() => go(at + 1)}>{t('Next: {name}', { name: steps[at + 1].kind === 'block' ? nameOfBlock(steps[at + 1].key) : steps[at + 1].name })}<ChevronRight size={18} aria-hidden="true" /></button>
      {:else}
        <a class="btn hi" href="#/blocks">{t('Done')}</a>
      {/if}
    </nav>
  {/if}
</div>

{#if last}
  <div class="undopad" aria-hidden="true"></div>
  <div class="undo" role="status">
    <span>{last.text}</span>
    <button type="button" class="btn hi" onclick={undo}><Undo2 size={16} aria-hidden="true" />{t('Undo')}</button>
  </div>
{/if}

<style>
  .bcheck {
    max-width: 760px;
    margin: 0 auto;
  }
  .back {
    margin: 0 0 4px;
    font-size: var(--fs-small);
  }
  .back a {
    display: inline-flex;
    align-items: center;
    gap: 2px;
    min-height: 44px;
    color: var(--ink-2);
  }
  .progress {
    display: grid;
    gap: 6px;
    margin: 14px 0 0;
    font-size: var(--fs-small);
    color: var(--ink-3);
  }
  .bar {
    height: 6px;
    border-radius: 99px;
    background: var(--paper-2);
    border: 1px solid var(--line);
    overflow: hidden;
  }
  .bar span {
    display: block;
    height: 100%;
    background: var(--ink);
  }
  .sec-head span:first-child {
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }
  .note {
    margin: 8px 0;
    font-size: var(--fs-small);
    color: var(--ink-3);
  }
  .empty {
    color: var(--ink-3);
  }
  .mh {
    margin: 18px 0 6px;
    font-weight: 600;
    font-size: var(--fs-body);
  }
  .irow {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 6px 10px;
    min-height: 52px;
    padding: 6px 12px;
  }
  .irow.done {
    color: var(--ink-3);
  }
  .in {
    flex: 1 1 12em;
    min-width: 0;
    display: grid;
  }
  .iname {
    overflow-wrap: break-word;
  }
  .w {
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .acts {
    flex: 0 1 auto;
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 6px;
    margin-left: auto;
  }
  .acts .btn {
    min-height: 44px;
  }
  .else {
    position: relative;
    display: inline-flex;
    align-items: center;
    gap: 4px;
    color: var(--ink-2);
  }
  .else .sel {
    width: auto;
    max-width: 11em;
    min-height: 44px;
    font-size: var(--fs-small);
  }
  .state {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    margin-left: auto;
    font-size: var(--fs-small);
    color: var(--ink-3);
  }
  .temp {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-size: var(--fs-small);
    color: var(--ink-2);
  }
  .temp .inp {
    width: 4.5em;
    min-height: 44px;
  }
  .stepnav {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    gap: 8px;
    margin: 18px 0 12px;
  }
  .stepnav .btn {
    min-height: 44px;
  }
  .undopad {
    height: 80px;
  }
  .undo {
    position: fixed;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 5;
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;
    background: var(--paper);
    border-top: 1.5px solid var(--line-strong);
    box-shadow: 0 -4px 14px var(--shadow);
    padding: 8px max(12px, calc((100vw - 1560px) / 2)) calc(8px + env(safe-area-inset-bottom));
  }
  .undo span {
    flex: 1 1 180px;
    min-width: 0;
    overflow-wrap: break-word;
  }
  @media (max-width: 719px) {
    .undo {
      bottom: calc(76px + env(safe-area-inset-bottom));
      padding-bottom: 8px;
    }
  }
</style>
