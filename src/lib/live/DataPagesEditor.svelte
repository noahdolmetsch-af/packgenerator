<script>
  /**
   * «Datenseiten» (Noah 20.10.2026): the editor of the data pages, for the bottom sheet of the live map.
   * The list of pages: add, rename, delete (with Undo), order (arrows and drag). One page: its grid (a
   * ready one like Garmin, or free), its fields and charts (on, off, big or small, order), the small map.
   * The zones: the rider's own max heart rate and FTP (stored with the pages).
   *
   * set: the cleaned stored value; fields: the catalogue; route: is there a route; start: the id of the
   * page to open first (from the pencil on a data page); onsave(next): stores the new value (Live.svelte:
   * db.settings.put({ key: PAGES_KEY, value: next })).
   */
  import { untrack } from 'svelte';
  import { Plus, Pencil, Trash2, ChevronLeft, ChevronRight, X, Map as MapIcon, ChartLine } from '@lucide/svelte';
  import { t, tn } from '../i18n.svelte.js';
  import SortArrows from '../ui/SortArrows.svelte';
  import SortGrip from '../ui/SortGrip.svelte';
  import RenameSheet from '../ui/RenameSheet.svelte';
  import Fold from '../ui/Fold.svelte';
  import { sortable } from '../ui/sortable.js';
  import { askDelete, deleteWithUndo } from '../ui/ask.js';
  import { offerRename } from '../ui/rename.svelte.js';
  import {
    CHARTS,
    CHART,
    MAX_UNITS,
    MAX_PAGES,
    NAME_MAX,
    LAYOUT_NS,
    pageName,
    addPage,
    renamePage,
    deletePage,
    insertPage,
    movePage,
    updatePage,
    unitsOf,
    roomFor,
    toggleField,
    toggleChart,
    removeItem,
    moveItem,
    setBig,
    setMap,
    layoutOf,
    layoutFits,
    applyLayout,
    cleanMaxHr,
    cleanFtp,
    hrZones,
    powerZones,
  } from './datapages.js';

  let { set, fields = [], route = false, start = null, onsave } = $props();

  // the value shown: what was saved last, so quick taps build on each other before the database answers
  // svelte-ignore state_referenced_locally
  let cur = $state(set);
  $effect(() => {
    const next = set;
    untrack(() => (cur = next));
  });
  const save = async (next) => {
    cur = next;
    await onsave?.(next);
  };

  // svelte-ignore state_referenced_locally
  let openId = $state(start);
  const page = $derived(openId ? cur.pages.find((p) => p.id === openId) : null);
  const pageAt = $derived(page ? cur.pages.indexOf(page) : -1);
  const nameOf = (p) => pageName(p, t, cur.pages.indexOf(p));

  const FIELD = $derived(Object.fromEntries(fields.map((f) => [f.key, f])));
  const shownFields = $derived(fields.filter((f) => route || !f.route));
  const shownCharts = $derived(CHARTS.filter((c) => route || !c.route));
  const itemName = (it) => (it.f ? (FIELD[it.f] ? t(FIELD[it.f].label) : it.f) : t(CHART[it.c]?.label ?? it.c));
  const needsRoute = (it) => (it.f ? !!FIELD[it.f]?.route : !!CHART[it.c]?.route);

  const change = (fn) => page && save(updatePage(cur, page.id, fn));

  /* ---------- pages ---------- */
  let renaming = $state(null); // the page being renamed

  async function add() {
    const before = cur.pages.map((p) => p.id);
    await save(addPage(cur));
    const fresh = cur.pages.find((p) => !before.includes(p.id));
    if (fresh) renaming = fresh; // a name right away (Discard keeps «Page n»)
  }
  async function rename(p, value) {
    const was = p.name;
    const nm = String(value ?? '').trim();
    if (nm === was || (!was && nm === nameOf(p))) return; // unchanged (a ready page keeps its own name)
    await save(renamePage(cur, p.id, nm));
    const now = cur.pages.find((x) => x.id === p.id);
    offerRename(nameOf(now), () => save(renamePage(cur, p.id, was)));
  }
  async function remove(p) {
    const name = nameOf(p);
    if ((await askDelete({ title: t('Delete the page "{name}"?', { name }), text: t('Its fields and charts go with it. The map and the other pages stay. You can bring it back for 4 seconds afterwards.') })) !== 'delete') return;
    await deleteWithUndo({
      run: async () => {
        const r = deletePage(cur, p.id);
        if (openId === p.id) openId = null;
        await save(r.set);
        return r;
      },
      undo: (r) => save(insertPage(cur, r.page, r.at)),
      text: t('"{name}" deleted.', { name }),
      name,
    });
  }
  const movePg = (a, b) => save(movePage(cur, a, b));
  const summaryOf = (p) => {
    const nf = p.items.filter((it) => it.f).length;
    const nc = p.items.length - nf;
    return [nf ? tn(nf, '{n} field', '{n} fields') : '', nc ? tn(nc, '{n} chart', '{n} charts') : '', p.map ? t('small map') : ''].filter(Boolean).join(' · ');
  };

  /* ---------- zones ---------- */
  const hrZ = $derived(hrZones(cur.maxHr));
  const pwZ = $derived(powerZones(cur.ftp));
  const rows = (zs) => zs.map((z) => `Z${z.z} ${z.to == null ? `> ${z.from - 1}` : `${z.from}–${z.to}`}`).join(' · ');
  function setZone(key, raw) {
    const v = key === 'maxHr' ? cleanMaxHr(raw) : cleanFtp(raw);
    save({ ...cur, [key]: v });
  }
