<script>
  /**
   * «Wertliste» (Warteliste 7; Noah 22.11.2026 «1-5 a»): #/gear/wertliste. All your velos and your gear with their price, for the insurance.
   * Everything is chosen at first; un-choose rows or filter («Only above CHF 50»). A missing price or day is typed in the row (saved in the
   * gear or the bike, one Undo). «Make PDF» writes the PDF on the device, shows it, offers «Share or save» and keeps a copy in Me › Documents
   * › Insurance. A price is the price paid, no depreciation; the PDF says so. Rules: wertliste/wertliste.js, PDF: wertliste/pdf.js.
   */
  import { liveQuery } from 'dexie';
  import { Shield, Undo2, Check, FileText } from '@lucide/svelte';
  import { db } from '../lib/db.js';
  import { t, tn, num, locale } from '../lib/i18n.svelte.js';
  import Crumbs from '../lib/ui/Crumbs.svelte';
  import Empty from '../lib/ui/Empty.svelte';
  import { UNDO_MS } from '../lib/ui/undo.js';
  import { localDay } from '../lib/localday.js';
  import { CATEGORY } from '../lib/gear.js';
  import { addDoc, blobOf } from '../lib/docs/client.svelte.js';
  import { rowsOf, filterRows, totalsOf, lineOf, savePlan, applyPlan, SMALL_CHF } from '../lib/wertliste/wertliste.js';

  const dataQ = liveQuery(async () => {
    const [bikes, items, visits] = await Promise.all([db.bikes.toArray(), db.items.toArray(), db.visits.toArray()]);
    return { bikes, items, visits };
  });
  const rows = $derived($dataQ ? rowsOf($dataQ) : []);
  let showBikes = $state(true);
  let showGear = $state(true);
  let big = $state(false);
  let noPrice = $state(false);
  let off = $state(new Set()); // rows un-chosen: everything is chosen at first
  const shown = $derived(filterRows(rows, { bikes: showBikes, gear: showGear, big, noPrice }));
  const chosen = $derived(new Set(rows.filter((r) => !off.has(r.key)).map((r) => r.key)));
  const tot = $derived(totalsOf(rows.filter((r) => shown.includes(r)), chosen));
  const chf = (n) => `CHF ${num(n)}`;
  const toggle = (key) => (off = off.has(key) ? new Set([...off].filter((k) => k !== key)) : new Set([...off, key]));
  const groupName = (r) => (r.group && CATEGORY[r.group] ? t(CATEGORY[r.group].name) : null);

  let last = $state(null); // the one Undo of a typed value
  let timer = 0;
  async function commit(row, field, value) {
    const plan = savePlan(row, field, value);
    if (!plan) return;
    const rec = await db[plan.table].get(plan.id);
    if (!rec) return;
    const before = $state.snapshot(rec);
    await db[plan.table].put(applyPlan(before, plan));
    clearTimeout(timer);
    last = { text: t('{name} saved.', { name: row.name }), table: plan.table, before };
    timer = setTimeout(() => (last = null), UNDO_MS);
  }
  async function undo() {
    if (!last) return;
    const { table, before } = last;
    clearTimeout(timer);
    last = null;
    await db[table].put($state.snapshot(before));
  }

  let busy = $state(false);
  let made = $state(null); // { url, doc, name }
  let note = $state('');
  async function makePdf() {
    busy = true;
    note = '';
    try {
      const { makeWertPdf } = await import('../lib/wertliste/pdf.js');
      const list = shown.filter((r) => chosen.has(r.key)).map((r) => ({ ...r, groupName: groupName(r) }));
      const day = localDay();
      const sum = totalsOf(list, new Set(list.map((r) => r.key)));
      const tr = {
        title: t('List of values'),
        dated: t('As of {day}', { day: new Date(`${day}T12:00:00`).toLocaleDateString(locale(), { day: 'numeric', month: 'long', year: 'numeric' }) }),
        bikes: t('Velos'),
        gear: t('Gear'),
        none: t('Nothing in this list.'),
        colName: t('Name'),
        colFrame: t('Frame number'),
        colBought: t('Bought'),
        colPrice: t('Price'),
        colPiece: t('Piece'),
        colGroup: t('Group'),
        sum: t('Total|wertliste'),
        note: t('Price paid, not the current value.'),
        missing: t('Price missing'),
        missingLine: t('{n} without a price:', { n: sum.missing }),
        receipts: t('Receipts at hand: {n} of {m}', { n: sum.receipts, m: sum.bikes }),
      };
      const data = await makeWertPdf(list, tr);
      const name = `${t('List of values')} ${day}`;
      const doc = await addDoc({ name, kind: 'pdf', group: t('Insurance'), source: 'file', pages: 1, bytes: Math.round((data.length * 3) / 4), data }, { upload: false });
      if (made?.url) URL.revokeObjectURL(made.url);
      made = { url: URL.createObjectURL(blobOf(doc)), doc, name };
    } catch {
      note = t('The PDF could not be made. Please try again.');
    } finally {
      busy = false;
    }
  }
  async function shareIt() {
    if (!made) return;
    const file = new File([blobOf(made.doc)], `${made.name}.pdf`, { type: 'application/pdf' });
    try {
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: made.name });
        return;
      }
    } catch (e) {
      if (e?.name === 'AbortError') return;
    }
    const a = document.createElement('a');
    a.href = made.url;
    a.download = `${made.name}.pdf`;
    a.click();
  }
