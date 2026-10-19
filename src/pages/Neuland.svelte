<script>
  /**
   * «Neuland» (wish #1007 «Kantonskarte und Bingo» + #1006 «Was war neu?», Noah 19.10.2026): what you
   * reached for the first time. #/neuland (Touren › Rückblick › Neuland), #/neuland?c=<collection>.
   * One collection at a time (chips): its count «12 von 26», a map where it fits, the canton bingo,
   * a searchable list with tick and untick, «dieses Jahr» / «alle Jahre». «Sammlungen wählen» switches
   * each collection on or off, orders them (arrows and drag), renames and deletes, and adds own ones.
   * Everything is a suggestion: the app finds it on your routes; your ticks always win.
   * The logic is in src/lib/neuland/ (neuland.js pure, tested in tests/neuland.test.js).
   */
  import { liveQuery } from 'dexie';
  import { db } from '../lib/db.js';
  import { readRaw, computeFrom, saveState } from '../lib/neuland/store.js';
  import { loadBase } from '../lib/neuland/load.js';
  import {
    stateOf, collectionsOf, collectionName, setOn, moveCollection, moveCollectionTo, addCustom, renameCollection, deleteCustom,
    addItem, editItem, hideItem, removeItem, restoreItem, tick, untick, clearNope, newIn, bingoCard, bingoLines, cantonsInYear,
    itemLabel, whatOf, neulandSummary, placeText, isBuiltIn, LOOSE_ID, CANTON_IDS,
  } from '../lib/neuland/neuland.js';
  import NeulandMap from '../lib/neuland/NeulandMap.svelte';
  import Bingo from '../lib/neuland/Bingo.svelte';
  import ItemSheet from '../lib/neuland/ItemSheet.svelte';
  import CollectionsSheet from '../lib/neuland/CollectionsSheet.svelte';
  import ItemEditSheet from '../lib/neuland/ItemEditSheet.svelte';
  import RenameSheet from '../lib/ui/RenameSheet.svelte';
  import GroupDeleteSheet from '../lib/ui/GroupDeleteSheet.svelte';
  import PathHead from '../lib/ui/PathHead.svelte';
  import Seg from '../lib/ui/Seg.svelte';
  import Empty from '../lib/ui/Empty.svelte';
  import Skeleton from '../lib/ui/Skeleton.svelte';
  import { askDelete, deleteWithUndo } from '../lib/ui/ask.js';
  import { offerDone, offerRename } from '../lib/ui/rename.svelte.js';
  import { dayLong } from '../lib/review/fmt.js';
  import { localDay } from '../lib/localday.js';
  import { t, tn, lang } from '../lib/i18n.svelte.js';
  import AreaIntro from '../lib/intro/AreaIntro.svelte'; // «Anleitungen überall»: the guide of this page (lib/guides.js)
  import { Check, Circle, Search, Plus, SlidersHorizontal, Info, Eye, Compass } from '@lucide/svelte';
  import '../lib/review/review.css';

  const today = localDay();
  const year = today.slice(0, 4);
  const LIST_MAX = 30;
  const LS = 'pg.neuland.sel';

  const rawQ = liveQuery(() => readRaw(db));
  let result = $state.raw(null);
  let failed = $state(false);
  let bg = $state.raw({});
  $effect(() => {
    const raw = $rawQ;
    if (!raw) return;
    let live = true;
    computeFrom(raw, { today })
      .then((r) => live && ((result = r), (failed = false)))
      .catch((err) => {
        console.error(err);
        if (live) failed = true;
      });
    return () => (live = false);
  });
  // the background of the maps, loaded once
  Promise.all([loadBase('cantons'), loadBase('countries'), loadBase('lakes')])
    .then(([cantons, countries, lakes]) => (bg = { cantons, countries, lakes: lakes.filter((l) => l.rings) }))
    .catch((err) => console.error(err));

  const state = $derived(result?.state ?? stateOf(null));
  const tripNames = $derived(Object.fromEntries(($rawQ?.trips ?? []).map((x) => [x.id, x.title ?? x.name ?? ''])));
  const on = $derived(result?.collections ?? []);

  // the chosen collection: ?c= in the address, else the last one on this device, else the first one
  const fromHash = new URLSearchParams(location.hash.split('?')[1] ?? '').get('c');
  let selWant = $state(fromHash || readLs());
  function readLs() {
    try {
      return localStorage.getItem(LS) || '';
    } catch {
      return '';
    }
  }
  function choose(id) {
    selWant = id;
    q = '';
    showAll = false;
    try {
      localStorage.setItem(LS, id);
    } catch {
      /* private window: the choice is only for now */
    }
  }
  const cur = $derived(on.find((c) => c.id === selWant) ?? on[0] ?? null);
  let mode = $state('all'); // 'year' | 'all'
  let q = $state('');
  let showAll = $state(false);

  const name = (c) => collectionName(c);
  const shownName = (it) => (lang.v !== 'de' && it.en ? it.en : it.name);
  const visitedIn = (c, id) => c.visited.get(id);
  const stOf = (c, id) => {
    const v = c.visited.get(id);
    if (!v) return '';
    if (mode === 'all') return 'year';
    return v.day.startsWith(year) ? 'year' : 'old';
  };
  const reached = $derived(cur ? cur.items.filter((i) => cur.visited.has(i.id)).length : 0);
  const newYear = $derived(cur ? newIn(cur.visited, year).length : 0);
  const summary = $derived(result ? neulandSummary(result, year).text : '');
  const nothingYet = $derived(!!result && !result.tracks.length && on.every((c) => !c.visited.size));

  // the list: reached first (newest first), then the open ones A–Z; «dieses Jahr» shows only what was new this year
  const rows = $derived.by(() => {
    if (!cur) return [];
    const needle = q.trim().toLowerCase();
    let list = cur.items;
    if (needle) list = list.filter((i) => shownName(i).toLowerCase().includes(needle) || (i.kt ?? i.region ?? '').toLowerCase() === needle);
    if (mode === 'year') list = list.filter((i) => cur.visited.get(i.id)?.day.startsWith(year));
    const done = list.filter((i) => cur.visited.has(i.id)).sort((a, b) => (cur.visited.get(b.id).day < cur.visited.get(a.id).day ? -1 : 1));
    const open = list.filter((i) => !cur.visited.has(i.id)).sort((a, b) => shownName(a).localeCompare(shownName(b), 'de'));
    return [...done, ...open];
  });
  const shownRows = $derived(showAll || q.trim() ? rows : rows.slice(0, LIST_MAX));

  // the map of the chosen collection
  const mapOf = $derived.by(() => {
    if (!cur) return null;
    const areas = cur.items.filter((i) => i.rings).map((i) => ({ id: i.id, rings: i.rings, bbox: i.bbox, st: stOf(cur, i.id) }));
    const points = cur.items.filter((i) => Number.isFinite(i.lat) && Number.isFinite(i.lon)).map((i) => ({ id: i.id, lat: i.lat, lon: i.lon, st: stOf(cur, i.id) }));
    if (!areas.length && !points.length) return null;
    let view = cur.map ?? 'ch';
    if (!cur.builtIn) view = points.every((p) => p.lat > 45.7 && p.lat < 47.9 && p.lon > 5.9 && p.lon < 10.6) ? 'ch' : 'alps';
    const back = view === 'ch' ? { cantons: cur.id === 'cantons' || cur.id === 'municipalities' ? [] : bg.cantons, lakes: bg.lakes } : view === 'alps' ? { countries: bg.countries, cantons: bg.cantons, lakes: bg.lakes } : {};
    const labels = cur.id === 'cantons' ? cur.items.filter((i) => i.c && i.bbox && (i.bbox[2] - i.bbox[0]) * (i.bbox[3] - i.bbox[1]) > 0.04).map((i) => ({ lon: i.c[0], lat: i.c[1], text: i.id, st: stOf(cur, i.id) })) : [];
    return { view, areas, points, bg: back, labels };
  });
  const lines = $derived((result?.tracks ?? []).map((x) => x.pts));

  // bingo (cantons)
  const cantonNames = $derived(cur?.id === 'cantons' ? Object.fromEntries(cur.items.filter((i) => CANTON_IDS.includes(i.id)).map((i) => [i.id, i.name])) : {});
  const card = $derived(result ? bingoCard(year, result.home) : null);
  const marked = $derived(cur?.id === 'cantons' ? cantonsInYear(cur.visited, year) : new Set());
  const bingo = $derived(card && cur?.id === 'cantons' ? bingoLines(card, marked) : []);

  /* ---------- saving ---------- */
  const save = (next) => saveState(db, next);
  // «Rückmeldungen»: the one calm note at the bottom, «… · Undo» for 4 s (rename.svelte.js), also above an open window
  const withUndo = (text, before) => offerDone(text, () => save(before));

  function toggle(c, it) {
    const v = c.visited.get(it.id);
    if (v) save(untick(state, c.id, it.id, { found: !!c.found[it.id], day: today }));
    else save(tick(state, c.id, it.id, today));
  }

  // windows: one item; the collections; a name (collection or item); the delete question
  let itemOpen = $state.raw(null); // { cid, id }
  let colsOpen = $state(false);
  let naming = $state.raw(null); // { kind: 'newCol' | 'col' | 'newItem' | 'item', c, it }
  let deleting = $state.raw(null); // collection
  const openItem = $derived(itemOpen ? on.find((c) => c.id === itemOpen.cid) : null);
  const openIt = $derived(openItem?.items.find((i) => i.id === itemOpen.id) ?? null);

  function startName(kind, c = null, it = null) {
    naming = { kind, c, it };
  }
  const withPlace = (n) => n.kind === 'newItem' || (n.kind === 'item' && (n.it.own || Number.isFinite(n.it.lat) || n.c.kind !== 'area'));
  async function saveName(text) {
    const n = naming;
    if (n.kind === 'newCol') {
      const r = addCustom(state, text);
      await save(r.state);
      choose(r.id);
      return;
    }
    const before = state;
    await save(renameCollection(state, n.c.id, text));
    offerRename(text || t(n.c.title), () => save(before));
  }
  async function saveItem({ name: text, place }) {
    const n = naming;
    if (n.kind === 'newItem') {
      await save(addItem(state, n.c.id, { name: text, ...(place ?? {}) }).state);
      offerDone(t('«{name}» added.', { name: text }));
      return;
    }
    const before = state;
    await save(editItem(state, n.c.id, n.it.id, { name: text, ...(place ?? {}) }));
    offerDone(t('«{name}» saved.', { name: text || n.it.name }), () => save(before));
  }

  async function hide(c, it) {
    const before = state;
    await save(hideItem(state, it.id, true));
    withUndo(t('«{name}» hidden.', { name: shownName(it) }), before);
  }
  async function removeOwn(c, it) {
    const idx = (isBuiltIn(c.id) ? state.extra[c.id] : state.custom.find((x) => x.id === c.id)?.items)?.findIndex((i) => i.id === it.id) ?? -1;
    const tk = state.ticks[c.id]?.[it.id] ?? null;
    const answer = await askDelete({ title: t('Delete «{name}»?', { name: it.name }), text: t('The entry goes from this collection.') });
    if (answer !== 'delete') return;
    await deleteWithUndo({
      name: it.name,
      text: t('«{name}» deleted.', { name: it.name }),
      run: async () => {
        const r = await readFresh();
        await save(removeItem(r, c.id, it.id));
      },
      undo: async () => save(restoreItem(await readFresh(), c.id, it, idx, tk)),
    });
  }
  const readFresh = async () => stateOf((await db.settings.get('neuland'))?.value);

  async function deleteCol(c, to) {
    const before = state;
    await save(deleteCustom(state, c.id, to, t('Without collection')));
    if (selWant === c.id) choose('');
    withUndo(t('«{name}» deleted.', { name: c.name }), before);
  }
  async function askDeleteCol(c) {
    const n = state.custom.find((x) => x.id === c.id)?.items.length ?? 0;
    if (c.id !== LOOSE_ID || !n) return (deleting = c);
    // «Ohne Sammlung» holds what was left of deleted collections: deleting it takes its entries along
    const answer = await askDelete({ title: t('Delete «{name}»?', { name: c.name }), text: tn(n, 'Its {n} entry goes too. You can undo this for a few seconds.', 'Its {n} entries go too. You can undo this for a few seconds.') });
    if (answer === 'delete') deleteCol(c, null);
  }
  const counts = $derived(Object.fromEntries(state.custom.map((c) => [c.id, c.items.length])));
  const targets = (c) => state.custom.filter((x) => x.id !== c.id).map((x) => ({ id: x.id, name: x.name }));