</script>

<div class="dpe" data-dp-editor>
  {#if !page}
    <p class="dpe-intro">{t('Swipe left and right on the live map: the map is the first page, then your data pages. Each page shows up to {n} fields in big numbers; a chart takes the space of two fields. Everything here is a suggestion: change, add or delete what you like.', { n: MAX_UNITS })}</p>

    <ol class="dpe-list" use:sortable={{ onmove: movePg }} aria-label={t('Data pages')}>
      {#each cur.pages as p, i (p.id)}
        {@const name = nameOf(p)}
        <li class="dpe-row" data-sort-id={p.id} data-dp-row={p.id}>
          <SortGrip {name} onstep={(dir) => movePg(i, i + dir)} />
          <button type="button" class="dpe-open" onclick={() => (openId = p.id)} data-dp-open={p.id}>
            <span class="dpe-txt">
              <span class="dpe-name">{name}</span>
              <small>{summaryOf(p)}</small>
            </span>
            <ChevronRight size={18} aria-hidden="true" />
          </button>
          <button type="button" class="dpe-ic" onclick={() => (renaming = p)} aria-label={t('Rename {name}', { name })} data-dp-rename={p.id}><Pencil size={18} aria-hidden="true" /></button>
          <button type="button" class="dpe-ic" onclick={() => remove(p)} aria-label={t('Delete {name}', { name })} data-dp-delete={p.id}><Trash2 size={18} aria-hidden="true" /></button>
          <SortArrows {name} {i} n={cur.pages.length} onstep={(dir) => movePg(i, i + dir)} />
        </li>
      {/each}
    </ol>
    {#if !cur.pages.length}
      <p class="dpe-note">{t('No data pages: only the map. Add a page to see your numbers big.')}</p>
    {/if}
    <button type="button" class="btn" onclick={add} disabled={cur.pages.length >= MAX_PAGES} data-dp-add><Plus size={18} aria-hidden="true" />{t('Add page')}</button>
    {#if cur.pages.length >= MAX_PAGES}<p class="dpe-note">{t('At most {n} data pages.', { n: MAX_PAGES })}</p>{/if}

    <Fold label={t('Your zones')} summary={[cur.maxHr ? `${cur.maxHr} bpm` : '', cur.ftp ? `${cur.ftp} W FTP` : ''].filter(Boolean).join(' · ')}>
      <p class="dpe-note">{t('For the zone charts. Heart rate: 5 zones from your max heart rate (Z1 50–60 %, Z2 60–70 %, Z3 70–80 %, Z4 80–90 %, Z5 90–100 %; lower counts to Z1). Power: the 7 Coggan zones from your FTP, the same as in Training (Z1 up to 55 %, Z2 to 75 %, Z3 to 90 %, Z4 to 105 %, Z5 to 120 %, Z6 to 150 %, Z7 above). The charts only show the time in each zone; they do not judge.')}</p>
      <label class="dpe-field">
        <span>{t('Max heart rate (bpm)')}</span>
        <input type="number" inputmode="numeric" min="100" max="240" value={cur.maxHr ?? ''} onchange={(e) => setZone('maxHr', e.currentTarget.value)} data-dp-maxhr />
      </label>
      {#if hrZ}<p class="dpe-zones" data-dp-hrzones>{rows(hrZ)}</p>{/if}
      <label class="dpe-field">
        <span>{t('FTP (W)')}</span>
        <input type="number" inputmode="numeric" min="50" max="700" value={cur.ftp ?? ''} onchange={(e) => setZone('ftp', e.currentTarget.value)} data-dp-ftp />
      </label>
      {#if pwZ}<p class="dpe-zones" data-dp-pwzones>{rows(pwZ)}</p>{/if}
    </Fold>
  {:else}
    {@const used = unitsOf(page.items)}
    {@const lay = layoutOf(page.items)}
    {@const name = nameOf(page)}
    <div class="dpe-top">
      <button type="button" class="btn sm" onclick={() => (openId = null)} data-dp-back><ChevronLeft size={18} aria-hidden="true" />{t('All data pages')}</button>
    </div>
    <h3 class="dpe-title">
      <span>{name}</span>
      <button type="button" class="dpe-ic" onclick={() => (renaming = page)} aria-label={t('Rename {name}', { name })} data-dp-rename={page.id}><Pencil size={18} aria-hidden="true" /></button>
      <button type="button" class="dpe-ic" onclick={() => remove(page)} aria-label={t('Delete {name}', { name })} data-dp-delete={page.id}><Trash2 size={18} aria-hidden="true" /></button>
    </h3>
    <p class="dpe-note">{t('Page {n} of {all}. The map is page 1.', { n: pageAt + 2, all: cur.pages.length + 1 })}</p>

    <h4 class="dpe-h">{t('Grid|dp')}</h4>
    <p class="dpe-note">{t('A suggestion like on a Garmin: how many fields and how big. Afterwards each field can still be big or small (free arrangement).')}</p>
    <div class="dpe-chips" role="group" aria-label={t('Grid|dp')}>
      {#each LAYOUT_NS as n (n)}
        <button type="button" class="dpe-chip" aria-pressed={lay === n} disabled={!layoutFits(page, n)} onclick={() => change((p) => applyLayout(p, n, shownFields.map((f) => f.key)))} aria-label={tn(n, '{n} field', '{n} fields')} data-dp-layout={n}>{n}</button>
      {/each}
      <span class="dpe-chip dpe-free" aria-current={lay === 'free' ? 'true' : undefined}>{t('Free|dp')}</span>
    </div>

    <h4 class="dpe-h">{t('On this page')}</h4>
    <p class="dpe-note" data-dp-units>{t('{n} of {max} places used. A small field takes one place, a big field or a chart two.', { n: used, max: MAX_UNITS })}</p>
    <ol class="dpe-list" use:sortable={{ onmove: (a, b) => change((p) => moveItem(p, a, b)) }} aria-label={t('On this page')}>
      {#each page.items as it, i (it.f ?? `c:${it.c}`)}
        {@const nm = itemName(it)}
        <li class="dpe-row" data-sort-id={it.f ?? `c:${it.c}`} data-dp-item={it.f ?? `c:${it.c}`}>
          <SortGrip name={nm} onstep={(dir) => change((p) => moveItem(p, i, i + dir))} />
          <span class="dpe-item">
            <span>{#if it.c}<ChartLine size={16} aria-hidden="true" class="dpe-chart-ic" />{/if}{nm}</span>
            {#if needsRoute(it) && !route}<small>{t('needs a route')}</small>{/if}
          </span>
          {#if it.f}
            <button type="button" class="dpe-size" aria-pressed={it.big} disabled={!it.big && used >= MAX_UNITS} onclick={() => change((p) => setBig(p, i, !it.big))} data-dp-big={it.f}>{it.big ? t('Big|dp') : t('Small|dp')}</button>
          {/if}
          <button type="button" class="dpe-ic" disabled={page.items.length < 2} onclick={() => change((p) => removeItem(p, i))} aria-label={t('Remove {name}', { name: nm })} data-dp-remove={it.f ?? `c:${it.c}`}><X size={18} aria-hidden="true" /></button>
          <SortArrows name={nm} {i} n={page.items.length} onstep={(dir) => change((p) => moveItem(p, i, i + dir))} />
        </li>
      {/each}
    </ol>

    <h4 class="dpe-h">{t('Add fields')}</h4>
    <div class="dpe-chips" role="group" aria-label={t('Add fields')}>
      {#each shownFields.filter((f) => !page.items.some((it) => it.f === f.key)) as f (f.key)}
        <button type="button" class="dpe-chip" disabled={!roomFor(page, 'field')} onclick={() => change((p) => toggleField(p, f.key))} data-dp-addfield={f.key}><Plus size={14} aria-hidden="true" />{t(f.label)}</button>
      {/each}
    </div>

    <h4 class="dpe-h">{t('Add charts')}</h4>
    <div class="dpe-chips" role="group" aria-label={t('Add charts')}>
      {#each shownCharts.filter((c) => !page.items.some((it) => it.c === c.key)) as c (c.key)}
        <button type="button" class="dpe-chip" disabled={!roomFor(page, 'chart')} onclick={() => change((p) => toggleChart(p, c.key))} data-dp-addchart={c.key}><Plus size={14} aria-hidden="true" />{t(c.label)}</button>
      {/each}
    </div>
    {#if !roomFor(page, 'field')}<p class="dpe-note">{t('The page is full. Remove a field or make one small to add more.')}</p>{/if}

    <label class="dpe-check">
      <input type="checkbox" checked={page.map} onchange={(e) => change((p) => setMap(p, e.currentTarget.checked))} data-dp-smallmap />
      <span><b><MapIcon size={16} aria-hidden="true" /> {t('Small map at the bottom')}</b><small>{t('The fields get a little less room.')}</small></span>
    </label>
  {/if}
</div>

{#if renaming}
  {@const p = renaming}
  <RenameSheet
    kicker={t('Data page')}
    title={t('Rename page')}
    value={p.name || nameOf(p)}
    max={NAME_MAX}
    hint={t('The name stands at the top of the page and next to its dot.')}
    empty={p.std ? t('Empty: the page gets its own name back.') : ''}
    onsave={(v) => rename(p, v)}
    onclose={() => (renaming = null)}
  />
{/if}

<style>
  .dpe {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  .dpe-intro,
  .dpe-note {
    margin: 0;
    font-size: var(--fs-small);
    color: var(--ink-2);
  }
  .dpe-list {
    display: flex;
    flex-direction: column;
    margin: 0;
    padding: 0;
    list-style: none;
    border-top: 1px solid var(--line);
  }
  .dpe-row {
    display: flex;
    align-items: center;
    gap: 4px;
    min-height: 48px;
    border-bottom: 1px solid var(--line);
    background: var(--paper);
  }
  .dpe-open {
    flex: 1;
    display: flex;
    align-items: center;
    gap: 8px;
    min-width: 0;
    min-height: 44px;
    padding: 4px 0;
    border: 0;
    background: none;
    color: var(--ink);
    text-align: left;
    cursor: pointer;
    font: inherit;
  }
  .dpe-txt {
    flex: 1;
    display: flex;
    flex-direction: column;
    min-width: 0;
  }
  .dpe-name {
    font-weight: 600;
    overflow-wrap: break-word;
  }
  .dpe-open small,
  .dpe-item small {
    font-size: var(--fs-small);
    color: var(--ink-2);
  }
  .dpe-item {
    flex: 1;
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 2px 6px;
    min-width: 0;
    overflow-wrap: break-word;
  }
  .dpe-item :global(.dpe-chart-ic) {
    margin-right: 6px;
    vertical-align: -2px;
    color: var(--ink-2);
  }
  .dpe-ic {
    flex: none;
    display: grid;
    place-items: center;
    width: 44px;
    height: 44px;
    padding: 0;
    border: 0;
    border-radius: 8px;
    background: none;
    color: var(--ink-2);
    cursor: pointer;
  }
  .dpe-ic:disabled {
    opacity: 0.3;
    cursor: default;
  }
  .dpe-size {
    flex: none;
    min-width: 64px;
    min-height: 36px;
    padding: 0 10px;
    border: 1px solid var(--line);
    border-radius: 999px;
    background: var(--paper);
    color: var(--ink);
    font: inherit;
    font-size: var(--fs-small);
    cursor: pointer;
  }
  .dpe-size[aria-pressed='true'] {
    border-color: var(--ink);
    background: var(--ink);
    color: var(--paper);
  }
  .dpe-size:disabled {
    opacity: 0.4;
    cursor: default;
  }
  .dpe-top {
    display: flex;
  }
  .dpe-title {
    display: flex;
    align-items: center;
    gap: 4px;
    margin: 0;
    font-size: var(--fs-sub);
  }
  .dpe-title span {
    flex: 1;
    min-width: 0;
    overflow-wrap: break-word;
  }
  .dpe-h {
    margin: 8px 0 0;
    font-size: var(--fs-body);
  }
  .dpe-chips {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }
  .dpe-chip {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    min-height: 44px;
    min-width: 44px;
    justify-content: center;
    padding: 0 12px;
    border: 1px solid var(--line);
    border-radius: 999px;
    background: var(--paper);
    color: var(--ink);
    font: inherit;
    font-size: var(--fs-small);
    cursor: pointer;
  }
  .dpe-chip[aria-pressed='true'],
  .dpe-free[aria-current='true'] {
    border-color: var(--ink);
    background: var(--ink);
    color: var(--paper);
  }
  .dpe-chip:disabled {
    opacity: 0.4;
    cursor: default;
  }
  .dpe-free {
    cursor: default;
  }
  .dpe-field {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    font-size: var(--fs-body);
  }
  .dpe-field input {
    width: 7em;
    min-height: 44px;
    padding: 0 10px;
    border: 1px solid var(--line);
    border-radius: 8px;
    background: var(--paper);
    color: var(--ink);
    font: inherit;
  }
  .dpe-zones {
    margin: 0;
    font-size: var(--fs-tiny);
    color: var(--ink-2);
    font-variant-numeric: tabular-nums;
  }
  .dpe-check {
    display: flex;
    gap: 10px;
    align-items: flex-start;
    min-height: 44px;
    padding-top: 6px;
    cursor: pointer;
  }
  .dpe-check input {
    width: 22px;
    height: 22px;
    margin: 2px 0 0;
  }
  .dpe-check span {
    display: flex;
    flex-direction: column;
  }
  .dpe-check b {
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }
  .dpe-check small {
    font-size: var(--fs-small);
    color: var(--ink-2);
  }
</style>