</script>

<div class="wl">
  <header>
    <Crumbs crumbs={[{ label: t('Gear|place'), href: '#/gear' }]} here={t('List of values')} />
    <h1 class="title">{t('List of values')}</h1>
    <p class="page-sub">{t('All your velos and your gear with their price, for the insurance. It stays on this device until you share it.')}</p>
  </header>

  {#if !$dataQ}
    <p class="hint" role="status">{t('Loading …')}</p>
  {:else if !rows.length}
    <Empty icon={Shield} title={t('Nothing to list yet')} text={t('Add a velo or some gear first; then the list of values is made from them.')} action={{ label: t('Open the gear'), href: '#/gear' }} />
  {:else}
    <section class="sum" aria-label={t('In short')} data-wl-sum>
      <b class="big num" data-wl-total>{chf(tot.sum)}</b>
      <span class="num">{[tn(tot.bikes, '{n} velo', '{n} velos'), tn(tot.gear, '{n} piece', '{n} pieces')].join(' · ')}</span>
      {#if tot.missing}<span class="warn" data-wl-missing>{tn(tot.missing, '{n} without a price', '{n} without a price')}</span>{/if}
    </section>

    <div class="filters" role="group" aria-label={t('Show')}>
      <button type="button" class="chip" class:on={showBikes} aria-pressed={showBikes} onclick={() => (showBikes = !showBikes)} data-wl-f="bikes">{t('Velos')}</button>
      <button type="button" class="chip" class:on={showGear} aria-pressed={showGear} onclick={() => (showGear = !showGear)} data-wl-f="gear">{t('Gear')}</button>
      <button type="button" class="chip" class:on={big} aria-pressed={big} onclick={() => (big = !big)} data-wl-f="big">{t('Only above CHF {n}', { n: SMALL_CHF })}</button>
      <button type="button" class="chip" class:on={noPrice} aria-pressed={noPrice} onclick={() => (noPrice = !noPrice)} data-wl-f="noprice">{t('Without a price')}</button>
    </div>

    <ul class="list" data-wl-list>
      {#each shown as r (r.key)}
        <li data-wl-row={r.key} class:out={!chosen.has(r.key)}>
          <label class="tick"><input type="checkbox" checked={chosen.has(r.key)} onchange={() => toggle(r.key)} aria-label={t('Include {name}|wertliste', { name: r.name })} /></label>
          <div class="mid">
            <b>{r.name}</b>
            <small>{[r.kind === 'bike' ? (r.ref ? t('Frame {no}', { no: r.ref }) : t('Frame number missing')) : groupName(r), (r.qty || 1) > 1 ? `× ${r.qty}` : null, r.receipt ? t('Receipt there') : null].filter(Boolean).join(' · ')}</small>
            {#if !r.bought}<label class="fld"><span>{t('Bought')}</span><input class="inp" type="date" max={localDay()} onchange={(e) => commit(r, 'bought', e.currentTarget.value)} data-wl-bought /></label>{:else}<small>{t('Bought {day}', { day: r.bought })}</small>{/if}
          </div>
          {#if r.price != null}
            <b class="pr num" data-wl-price>{chf(lineOf(r))}</b>
          {:else}
            <label class="fld pf"><span>{t('Price missing')}</span><input class="inp num" type="text" inputmode="decimal" autocomplete="off" placeholder="CHF" onchange={(e) => commit(r, 'price', e.currentTarget.value)} data-wl-price-input /></label>
          {/if}
        </li>
      {/each}
    </ul>

    <div class="acts">
      <button type="button" class="btn hi" disabled={busy || !tot.n} onclick={makePdf} data-wl-pdf><FileText size={20} aria-hidden="true" />{busy ? t('Making the PDF …') : t('Make PDF')}</button>
    </div>
    {#if note}<p class="warn" role="alert">{note}</p>{/if}
    {#if made}
      <section class="made" aria-label={t('The PDF')} data-wl-made>
        <h2>{made.name}</h2>
        <iframe src={made.url} title={made.name} class="view"></iframe>
        <div class="acts">
          <button type="button" class="btn hi" onclick={shareIt} data-wl-share>{t('Share or save')}</button>
          <a class="btn" href={made.url} target="_blank" rel="noopener">{t('Open the PDF')}</a>
        </div>
        <p class="note">{t('A copy is kept in Me › Documents › Insurance.')} <a href="#/me/docs">{t('Open the documents')}</a></p>
      </section>
    {/if}
    <p class="note">{t('Price paid, not the current value; most insurers ask for the new price or the purchase price. Photos and receipts are not in the PDF, only the note that a receipt exists.')}</p>
  {/if}

  {#if last}
    <p class="undo" role="status"><span><Check size={16} aria-hidden="true" /> {last.text}</span><button type="button" class="btn sm" onclick={undo}><Undo2 size={16} aria-hidden="true" />{t('Undo')}</button></p>
  {/if}
</div>

<style>
  .wl { max-width: 860px; display: grid; grid-template-columns: minmax(0, 1fr); gap: var(--sp-4); }
  .note { color: var(--ink-3); font-size: var(--fs-small); margin: 0; overflow-wrap: break-word; }
  .hint { color: var(--ink-3); }
  .sum { display: flex; flex-wrap: wrap; align-items: baseline; gap: var(--sp-1) var(--sp-4); }
  .big { font-size: var(--fs-section); }
  .warn { color: var(--warn, var(--ink-2)); font-size: var(--fs-small); }
  .filters { display: flex; flex-wrap: wrap; gap: var(--sp-2); }
  .chip { display: inline-flex; align-items: center; min-height: 44px; padding: 6px 14px; border: 1px solid var(--line-strong); border-radius: 999px; background: var(--paper); color: var(--ink); font: inherit; cursor: pointer; }
  .chip.on { background: var(--ink); border-color: var(--ink); color: var(--paper); }
  .list { list-style: none; margin: 0; padding: 0; background: var(--paper); border: 1px solid var(--card-line, var(--line)); border-radius: var(--radius-card, 12px); }
  .list li { display: grid; grid-template-columns: 44px minmax(0, 1fr) auto; align-items: center; gap: var(--sp-2) var(--sp-3); padding: var(--sp-2) var(--sp-3); border-top: 1px solid var(--line); }
  .list li:first-child { border-top: 0; }
  .list li.out { opacity: 0.55; }
  .tick { display: grid; place-items: center; width: 44px; height: 44px; }
  .tick input { width: 22px; height: 22px; }
  .mid { display: grid; gap: 2px; min-width: 0; }
  .mid small { color: var(--ink-3); font-size: var(--fs-small); overflow-wrap: break-word; }
  .pr { white-space: nowrap; }
  .fld { display: grid; gap: 2px; font-size: var(--fs-small); color: var(--ink-3); }
  .fld .inp { min-height: 44px; max-width: 170px; }
  .pf .inp { width: 120px; }
  .acts { display: flex; flex-wrap: wrap; gap: var(--sp-2); }
  .acts .btn { justify-content: center; }
  .made { display: grid; gap: var(--sp-2); background: var(--paper); border: 1px solid var(--card-line, var(--line)); border-radius: var(--radius-card, 12px); padding: var(--sp-4); }
  .made h2 { margin: 0; font-size: var(--fs-sub); overflow-wrap: break-word; }
  .view { width: 100%; height: 420px; border: 1px solid var(--line); border-radius: 8px; background: var(--paper-2); }
  .undo { display: flex; align-items: center; justify-content: space-between; gap: var(--sp-3); margin: 0; padding: 10px 14px; border-radius: var(--radius-card, 12px); background: var(--ink); color: var(--paper); }
  .undo :global(.btn) { background: transparent; color: var(--paper); border-color: var(--paper); }
</style>