</script>

<div class="rv-page nl">
  <PathHead crumbs={[{ label: t('Trips|place'), href: '#/trips' }, { label: t('Look back|page'), href: '#/debrief' }]} title={t('New ground')} sub={t('What you experienced for the first time. The app finds it from your routes and rides; you can tick everything yourself.')}>
    <button type="button" class="btn" aria-haspopup="dialog" onclick={() => (colsOpen = true)}><SlidersHorizontal size={16} aria-hidden="true" />{t('Choose collections')}</button>
  </PathHead>
  <AreaIntro place="neuland" />

  {#if failed}
    <Empty icon={Info} text={t("The maps couldn't be loaded. Reload the page; your ticks are safe.")} />
  {:else if !result}
    <Skeleton />
  {:else if !on.length}
    <Empty icon={Compass} title={t('No collection switched on')} text={t('Switch on what you want to collect: cantons, passes, huts, peaks, lakes or your own.')} action={{ label: t('Choose collections'), onclick: () => (colsOpen = true) }} />
  {:else}
    {#if summary}<p class="nl-sum">{summary}</p>{/if}
    {#if nothingYet}
      <p class="nl-hint card"><Info size={18} aria-hidden="true" /><span>{t('Nothing found yet. Upload a ride or give a trip a GPX route: the app then colours in where you were. You can also tick by hand.')} <a href="#/debrief/ride">{t('Upload a ride')}</a></span></p>
    {/if}

    <Seg chips full={false} label={t('Collections')} value={cur?.id} onchange={choose} options={on.map((c) => ({ key: c.id, name: name(c), n: `${c.items.filter((i) => c.visited.has(i.id)).length}` }))} />

    {#if cur}
      <section class="rv-sec nl-sec" aria-labelledby="nl-h">
        <div class="rv-h">
          <div>
            <h2 id="nl-h">{name(cur)}</h2>
            <p class="rv-sub" data-testid="nl-count">
              {t('{n} of {total}', { n: reached, total: cur.items.length })}{#if newYear}{' · '}{tn(newYear, '{n} new in {year}', '{n} new in {year}', { year })}{/if}
            </p>
          </div>
          <Seg small full={false} label={t('Which years')} value={mode} onchange={(v) => ((mode = v), (showAll = false))} options={[{ key: 'year', name: t('This year') }, { key: 'all', name: t('All years') }]} />
        </div>

        <div class="nl-lay">
          <div class="nl-col">
            {#if mapOf}
              <div class="rv-box pad">
                <NeulandMap {...mapOf} {lines} title={t('Map: {name}', { name: name(cur) })} onpick={(id) => (itemOpen = { cid: cur.id, id })} />
                <p class="legend"><span class="sw year"></span>{mode === 'year' ? t('New in {year}', { year }) : t('Been there')} {#if mode === 'year'}<span class="sw old"></span>{t('Earlier years')}{/if}<span class="sw no"></span>{t('Not yet')}</p>
              </div>
            {/if}
            {#if cur.id === 'cantons' && card}
              <div class="rv-box pad">
                <h3 class="nl-h3">{t('Canton bingo {year}', { year })}</h3>
                <Bingo {year} {card} {marked} names={cantonNames} lines={bingo} onhome={(id) => save({ ...state, home: id })} onpick={(id) => (itemOpen = { cid: 'cantons', id })} />
              </div>
            {/if}
          </div>

          <div class="nl-col">
            <div class="rv-box nl-list">
              <label class="find"><Search size={16} aria-hidden="true" /><input type="search" bind:value={q} placeholder={t('Search in {name}', { name: name(cur) })} aria-label={t('Search in {name}', { name: name(cur) })} autocomplete="off" /></label>
              {#if !cur.items.length}
                <Empty text={cur.builtIn ? t('All entries are hidden.') : t('No entries yet. Add a place, e.g. a café with its place.')} action={{ label: t('Add an entry'), onclick: () => startName('newItem', cur) }} />
              {:else if !rows.length}
                <p class="none">{q.trim() ? t('Nothing found for «{q}».', { q: q.trim() }) : t('Nothing new in {year} yet.', { year })}</p>
              {:else}
                <ul class="rows" aria-label={name(cur)}>
                  {#each shownRows as it (it.id)}
                    {@const v = visitedIn(cur, it.id)}
                    {@const label = itemLabel(cur.id, { ...it, name: shownName(it) })}
                    <li class="row" data-id={it.id}>
                      <button type="button" class="tk" class:on={!!v} aria-pressed={!!v} aria-label={v ? t('Been there: {name}. Tap to untick.', { name: label }) : t('Tick: {name}', { name: label })} onclick={() => toggle(cur, it)}>
                        {#if v}<Check size={18} aria-hidden="true" />{:else}<Circle size={18} aria-hidden="true" />{/if}
                      </button>
                      <button type="button" class="nm" aria-haspopup="dialog" onclick={() => (itemOpen = { cid: cur.id, id: it.id })}>
                        <b>{label}</b>
                        <small>{v ? `${dayLong(v.day)}${v.tripId && tripNames[v.tripId] ? ` · ${tripNames[v.tripId]}` : ''}${v.by === 'hand' ? ` · ${t('by hand')}` : ''}` : state.nope[cur.id]?.[it.id] ? t('Marked «not there»') : t('Not yet')}</small>
                      </button>
                    </li>
                  {/each}
                </ul>
                {#if shownRows.length < rows.length}
                  <button type="button" class="btn more" onclick={() => (showAll = true)}>{t('Show all ({n})', { n: rows.length })}</button>
                {/if}
              {/if}
              {#if cur.items.length}<button type="button" class="add" onclick={() => startName('newItem', cur)}><Plus size={18} aria-hidden="true" />{cur.builtIn ? t('Something missing? Add an entry') : t('Add an entry')}</button>{/if}
            </div>
            {#if cur.hidden.length}
              <details class="nl-hidden">
                <summary>{tn(cur.hidden.length, '{n} hidden entry', '{n} hidden entries')}</summary>
                <ul class="rows">
                  {#each cur.hidden as it (it.id)}
                    <li class="row">
                      <span class="nm"><b>{shownName(it)}</b></span>
                      <button type="button" class="btn" onclick={() => save(hideItem(state, it.id, false))}><Eye size={16} aria-hidden="true" />{t('Show again')}</button>
                    </li>
                  {/each}
                </ul>
              </details>
            {/if}
            <p class="rv-note nl-note"><Info size={15} aria-hidden="true" /><span>{cur.kind === 'area' ? t('A route counts where it runs through.') : cur.id === 'lakes' ? t('A route within 300 m of the shore counts as «passed by»; tick a swim yourself.') : cur.builtIn ? t('A route close by counts (pass 600 m, hut 400 m, peak 250 m). Places are rounded; correct one in its window.') : t('An entry with a place counts when a route passes within 200 m.')}</span></p>
          </div>
        </div>
      </section>
    {/if}
  {/if}

  {#if openIt}
    {@const c = openItem}
    <ItemSheet
      item={{ ...openIt, name: shownName(openIt) }}
      what={whatOf(c)}
      label={itemLabel(c.id, { ...openIt, name: shownName(openIt) })}
      visit={c.visited.get(openIt.id) ?? null}
      auto={c.found[openIt.id] ?? null}
      nope={!!state.nope[c.id]?.[openIt.id]}
      tripName={(id) => tripNames[id] ?? ''}
      {today}
      ontick={(day) => save(tick(state, c.id, openIt.id, day))}
      onuntick={() => save(untick(state, c.id, openIt.id, { found: !!c.found[openIt.id], day: today }))}
      onclearnope={() => save(clearNope(state, c.id, openIt.id))}
      onedit={() => startName('item', c, openIt)}
      onhide={() => hide(c, openIt)}
      onremove={() => removeOwn(c, openIt)}
      onclose={() => (itemOpen = null)}
    />
  {/if}
  {#if colsOpen}
    <CollectionsSheet
      list={collectionsOf(state)}
      {counts}
      onswitch={(id, v) => save(setOn(state, id, v))}
      onmove={(from, to) => save(moveCollectionTo(state, from, to))}
      onstep={(id, dir) => save(moveCollection(state, id, dir))}
      onrename={(c) => startName('col', c)}
      ondelete={(c) => askDeleteCol(c)}
      onadd={() => startName('newCol')}
      onclose={() => (colsOpen = false)}
    />
  {/if}
  {#if naming && (naming.kind === 'newCol' || naming.kind === 'col')}
    {@const n = naming}
    <RenameSheet
      kicker={t('New ground')}
      title={n.kind === 'newCol' ? t('Own collection') : t('Rename collection')}
      value={n.kind === 'col' ? n.c.name : ''}
      hint={n.kind === 'newCol' ? t('e.g. «Favourite cafés», «Waterfalls», «Swims in the Aare»') : n.c.builtIn ? t('Empty: the name of the app again.') : ''}
      empty={n.kind === 'col' && n.c.builtIn ? t(n.c.title) : ''}
      onsave={saveName}
      onclose={() => (naming = null)}
    />
  {:else if naming}
    {@const n = naming}
    <ItemEditSheet
      kicker={name(n.c)}
      title={n.kind === 'newItem' ? t('Add an entry') : withPlace(n) ? t('Name and place') : t('Rename')}
      name={n.it?.name ?? ''}
      place={n.it ? placeText(n.it) : ''}
      withPlace={withPlace(n)}
      builtIn={n.kind === 'item' && !n.it.own}
      onsave={saveItem}
      onclose={() => (naming = null)}
    />
  {/if}
  {#if deleting}
    {@const c = deleting}
    <GroupDeleteSheet
      title={t('Delete collection «{name}»?', { name: c.name })}
      count={counts[c.id] ?? 0}
      what={(k) => tn(k, '{n} entry', '{n} entries')}
      none={t('Without collection')}
      noneHint={t('The entries stay under «Without collection» (in «Choose collections»).')}
      targets={targets(c)}
      onconfirm={(to) => deleteCol(c, to)}
      onclose={() => (deleting = null)}
    />
  {/if}
</div>

<style>
  .nl-sum {
    margin: 0 0 12px;
    font-weight: 600;
    color: var(--ink);
  }
  .nl-hint {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    margin: 0 0 16px;
    padding: 12px 16px;
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .nl-hint :global(svg) {
    flex: none;
    margin-top: 1px;
  }
  .nl-sec {
    margin-top: 18px;
  }
  .nl-lay {
    display: grid;
    gap: 16px;
    align-items: start;
  }
  @media (min-width: 1000px) {
    .nl-lay {
      grid-template-columns: minmax(0, 1.2fr) minmax(0, 1fr);
    }
  }
  .nl-col {
    display: grid;
    gap: 16px;
    min-width: 0;
  }
  .nl-h3 {
    margin: 0 0 10px;
    font: 600 var(--fs-body) / 1.3 var(--font-body);
  }
  .legend {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 4px 8px;
    margin: 8px 0 0;
    color: var(--ink-3);
    font-size: var(--fs-tiny);
  }
  .legend .sw {
    display: inline-block;
    width: 12px;
    height: 12px;
    border-radius: 3px;
    border: 1px solid var(--line-strong);
  }
  .legend .sw.year {
    background: var(--accent);
  }
  .legend .sw.old {
    background: color-mix(in srgb, var(--accent) 55%, var(--paper));
  }
  .legend .sw.no {
    background: var(--paper-2);
  }
  .find {
    display: flex;
    align-items: center;
    gap: 8px;
    margin: 8px 0;
    padding: 0 12px;
    min-height: 44px;
    border: 1px solid var(--line);
    border-radius: var(--r-ctl);
    background: var(--input);
    color: var(--ink-3);
  }
  .find input {
    flex: 1;
    min-width: 0;
    min-height: 42px;
    border: 0;
    background: none;
    color: var(--ink);
    font: inherit;
    outline: none;
  }
  .find:focus-within {
    outline: var(--focus-ring);
    outline-offset: 1px;
  }
  .rows {
    list-style: none;
    margin: 0;
    padding: 0;
  }
  .row {
    display: flex;
    align-items: center;
    gap: 4px;
    min-height: 56px;
  }
  .row + .row {
    border-top: 1px solid var(--line);
  }
  .tk {
    flex: none;
    display: grid;
    place-items: center;
    width: 44px;
    height: 44px;
    padding: 0;
    border: 0;
    border-radius: 50%;
    background: none;
    color: var(--ink-3);
    cursor: pointer;
  }
  .tk.on {
    background: var(--accent);
    color: var(--paper);
  }
  .tk:focus-visible,
  .nm:focus-visible {
    outline: var(--focus-ring);
    outline-offset: 1px;
  }
  .nm {
    flex: 1;
    min-width: 0;
    display: grid;
    gap: 1px;
    min-height: 44px;
    padding: 6px 4px;
    border: 0;
    border-radius: var(--r-ctl);
    background: none;
    color: var(--ink);
    font: inherit;
    text-align: left;
    cursor: pointer;
  }
  .nm b {
    font-weight: 500;
    overflow-wrap: break-word;
  }
  .nm small {
    color: var(--ink-3);
    font-size: var(--fs-small);
    overflow-wrap: break-word;
  }
  .none {
    margin: 8px 0;
    color: var(--ink-3);
  }
  .more {
    margin: 8px 0;
  }
  .add {
    display: flex;
    align-items: center;
    gap: 8px;
    width: 100%;
    min-height: 48px;
    margin: 8px 0 10px;
    padding: 0 16px;
    border: 1px dashed var(--line-strong);
    border-radius: var(--r-ctl);
    background: none;
    color: var(--ink);
    font: inherit;
    cursor: pointer;
  }
  .nl-hidden {
    padding: 0 4px;
    font-size: var(--fs-small);
  }
  .nl-hidden summary {
    min-height: 44px;
    display: flex;
    align-items: center;
    cursor: pointer;
    color: var(--ink-2);
  }
  .nl-note {
    display: flex;
    gap: 8px;
    align-items: flex-start;
    margin: 0;
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .nl-note :global(svg) {
    flex: none;
    margin-top: 2px;
  }
</style>
