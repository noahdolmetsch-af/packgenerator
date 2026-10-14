<script>
  /**
   * v0.48.0 «Velos vergleichen» (Noah: «bei allen Bikes alle diese Werte pflegen und vergleichen»):
   * one table, the parts and their attributes as rows, the bikes as columns. The key values on top
   * (travel, stack, reach, wheel size), then the parts shown by default per area, the geometry, the
   * rest under «More», and the weight per area at the bottom. An empty cell is a calm «–»; a tap on
   * any cell opens a small sheet to type the value. Values that differ get a soft background.
   * v0.65.0 «Velo-Masse»: the fit and setup rows (saddle height, target pressure, bar width …) come
   * first of all and are always shown, never under «More».
   * Phone: the first column stays, the bike columns scroll inside the table, never the page.
   * v0.83.0 «Ausstattung» (A5a): only rows with at least one value («show all» brings the rest back);
   * the bikes to compare are chosen on top, on a phone two side by side to start with.
   */
  import { liveQuery } from 'dexie';
  import Empty from '../ui/Empty.svelte';
  import { db } from '../db.js';
  import { sortBikes, bikesHash } from '../bikes.js';
  import { compareRows, setSpec, specValue, areaWeight, readValue } from '../bikespecs.js';
  import { AREAS } from '../care.js';
  import { formatWeight } from '../gear.js';
  import { t, num } from '../i18n.svelte.js';
  import { ChevronDown, ChevronRight, Bike as BikeIcon } from '@lucide/svelte';
  import { wantBike } from '../nav.js';
  import VeloHead from './VeloHead.svelte';

  // Bugfix Dateneingabe: bikeId (the bike it was opened for) is always one of the columns; target
  // ('<part>:<field>') opens that value of the bike for typing at once; closing it goes back to the
  // sheet it came from (back, from), else stays here.
  let { bikeId = null, target = null, back = null, from = null } = $props();

  const bikesQ = liveQuery(() => db.bikes.toArray());
  const bikes = $derived(sortBikes($bikesQ ?? []));
  const narrow = typeof matchMedia === 'function' && matchMedia('(max-width: 719px)').matches;
  let picked = $state(null); // Set of bike ids, null = the default (all; two on a phone)
  const own = $derived(bikes.find((b) => b.id === bikeId) ?? null);
  const first = $derived(own ? [own, ...bikes.filter((b) => b.id !== own.id)] : bikes);
  const cols = $derived(picked ? bikes.filter((b) => picked.has(b.id)) : narrow ? (own ? bikes.filter((b) => first.slice(0, 2).includes(b)) : bikes.slice(0, 2)) : bikes);
  function togglePick(id) {
    const s = new Set(cols.map((b) => b.id));
    if (s.has(id)) {
      if (s.size > 1) s.delete(id);
    } else s.add(id);
    picked = s;
  }
  const full = $derived(compareRows(cols));
  let all = $state(false);
  const keep = (r) => all || r.values.some((v) => v != null);
  const trim = (g) => ({ ...g, rows: g.rows.filter(keep) });
  const table = $derived({ fit: trim(full.fit), top: full.top.filter(keep), main: full.main.map(trim).filter((g) => g.rows.length), geo: trim(full.geo), more: full.more.map(trim).filter((g) => g.rows.length) });
  const hidden = $derived(all ? 0 : [full.fit, { rows: full.top }, ...full.main, full.geo].reduce((n, g) => n + g.rows.filter((r) => !keep(r)).length, 0));
  let more = $state(false);
  const moreCount = $derived(new Set(full.more.flatMap((g) => g.rows.map((r) => r.key))).size);
  const areas = AREAS.filter((a) => a.key !== 'checks');

  const show = (r, v) => (v == null ? '–' : r.num && typeof v === 'number' ? `${num(v)}${r.unit ? ` ${r.unit}` : ''}` : String(v));
  const cellLabel = (r) => (r.part ? `${r.part} · ${t(r.label)}` : t(r.label));

  /* ---------- one value, typed in a small sheet ---------- */
  let edit = $state(null); // { bike, row, value }
  let dialog = $state();
  $effect(() => {
    if (edit && dialog && !dialog.open) dialog.showModal();
  });
  function open(bike, r) {
    const v = specValue(bike, r.key, r.field);
    edit = { bikeId: bike.id, bikeName: bike.name, row: r, value: v == null ? '' : String(v) };
  }
  // the value asked for in the address: opened once the bikes are read (its row from this bike alone,
  // so a row hidden in the table, empty or under «More», opens all the same)
  let asked = false;
  let returning = $state(false);
  $effect(() => {
    if (asked || !target || !own) return;
    asked = true;
    const c = compareRows([own]);
    const r = [c.fit, { rows: c.top }, ...c.main, c.geo, ...c.more].flatMap((g) => g.rows).find((x) => x.id === target);
    if (r) {
      returning = !!back;
      open(own, r);
    } else leave();
  });
  /** Done with the value asked for: back to the sheet, or the plain address of this table. */
  function leave() {
    // replace: the browser's back button then goes to where the sheet was opened, not into this value again
    if (back) location.replace(bikesHash({ tab: 'setup', bike: bikeId, sheet: back, from }));
    else history.replaceState(null, '', bikesHash({ tab: 'compare', view: 'all', bike: bikeId }));
  }
  function closed() {
    edit = null;
    if (returning) {
      returning = false;
      leave();
    }
  }
  async function save(clear = false) {
    const e = edit;
    const bike = await db.bikes.get(e.bikeId);
    if (bike) {
      const v = clear ? null : readValue(e.value, e.row.num);
      await db.bikes.update(bike.id, setSpec(bike, e.row.key, e.row.field, v));
    }
    dialog?.close();
  }
