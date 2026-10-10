<script>
  /**
   * v0.39.0 (AP28, Noah 1a): a new template in 3 steps, #/pack/templates/new?area=…
   *   1 Building blocks: name, area (preselected from the list's switch), the blocks to tick
   *     (Standard always ticked, 4a), › shows what is in a block;
   *   2 Single items: search and categories, + adds; the added ones on top with − and +;
   *   3 Bike, optional (5a): "Without bike" or a bike; only with a bike the bags (automatic by the
   *     usual bag of each item). Days, overnight and ready check fold away. An area without a bike
   *     has "Days" as its third step.
   * Done steps can be tapped. Below always what the template is now and the one orange button; on a
   * computer this summary stands beside the steps. Like a new trip (AP29) the template is saved as
   * soon as it has a name; "Save template" only finishes.
   */
  import { liveQuery } from 'dexie';
  import { Check, ChevronRight, Minus, Plus } from '@lucide/svelte';
  import { db } from '../lib/db.js';
  import { TEMPLATES_KEY, saveTemplates, blankTemplate, upsert, tplByBike } from '../lib/templates.js';
  import { SETS_KEY } from '../lib/sets.js';
  import { STANDARD } from '../lib/blocks2026.js';
  import { nightName } from '../lib/context.js';
  import { knownWeight, formatWeight, itemWeight } from '../lib/gear.js';
  import { TRIP_DOMAINS, DOMAIN, BIKEPACKING, lastDomain } from '../lib/domains.js';
  import { sortBikes } from '../lib/bikes.js';
  import { blockChoices, extraRows, summary } from '../lib/tpl/view.js';
  import ItemPicker from '../lib/tpl/ItemPicker.svelte';
  import BagSplit from '../lib/tpl/BagSplit.svelte';
  import DaysFields from '../lib/tpl/DaysFields.svelte';
  import ReadyFields from '../lib/tpl/ReadyFields.svelte';
  import { t, tn, nameOf } from '../lib/i18n.svelte.js';

  let { area = null } = $props();

  const tplQ = liveQuery(() => db.settings.get(TEMPLATES_KEY));
  const itemsQ = liveQuery(() => db.items.toArray());
  const setsQ = liveQuery(() => db.settings.get(SETS_KEY));
  const bagsQ = liveQuery(() => db.containers.toArray());
  const bikesQ = liveQuery(() => db.bikes.toArray());
  const list = $derived($tplQ?.value ?? []);
  const items = $derived($itemsQ ?? []);
  const setsValue = $derived($setsQ?.value ?? []);
  const bikes = $derived(sortBikes($bikesQ ?? []));

  // svelte-ignore state_referenced_locally
  const first = DOMAIN[area] && DOMAIN[area].trip !== false ? area : lastDomain();
  let draft = $state(blankTemplate({ id: `tpl-${Date.now().toString(36)}`, domain: first ?? BIKEPACKING }));
  let step = $state(1);
  let error = $state('');
  let nameInput = $state();
  $effect(() => {
    if (step === 1) nameInput?.focus();
  });

  const byBike = $derived(tplByBike(draft));
  const STEPS = $derived([t('Building blocks'), t('Single items'), byBike ? t('Bike') : t('Days')]);
  const choices = $derived(blockChoices(items, setsValue, draft.domain));
  const extras = $derived(extraRows(draft, items, setsValue));
  const sum = $derived(summary(draft, items, setsValue));
  const extraSum = $derived(extras.reduce((a, e) => ({ n: a.n + 1, g: a.g + (e.g ?? 0), missing: a.missing + (e.g == null ? 1 : 0) }), { n: 0, g: 0, missing: 0 }));
  const bikeName = $derived(bikes.find((b) => b.id === draft.bikeId)?.name ?? '');
  let openBlock = $state(null);
  let foldOpen = $state(false);

  const taken = (name) => list.some((x) => x.id !== draft.id && `${x.name}`.toLowerCase() === name.trim().toLowerCase());
  const nameOk = () => {
    if (!draft.name.trim()) return (error = t('Give the template a name.')), false;
    if (taken(draft.name)) return (error = t('There is already a template "{name}".', { name: draft.name.trim() })), false;
    error = '';
    return true;
  };

  /* ---------- saved as soon as it has a name (AP29) ---------- */
  let timer;
  let busy = Promise.resolve();
  function save() {
    busy = busy.then(async () => {
      const name = draft.name.trim();
      if (!name || taken(name)) return;
      const rec = await db.settings.get(TEMPLATES_KEY);
      // The draft's snapshot is never its own: the stored one goes along, so saving only rewrites it
      // from the linked fields (a stale snapshot would read as an older writer's change).
      const stored = (rec?.value ?? []).find((x) => x.id === draft.id);
      await saveTemplates(db, upsert(rec?.value ?? [], { ...$state.snapshot(draft), entries: stored?.entries ?? [], name, updatedAt: new Date().toISOString() }));
    });
    return busy;
  }
  $effect(() => {
    JSON.stringify(draft);
    if (!draft.name.trim()) return;
    clearTimeout(timer);
    timer = setTimeout(save, 300);
    return () => clearTimeout(timer);
  });
  // Leaving the page with a name: the last change is saved too.
  $effect(() => () => {
    clearTimeout(timer);
    save();
  });

  /* ---------- changes ---------- */
  const change = (fn) => (draft = fn($state.snapshot(draft)));
  function toggleBlock(key) {
    if (key === STANDARD) return; // Noah 4a: Standard is always in it
    change((x) => {
      const on = x.blocks.includes(key);
      if (on) {
        const { [key]: _, ...without } = x.without ?? {};
        return { ...x, blocks: x.blocks.filter((k) => k !== key), without };
      }
      const members = new Set(choices.find((b) => b.key === key)?.members.map((i) => i.id) ?? []);
      return { ...x, blocks: [...x.blocks, key], extras: x.extras.filter((e) => !members.has(e.itemId)) };
    });
  }
  const addExtra = (itemId) => change((x) => ({ ...x, extras: [...x.extras.filter((e) => e.itemId !== itemId), { itemId, qty: 1 }] }));
  const setQty = (itemId, n) => change((x) => ({ ...x, extras: n < 1 ? x.extras.filter((e) => e.itemId !== itemId) : x.extras.map((e) => (e.itemId === itemId ? { ...e, qty: Math.min(20, n) } : e)) }));
  function setArea(key) {
    change((x) => ({ ...x, domain: key, ...(DOMAIN[key]?.bike ? {} : { bikeId: null, setup: {} }) }));
  }

  function go(n) {
    if (n > 1 && !nameOk()) return (step = 1);
    step = n;
    window.scrollTo?.(0, 0);
  }
  async function finish() {
    if (!nameOk()) return (step = 1);
    clearTimeout(timer);
    await save();
    location.hash = `#/pack/templates/${encodeURIComponent(draft.id)}`;
  }
  const weight = (g, missing, n = 1) => (n ? knownWeight(g, missing) : '–');
  const nightWord = (x) => (x.overnight === 'outdoor' || x.overnight === 'lodging' ? t(nightName(x)) : t('no night'));
