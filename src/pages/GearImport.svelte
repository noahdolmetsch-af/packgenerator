<script>
  /**
   * v0.36.0 (Noah 1a, 2a, 3b): "Import prüfen" (#/gear/import). The reviewed gear list waits here
   * before anything goes into Gear: three folded groups (Schon da, Neu, Unsicher), then the app items
   * the list does not name (Nicht im Import, archive only). One orange button takes the safe ones;
   * a backup comes first and "Rückgängig" puts it back. Rules: src/lib/gearimport.js; writes:
   * src/lib/gear/importdb.js.
   * v0.37.1 "Zusammenlegen": a "Nicht im Import" row can also be merged into its imported
   * counterpart (MergeSheet, mergeitems.js); "Merged · Undo" comes as a toast.
   */
  import { liveQuery } from 'dexie';
  import { SvelteSet } from 'svelte/reactivity';
  import { db } from '../lib/db.js';
  import { planGearImport, FIELD_NAMES, categoryName, isGearImportFile } from '../lib/gearimport.js';
  import { stageImport, decide, dropStaged, applyImport, undoImport, changedSince, lastApplied, keepImport, archiveItems, STAGED, UNDO } from '../lib/gear/importdb.js';
  import { undoBulk } from '../lib/gear/bulk.js';
  import MergeSheet from '../lib/gear/MergeSheet.svelte';
  import { demoState } from '../lib/demo.js';
  import { formatWeight, itemWeight } from '../lib/gear.js';
  import { domainName } from '../lib/domains.js';
  import { t, tn, nameOf, locale } from '../lib/i18n.svelte.js';

  const stagedQ = liveQuery(() => db.table('meta').get(STAGED));
  const undoQ = liveQuery(async () => ((await db.table('meta').get(UNDO)) ? lastApplied(db) : null));
  const itemsQ = liveQuery(() => db.items.toArray());
  const learnQ = liveQuery(() => db.learnings.toArray());
  const demoQ = liveQuery(() => demoState(db));

  const ready = $derived($stagedQ !== undefined || $itemsQ !== undefined);
  const staged = $derived($stagedQ ?? null);
  const data = $derived(staged?.data ?? null);
  // The plan follows the file and the gear as they are now (the decisions do not change it).
  const plan = $derived(data && $itemsQ && $learnQ ? planGearImport(data, $itemsQ, $learnQ) : null);
  const decisions = $derived(staged?.decisions ?? {});
  const decided = $derived(plan ? plan.unsure.filter((r) => decisions[r.key]).length : 0);
  const safeN = $derived(plan ? plan.same.length + plan.fresh.length : 0);
  const sameWith = $derived(plan ? plan.same.filter((r) => r.adds.length) : []);
  const sameNone = $derived(plan ? plan.same.filter((r) => !r.adds.length) : []);

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
  const pct = (s) => `${Math.round(s * 100)} %`;

  async function run(fn) {
    if (busy) return;
    busy = true;
    try {
      await fn();
    } catch (err) {
      message = `${t('Nothing was changed.')} ${err.message}`;
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
    toastTimer = setTimeout(() => (merged = null), 10000);
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

<div class="imp">
  <p class="back"><a href="#/gear">← {t('Gear')}</a></p>
  <h1 class="title">{t('Check import')}</h1>

  {#if $undoQ}
    <!-- After applying: what happened, and one tap back. -->
    <div class="done card" role="status">
      <p>
        <b>{t('Import applied {when}.', { when: when($undoQ.at) })}</b>
        {t('{enriched} completed, {added} new, {learn} learnings. A backup was made first.', { enriched: $undoQ.counts.enriched + $undoQ.counts.merged, added: $undoQ.counts.added, learn: $undoQ.counts.learningsAdded })}
      </p>
      <div class="acts">
        <button type="button" class="btn" disabled={busy} onclick={undo}>{t('Undo')}</button>
        <a class="btn" href="#/gear">{t('To the gear')}</a>
        <button type="button" class="btn link" disabled={busy} onclick={() => keepImport(db)}>{t('Keep, forget the backup')}</button>
      </div>
    </div>
  {/if}

  {#if message}<p class="msg" role="status">{message}</p>{/if}

  {#if ready && !data}
    {#if !$undoQ}
      <div class="empty card">
        <p>{t('No import is waiting. Choose a gear list (a JSON file of the kind "gear-import"); nothing goes into your gear before you check it here.')}</p>
        <label class="btn">{t('Choose file')}<input type="file" accept="application/json,.json,text/plain,.txt" onchange={pickFile} hidden /></label>
      </div>
    {/if}
  {:else if plan}
    <p class="meta">
      <span>{staged.name || t('Gear list')}</span>
      <span>{t('chosen {when}', { when: when(staged.at) })}</span>
      <span>{t('nothing applied yet')}</span>
    </p>

    <div class="main">
      <button type="button" class="btn hi" disabled={busy || !!$demoQ || !(safeN + decided)} onclick={applySafe}>{t('Apply all safe ones')}</button>
      <p class="hint">
        {t('Takes "Already there" and "New"')}{#if decided}{' '}{tn(decided, 'and {n} decided item', 'and {n} decided items')}{/if}.
        {t('A backup comes first; you can undo it.')}
        {#if plan.unsure.length - decided}{' '}{tn(plan.unsure.length - decided, '{n} unsure item stays here until you decide.', '{n} unsure items stay here until you decide.')}{/if}
      </p>
      {#if $demoQ}<p class="hint">{t('End the running demo first.')}</p>{/if}
    </div>

    <!-- Schon da: what each item gets, said quietly; the ones with nothing new folded away. -->
    <details class="sec">
      <summary><span class="h">{t('Already there')}</span><span class="n num">{plan.same.length}</span></summary>
      <p class="note">{t('Your item stays as it is. Only empty fields are filled; notes and areas are added.')}</p>
      <ul class="rows">
        {#each sameWith as r (r.key)}
          <li>
            <span class="nm">{nameOf(r.item)}{#if r.via === 'name' && r.imp.name !== r.item.name}<small class="q">{r.imp.name}</small>{/if}</span>
            <span class="add">+ {r.adds.map(fieldText).join(' · ')}</span>
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
    </details>

    <!-- Neu -->
    <details class="sec">
      <summary><span class="h">{t('New')}</span><span class="n num">{plan.fresh.length}</span></summary>
      <ul class="rows">
        {#each plan.fresh as r (r.key)}
          <li>
            <span class="nm">{r.item.name}{#if r.item.qty > 1}<small> × {r.item.qty}</small>{/if}<small class="q">{catText(r.item.category)}</small></span>
            <span class="tags">
              {#if r.item.ownership === 'wishlist'}<i class="badge">{t('Wishlist')}</i>{/if}
              {#if r.item.leaveHome}<i class="badge">{t('Optional')}</i>{/if}
            </span>
            <span class="w num">{r.item.weightG == null ? '–' : formatWeight(itemWeight(r.item))}</span>
          </li>
        {/each}
      </ul>
      {#if plan.learnings.add.length || plan.learnings.update.length}
        <p class="note">{t('Learnings: {add} new, {upd} completed. They keep their original date.', { add: plan.learnings.add.length, upd: plan.learnings.update.length })}</p>
      {/if}
    </details>

    <!-- Unsicher: one tap each -->
    <details class="sec">
      <summary><span class="h">{t('Unsure')}</span>{#if plan.unsure.length}<span class="s">{t('{a} of {b} decided', { a: decided, b: plan.unsure.length })}</span>{/if}<span class="n num">{plan.unsure.length}</span></summary>
      <p class="note">{t('Maybe already in your gear. Tap the item it is, or "New item".')}</p>
      <ul class="rows unsure">
        {#each plan.unsure as r (r.key)}
          <li>
            <span class="nm">{r.imp.name}<small class="q">{catText(r.imp.category)}{r.reason === 'twice' ? ` · ${t('two lines point to the same item')}` : ''}</small></span>
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
    </details>

    {#if plan.skipped.length}<p class="note">{tn(plan.skipped.length, '{n} line without a name is skipped.', '{n} lines without a name are skipped.')}</p>{/if}

    <!-- 3b: what the list does not name. Archive only: trips keep the item. -->
    <details class="sec">
      <summary><span class="h">{t('Not in the import')}</span><span class="n num">{notIn.length}</span></summary>
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

    <p class="foot"><button type="button" class="btn link" disabled={busy} onclick={discard}>{t('Discard import')}</button></p>
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
  .imp {
    max-width: 860px;
    margin: 0 auto;
    min-width: 0;
  }
  .back {
    margin: 0 0 4px;
    font-size: var(--fs-small);
  }
  h1 {
    margin: 0 0 8px;
  }
  .meta {
    display: flex;
    flex-wrap: wrap;
    gap: 2px 14px;
    margin: 0 0 16px;
    color: var(--ink-3);
    font-size: var(--fs-small);
    overflow-wrap: anywhere;
  }
  .main {
    margin: 0 0 20px;
  }
  .main .btn.hi {
    min-height: 44px;
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
  .sec > summary::before {
    content: '▸';
    color: var(--ink-3);
    font-size: 13px;
    width: 12px;
    flex: none;
  }
  .sec[open] > summary::before {
    content: '▾';
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
    overflow-wrap: anywhere;
  }
  .q {
    display: block;
    color: var(--ink-3);
    font-size: 13px;
  }
  .add {
    flex: 1 1 14em;
    min-width: 0;
    color: var(--ink-3);
    font-size: var(--fs-small);
    overflow-wrap: anywhere;
  }
  .w {
    margin-left: auto;
    text-align: right;
    min-width: 5.5em;
    color: var(--ink-2);
  }
  .tags {
    display: inline-flex;
    gap: 4px;
  }
  /* Small neutral badges. */
  .badge {
    font-style: normal;
    font-size: 12px;
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
    font: 500 14px/1.25 var(--font-body);
    text-align: left;
    border: 1.5px solid var(--line-strong);
    border-radius: 6px;
    background: var(--paper);
    color: var(--ink);
    cursor: pointer;
    overflow-wrap: anywhere;
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
    box-shadow: 0 8px 24px rgba(15, 46, 39, 0.3);
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