</script>

<div class="cmp">
  <!-- Design-Refresh P7 (V14b, Noah 12.10.2026 «v11-v14 freigegeben»): «‹ Velo › Ausstattung › Vergleichen»,
       the bikes as dark chips, the table with the rows where the bikes differ marked. -->
  <VeloHead
    crumbs={[{ label: t('Bike'), href: bikesHash({ tab: 'setup' }) }, { label: t('Equipment|tab'), href: bikesHash({ tab: 'compare' }) }]}
    here={t('Compare|verb')}
    title={t('Compare bikes')}
    sub={t('Fit, parts, values and geometry of every bike side by side. Tap a cell to fill it in.')}
  />

  {#if !bikes.length && $bikesQ}
    <!-- v0.127.0 A-U2: the one empty building block -->
    <Empty icon={BikeIcon} title={t('No bikes yet')} text={t('Add your bike, or bring your data along with a backup.')} action={{ label: t('Add bike'), href: '#/bikes', onclick: wantBike }}>{t('Or import your data on the')} <a href="#/">{t('start page')}</a>.</Empty>
  {:else if bikes.length}
    {#if bikes.length > 2}
      <div class="bpicks" role="group" aria-label={t('Bikes to compare')}>
        {#each bikes as b (b.id)}
          <button type="button" class="bpick" aria-pressed={cols.some((c) => c.id === b.id)} onclick={() => togglePick(b.id)}>{b.name}</button>
        {/each}
      </div>
    {/if}
    {#snippet rows(list)}
      {#each list as r (r.id)}
        <tr class:first={r.first && r.part}>
          <th scope="row" class="rh">{#if r.first && r.part}<span class="pn">{r.part}</span>{/if}<span class="fl">{t(r.label)}</span></th>
          {#each cols as b, i (b.id)}
            <td class:diff={r.differ && r.values[i] != null}>
              <button type="button" class="cell" class:none={r.values[i] == null} aria-label="{b.name}: {cellLabel(r)}: {show(r, r.values[i])}" onclick={() => open(b, r)}>{show(r, r.values[i])}</button>
            </td>
          {/each}
        </tr>
      {/each}
    {/snippet}
    {#snippet group(g)}
      {#if g.rows.length}
        <tr class="gh"><th scope="rowgroup" colspan={cols.length + 1}><span class="zl">{t(g.name)}</span></th></tr>
        {@render rows(g.rows)}
      {/if}
    {/snippet}
    <div class="wrap surf" role="region" aria-label={t('Compare bikes')} tabindex="-1">
      <table>
        <thead>
          <tr>
            <th scope="col" class="rh corner">{t('Part')}</th>
            {#each cols as b (b.id)}<th scope="col" class="bh">{b.name}</th>{/each}
          </tr>
        </thead>
        <tbody>
          {@render group(table.fit)}
          {#if table.top.length}
            <tr class="gh"><th scope="rowgroup" colspan={cols.length + 1}><span class="zl">{t('Key values')}</span></th></tr>
            {@render rows(table.top)}
          {/if}
          {#each table.main as g (g.area)}{@render group(g)}{/each}
          {@render group(table.geo)}
          <tr class="gh morerow">
            <th scope="rowgroup" colspan={cols.length + 1}>
              <button type="button" class="morebtn" aria-expanded={more} onclick={() => (more = !more)}>
                {#if more}<ChevronDown size={18} aria-hidden="true" />{:else}<ChevronRight size={18} aria-hidden="true" />{/if}
                {t('More')} <span class="n">{t('{n} more parts: frame, suspension, cockpit, own parts', { n: moreCount })}</span>
              </button>
            </th>
          </tr>
          {#if more}{#each table.more as g (g.area)}{@render group(g)}{/each}{/if}
        </tbody>
        <tfoot>
          <tr class="gh"><th scope="rowgroup" colspan={cols.length + 1}><span class="zl">{t('Weight per area')}</span></th></tr>
          {#each areas as a (a.key)}
            <tr>
              <th scope="row" class="rh"><span class="fl">{t(a.name)}</span></th>
              {#each cols as b (b.id)}
                {@const w = areaWeight(b, a.key)}
                <td class="tot num">{w.known ? formatWeight(w.g) : '–'}{#if w.known && w.known < w.total}<small>{t('{n} of {all}', { n: w.known, all: w.total })}</small>{/if}</td>
              {/each}
            </tr>
          {/each}
          <tr class="sum">
            <th scope="row" class="rh"><span class="fl">{t('Total|weight')}</span></th>
            {#each cols as b (b.id)}
              {@const g = areas.reduce((s, a) => s + areaWeight(b, a.key).g, 0)}
              <td class="tot num">{g ? formatWeight(g) : '–'}</td>
            {/each}
          </tr>
        </tfoot>
      </table>
    </div>
    <p class="hid">
      {#if all}<button type="button" class="showall" onclick={() => (all = false)}>{t('Hide empty rows')}</button>{:else if hidden}{t('Only rows with at least one value · {n} empty rows hidden', { n: hidden })} · <button type="button" class="showall" onclick={() => (all = true)}>{t('show all')}</button>{/if}
    </p>
    <p class="legend"><span class="sw diffsw" aria-hidden="true"></span>{t('= the bikes differ here')}</p>
  {/if}
</div>

{#if edit}
  <dialog class="sheet" bind:this={dialog} onclose={closed} aria-labelledby="cmp-h">
    <p class="meta">{edit.bikeName}</p>
    <h2 id="cmp-h" class="title">{cellLabel(edit.row)}</h2>
    <form method="dialog" onsubmit={(e) => (e.preventDefault(), save())}>
      <label class="fld">
        <span class="lbl">{t(edit.row.label)}{edit.row.unit ? ` (${edit.row.unit})` : ''}</span>
        <!-- svelte-ignore a11y_autofocus -->
        <input class="inp" class:num={edit.row.num} type="text" inputmode={edit.row.num ? 'decimal' : 'text'} autocomplete="off" bind:value={edit.value} autofocus />
      </label>
      <div class="acts">
        <button type="submit" class="btn hi">{t('Save')}</button>
        {#if edit.value}<button type="button" class="btn" onclick={() => save(true)}>{t('Clear')}</button>{/if}
        <button type="button" class="btn" onclick={() => dialog.close()}>{t('Cancel')}</button>
      </div>
    </form>
  </dialog>
{/if}

<style>
  .wrap {
    max-width: 100%;
    overflow-x: auto;
    overscroll-behavior-x: contain;
    margin-top: 8px;
  }
  table {
    border-collapse: separate;
    border-spacing: 0;
    width: 100%;
    font-size: var(--fs-small);
  }
  th,
  td {
    text-align: left;
    vertical-align: middle;
    border-bottom: 1px solid var(--line);
  }
  thead th {
    position: sticky;
    top: 0;
    z-index: 1;
    background: var(--paper);
    padding: 12px 10px;
    font-weight: 600;
    color: var(--ink);
  }
  .bh {
    min-width: 128px;
    overflow-wrap: break-word;
  }
  .rh {
    position: sticky;
    left: 0;
    z-index: 2;
    background: var(--paper);
    min-width: 132px;
    max-width: 180px;
    padding: 6px 10px 6px 14px;
    font-weight: 400;
    border-right: 1px solid var(--line);
  }
  .corner {
    z-index: 3;
    color: var(--ink-3);
    font-weight: 500;
  }
  .rh .pn {
    display: block;
    font-weight: 600;
    color: var(--ink);
  }
  .rh .fl {
    display: block;
    color: var(--ink-3);
  }
  tr.first .rh .fl {
    color: var(--ink-3);
  }
  td {
    padding: 0;
  }
  td.diff {
    background: var(--info-soft);
  }
  .cell {
    display: block;
    width: 100%;
    min-height: 44px;
    padding: 6px 10px;
    border: 0;
    background: none;
    font: inherit;
    color: var(--ink);
    text-align: left;
    cursor: pointer;
    overflow-wrap: break-word;
  }
  .cell:hover {
    background: var(--paper-2);
  }
  .cell.none {
    color: var(--ink-3);
  }
  .gh th {
    position: sticky;
    left: 0;
    padding: 14px 14px 4px;
    background: var(--paper);
    text-align: left;
  }
  .zl {
    position: sticky;
    left: 14px;
    color: var(--ink-3);
    font: 600 var(--fs-small) / 1.3 var(--font-body);
    letter-spacing: 0.06em;
    text-transform: uppercase;
  }
  .morebtn {
    position: sticky;
    left: 14px;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    min-height: 44px;
    border: 0;
    background: none;
    padding: 0;
    font: 600 var(--fs-body) var(--font-body);
    color: var(--ink);
    cursor: pointer;
  }
  .morebtn .n {
    font-weight: 400;
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .tot {
    padding: 8px 10px;
    color: var(--ink-2);
  }
  .tot small {
    display: block;
    color: var(--ink-3);
  }
  tr.sum .tot,
  tr.sum .fl {
    font-weight: 600;
    color: var(--ink);
  }
  .bpicks {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin: 10px 0 0;
  }
  .bpick {
    min-height: 44px;
    padding: 6px 14px;
    border: 1px solid var(--line);
    border-radius: 999px;
    background: var(--paper);
    color: var(--ink-2);
    font: 500 var(--fs-small) var(--font-body);
    cursor: pointer;
  }
  .bpick[aria-pressed='true'] {
    background: var(--brand);
    border-color: var(--brand);
    color: var(--brand-ink);
  }
  .hid {
    margin: 10px 0 0;
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .showall {
    min-height: 44px;
    padding: 0;
    border: 0;
    background: none;
    color: var(--hi);
    font: 600 var(--fs-small) var(--font-body);
    cursor: pointer;
  }
  .legend {
    display: flex;
    align-items: center;
    gap: 8px;
    margin: 10px 0 0;
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .diffsw {
    background: var(--info-soft);
    border: 1px solid var(--line);
  }
  .meta {
    margin: 0;
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .fld {
    display: block;
    margin: 14px 0;
  }
  .acts {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
</style>