</script>

<div class="tn">
  <p class="back"><a href="#/pack/templates">← {t('Templates')}</a></p>
  <h1 class="title big">{t('New template')}</h1>
  <ol class="steps" aria-label={t('Steps')}>
    {#each STEPS as name, n (n)}
      <li>
        {#if n + 1 === step}<b aria-current="step">{n + 1} {name}</b>
        {:else if n + 1 < step}<button type="button" class="done" onclick={() => go(n + 1)}>{n + 1} {name}</button>
        {:else}<span>{n + 1} {name}</span>{/if}
      </li>
    {/each}
  </ol>

  <div class="flowgrid">
    <div class="flow">
      {#if step === 1}
        <label class="field"><span class="lbl">{t('Name')}</span><input class="inp" bind:this={nameInput} bind:value={draft.name} oninput={() => (error = '')} placeholder={t('e.g. Autumn overnighter')} /></label>
        <label class="field"><span class="lbl">{t('Area')}</span>
          <select class="sel" value={draft.domain} onchange={(e) => setArea(e.currentTarget.value)}>
            {#each TRIP_DOMAINS as d (d.key)}<option value={d.key}>{t(d.name)}</option>{/each}
          </select>
        </label>
        {#if error}<p class="err" role="alert">{error}</p>{/if}
        <div class="sh"><span>{t('Building blocks')}</span><small>{t('several possible')}</small></div>
        <ul class="opts">
          {#each choices as b (b.key)}
            {@const on = draft.blocks.includes(b.key)}
            <li class="opt" class:on>
              <button type="button" class="tick" role="checkbox" aria-checked={on} aria-disabled={b.key === STANDARD} onclick={() => toggleBlock(b.key)}>
                <span class="box" aria-hidden="true">{#if on}<Check size={16} />{/if}</span>
                <span class="t">{b.name}{#if b.key === STANDARD}<small>{t('comes into every trip')}</small>{/if}</span>
                <span class="n num">{tn(b.n, '{n} item', '{n} items')}</span><span class="w num">{weight(b.g, b.missing, b.n)}</span>
              </button>
              <button type="button" class="disc" aria-label={t('What is in {name}', { name: b.name })} aria-expanded={openBlock === b.key} onclick={() => (openBlock = openBlock === b.key ? null : b.key)}><ChevronRight class="chev" size={18} aria-hidden="true" /></button>
              {#if openBlock === b.key}
                <ul class="sub">
                  {#each b.members as i (i.id)}<li><span>{nameOf(i)}</span><span class="num">{itemWeight(i) == null ? '–' : formatWeight(itemWeight(i))}</span></li>{:else}<li>{t('No items in this building block yet.')}</li>{/each}
                </ul>
              {/if}
            </li>
          {/each}
        </ul>
      {:else if step === 2}
        <div class="sh"><span>{t('Added')}</span><small class="num">{extraSum.n} · {weight(extraSum.g, extraSum.missing, extraSum.n)}</small></div>
        <ul class="extras">
          {#each extras as e (e.itemId)}
            <li class="extra">
              <span class="t">{e.item ? nameOf(e.item) : e.itemId}</span>
              <span class="w num">{e.g == null ? '–' : formatWeight(e.g)}</span>
              <span class="qty" role="group" aria-label={t('Amount of {name}', { name: e.item ? nameOf(e.item) : e.itemId })}>
                <button type="button" aria-label={t('Fewer: {name}', { name: e.item ? nameOf(e.item) : e.itemId })} onclick={() => setQty(e.itemId, e.qty - 1)}><Minus size={16} aria-hidden="true" /></button>
                <span class="num">{e.qty}×</span>
                <button type="button" aria-label={t('More: {name}', { name: e.item ? nameOf(e.item) : e.itemId })} disabled={e.qty >= 20} onclick={() => setQty(e.itemId, e.qty + 1)}><Plus size={16} aria-hidden="true" /></button>
              </span>
            </li>
          {:else}
            <li class="note">{t('Nothing added yet. Add single items below, or go on.')}</li>
          {/each}
        </ul>
        <div class="pick"><ItemPicker tpl={draft} {items} {setsValue} onadd={addExtra} /></div>
      {:else}
        {#if byBike}
          <BagSplit tpl={draft} {items} {setsValue} bags={$bagsQ ?? []} {bikes} onchange={change} />
        {/if}
        <details class="fold" bind:open={foldOpen}>
          <summary><span>{t('Days, overnight, ready check')}</span><small class="num">{tn(draft.days ?? 1, '{n} day', '{n} days')} · {nightWord(draft)}</small><ChevronRight class="chev" size={18} aria-hidden="true" /></summary>
          <DaysFields tpl={draft} {byBike} onchange={change} />
          <span class="lbl">{t('Ready check')}</span>
          <ReadyFields tpl={draft} onchange={change} />
        </details>
      {/if}

      <div class="sticky">
        <p class="sum"><b>{sum.line}</b><span class="num">{tn(sum.n, '{n} item', '{n} items')} · {weight(sum.g, sum.missing, sum.n)}{#if byBike && bikeName} · {bikeName}{/if}</span></p>
        {#if step < 3}<button type="button" class="btn hi" onclick={() => go(step + 1)}>{t('Next|step')}</button>
        {:else}<button type="button" class="btn hi" onclick={finish}>{t('Save template')}</button>{/if}
      </div>
    </div>
    <aside class="side" aria-label={t('Your template')}>
      <h2>{t('Your template')}</h2>
      <p class="bigw num">{weight(sum.g, sum.missing, sum.n)}</p>
      <p>{sum.line}</p>
      <p class="small num">{tn(sum.n, '{n} item', '{n} items')} · {byBike ? bikeName || t('bike open') : t(DOMAIN[draft.domain]?.name ?? '')}</p>
    </aside>
  </div>
</div>

<style>
  .tn {
    max-width: 1040px;
  }
  .back {
    margin: 0;
  }
  .big {
    font-size: var(--fs-page);
    line-height: var(--lh-title);
    margin: 4px 0;
  }
  .steps {
    list-style: none;
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0 6px;
    margin: 0 0 8px;
    padding: 0;
    font-size: 14px;
    color: var(--ink-3);
  }
  .steps li:not(:last-child)::after {
    content: '·';
    margin-left: 6px;
  }
  .steps li {
    display: inline-flex;
    align-items: center;
    min-height: 44px;
  }
  .steps b {
    color: var(--ink);
  }
  .done {
    min-height: 44px;
    border: 0;
    background: none;
    padding: 0;
    color: var(--ink-2);
    font: inherit;
    text-decoration: underline;
    text-underline-offset: 3px;
    cursor: pointer;
  }
  .flowgrid {
    display: grid;
    gap: 24px;
  }
  .flow {
    min-width: 0;
  }
  .field {
    display: grid;
    gap: 2px;
    margin: 0 0 14px;
  }
  .err {
    color: var(--bad);
    margin: 0 0 8px;
  }
  .sh {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 8px;
    font-size: 14px;
    font-weight: 700;
    color: var(--ink-2);
    margin: 8px 0 2px;
    padding-bottom: 4px;
    border-bottom: 1px solid var(--line);
  }
  .sh small {
    font-weight: 600;
    color: var(--ink-3);
  }
  .opts,
  .extras,
  .sub {
    list-style: none;
    margin: 0;
    padding: 0;
  }
  .opt {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 44px;
    align-items: center;
    border-bottom: 1px solid var(--line);
  }
  .tick {
    display: grid;
    grid-template-columns: 28px minmax(0, 1fr) auto auto;
    align-items: center;
    gap: 4px 10px;
    min-height: 52px;
    border: 0;
    background: none;
    color: var(--ink);
    font: 400 16px var(--font-body);
    text-align: left;
    padding: 4px 0;
    cursor: pointer;
  }
  .tick[aria-disabled='true'] {
    cursor: default;
  }
  .box {
    width: 22px;
    height: 22px;
    border: 2px solid var(--line-strong);
    border-radius: 5px;
    display: grid;
    place-items: center;
    background: var(--paper);
    box-sizing: border-box;
  }
  .opt.on .box {
    background: var(--ink);
    border-color: var(--ink);
    color: var(--paper);
  }
  .t {
    min-width: 0;
    overflow-wrap: break-word;
  }
  .t small {
    display: block;
    color: var(--ink-3);
    font-size: 14px;
  }
  .n {
    color: var(--ink-3);
    font-size: 14px;
    text-align: right;
    white-space: nowrap;
  }
  .w {
    text-align: right;
    min-width: 60px;
    white-space: nowrap;
  }
  .disc {
    width: 44px;
    height: 44px;
    display: grid;
    place-items: center;
    border: 0;
    background: none;
    color: var(--ink-3);
    cursor: pointer;
  }
  .disc :global(.chev) {
    transition: transform 0.15s;
  }
  .disc[aria-expanded='true'] :global(.chev) {
    transform: rotate(90deg);
  }
  .sub {
    grid-column: 1 / -1;
    padding: 0 52px 8px 38px;
  }
  .sub li {
    display: flex;
    justify-content: space-between;
    gap: 8px;
    font-size: 14px;
    color: var(--ink-2);
    padding: 3px 0;
  }
  .extra {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto auto;
    align-items: center;
    gap: 8px;
    min-height: 52px;
    border-bottom: 1px solid var(--line);
  }
  .qty {
    display: inline-flex;
    align-items: center;
    gap: 2px;
  }
  .qty .num {
    min-width: 28px;
    text-align: center;
  }
  .qty button {
    width: 44px;
    height: 44px;
    border: 1.5px solid var(--line);
    background: var(--paper);
    border-radius: 6px;
    display: grid;
    place-items: center;
    color: var(--ink);
    cursor: pointer;
  }
  .qty button:disabled {
    opacity: 0.4;
  }
  .note {
    margin: 8px 0;
    font-size: 14px;
    color: var(--ink-3);
  }
  .pick {
    margin-top: 16px;
  }
  .fold {
    margin-top: 12px;
    border-bottom: 1px solid var(--line);
  }
  .fold summary {
    display: flex;
    align-items: center;
    gap: 8px;
    min-height: 48px;
    font-weight: 600;
    cursor: pointer;
    list-style: none;
  }
  .fold summary::-webkit-details-marker {
    display: none;
  }
  .fold summary span {
    flex: 1;
    min-width: 0;
  }
  .fold summary small {
    color: var(--ink-3);
    font-weight: 500;
  }
  .fold :global(.chev) {
    color: var(--ink-3);
    transition: transform 0.15s;
  }
  .fold[open] :global(.chev) {
    transform: rotate(90deg);
  }
  .sticky {
    position: sticky;
    bottom: calc(76px + env(safe-area-inset-bottom));
    z-index: 4;
    background: var(--ground);
    border-top: 1px solid var(--line);
    padding: 10px 0 12px;
    margin-top: 16px;
    display: flex;
    align-items: center;
    gap: 12px;
  }
  .sum {
    flex: 1;
    min-width: 0;
    margin: 0;
    font-size: 14px;
    color: var(--ink-2);
  }
  .sum b {
    display: block;
    color: var(--ink);
    font-size: 15px;
    overflow-wrap: break-word;
  }
  .sticky .btn.hi {
    min-height: 48px;
    padding: 0 20px;
    flex: none;
  }
  .side {
    display: none;
  }
  @media (min-width: 720px) {
    .sticky {
      bottom: 0;
    }
  }
  @media (min-width: 900px) {
    .flowgrid {
      grid-template-columns: minmax(0, 1fr) 300px;
      align-items: start;
    }
    .side {
      display: block;
      position: sticky;
      top: 88px;
      background: var(--paper);
      border: 1px solid var(--line);
      border-radius: var(--radius);
      padding: 14px 16px;
    }
    .side h2 {
      font-size: 15px;
      margin: 0 0 6px;
      color: var(--ink-3);
    }
    .side p {
      margin: 0 0 6px;
    }
    .bigw {
      font-size: 22px;
      font-weight: 700;
    }
    .small {
      font-size: 14px;
      color: var(--ink-3);
    }
    .sum {
      visibility: hidden;
    }
  }
</style>
