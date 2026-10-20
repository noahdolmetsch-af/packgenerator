<script>
  import { UNDO_MS } from '../lib/ui/undo.js';
  import { plainError } from '../lib/clear/errors.js'; // Paket Q #127: plain words instead of technical text
  /**
   * v0.36.0 (Noah 1a, 2a, 3b): "Import prüfen" (#/gear/import). The reviewed gear list waits here
   * before anything goes into Gear: three folded groups (Schon da, Neu, Unsicher), then the app items
   * the list does not name (Nicht im Import, archive only). One orange button takes the safe ones;
   * a backup comes first and "Rückgängig" puts it back. Rules: src/lib/gearimport.js; writes:
   * src/lib/gear/importdb.js.
   * v0.37.1 "Zusammenlegen": a "Nicht im Import" row can also be merged into its imported
   * counterpart (MergeSheet, mergeitems.js); "Merged · Undo" comes as a toast.
   * v0.42.0 (Noah 7-11) "Schritt 2": a second tab "Kits, building blocks, tasks" reads the same file:
   * temperature kits become building blocks, a similar favourite kit or Excel block gets Merge | New |
   * Leave out, the tasks become one preparation list, old trips go into the Logbook. One main button
   * "Apply"; a backup comes first and "Undo" puts it back. Rules: importstep2.js.
   * SN5 «Seiten neu» (Noah 13.10.2026 «ich gebe alle bild mockups frei»): the head with its path and
   * the one main button «Übernehmen»; four numbers on top; «Neu» open, each item with a pressed
   * «Übernehmen» (tap it off: it stays in the import for later); «Unsicher», «Schon da» and «Nicht im
   * Import» calm below; on the side «So geht es» and «Import verwerfen».
   * SN5+ (Noah 13.10.2026, answers 4a 5b): I1 the weight before → after (only what is on «Übernehmen»);
   * I3 each new item a pill «→ category · bag» that opens the category and bag as buttons (the bag is a
   * suggestion from the category); I2 «Schon da» says what it gets and what stays (no source ID); I4
   * «Letzte Importe»: the last three, each one with «Rückgängig» (what changed since stays, said quietly).
   */
  import { liveQuery } from 'dexie';
  import { SvelteSet } from 'svelte/reactivity';
  import { db } from '../lib/db.js';
  import { planGearImport, FIELD_NAMES, categoryName, isGearImportFile, stagedStatus, appliedNothing, SKIP } from '../lib/gearimport.js';
  import { stageImport, decide, dropStaged, applyImport, undoImport, changedSince, lastApplied, keepImport, archiveItems, STAGED, UNDO, UNDO2, applyStep2, undoStep2, lastApplied2, keepStep2, choose2, setPlace, undoEntry } from '../lib/gear/importdb.js';
  import { importWeight, changeLines, BAG_CHOICES, HISTORY } from '../lib/gear/importplus.js';
  import { hasStep2, planStep2, defaultChoice } from '../lib/importstep2.js';
  import { tempRange } from '../lib/wardrobe.js';
  import { SETS_KEY } from '../lib/sets.js';
  import Seg from '../lib/ui/Seg.svelte';
  import { undoBulk } from '../lib/gear/bulk.js';
  import MergeSheet from '../lib/gear/MergeSheet.svelte';
  import { demoState } from '../lib/demo.js';
  import { formatWeight, itemWeight, choosable, BAG } from '../lib/gear.js';
  import { domainName } from '../lib/domains.js';
  import { t, tn, nameOf, locale } from '../lib/i18n.svelte.js';
  import PathHead from '../lib/ui/PathHead.svelte';
  import Section from '../lib/ui/Section.svelte';
  import Btn from '../lib/ui/Btn.svelte';
  import OptionButton from '../lib/ui/OptionButton.svelte';
  import { catIcon } from '../lib/gear/caticon.js';
  import { Check, Archive, ChevronRight, ArrowRight, Pencil, Info, FileText, Undo2, Backpack } from '@lucide/svelte';

  const stagedQ = liveQuery(() => db.table('meta').get(STAGED));
  const undoQ = liveQuery(async () => ((await db.table('meta').get(UNDO)) ? lastApplied(db) : null));
  const itemsQ = liveQuery(() => db.items.toArray());
  const learnQ = liveQuery(() => db.learnings.toArray());
  const demoQ = liveQuery(() => demoState(db));
  // v0.42.0: step 2 works on the building blocks, the tasks and the logbook.
  const setsQ = liveQuery(() => db.settings.get(SETS_KEY));
  const tasksQ = liveQuery(() => db.maintenance.toArray());
  const eventsQ = liveQuery(() => db.events.toArray());
  const undo2Q = liveQuery(async () => ((await db.table('meta').get(UNDO2)) ? lastApplied2(db) : null));

  const ready = $derived($stagedQ !== undefined || $itemsQ !== undefined);
  const staged = $derived($stagedQ ?? null);
  const data = $derived(staged?.data ?? null);
  // The plan follows the file and the gear as they are now (the decisions do not change it).
  // SN5+ (I3): the category and bag chosen for new items (staged.places) go into the plan.
  const plan = $derived(data && $itemsQ && $learnQ ? planGearImport(data, $itemsQ, $learnQ, undefined, staged?.places ?? {}) : null);
  const decisions = $derived(staged?.decisions ?? {});
  const decided = $derived(plan ? plan.unsure.filter((r) => decisions[r.key]).length : 0);
  // SN5: a new item is taken unless it was tapped off (decisions[key] === SKIP, it stays in the import).
  const takes = (r) => decisions[r.key] !== SKIP;
  const freshOn = $derived(plan ? plan.fresh.filter(takes).length : 0);
  const safeN = $derived(plan ? plan.same.length + freshOn : 0);
  const flipFresh = (r) => decide(db, r.key, takes(r) ? SKIP : null);
  // SN5+ (I2): what a «Schon da» item gets and what stays; only the source ID: nothing new to say.
  const sameLines = $derived(plan ? plan.same.map((r) => ({ r, ...changeLines(r) })) : []);
  const sameWith = $derived(sameLines.filter((x) => x.adds.length));
  const sameNone = $derived(sameLines.filter((x) => !x.adds.length).map((x) => x.r));
  // SN5+ (I1): the weight of the gear list before and after.
  const weight = $derived(plan && $itemsQ ? importWeight(plan, $itemsQ, decisions, SKIP) : null);
  const barNew = $derived(weight && weight.after > 0 ? Math.max(0, weight.delta) / weight.after : 0);
  // SN5+ (I3): the place of a new item, opened under its row.
  let placing = $state(null); // the key of the open row
  const bagText = (key) => (key ? t(BAG[key] ?? key) : t('no bag'));
  // A new category brings its suggested bag, unless a bag was chosen by hand (then that one stays).
  const pickCat = (r, key) => setPlace(db, r.key, { category: key });
  const pickBag = (r, key) => setPlace(db, r.key, { bag: r.item.defaultBag === key ? null : key });
  // SN5+ (I4, 5b): the last imports, each one can be undone.
  const histQ = liveQuery(async () => (await db.table('meta').get(HISTORY))?.list ?? []);
  const plusWeight = (g) => (g ? `${g > 0 ? '+' : '−'}${formatWeight(Math.abs(g))}` : '');
  const histLine = (e) => [when(e.at), [e.counts.added ? t('{n} new', { n: e.counts.added }) : '', e.counts.completed ? t('{n} completed|import', { n: e.counts.completed }) : ''].filter(Boolean).join(', '), plusWeight(e.grams)].filter(Boolean).join(' · ');
  const keptText = (kept) => {
    const names = kept.filter((k) => !k.learning).map((k) => k.name);
    return names.length ? tn(names.length, '{n} item stays because it changed since: {names}.', '{n} items stay because they changed since: {names}.', { names: names.join(', ') }) : '';
  };
  const undoOne = (e) =>
    run(async () => {
      const res = await undoEntry(db, e.id);
      message = [t('Undone: {name}.', { name: e.name || t('Gear list') }), keptText(res.kept)].filter(Boolean).join(' ');
    });

  /* ---------- v0.42.0 step 2 ---------- */
  const two = $derived(!!data && hasStep2(data));
  const step1Done = $derived(!!data && !(data.items ?? []).length);
  // v0.45.0 (coordinator fix 1): the status line under the file name follows the last apply.
  const status = $derived(stagedStatus(staged, $undoQ));
  let tab = $state(null);
  const shownTab = $derived(tab ?? (two && step1Done ? 'step2' : 'material'));
  const plan2 = $derived(two && $itemsQ && $tasksQ && $eventsQ && $setsQ !== undefined ? planStep2(data, { items: $itemsQ, sets: $setsQ?.value ?? [], tasks: $tasksQ, events: $eventsQ }) : null);
  const choices2 = $derived(staged?.choices2 ?? {});
  const choiceOf = (b) => choices2[b.id] ?? defaultChoice(b);
  const similar = $derived(plan2 ? plan2.blocks.filter((b) => b.status === 'similar') : []);
  const plainBlocks = $derived(plan2 ? plan2.blocks.filter((b) => b.status !== 'similar') : []);
  const counts2 = $derived.by(() => {
    if (!plan2) return null;
    const newKits = plan2.kits.filter((k) => k.status === 'new').length;
    const merge = similar.filter((b) => choiceOf(b) === 'merge').length;
    const newBlocks = plan2.blocks.filter((b) => b.status === 'new' || (b.status === 'similar' && choiceOf(b) === 'new')).length;
    return { newKits, merge, newBlocks, tasks: plan2.tasks.add.length, trips: plan2.oldTrips.add.length };
  });
  const tr = (s, v) => t(s, v);
  const kitRange = (k) => tempRange(k.minC, k.maxC, tr) || '–';
  const CHOICES = $derived([{ key: 'merge', name: t('Merge|blocks') }, { key: 'new', name: t('New|block') }, { key: 'skip', name: t('Leave out') }]);
  const apply2 = () =>
    run(async () => {
      await applyStep2(db);
      message = '';
      window.scrollTo(0, 0);
    });
  const undo2 = () =>
    run(async () => {
      if ((await changedSince(db)) && !confirm(t('Changes made after the import are undone too. Undo anyway?'))) return;
      await undoStep2(db);
      tab = 'step2';
      message = t('Undone: everything is as before the import. The list waits here again.');
    });

  let message = $state('');
  let busy = $state(false);
  let archived = $state.raw(null); // { text, snap } for the archive undo (raw: the snapshot goes back into the database)

  const when = (iso) => new Date(iso).toLocaleString(locale(), { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  const fieldText = (a) => {
    const name = t(FIELD_NAMES[a.field] ?? a.field);
    if (a.field === 'weightG') return `${name} ${formatWeight(a.value)}`;
    if (a.field === 'domains') return `${name}: ${a.value.map((d) => t(domainName(d))).join(', ')}`;
    if (a.field === 'leaveHome' || a.field === 'sourceId' || a.field === 'note') return name;
    return `${name}: ${a.value}`;
  };
  const catText = (key) => (key ? t(categoryName(key)) : t('No category'));
  // SN5+ (I2): one change in words: «+ Reiseart Alltag», «+ Notiz «…»», «+ Gewicht 60 g».
  const addText = (a) => {
    if (a.field === 'domains') return a.value.map((d) => t('+ Trip kind {name}', { name: t(domainName(d)) })).join('  ');
    if (a.field === 'note') return t('+ Note «{text}»', { text: a.value });
    if (a.field === 'weightG') return t('+ Weight {w}', { w: formatWeight(a.value) });
    if (a.field === 'category') return t('+ Category {name}', { name: catText(a.value) });
    if (a.field === 'leaveHome') return `+ ${t('Optional')}`;
    return `+ ${fieldText(a)}`;
  };
  const stayText = (s) => (s.field === 'weightG' ? t('Weight {w}', { w: formatWeight(s.value) }) : s.field === 'name' ? t('Name') : t('Category'));
  const pct = (s) => `${Math.round(s * 100)} %`;

  async function run(fn) {
    if (busy) return;
    busy = true;
    try {
      await fn();
    } catch (err) {
      message = `${t('Nothing was changed.')} ${t(plainError(err))}`;
    } finally {
      busy = false;
    }
  }

  async function pickFile(event) {
    const file = event.target.files[0];
    event.target.value = '';
    if (!file) return;
    try {
      const parsed = JSON.parse(await file.text());
      if (!isGearImportFile(parsed)) return (message = `${t('This is not a gear import file.')} ${t('Nothing was changed.')}`);
      const problems = await stageImport(db, parsed, file.name);
      message = problems.length ? `${problems.map((p) => t(p)).join(' ')} ${t('Nothing was changed.')}` : '';
    } catch {
      message = `${t('This file could not be read.')} ${t('Nothing was changed.')}`;
    }
  }

  const choose = (key, choice) => decide(db, key, decisions[key] === choice ? null : choice);
  // SN5: the head's one main button: the safe ones (Gear) or the kits, blocks and tasks (step 2).
  const canApply = $derived(!busy && !$demoQ && (shownTab === 'step2' ? !!plan2 && !plan2.empty : !!plan && safeN + decided > 0));

  const applySafe = () =>
    run(async () => {
      await applyImport(db);
      archived = null;
      // The card at the top says what was applied, with "Rückgängig".
      message = '';
      window.scrollTo(0, 0);
    });

  const undo = () =>
    run(async () => {
      if ((await changedSince(db)) && !confirm(t('Changes made after the import are undone too. Undo anyway?'))) return;
      await undoImport(db);
      message = t('Undone: everything is as before the import. The list waits here again.');
    });

  const discard = () =>
    run(async () => {
      if (!confirm(t('Discard this import? Nothing in your gear changes.'))) return;
      await dropStaged(db);
      message = '';
    });

  /* ---------- Nicht im Import (3b): archive, never delete ---------- */
  const picked = new SvelteSet();
  const notIn = $derived(plan?.notIn ?? []);
  const chosen = $derived(notIn.filter((i) => picked.has(i.id)));
  const flip = (id) => (picked.has(id) ? picked.delete(id) : picked.add(id));
  const archive = (ids) =>
    run(async () => {
      const snap = await archiveItems(db, ids);
      for (const id of ids) picked.delete(id);
      archived = { text: tn(ids.length, '{n} item archived (Gear → Gone).', '{n} items archived (Gear → Gone).'), snap };
    });
  /* ---------- v0.37.1 Zusammenlegen ---------- */
  let merging = $state(null); // the item whose merge sheet is open
  let merged = $state.raw(null); // { snap } for the toast's undo
  let toastTimer;
  function mergedDone(snap) {
    picked.delete(snap.merge.oldId);
    merged = { snap };
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => (merged = null), UNDO_MS);
  }
  const unmerge = () =>
    run(async () => {
      if (!merged) return;
      await undoBulk(db, merged.snap);
      merged = null;
      clearTimeout(toastTimer);
    });
  const unarchive = () =>
    run(async () => {
      if (!archived) return;
      await undoBulk(db, archived.snap);
      archived = null;
    });
</script>

{#snippet headMeta()}
  <!-- v0.45.0 (coordinator fix 1): after an apply the line says when, not "nothing applied yet" (SN5: in the head). -->
  <p class="imeta">{staged.name || t('Gear list')} · {t('chosen {when}', { when: when(staged.at) })} · <span data-applied>{status.at ? t(status.text, { when: when(status.at) }) : t(status.text)}</span></p>
{/snippet}

<div class="imp">
  <PathHead crumbs={[{ label: t('Gear|place'), href: '#/gear' }]} title={t('Check import')} extra={plan ? headMeta : null}>
    {#if plan}
      {#if shownTab === 'step2' && plan2}<Btn kind="hi" icon={Check} label={t('Apply|step2')} disabled={!canApply} onclick={apply2} />
      {:else}<Btn kind="hi" icon={Check} label={t('Apply|import')} explain={t('Apply all safe ones')} disabled={!canApply} onclick={applySafe} />{/if}
    {/if}
  </PathHead>

  {#if $undoQ}
    <!-- After applying: what happened, and one tap back. -->
    <div class="done card" role="status">
      <p>
        <b>{t('Import applied {when}.', { when: when($undoQ.at) })}</b>
        <!-- v0.45.0 (coordinator fix 2): an apply that changed nothing says so in words. -->
        {#if appliedNothing($undoQ.counts)}<span data-nothing>{t('Nothing to add: all items were already complete.')}</span>
        {:else}{t('{enriched} completed, {added} new, {learn} learnings. A backup was made first.', { enriched: $undoQ.counts.enriched + $undoQ.counts.merged, added: $undoQ.counts.added, learn: $undoQ.counts.learningsAdded })}{/if}
      </p>
      <div class="acts">
        <button type="button" class="btn" disabled={busy} onclick={undo}>{t('Undo')}</button>
        <a class="btn" href="#/gear">{t('To the gear')}</a>
        <button type="button" class="btn link" disabled={busy} onclick={() => keepImport(db)} data-explain={t('Keep, forget the backup')}>{t('Keep|import')}</button>
      </div>
    </div>
  {/if}

  {#if $undo2Q}
    <div class="done card" role="status">
      <p>
        <b>{t('Kits, building blocks and tasks applied {when}.', { when: when($undo2Q.at) })}</b>
        {t('{kits} kits and {blocks} building blocks made, {merged} merged, {tasks} tasks, {trips} old trips. A backup was made first.', { kits: $undo2Q.counts.kits, blocks: $undo2Q.counts.blocks, merged: $undo2Q.counts.merged, tasks: $undo2Q.counts.tasks, trips: $undo2Q.counts.oldTrips })}
      </p>
      <div class="acts">
        <button type="button" class="btn" disabled={busy} onclick={undo2}>{t('Undo')}</button>
        <a class="btn" href="#/blocks" data-explain={t('To the building blocks')}>{t('Building blocks|back')}</a>
        <button type="button" class="btn link" disabled={busy} onclick={() => keepStep2(db)} data-explain={t('Keep, forget the backup')}>{t('Keep|import')}</button>
      </div>
    </div>
  {/if}

  {#if message}<p class="msg" role="status">{message}</p>{/if}

  {#if ready && !data}
    {#if !$undoQ}
      <div class="empty card">
        <!-- Impeccable runde 2 (Import 1): in plain words, where the file comes from; the one action is the main button -->
        <p>{t('Here a gear list comes into the app, for example one Claude built from your Excel list (a file ending in .json). You first see every item and decide what is taken over. Nothing goes into your gear before you confirm it.')}</p>
        <label class="btn hi pickl">{t('Choose a gear list')}<input type="file" accept="application/json,.json,text/plain,.txt" onchange={pickFile} hidden /></label>
      </div>
    {/if}
    <!-- SN5+ (I4, Noah 5b): the last three imports, each with «Rückgängig» -->
    <div class="hist">
      <Section title={t('Last imports')} sub={$histQ?.length ? t('the last three · each one can be undone') : ''} id="imp-history">
        {#if $histQ?.length}
          <ul class="card slist" data-sec="history">
            {#each $histQ as e (e.id)}
              <li class="srow">
                <span class="sib" aria-hidden="true"><FileText size={18} /></span>
                <span class="sm"><b>{e.name || t('Gear list')}</b><small class="num">{histLine(e)}</small>
                  {#if e.undone}<small class="undone">{t('undone {when}', { when: when(e.undone) })}{#if e.kept?.length}{' · '}{tn(e.kept.length, '{n} item stayed', '{n} items stayed')}{/if}</small>{/if}
                </span>
                <!-- the newest import's «Rückgängig» is the card above while it shows (one button per import) -->
                {#if !e.undone && e.id !== $undoQ?.histId}<span class="rowacts"><Btn icon={Undo2} label={t('Undo')} aria={t('Undo the import {name}', { name: e.name || t('Gear list') })} disabled={busy || !!$demoQ} onclick={() => undoOne(e)} /></span>{/if}
              </li>
            {/each}
          </ul>
          <p class="shint"><Info size={15} aria-hidden="true" /><span>{t('Undo takes back what this import brought. What you changed yourself since stays, and the app says so.')}</span></p>
        {:else}
          <p class="note">{t('No import yet.')}</p>
        {/if}
      </Section>
    </div>
  {:else if plan}

    {#if two}
      <div class="tabs"><Seg label={t('Part of the import')} full={false} value={shownTab} options={[{ key: 'material', name: step1Done ? `${t('Gear|place')} ✓` : t('Gear|place') }, { key: 'step2', name: t('Kits, building blocks, tasks') }]} onchange={(v) => (tab = v)} /></div>
    {/if}

    {#if shownTab === 'step2' && plan2}
      <div class="main">
        <p class="hint">
          {t('Makes {kits} kits and {blocks} building blocks, merges {merge}, {tasks} tasks go into the preparation list, {trips} old trips into the logbook.', { kits: counts2.newKits, blocks: counts2.newBlocks, merge: counts2.merge, tasks: counts2.tasks, trips: counts2.trips })}
          {t('A backup comes first; you can undo it.')}
        </p>
        {#if $demoQ}<p class="hint">{t('End the running demo first.')}</p>{/if}
      </div>

      {#if plan2.kits.length}
        <details class="sec" open>
          <summary><span class="h">{t('Temperature kits')}</span><span class="s">{t('become building blocks')}</span><span class="n num">{plan2.kits.length}</span></summary>
          <p class="note">{t('Pack suggests the kit that fits the forecast.')}</p>
          <ul class="rows">
            {#each plan2.kits as k (k.id)}
              <li>
                <span class="nm">{k.id} {k.name}{#if k.notFound.length}<small class="q">{tn(k.notFound.length, '{n} not found', '{n} not found')}: {k.notFound.join(', ')}</small>{/if}</span>
                <span class="w num rng">{kitRange(k)}</span>
                <span class="w num">{tn(k.itemIds.length, '{n} item', '{n} items')}</span>
                <i class="badge">{k.status === 'same' ? t('already there') : t('new')}</i>
              </li>
            {/each}
          </ul>
        </details>
      {/if}

      {#if plan2.blocks.length}
        <details class="sec" open>
          <summary><span class="h">{t('Favourite kits and Excel building blocks')}</span><span class="n num">{plan2.blocks.length}</span></summary>
          <p class="note">{t('"Merge" is suggested from 70 % of the same items on.')}</p>
          <ul class="rows sim">
            {#each similar as b (b.id)}
              <li>
                <span class="nm">{b.name}<small class="q">{t('like the building block "{name}": {both} of {of} items the same', { name: b.similar.name, both: b.similar.both, of: b.similar.of })}{#if b.notFound.length}{' · '}{tn(b.notFound.length, '{n} not found', '{n} not found')}{/if}</small></span>
                <span class="w num">{tn(b.itemIds.length, '{n} item', '{n} items')}</span>
                <div class="pick"><Seg small full={false} label={t('What happens with {name}', { name: b.name })} value={choiceOf(b)} options={CHOICES} onchange={(v) => choose2(db, b.id, v)} /></div>
              </li>
            {/each}
          </ul>
          {#if plainBlocks.length}
            <details class="sub">
              <summary>{tn(plainBlocks.filter((b) => b.status === 'new').length, '{n} without a similar one, made new', '{n} without similarity, made new')}{plainBlocks.some((b) => b.status === 'same') ? ` · ${tn(plainBlocks.filter((b) => b.status === 'same').length, '{n} already there', '{n} already there')}` : ''} ›</summary>
              <ul class="rows">
                {#each plainBlocks as b (b.id)}
                  <li><span class="nm">{b.name}{#if b.notFound.length}<small class="q">{tn(b.notFound.length, '{n} not found', '{n} not found')}: {b.notFound.join(', ')}</small>{/if}</span><span class="w num">{tn(b.itemIds.length, '{n} item', '{n} items')}</span><i class="badge">{b.status === 'same' ? t('already there') : t('new')}</i></li>
                {/each}
              </ul>
            </details>
          {/if}
        </details>
      {/if}

      {#if plan2.tasks.total}
        <details class="sec" open>
          <summary><span class="h">{t('Tasks')}</span><span class="n num">{plan2.tasks.total}</span></summary>
          <div class="card tasks">
            <p><b>{tn(plan2.tasks.total, '{n} task', '{n} tasks')}</b> → {t('Preparation list. It shows only before events and bikepacking trips of more than 4 nights.')}</p>
            <p class="q">{t('e.g. {list}', { list: plan2.tasks.sample.join(' · ') })}{plan2.tasks.same ? ` · ${t('{n} already there', { n: plan2.tasks.same })}` : ''}</p>
          </div>
        </details>
      {/if}

      {#if plan2.oldTrips.total}
        <div class="sec flat">
          <p class="row1"><span class="h">{t('Old trips')}</span><span class="s">{t('as notes in the Logbook, read only')}</span><span class="n num">{plan2.oldTrips.total}</span></p>
        </div>
      {/if}

      {#if plan2.notFound.length}
        <p class="note nf">{tn(plan2.notFound.length, '{n} item id not found (left out): {list}', '{n} item ids not found (left out): {list}', { list: plan2.notFound.slice(0, 12).join(', ') + (plan2.notFound.length > 12 ? ' …' : '') })}</p>
      {/if}
      <p class="foot"><Btn kind="quiet" label={t('Discard import')} disabled={busy} onclick={discard} /></p>
    {:else}

    <div class="card tiles">
      <dl class="nums">
        <div><dd class="num">{plan.fresh.length}</dd><dt>{t('new|import')}</dt></div>
        <div><dd class="num">{plan.same.length}</dd><dt>{t('already there, gets completed')}</dt></div>
        <div><dd class="num">{plan.unsure.length}</dd><dt>{t('unsure|import')}</dt></div>
        <div><dd class="num">{notIn.length}</dd><dt>{t('not in the import, they stay')}</dt></div>
      </dl>
    </div>
    {#if weight && (weight.delta || weight.unweighed.length)}
      <!-- SN5+ (I1): the weight before and after; only what is on «Übernehmen» counts. -->
      <div class="card wcard" data-sec="weight">
        <span class="sib" aria-hidden="true"><Backpack size={18} /></span>
        <div class="wtext">
          <b class="num">{t('{w} in your gear list', { w: plusWeight(weight.delta) || formatWeight(0) })}</b>
          <small class="num">{t('before {a} → after {b} · only what you apply counts', { a: formatWeight(weight.before), b: formatWeight(weight.after) })}</small>
        </div>
        <div class="wbar" aria-hidden="true"><span class="wnow" style:width="{(1 - barNew) * 100}%"></span><span class="wnew" style:width="{barNew * 100}%"></span></div>
        <p class="wkey num" aria-hidden="true"><span><i class="dot now"></i>{t('today {w}', { w: formatWeight(weight.before) })}</span><span><i class="dot new"></i>{t('new {w}', { w: formatWeight(Math.max(0, weight.delta)) })}</span></p>
        {#if weight.unweighed.length}<p class="shint wq"><Info size={15} aria-hidden="true" /><span>{tn(weight.unweighed.length, '{names} is not weighed and does not count.', '{names} are not weighed and do not count.', { names: weight.unweighed.join(', ') })}</span></p>{/if}
      </div>
    {/if}
    <p class="hint">
      {t('Takes "Already there" and "New"')}{#if decided}{' '}{tn(decided, 'and {n} decided item', 'and {n} decided items')}{/if}.
      {t('A backup comes first; you can undo it.')}
      {#if plan.unsure.length - decided}{' '}{tn(plan.unsure.length - decided, '{n} unsure item stays here until you decide.', '{n} unsure items stay here until you decide.')}{/if}
    </p>
    {#if $demoQ}<p class="hint">{t('End the running demo first.')}</p>{/if}

    <div class="igrid">
      <div class="icol">
        <!-- Neu: open, every item pre-chosen; tap «Übernehmen» off and it stays in the import -->
        {#if plan.fresh.length}
          <Section title={t('New')} sub={`${tn(plan.fresh.length, '{n} item', '{n} items')} · ${t('all chosen, tap to leave one out')}`} id="imp-new">
            <ul class="card slist isec" data-sec="fresh">
              {#each plan.fresh as r (r.key)}
                {@const Icon = catIcon(r.item.category)}
                <li class="srow">
                  <span class="sib" aria-hidden="true"><Icon size={18} /></span>
                  <span class="sm"><b>{r.item.name}{#if r.item.qty > 1}<small class="qx"> × {r.item.qty}</small>{/if}</b><small>{r.item.weightG == null ? t('not weighed') : formatWeight(itemWeight(r.item))}{#if r.item.ownership === 'wishlist'}{' · '}<i class="badge">{t('Wishlist')}</i>{/if}{#if r.item.leaveHome}{' · '}<i class="badge">{t('Optional')}</i>{/if}</small>
                    <!-- SN5+ (I3): where it goes, a suggestion from the category; a tap opens category and bag -->
                    <button type="button" class="place" aria-expanded={placing === r.key} aria-controls="place-{r.key}" aria-label={t('Where {name} goes: {cat} · {bag}. Change', { name: r.item.name, cat: catText(r.item.category), bag: bagText(r.item.defaultBag) })} onclick={() => (placing = placing === r.key ? null : r.key)}><ArrowRight size={14} aria-hidden="true" /><span>{catText(r.item.category)} · {bagText(r.item.defaultBag)}</span><Pencil size={13} aria-hidden="true" /></button>
                  </span>
                  <span class="rowacts"><OptionButton pressed={takes(r)} label={t('Apply|import')} aria-label={t('Apply {name}', { name: r.item.name })} disabled={busy} onclick={() => flipFresh(r)} /></span>
                </li>
                {#if placing === r.key}
                  <li class="placebox" id="place-{r.key}">
                    <p class="plbl">{t('Category')}</p>
                    <div class="pick" role="group" aria-label={t('Category of {name}', { name: r.item.name })}>
                      {#each choosable(r.item.category) as c (c.key)}<button type="button" class="opt" aria-pressed={r.item.category === c.key} onclick={() => pickCat(r, c.key)}>{t(c.name)}</button>{/each}
                    </div>
                    <p class="plbl">{t('Bag')}</p>
                    <div class="pick" role="group" aria-label={t('Bag of {name}', { name: r.item.name })}>
                      {#each BAG_CHOICES as b (b)}<button type="button" class="opt" aria-pressed={r.item.defaultBag === b} onclick={() => pickBag(r, b)}>{t(BAG[b])}</button>{/each}
                    </div>
                    <p class="shint"><Info size={15} aria-hidden="true" /><span>{t('Suggested from the category. You can change it later in the item too.')}</span></p>
                  </li>
                {/if}
              {/each}
            </ul>
            {#if plan.learnings.add.length || plan.learnings.update.length}
              <p class="shint">{t('Learnings: {add} new, {upd} completed. They keep their original date.', { add: plan.learnings.add.length, upd: plan.learnings.update.length })}</p>
            {/if}
          </Section>
        {/if}

        <!-- Unsicher: one tap each -->
        {#if plan.unsure.length}
          <Section title={t('Unsure')} sub={t('{a} of {b} decided', { a: decided, b: plan.unsure.length })} id="imp-unsure">
            <div class="card isec" data-sec="unsure">
              <p class="note">{t('Maybe already in your gear. Tap the item it is, or "New item".')}</p>
              <ul class="rows unsure">
                {#each plan.unsure as r (r.key)}
                  <li>
                    <span class="nm">{r.imp.name}<small class="q">{catText(r.imp.category)}{r.reason === 'twice' ? ` · ${t('two lines point to the same item')}` : r.reason === 'file' ? ` · ${t('is twice in the file')}` : ''}</small></span>
                    <div class="pick" role="group" aria-label={t('What is {name}?', { name: r.imp.name })}>
                      {#each r.candidates as c (c.item.id)}
                        <button type="button" class="opt" aria-pressed={decisions[r.key] === c.item.id} onclick={() => choose(r.key, c.item.id)}>
                          <span>{t('Same as {name}', { name: nameOf(c.item) })}</span><small class="num">{pct(c.score)}</small>
                        </button>
                      {/each}
                      <button type="button" class="opt" aria-pressed={decisions[r.key] === 'new'} onclick={() => choose(r.key, 'new')}><span>{t('New item')}</span></button>
                    </div>
                  </li>
                {/each}
              </ul>
            </div>
          </Section>
        {/if}

        <!-- Schon da: what each item gets, said quietly; the ones with nothing new folded away -->
        {#if plan.same.length}
          <Section title={t('Already there')} sub={t('gets completed, your weight stays')} id="imp-same">
            <div class="card isec" data-sec="same">
              <ul class="slist flat">
                {#each sameWith as x (x.r.key)}
                  {@const r = x.r}
                  {@const Icon = catIcon(r.item.category)}
                  <!-- SN5+ (I2): what it gets («+ …») and, under it, what stays -->
                  <li class="srow">
                    <span class="sib" aria-hidden="true"><Icon size={18} /></span>
                    <span class="sm"><b>{nameOf(r.item)}{#if r.via === 'name' && r.imp.name !== r.item.name}<small class="q">{r.imp.name}</small>{/if}</b>
                      <span class="chg"><span class="adds">{#each x.adds as a, n (n)}<span class="plus">{addText(a)}</span>{/each}</span><small class="stays">{t('stays: {list}', { list: x.stays.map(stayText).join(', ') })}</small></span>
                    </span>
                  </li>
                {/each}
              </ul>
              {#if sameNone.length}
                <details class="sub">
                  <summary>{tn(sameNone.length, '{n} item without anything new', '{n} items without anything new')}</summary>
                  <ul class="rows">
                    {#each sameNone as r (r.key)}<li><span class="nm">{nameOf(r.item)}</span></li>{/each}
                  </ul>
                </details>
              {/if}
            </div>
          </Section>
        {/if}

        {#if plan.skipped.length}<p class="note">{tn(plan.skipped.length, '{n} line without a name is skipped.', '{n} lines without a name are skipped.')}</p>{/if}

        <!-- 3b: what the list does not name. Archive only: trips keep the item. -->
        <Section title={t('Not in the import')} sub={`${tn(notIn.length, '{n} item', '{n} items')} · ${t('they stay, nothing is deleted')}`} id="imp-notin">
          <details class="card isec nifold" data-sec="notin">
            <summary class="srow">
              <span class="sib" aria-hidden="true"><Archive size={18} /></span>
              <span class="sm"><b>{t('Look at them')}</b><small>{t('archive one by one, if you like')}</small></span>
              <ChevronRight class="schev chev" size={18} aria-hidden="true" />
            </summary>
            <p class="note">{t('In your gear, but not in the list. Archived items move to Gear → Gone; past trips stay complete. Nothing is deleted.')}</p>
            {#if notIn.length}
              <div class="selbar">
                <label class="all"><input type="checkbox" checked={notIn.length > 0 && chosen.length === notIn.length} onchange={(e) => notIn.forEach((i) => (e.currentTarget.checked ? picked.add(i.id) : picked.delete(i.id)))} /> {t('Select all')}</label>
                <button type="button" class="btn" disabled={!chosen.length || busy} onclick={() => archive(chosen.map((i) => i.id))}>{chosen.length ? tn(chosen.length, 'Archive {n} item', 'Archive {n} items') : t('Archive selected')}</button>
              </div>
            {/if}
            <ul class="rows notin">
              {#each notIn as i (i.id)}
                <li>
                  <label class="ck"><input type="checkbox" checked={picked.has(i.id)} onchange={() => flip(i.id)} aria-label={nameOf(i)} /></label>
                  <span class="nm">{nameOf(i)}<small class="q">{catText(i.category)}{i.ownership === 'wishlist' || i.ownership === 'to-buy' ? ` · ${t('Wishlist')}` : ''}</small></span>
                  <span class="row-acts">
                    <button type="button" class="btn sm row-act" disabled={busy} onclick={() => (merging = i)} aria-label={t('Merge {name}', { name: nameOf(i) })}>{t('Merge|items')}</button>
                    <button type="button" class="btn sm row-act" disabled={busy} onclick={() => archive([i.id])} aria-label={t('Archive {name}', { name: nameOf(i) })}>{t('Archive')}</button>
                  </span>
                </li>
              {/each}
            </ul>
            {#if archived}<p class="msg" role="status">{archived.text} <button type="button" class="btn sm" onclick={unarchive}>{t('Undo')}</button></p>{/if}
          </details>
        </Section>
      </div>

      <aside class="icol">
        <Section title={t('How it works')} id="imp-how">
          <ol class="card how">
            <li><b>{t('Look')}</b><p>{t('New is chosen, unsure asks one by one.')}</p></li>
            <li><b>{t('Apply|import')}</b><p>{t('A backup is made first.')}</p></li>
            <li><b>{t('Undo')}</b><p>{t('each of the last three imports, with one tap.')}</p></li>
          </ol>
        </Section>
        <p class="foot"><Btn kind="quiet" label={t('Discard import')} disabled={busy} onclick={discard} /></p>
      </aside>
    </div>
    {/if}

  {/if}
</div>

{#if merging}<MergeSheet item={merging} items={$itemsQ ?? []} imported onmerged={mergedDone} onclose={() => (merging = null)} />{/if}
{#if merged}
  <div class="toast" role="status">
    <span>{t('Merged')}</span>
    <button type="button" class="btn sm" disabled={busy} onclick={unmerge}>{t('Undo')}</button>
  </div>
{/if}

<style>
  .imeta {
    margin: 4px 0 0;
    color: var(--ink-3);
    font-size: var(--fs-body);
    overflow-wrap: break-word;
  }
  .imp {
    max-width: 1240px;
    min-width: 0;
  }
  /* SN5: four numbers on top, then the sections in two columns */
  .tiles {
    margin: 0 0 var(--sp-3);
    padding: 14px var(--sp-4);
  }
  .nums {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: var(--sp-2);
    margin: 0;
  }
  .nums div {
    min-width: 0;
    padding: 10px 12px;
    border-radius: 10px;
    background: var(--paper-2);
  }
  .nums dd {
    margin: 0;
    font: 700 var(--fs-section) / 1.15 var(--font-body);
  }
  .nums dt {
    margin-top: 2px;
    color: var(--ink-3);
    font-size: var(--fs-small);
    overflow-wrap: break-word;
  }
  @media (max-width: 719px) {
    .nums {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }
  /* SN5+ (I1): the weight card */
  .wcard {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr);
    gap: 8px 12px;
    align-items: center;
    margin: 0 0 var(--sp-3);
    padding: 14px var(--sp-4);
  }
  .wtext {
    display: grid;
    gap: 2px;
    min-width: 0;
  }
  .wtext small,
  .wkey {
    color: var(--ink-3);
    font-size: var(--fs-small);
    overflow-wrap: break-word;
  }
  .wbar {
    grid-column: 1 / -1;
    display: flex;
    gap: 2px;
    height: 8px;
    border-radius: 99px;
    overflow: hidden;
    background: var(--paper-2);
  }
  .wnow {
    background: var(--line-strong);
  }
  .wnew {
    background: var(--brand, var(--ok));
  }
  .wkey {
    grid-column: 1 / -1;
    display: flex;
    flex-wrap: wrap;
    gap: 4px 16px;
    margin: 0;
  }
  .dot {
    display: inline-block;
    width: 9px;
    height: 9px;
    margin-right: 6px;
    border-radius: 2px;
  }
  .dot.now {
    background: var(--line-strong);
  }
  .dot.new {
    background: var(--brand, var(--ok));
  }
  .wq {
    grid-column: 1 / -1;
    display: flex;
    align-items: flex-start;
    gap: var(--sp-2);
    margin: 0;
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .wq :global(svg) {
    flex: none;
    margin-top: 2px;
  }
  /* SN5+ (I3): the pill «→ category · bag» and its buttons */
  .place {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    align-self: flex-start;
    max-width: 100%;
    min-height: 32px;
    margin-top: 4px;
    padding: 3px 12px;
    border: 1.5px solid var(--line-strong);
    border-radius: 99px;
    background: var(--paper);
    color: var(--ink);
    font: 500 var(--fs-small) / 1.25 var(--font-body);
    text-align: left;
    cursor: pointer;
    overflow-wrap: break-word;
  }
  .place[aria-expanded='true'] {
    background: var(--paper-2);
  }
  .placebox {
    list-style: none;
    margin: 0 0 6px;
    padding: 10px 14px;
    border: 1px solid var(--line);
    border-radius: 10px;
    background: var(--paper-2);
  }
  .plbl {
    margin: 4px 0 0;
    color: var(--ink-2);
    font-size: var(--fs-small);
    font-weight: 600;
  }
  /* SN5+ (I2): what a «Schon da» item gets, and what stays */
  .chg {
    display: grid;
    gap: 2px;
    margin-top: 4px;
    padding: 6px 10px;
    border-radius: 8px;
    background: var(--paper-2);
  }
  .adds {
    display: flex;
    flex-wrap: wrap;
    gap: 2px 14px;
    font-size: var(--fs-small);
    overflow-wrap: break-word;
  }
  .stays,
  .undone {
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .hist {
    margin-top: var(--sp-5);
  }
  .igrid {
    display: grid;
    gap: var(--sp-5);
    margin-top: var(--sp-5);
  }
  @media (min-width: 1100px) {
    .igrid {
      grid-template-columns: minmax(0, 1fr) 420px;
      align-items: start;
    }
  }
  .icol {
    display: grid;
    gap: var(--sp-5);
    min-width: 0;
  }
  .flat {
    padding: 0;
  }
  .qx {
    display: inline;
    font-weight: 400;
  }
  .nifold > summary {
    cursor: pointer;
    list-style: none;
  }
  .nifold > summary::-webkit-details-marker {
    display: none;
  }
  .nifold > summary.srow {
    border-top: 0;
    min-height: 44px;
    padding: 0;
  }
  .nifold[open] > summary :global(.chev) {
    transform: rotate(90deg);
  }
  .how {
    display: grid;
    gap: var(--sp-3);
    margin: 0;
    padding: var(--sp-4) var(--sp-4) var(--sp-4) 36px;
  }
  .how p {
    margin: 2px 0 0;
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .main {
    margin: 0 0 20px;
  }
  .tabs {
    margin: 0 0 16px;
  }
  .rng {
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .sim .pick {
    padding-top: 2px;
  }
  .tasks {
    margin: 0 0 12px;
    padding: 12px;
  }
  .tasks p {
    margin: 0;
  }
  .tasks .q {
    margin-top: 4px;
  }
  .flat {
    padding: 4px 0;
  }
  .row1 {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    gap: 4px 10px;
    min-height: 44px;
    margin: 0;
    padding-top: 8px;
  }
  .nf {
    margin-top: 12px;
  }
  .hint,
  .note {
    margin: 8px 0 0;
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .note {
    margin: 0 0 8px;
  }
  .msg {
    font-weight: 600;
    margin: 0 0 14px;
  }
  .done {
    margin: 0 0 16px;
  }
  .done p {
    margin: 0 0 10px;
  }
  .acts {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
  .empty p {
    margin: 0 0 12px;
  }
  /* Light section headers: the name left, the number right. */
  .sec {
    border-top: 1.5px solid var(--line);
  }
  .sec:last-of-type {
    border-bottom: 1.5px solid var(--line);
  }
  .sec > summary {
    display: flex;
    align-items: baseline;
    gap: 10px;
    min-height: 44px;
    padding: 11px 0;
    cursor: pointer;
    list-style: none;
  }
  .sec > summary::-webkit-details-marker {
    display: none;
  }
  /* Gesamttest 20.10.2026 Design 4: the app's one arrow ›, turned down when open */
  .sec > summary::before {
    content: '›' / '';
    color: var(--ink-3);
    width: 12px;
    flex: none;
    text-align: center;
    transition: transform 0.15s;
  }
  .sec[open] > summary::before {
    transform: rotate(90deg);
  }
  .h {
    font-weight: 600;
    font-size: var(--fs-sub);
  }
  .s {
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .n {
    margin-left: auto;
    font-weight: 600;
    color: var(--ink-2);
  }
  .num {
    font-variant-numeric: tabular-nums;
  }
  .rows {
    list-style: none;
    margin: 0 0 12px;
    padding: 0;
  }
  .rows li {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 2px 12px;
    min-height: 44px;
    padding: 6px 0;
    border-top: 1px solid var(--line);
  }
  .nm {
    flex: 1 1 12em;
    min-width: 0;
    overflow-wrap: break-word;
  }
  .q {
    display: block;
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .add {
    flex: 1 1 14em;
    min-width: 0;
    color: var(--ink-3);
    font-size: var(--fs-small);
    overflow-wrap: break-word;
  }
  .w {
    margin-left: auto;
    text-align: right;
    min-width: 5.5em;
    color: var(--ink-2);
  }
  /* Small neutral badges. */
  .badge {
    font-style: normal;
    font-size: var(--fs-tiny);
    font-weight: 600;
    padding: 1px 8px;
    border-radius: 99px;
    background: var(--paper-2);
    color: var(--ink-2);
    border: 1px solid var(--line);
  }
  .sub > summary {
    min-height: 44px;
    display: flex;
    align-items: center;
    color: var(--ink-3);
    font-size: var(--fs-small);
    cursor: pointer;
  }
  .unsure li {
    align-items: flex-start;
  }
  .pick {
    flex: 1 1 100%;
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    padding: 4px 0 6px;
  }
  .opt {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    min-height: 44px;
    max-width: 100%;
    padding: 6px 12px;
    font: 500 var(--fs-small)/1.25 var(--font-body);
    text-align: left;
    border: 1.5px solid var(--line-strong);
    border-radius: 6px;
    background: var(--paper);
    color: var(--ink);
    cursor: pointer;
    overflow-wrap: break-word;
  }
  .opt small {
    color: var(--ink-3);
  }
  .opt[aria-pressed='true'] {
    background: var(--ink);
    border-color: var(--ink);
    color: var(--paper);
  }
  .opt[aria-pressed='true'] small {
    color: var(--brand-ink-2);
  }
  .selbar {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px 16px;
    margin: 0 0 6px;
  }
  .all,
  .ck {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    min-height: 44px;
    min-width: 44px;
    cursor: pointer;
  }
  .ck {
    justify-content: center;
    margin: -6px 0;
  }
  .notin .nm {
    flex: 1 1 10em;
  }
  .row-acts {
    display: inline-flex;
    gap: 6px;
    margin-left: auto;
  }
  .row-act {
    flex: none;
  }
  /* "Merged · Undo": a quiet toast at the bottom. */
  .toast {
    position: fixed;
    left: 50%;
    bottom: calc(16px + env(safe-area-inset-bottom));
    transform: translateX(-50%);
    z-index: 50;
    display: flex;
    align-items: center;
    gap: 12px;
    max-width: calc(100vw - 32px);
    padding: 6px 8px 6px 16px;
    border-radius: 10px;
    background: var(--ink);
    color: var(--paper);
    box-shadow: 0 8px 24px var(--shadow);
    font-weight: 600;
  }
  /* A phone: above the bottom bar. */
  @media (max-width: 719px) {
    .toast {
      bottom: calc(76px + env(safe-area-inset-bottom));
    }
  }
  .toast .btn {
    background: none;
    border-color: transparent;
    color: var(--paper);
    text-decoration: underline;
  }
  input[type='checkbox'] {
    width: 18px;
    height: 18px;
    accent-color: var(--ink);
  }
  .link {
    border-color: transparent;
    background: none;
    color: var(--ink-2);
    text-decoration: underline;
  }
  .foot {
    margin: 16px 0 0;
  }
  /* Row actions: quiet on a computer, full on hover and focus, always there on a phone. */
  @media (hover: hover) and (min-width: 720px) {
    .row-act {
      border-color: transparent;
      background: none;
      color: var(--ink-3);
    }
    .notin li:hover .row-act,
    .notin li:focus-within .row-act {
      border-color: var(--line-strong);
      background: var(--paper);
      color: var(--ink);
    }
  }
  @media (pointer: coarse) {
    .btn,
    .btn.sm {
      min-height: 44px;
    }
  }
</style>
