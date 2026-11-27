<script>
  /**
   * «Favoriten» on Heute (was «Schnell öffnen», Noah 01.11.2026 «1a 2a 3b 4a 5a»; since Noah 27.11.2026 «1-5a», step 2): your favourites as
   * small cards right under the greeting (1a, 2a), the first six (3a), behind them «All n ›» (the window FavoritenAlle: all by group, rename
   * and delete a group, order, take one out). On a phone the cards stand big, two by two (Noah 27.11.2026 «a»). «Often used» suggests two
   * pages you open often, quietly: the page name with «×» (5a). «Change» edits right here (add from all functions, rename, take out with
   * Undo, order with arrows and drag, back to the suggestions). Same record as the page Favoriten (lib/quick/quicklinks.js).
   */
  import { Pencil, Check, Plus, Trash2, RotateCcw, Search as SearchIcon, Star, X, Compass, Backpack, BookOpen, Bike, Leaf, Save, ArrowUpRight } from '@lucide/svelte';
  import { liveQuery } from 'dexie';
  import SortArrows from '../ui/SortArrows.svelte';
  import SortGrip from '../ui/SortGrip.svelte';
  import { sortable } from '../ui/sortable.js';
  import { offerDone } from '../ui/rename.svelte.js';
  import { db } from '../db.js';
  import { FEATURES, FEATURE } from '../features.js';
  import { goFeature, runOf } from '../know/featureRun.js';
  import { glowFeature } from '../quick/findcard.js';
  import { USAGE_KEYS, cleanUsage, usePin, suggestions, pathOf } from '../quick/usage.js';
  import { favCards, favTotal, FAV_SUGGESTED } from '../quick/favcards.js';
  import { QUICK_KEYS, deviceKind, cleanQuick, starter, pinLabel, flatPins, moveFlat, addPin, addView, removePin, editPin, findForPin } from '../quick/quicklinks.js';
  import { localDay } from '../localday.js';
  import { t } from '../i18n.svelte.js';

  const kind = deviceKind();
  const KEY = QUICK_KEYS[kind];
  const USED = USAGE_KEYS[kind];

  let s = $state(cleanQuick(null));
  let bikeId = $state(null);
  let editing = $state(false);
  let adding = $state(false);
  let q = $state('');
  let open = $state(null); // the pin being renamed
  let Alle = $state(null); // the window «All favourites» loads on first use (not part of the start)
  let alleOpen = $state(false);
  const ICONS = { compass: Compass, backpack: Backpack, book: BookOpen, bike: Bike, leaf: Leaf, save: Save, link: ArrowUpRight, star: Star };
  let u = $state(cleanUsage(null)); // what this device opened (for the suggestion to pin a page you open often)

  $effect(() => {
    const sub = liveQuery(() => db.settings.bulkGet([KEY, USED])).subscribe({
      next: ([r, used]) => ((s = cleanQuick(r?.value)), (u = cleanUsage(used?.value))),
      error: () => {},
    });
    return () => sub.unsubscribe();
  });
  db.bikes.toCollection().first().then((b) => (bikeId = b?.id ?? null)).catch(() => {});

  const pins = $derived(flatPins(s));
  const cards = $derived(favCards(s, t));
  // Noah 27.11.2026 «5a»: up to two pages you open often, quietly under the cards («×» holds one back for 30 days)
  const suggested = $derived(suggestions(u, s, localDay(), FAV_SUGGESTED));
  const pinSuggested = (r) => change(addView(s, r.href, r.title, s.groups.at(-1)?.id ?? '', localDay()), t('«{name}» pinned.', { name: r.title }));
  async function showAll() {
    Alle ??= (await import('./FavoritenAlle.svelte')).default;
    alleOpen = true;
  }
  const noThanks = (r) => db.settings.put({ key: USED, value: JSON.parse(JSON.stringify({ ...u, no: { ...u.no, [pathOf(r.href)]: localDay() } })) });
  const hits = $derived(findForPin(FEATURES, q, t).filter((f) => !pins.some((p) => p.feature === f.id)).slice(0, 8));

  const save = (next) => db.settings.put({ key: KEY, value: JSON.parse(JSON.stringify(next)) });
  async function change(next, text) {
    const before = $state.snapshot(s);
    s = next;
    await save(next);
    if (text) offerDone(text, () => save(before));
  }

  async function go(p) {
    try {
      const u = cleanUsage((await db.settings.get(USED))?.value);
      await db.settings.put({ key: USED, value: JSON.parse(JSON.stringify(usePin(u, p.id, localDay()))) });
    } catch {
      /* the count is a nicety */
    }
    if (!p.feature) return void (location.hash = p.href);
    const f = FEATURE[p.feature];
    if (!f) return;
    goFeature(f, { bikeId });
    if (!runOf(f)) glowFeature(f.id);
  }
  const move = (a, b) => change(moveFlat(s, a, b));
  const unpin = (p) => change(removePin(s, p.id), t('«{name}» unpinned.', { name: pinLabel(p, t) }));
  const pin = (f) => {
    change(addPin(s, f.id, s.groups.at(-1)?.id ?? ''), t('«{name}» pinned.', { name: t(f.title) }));
    q = '';
  };
  function rename(p, e) {
    e.preventDefault();
    change(editPin(s, p.id, { name: String(new FormData(e.currentTarget).get('name') ?? '') }), t('Pin saved.'));
    open = null;
  }
  const reset = () => change(starter(), t('Back to the suggestions.'));
