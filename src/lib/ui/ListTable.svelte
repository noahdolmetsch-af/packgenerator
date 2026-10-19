<script>
  /**
   * Paket H «Packen leichter», answer 3 (Noah 19.10.2026 «3a und b soll für alle Listen auf der gesamten
   * App möglich sein»): one table for every list.
   * - On a computer: a table. Every field changes right in its cell (Enter or leaving the cell saves),
   *   a click on a column head sorts.
   * - Everywhere (phone too): tick rows, then «Change for all» sets one field for every ticked row at
   *   once; «Delete» asks once for all of them. Each change offers «Undo».
   * On a phone the rows show as a list with tick boxes; a tap on the name opens the record.
   *
   * Props: rows, cols (see lib/listtable.js), idOf, nameOf(row) → text, onsave(pairs) writes
   * [{ before, after }] and gets the reversed pairs for Undo, ondelete(rows) → snapshot,
   * onrestore(snapshot), onopen(row), actions: [{ label, run(rows) }] more buttons for the ticked rows,
   * label: the name of the list (aria), what: «items» word for the counts, onclose: «Done».
   */
  import { t, tn } from '../i18n.svelte.js';
  import { phone } from '../media.svelte.js';
  import { cellOf, parseCell, withCell, changes, applyToAll, bulkCols, sortRows, filterRows } from '../listtable.js';
  import { offerDone } from './rename.svelte.js';
  import { askDelete, deleteWithUndo, saveFailed } from './ask.js';
  import { ArrowUp, ArrowDown, Search } from '@lucide/svelte';

  let { rows = [], cols = [], idOf = (r) => r.id, nameOf = (r) => r.name ?? '', onsave, ondelete = null, onrestore = null, onopen = null, actions = [], label = '', onclose = null, search = true } = $props();

  let q = $state('');
  let sortKey = $state(null);
  let dir = $state(1);
  let picked = $state(new Set());
  let bulkKey = $state('');
  let bulkVal = $state('');
  let problem = $state('');
  let busy = $state(false);

  const sortCol = $derived(cols.find((c) => c.key === sortKey) ?? null);
  const shown = $derived(sortRows(filterRows(rows, cols, q), sortCol, dir));
  const chosen = $derived(rows.filter((r) => picked.has(idOf(r))));
  const allOn = $derived(shown.length > 0 && shown.every((r) => picked.has(idOf(r))));
  const canBulk = $derived(bulkCols(cols));
  const bulkCol = $derived(canBulk.find((c) => c.key === bulkKey) ?? null);

  function flip(id) {
    const next = new Set(picked);
    next.has(id) ? next.delete(id) : next.add(id);
    picked = next;
  }
  function flipAll() {
    picked = allOn ? new Set() : new Set(shown.map(idOf));
  }
  function sortBy(c) {
    if (sortKey === c.key) dir = -dir;
    else {
      sortKey = c.key;
      dir = 1;
    }
  }

  async function write(pairs, text) {
    if (!pairs.length) return;
    problem = '';
    busy = true;
    try {
      await onsave(pairs);
      offerDone(text, async () => {
        await onsave(pairs.map((p) => ({ before: p.after, after: p.before })));
        offerDone(t('Changed back.'));
      });
    } catch (err) {
      problem = saveFailed(err);
    } finally {
      busy = false;
    }
  }

  async function saveCell(row, col, raw) {
    const value = parseCell(col, raw);
    if (value === undefined) return (problem = col.type === 'date' ? t('Please enter a date like 2026-10-31.') : t('Please enter a number.'));
    if (col.required && value === '') return (problem = t('This field cannot be empty.'));
    if (!changes(row, col, value)) return;
    await write([{ before: row, after: withCell(row, col, value) }], t('«{field}» saved for {name}.', { field: col.label, name: nameOf(row) }));
  }

  async function forAll() {
    if (!bulkCol || !chosen.length) return;
    const value = parseCell(bulkCol, bulkCol.type === 'check' ? bulkVal === 'yes' : bulkVal);
    if (value === undefined) return (problem = bulkCol.type === 'date' ? t('Please enter a date like 2026-10-31.') : t('Please enter a number.'));
    if (bulkCol.required && value === '') return (problem = t('This field cannot be empty.'));
    const pairs = applyToAll(rows, chosen.map(idOf), bulkCol, value, idOf);
    if (!pairs.length) return offerDone(t('Nothing to change: all of them have it already.'));
    await write(pairs, tn(pairs.length, '«{field}» changed for {n} entry.', '«{field}» changed for {n} entries.', { field: bulkCol.label }));
  }

  async function del() {
    const list = chosen;
    if (!list.length || !ondelete) return;
    const answer = await askDelete({
      title: tn(list.length, 'Delete {n} entry?', 'Delete {n} entries?'),
      text: t('They go away together. «Undo» brings all of them back.'),
      lines: list.slice(0, 8).map(nameOf),
    });
    if (answer !== 'delete') return;
    const ok = await deleteWithUndo({ run: () => ondelete(list), undo: onrestore, text: tn(list.length, '{n} entry deleted.', '{n} entries deleted.'), name: nameOf(list[0]) });
    if (ok) picked = new Set();
  }

  const optName = (c, v) => c.options?.find((o) => o.key === v)?.name ?? v ?? '';
  const show = (c, v) => (c.type === 'check' ? (v ? '✓' : '') : c.type === 'select' ? optName(c, v) : v ?? '');
  // the field of a cell: Enter saves and leaves, Escape puts the old value back
  function keys(e) {
    if (e.key === 'Enter') e.currentTarget.blur();
    if (e.key === 'Escape') {
      e.currentTarget.value = e.currentTarget.defaultValue;
      e.currentTarget.blur();
    }
  }
</script>

<section class="ltab" aria-label={label}>
  <div class="ltop">
    {#if search}
      <label class="lsearch"><Search size={16} aria-hidden="true" /><input type="search" bind:value={q} placeholder={t('Search in the list')} aria-label={t('Search in the list')} /></label>
    {/if}
    <span class="lcount num">{tn(shown.length, '{n} entry', '{n} entries')}</span>
    {#if onclose}<button type="button" class="btn" onclick={onclose}>{t('Done')}</button>{/if}
  </div>
  {#if !phone.matches}
    <p class="lhint">{t('Change a field right in its cell; Enter saves. Tick rows to change one field for all of them.')}</p>
  {/if}

  {#if phone.matches}
    <ul class="lt-rows">
      <li class="lall"><label><input type="checkbox" checked={allOn} onchange={flipAll} /> {t('Select all')}</label></li>
      {#each shown as r (idOf(r))}
        <li class="lt-row" class:on={picked.has(idOf(r))}>
          <input type="checkbox" checked={picked.has(idOf(r))} onchange={() => flip(idOf(r))} aria-label={nameOf(r)} />
          {#if onopen}
            <button type="button" class="lname" onclick={() => onopen(r)}>{nameOf(r)}</button>
          {:else}
            <span class="lname">{nameOf(r)}</span>
          {/if}
          <small class="lsub">{cols.slice(1, 4).map((c) => show(c, cellOf(r, c))).filter((x) => x !== '' && x != null).join(' · ')}</small>
        </li>
      {/each}
    </ul>
  {:else}
    <div class="lscroll">
      <table>
        <thead>
          <tr>
            <th class="cb"><input type="checkbox" checked={allOn} onchange={flipAll} aria-label={t('Select all')} /></th>
            {#each cols as c (c.key)}
              <th style:width={c.width} aria-sort={sortKey === c.key ? (dir === 1 ? 'ascending' : 'descending') : 'none'}>
                <button type="button" class="sorth" onclick={() => sortBy(c)}>{c.label}{#if sortKey === c.key}{#if dir === 1}<ArrowUp size={14} aria-hidden="true" />{:else}<ArrowDown size={14} aria-hidden="true" />{/if}{/if}</button>
              </th>
            {/each}
            {#if onopen}<th class="op"><span class="lt-sr">{t('Open|item')}</span></th>{/if}
          </tr>
        </thead>
        <tbody>
          {#each shown as r (idOf(r))}
            {@const id = idOf(r)}
            <tr class:on={picked.has(id)}>
              <td class="cb"><input type="checkbox" checked={picked.has(id)} onchange={() => flip(id)} aria-label={nameOf(r)} /></td>
              {#each cols as c (c.key)}
                {@const v = cellOf(r, c)}
                <td class={c.type}>
                  {#if c.readOnly}
                    <span class="ro">{show(c, v)}</span>
                  {:else if c.type === 'select'}
                    <select value={v ?? ''} aria-label={`${c.label} · ${nameOf(r)}`} onchange={(e) => saveCell(r, c, e.currentTarget.value)}>
                      {#if c.empty !== false}<option value="">–</option>{/if}
                      {#each c.options ?? [] as o (o.key)}<option value={o.key}>{o.name}</option>{/each}
                    </select>
                  {:else if c.type === 'check'}
                    <input type="checkbox" checked={!!v} aria-label={`${c.label} · ${nameOf(r)}`} onchange={(e) => saveCell(r, c, e.currentTarget.checked)} />
                  {:else}
                    <input type={c.type === 'date' ? 'date' : 'text'} inputmode={c.type === 'number' ? 'decimal' : undefined} value={v ?? ''} aria-label={`${c.label} · ${nameOf(r)}`} onkeydown={keys} onchange={(e) => saveCell(r, c, e.currentTarget.value)} />
                  {/if}
                </td>
              {/each}
              {#if onopen}<td class="op"><button type="button" class="btn sm" onclick={() => onopen(r)}>{t('Open|item')}</button></td>{/if}
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  {/if}

  {#if problem}<p class="lerr" role="alert">{problem}</p>{/if}

  {#if chosen.length}
    <div class="lbulk" role="region" aria-label={t('Selected entries')}>
      <b class="num">{tn(chosen.length, '{n} selected', '{n} selected')}</b>
      {#if canBulk.length}
        <label class="bf">
          <span>{t('Change for all')}</span>
          <select bind:value={bulkKey} onchange={() => (bulkVal = '')}>
            <option value="">{t('Choose a field …')}</option>
            {#each canBulk as c (c.key)}<option value={c.key}>{c.label}</option>{/each}
          </select>
        </label>
        {#if bulkCol}
          {#if bulkCol.type === 'select'}
            <select bind:value={bulkVal} aria-label={bulkCol.label}>
              {#if bulkCol.empty !== false}<option value="">–</option>{/if}
              {#each bulkCol.options ?? [] as o (o.key)}<option value={o.key}>{o.name}</option>{/each}
            </select>
          {:else if bulkCol.type === 'check'}
            <select bind:value={bulkVal} aria-label={bulkCol.label}><option value="yes">{t('Yes')}</option><option value="">{t('No')}</option></select>
          {:else}
            <input type={bulkCol.type === 'date' ? 'date' : 'text'} bind:value={bulkVal} aria-label={bulkCol.label} />
          {/if}
          <button type="button" class="btn hi" disabled={busy} onclick={forAll}>{t('Set for all')}</button>
        {/if}
      {/if}
      {#each actions as a (a.label)}<button type="button" class="btn" disabled={busy} onclick={() => a.run(chosen)}>{a.label}</button>{/each}
      {#if ondelete}<button type="button" class="btn del" disabled={busy} onclick={del}>{t('Delete')}</button>{/if}
      <button type="button" class="btn btn-link" onclick={() => (picked = new Set())}>{t('Clear selection')}</button>
    </div>
  {/if}
</section>

<style>
  .ltab {
    display: grid;
    /* the table scrolls inside its box; it never widens the page */
    grid-template-columns: minmax(0, 1fr);
    min-width: 0;
    gap: 10px;
  }
  .ltop {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 10px;
  }
  .lsearch {
    display: flex;
    align-items: center;
    gap: 6px;
    flex: 1 1 220px;
    padding: 0 10px;
    border: 1px solid var(--line);
    border-radius: var(--r-ctl);
    background: var(--input);
    min-height: 44px;
  }
  .lsearch input {
    flex: 1;
    border: 0;
    background: transparent;
    font: inherit;
    min-height: 40px;
    color: var(--ink);
  }
  .lsearch input:focus {
    outline: none;
  }
  .lsearch:focus-within {
    outline: var(--focus-ring);
  }
  .lcount,
  .lhint {
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .lhint {
    margin: 0;
  }
  .lscroll {
    overflow-x: auto;
    border: 1px solid var(--card-line);
    border-radius: var(--radius-card);
    background: var(--paper);
  }
  table {
    width: 100%;
    border-collapse: collapse;
    font-size: var(--fs-small);
  }
  th,
  td {
    padding: 4px 6px;
    border-bottom: 1px solid var(--line);
    text-align: left;
    vertical-align: middle;
  }
  thead th {
    position: sticky;
    top: 0;
    background: var(--paper-2);
    z-index: 1;
  }
  .sorth {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    border: 0;
    background: none;
    font: 600 var(--fs-small) var(--font-body);
    color: var(--ink);
    cursor: pointer;
    min-height: 36px;
    padding: 0;
  }
  td input[type='text'],
  td input[type='date'],
  td select {
    width: 100%;
    min-width: 6em;
    min-height: 36px;
    padding: 2px 6px;
    border: 1px solid transparent;
    border-radius: 6px;
    background: transparent;
    font: inherit;
    color: var(--ink);
    box-sizing: border-box;
  }
  td input:hover,
  td select:hover {
    border-color: var(--line);
  }
  td input:focus,
  td select:focus {
    border-color: var(--line-strong);
    background: var(--input);
    outline: var(--focus-ring);
  }
  td.number input {
    text-align: right;
  }
  /* the first column is the name: wide enough to read it; the table scrolls sideways when needed */
  tbody td:nth-child(2) input[type='text'] {
    min-width: 12em;
  }
  td select {
    min-width: 8em;
  }
  .cb {
    width: 36px;
    text-align: center;
  }
  .cb input,
  .lt-row input,
  .lall input,
  td.check input {
    width: 20px;
    height: 20px;
  }
  tr.on td {
    background: var(--hi-soft);
  }
  .ro {
    color: var(--ink-2);
  }
  .op {
    width: 1%;
    white-space: nowrap;
  }
  .lt-sr {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip: rect(0 0 0 0);
  }
  .lt-rows {
    list-style: none;
    margin: 0;
    padding: 0;
    border: 1px solid var(--card-line);
    border-radius: var(--radius-card);
    background: var(--paper);
  }
  .lt-row,
  .lall {
    display: grid;
    grid-template-columns: 32px 1fr;
    align-items: center;
    gap: 2px 8px;
    padding: 8px 12px;
    border-bottom: 1px solid var(--line);
    min-height: 44px;
  }
  .lall label {
    grid-column: 1 / -1;
    display: flex;
    align-items: center;
    gap: 12px;
    font-weight: 600;
  }
  .lt-row.on {
    background: var(--hi-soft);
  }
  .lname {
    border: 0;
    background: none;
    padding: 0;
    text-align: left;
    font: 500 var(--fs-body) var(--font-body);
    color: var(--ink);
    min-height: 32px;
  }
  .lsub {
    grid-column: 2;
    color: var(--ink-2);
  }
  .lerr {
    color: var(--bad);
    margin: 0;
  }
  .lbulk {
    position: sticky;
    bottom: calc(env(safe-area-inset-bottom) + 72px);
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;
    padding: 10px 12px;
    border-radius: var(--radius-card);
    background: var(--paper);
    border: 1px solid var(--line-strong);
    box-shadow: 0 4px 16px var(--shadow);
    z-index: 5;
  }
  .lbulk select,
  .lbulk input {
    min-height: 44px;
    border: 1px solid var(--line);
    border-radius: var(--r-ctl);
    background: var(--input);
    color: var(--ink);
    font: inherit;
    padding: 0 8px;
  }
  .bf {
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .del {
    color: var(--bad);
  }
</style>