</script>

<section class="pt" data-pins-tile aria-label={t('Favourites|quick')}>
  <div class="pt-head">
    <h2 class="pt-n"><Star size={20} fill="currentColor" aria-hidden="true" />{t('Favourites|quick')}</h2>
    <button type="button" class="pt-edit" data-pins-edit aria-pressed={editing} onclick={() => ((editing = !editing), (open = null), (adding = false))}>
      {#if editing}<Check size={16} aria-hidden="true" />{t('Done')}{:else}<Pencil size={16} aria-hidden="true" />{t('Change favourites')}{/if}
    </button>
  </div>

  {#if !editing}
    {#if cards.length}
      <div class="pt-grid" role="list">
        {#each cards as c (c.pin.id)}
          {@const I = ICONS[c.icon] ?? Star}
          <button type="button" class="pt-pin" role="listitem" data-pin={c.pin.feature || c.pin.href} onclick={() => go(c.pin)}>
            <span class="pt-i" aria-hidden="true"><I size={18} /></span>
            <span class="pt-tx"><span class="pt-name">{c.label}</span>{#if c.sub}<span class="pt-sub">{c.sub}</span>{/if}</span>
          </button>
        {/each}
      </div>
    {:else}
      <p class="pt-empty" data-pins-empty>{t('No favourites yet. Tap the small star on a card, or «Change favourites».')}</p>
    {/if}
    <div class="pt-foot">
      {#if suggested.length}
        <div class="pt-sug" data-pins-suggested>
          <span class="pt-sl">{t('Often used')}</span>
          {#each suggested as r (r.href)}
            <span class="pt-chip" data-pins-suggest={r.href}>
              <button type="button" class="pt-chip-go" aria-label={t('Add «{name}» to your favourites', { name: r.title })} onclick={() => pinSuggested(r)}><Star size={14} aria-hidden="true" />{r.title}</button>
              <button type="button" class="pt-chip-x" aria-label={t('No, thanks')} onclick={() => noThanks(r)}><X size={14} aria-hidden="true" /></button>
            </span>
          {/each}
        </div>
      {/if}
      <button type="button" class="pt-more" data-pins-all onclick={showAll}>{t('All {n}', { n: favTotal(s) })} ›</button>
    </div>
  {:else}
    <ul class="pt-list" use:sortable={{ onmove: move, row: ':scope > li.pt-row' }}>
      {#each pins as p, i (p.id)}
        <li class="pt-row" data-sort-id={p.id} data-pin-row={p.feature || p.href}>
          <SortGrip name={pinLabel(p, t)} onstep={(d) => move(i, i + d)} />
          {#if open === p.id}
            <form class="pt-form" onsubmit={(e) => rename(p, e)}>
              <input class="pt-input" name="name" value={p.name} placeholder={p.feature ? t(FEATURE[p.feature]?.title ?? '') : p.title} maxlength="60" autocomplete="off" aria-label={t('Name')} />
              <button type="submit" class="btn sm hi">{t('Save')}</button>
              <button type="button" class="btn sm" onclick={() => (open = null)}>{t('Discard')}</button>
            </form>
          {:else}
            <span class="pt-lab">{pinLabel(p, t)}</span>
            <span class="pt-act">
              <button type="button" class="btn sm" aria-label={t('Rename «{name}»', { name: pinLabel(p, t) })} onclick={() => (open = p.id)}><Pencil size={16} aria-hidden="true" /></button>
              <button type="button" class="btn sm" aria-label={t('Unpin «{name}»', { name: pinLabel(p, t) })} onclick={() => unpin(p)}><Trash2 size={16} aria-hidden="true" /></button>
              <SortArrows name={pinLabel(p, t)} {i} n={pins.length} onstep={(d) => move(i, i + d)} />
            </span>
          {/if}
        </li>
      {/each}
    </ul>
    <div class="pt-tools">
      <button type="button" class="btn sm" data-pins-add aria-expanded={adding} onclick={() => (adding = !adding)}><Plus size={16} aria-hidden="true" />{t('Add a shortcut')}</button>
      <button type="button" class="btn sm" data-pins-reset onclick={reset}><RotateCcw size={16} aria-hidden="true" />{t('Back to the suggestions')}</button>
      <a class="pt-more" href="#/quick" data-pins-quick>{t('Groups and notes: Quick Links')} ›</a>
    </div>
    {#if adding}
      <div class="pt-add">
        <label class="pt-search"><SearchIcon size={16} aria-hidden="true" /><input class="pt-input" type="search" bind:value={q} placeholder={t('Search all functions')} aria-label={t('Search all functions')} autocomplete="off" /></label>
        {#if q.trim()}
          <ul class="pt-hits">
            {#each hits as f (f.id)}<li><button type="button" class="pt-hit" onclick={() => pin(f)}><Plus size={14} aria-hidden="true" />{t(f.title)}</button></li>{/each}
            {#if !hits.length}<li class="pt-none">{t('Nothing found.')}</li>{/if}
          </ul>
        {/if}
      </div>
    {/if}
  {/if}
</section>

{#if alleOpen && Alle}
  <Alle {s} {change} {go} onclose={() => (alleOpen = false)} />
{/if}

<style>
  .pt {
    display: grid;
    gap: var(--sp-2);
    padding: var(--sp-3);
    border: 1px solid var(--card-line);
    border-radius: var(--radius-card);
    background: var(--paper);
    box-shadow: var(--card-shadow);
    min-width: 0;
  }
  .pt-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--sp-2);
  }
  .pt-n {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    margin: 0;
    font-size: var(--fs-sub);
    font-weight: 700;
    color: var(--ink);
  }
  .pt-n :global(svg) {
    color: var(--hi);
  }
  .pt-edit {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    min-height: 44px;
    padding: 0 var(--sp-2);
    border: 0;
    background: none;
    color: var(--ink-2);
    font: inherit;
    font-size: var(--fs-small);
    cursor: pointer;
  }
  .pt-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(min(160px, 100%), 1fr)); /* two by two on a phone, big cards (Noah 27.11.2026 «a»); «Werkzeugkasten» needs about 130 px of text (frontend walk E1-006) */
    gap: var(--sp-2);
  }
  .pt-pin {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
    min-height: 96px;
    padding: 10px 12px;
    border: 1px solid var(--line);
    border-radius: var(--r-3);
    background: var(--paper);
    color: var(--ink);
    font: inherit;
    text-align: left;
    min-width: 0;
    cursor: pointer;
  }
  .pt-pin:hover {
    background: var(--paper-2);
  }
  .pt-i {
    flex: none;
    display: grid;
    place-items: center;
    width: 30px;
    height: 30px;
    border-radius: var(--r-2);
    background: var(--hi-soft, var(--paper-2));
    color: var(--hi);
  }
  .pt-tx {
    display: grid;
    gap: 2px;
    min-width: 0;
    width: 100%;
  }
  .pt-name {
    font-weight: 600;
    line-height: 1.2;
    overflow-wrap: break-word;
  }
  .pt-sub {
    color: var(--ink-2);
    font-size: var(--fs-small);
    line-height: 1.2;
    overflow-wrap: break-word;
  }
  .pt-empty {
    margin: 0;
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .pt-foot {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 4px var(--sp-3);
  }
  .pt-sug {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 6px;
    min-width: 0;
  }
  .pt-sl {
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .pt-chip {
    display: inline-flex;
    align-items: center;
    min-height: 44px;
    border: 1px dashed var(--ink-3, var(--line));
    border-radius: var(--r-pill);
    background: var(--paper);
    overflow: hidden;
    max-width: 100%;
  }
  .pt-chip-go,
  .pt-chip-x {
    display: inline-flex;
    align-items: center;
    min-height: 44px;
    border: 0;
    background: none;
    color: var(--ink);
    font: inherit;
    font-size: var(--fs-small);
    cursor: pointer;
  }
  .pt-chip-go {
    gap: 6px;
    padding: 0 6px 0 12px;
    font-weight: 600;
    min-width: 0;
  }
  .pt-chip-go :global(svg) {
    flex: none;
    color: var(--hi);
  }
  .pt-chip-x {
    justify-content: center;
    width: 40px;
    color: var(--ink-3, var(--ink-2));
  }
  .pt-list,
  .pt-hits {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    gap: 4px;
  }
  .pt-row {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--sp-2);
    min-width: 0;
  }
  .pt-act {
    display: flex;
    align-items: center;
    gap: 4px;
    margin-left: auto;
  }
  .pt-lab {
    flex: 1 1 0;
    min-width: 72px;
    font-size: var(--fs-small);
    overflow-wrap: break-word;
  }
  .pt-form {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--sp-2);
    flex: 1 1 auto;
    min-width: 0;
  }
  .pt-input {
    flex: 1 1 140px;
    min-width: 0;
    min-height: 40px;
    padding: 0 var(--sp-2);
    border: 1px solid var(--line);
    border-radius: 8px;
    font: inherit;
  }
  .pt-tools {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--sp-2);
  }
  .pt-more {
    display: inline-flex;
    align-items: center;
    min-height: 44px;
    padding: 0;
    border: 0;
    background: none;
    color: var(--hi);
    font: inherit;
    font-size: var(--fs-small);
    font-weight: 600;
    cursor: pointer;
  }
  .pt-add {
    display: grid;
    gap: var(--sp-2);
  }
  .pt-search {
    display: flex;
    align-items: center;
    gap: var(--sp-2);
  }
  .pt-hit {
    display: flex;
    align-items: center;
    gap: 6px;
    width: 100%;
    min-height: 44px;
    padding: 0 var(--sp-2);
    border: 0;
    border-radius: 8px;
    background: none;
    color: var(--ink);
    font: inherit;
    text-align: left;
    cursor: pointer;
  }
  .pt-hit:hover {
    background: var(--paper-2);
  }
  .pt-none {
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
</style>
