<script>
  /**
   * v0.68.0 «Q1 Jeder km zählt» (Q1.1 a, Q1.2 a): the ride ledger as its own block at the top of a bike
   * (Bikes › Care › bike). The km are the sum of the rides: every ride with date, km, unit, profile,
   * source and how sure its bike is; the bike's km after it. An unclear ride stands red in the list with
   * the bike buttons right there and counts only after you confirmed it. Nothing is overwritten: every
   * change is its own entry with a date and a source, and every action can be undone.
   * bike: the bike (as stored); bikes: all bikes (for the buttons and «Change bike»).
   */
  import { liveQuery } from 'dexie';
  import { MoreHorizontal } from '@lucide/svelte';
  import { db } from '../db.js';
  import { localDay } from '../localday.js';
  import { parseKm } from '../care.js';
  import { bikesHash } from '../bikes.js';
  import { ledgerRows, ledgerCounts, bikeKm, reasonText, entryTitle, entryDetail, makeEntry } from '../kmbook.js';
  import { addEntries, updateEntry, restoreEntries, deleteEntries, undoImport, LAST_KM_IMPORT } from '../kmbookdb.js';
  import KmChips from './KmChips.svelte';
  import DateInput from '../ui/DateInput.svelte';
  import { t, tn, num, dateOf } from '../i18n.svelte.js';

  let { bike, bikes = [] } = $props();

  const bookQ = $derived(liveQuery(() => db.kmBook.where('bikeId').equals(bike.id).toArray()));
  const lastQ = liveQuery(() => db.meta.get(LAST_KM_IMPORT));
  const entries = $derived($bookQ ?? []);
  const rows = $derived(ledgerRows(entries, bike.id));
  const n = $derived(ledgerCounts(entries, bike.id));
  const total = $derived(bikeKm(entries, bike.id));
  const waiting = $derived(Math.round(n.open.reduce((s, e) => s + e.km, 0)));
  const nameOf = (id) => bikes.find((b) => b.id === id)?.name ?? t('another bike');
  // the import banner: only right after an import that wrote into this bike's ledger, until closed
  const last = $derived($lastQ && entries.some((e) => e.importId === $lastQ.id) && Date.now() - Date.parse($lastQ.at) < 864e5 ? $lastQ : null);
  let bannerOff = $state(null);

  const FILTERS = ['all', 'open', 'corr'];
  let filter = $state('all');
  const shownRows = $derived(filter === 'open' ? rows.filter((r) => r.state === 'open') : filter === 'corr' ? rows.filter((r) => r.kind === 'correction' || r.kind === 'reading') : rows);
  let all = $state(false);
  const LIMIT = 12;
  const visible = $derived(all ? shownRows : shownRows.slice(0, LIMIT));

  /* ---------- what was just done, with Undo ---------- */
  let notice = $state(null);
  let timer;
  function say(text, undo = null) {
    clearTimeout(timer);
    notice = { id: Date.now(), text, undo };
    timer = setTimeout(() => (notice = null), undo ? 9000 : 5000);
  }
  async function undo() {
    const u = $state.snapshot(notice?.undo);
    notice = null;
    if (u) await restoreEntries(db, u);
  }

  /* ---------- km by hand, correction ---------- */
  let form = $state(null); // 'ride' | 'corr'
  let fDate = $state(localDay());
  let fKm = $state('');
  let fName = $state('');
  let fErr = $state('');
  function openForm(kind) {
    form = form === kind ? null : kind;
    fDate = localDay();
    fKm = '';
    fName = '';
    fErr = '';
  }
  async function saveForm(e) {
    e.preventDefault();
    const raw = String(fKm).trim().replace(/^\+/, '');
    const neg = raw.startsWith('-') || raw.startsWith('−');
    const k = parseKm(raw.replace(/^[-−]/, ''));
    if (k == null || Number.isNaN(k)) return (fErr = t('Type the km as a whole number, e.g. 12400.'));
    if (form === 'corr' && !fName.trim()) return (fErr = t('Say why: the reason stays with the correction.'));
    const entry =
      form === 'corr'
        ? makeEntry({ bikeId: bike.id, date: fDate, km: neg ? -k : k, kind: 'correction', source: 'hand', by: 'user', sure: 'user', note: fName.trim() })
        : makeEntry({ bikeId: bike.id, date: fDate, km: k, kind: 'ride', source: 'hand', by: 'user', sure: 'user', name: fName.trim() });
    const ids = await addEntries(db, [entry]);
    const kind = form;
    form = null;
    say(kind === 'corr' ? t('Correction saved: {km} km.', { km: num(entry.km) }) : t('Saved: {km} km on {date}.', { km: num(entry.km), date: dateOf(entry.date) }), { del: ids });
  }

  /* ---------- one row: confirm, change, leave out ---------- */
  let editing = $state(null); // entry id
  let eBike = $state('');
  let eKm = $state('');
  let eDate = $state('');
  let eName = $state('');
  let otherFor = $state(null); // the open row whose «other …» list is shown
  function edit(r) {
    if (editing === r.id) return (editing = null);
    editing = r.id;
    eBike = r.bikeId ?? '';
    eKm = String(r.km);
    eDate = r.date;
    eName = r.kind === 'correction' ? r.note : r.name;
  }
  async function change(r, changes, text) {
    editing = null;
    const prev = await updateEntry(db, r.id, changes);
    if (prev) say(text, { put: [prev] });
  }
  const confirm = (r, bikeId) =>
    change(r, { bikeId, state: 'counted', by: 'user', sure: 'user', reason: null }, bikeId === bike.id ? t('Counts now: {km} km on {bike}.', { km: num(r.km), bike: bike.name }) : t('Moved to {bike}: {km} km.', { km: num(r.km), bike: nameOf(bikeId) }));
  async function saveEdit(r) {
    const k = Number(String(eKm).replace(',', '.').replace('−', '-'));
    if (!Number.isFinite(k)) return;
    const moved = eBike !== r.bikeId;
    const changes = { km: Math.round(k * 10) / 10, date: eDate || r.date, ...(r.kind === 'correction' ? { note: eName } : { name: eName }) };
    if (moved) Object.assign(changes, { bikeId: eBike || null, by: 'user', sure: 'user', state: eBike ? (r.state === 'removed' ? 'removed' : 'counted') : 'open' });
    editing = null;
    await change(r, changes, moved ? t('Moved to {bike}: {km} km.', { km: num(changes.km), bike: nameOf(eBike) }) : t('Changed.'));
  }
  const leaveOut = (r) => change(r, { state: 'removed', was: r.state }, t('Left out: it stays in the list, struck through, until you remove it.'));
  const takeBack = (r) => change(r, { state: r.was && r.was !== 'removed' ? r.was : 'counted' }, t('Back in the ledger.'));
  async function remove(r) {
    editing = null;
    const gone = await deleteEntries(db, [r.id]);
    say(t('Removed.'), { put: gone });
  }
  /** The bikes offered on an unclear row: the proposal, the one that contradicts it, then «other …». */
  const offers = (r) => [...new Set([r.bikeId, r.reason?.said, r.reason?.bike, ...(r.reason?.bikes ?? [])].filter((id) => id && bikes.some((b) => b.id === id)))].slice(0, 3);
</script>

<section class="kmbook card" aria-labelledby="kmb-h-{bike.id}">
  {#if last && bannerOff !== last.id}
    <p class="banner" role="status">
      <span>{last.text}</span>
      <span class="bacts">
        <button type="button" class="blink" onclick={() => undoImport(db, last.id)}>{t('Undo')}</button>
        <button type="button" class="bx" aria-label={t('Close')} onclick={() => (bannerOff = last.id)}>×</button>
      </span>
    </p>
  {/if}
  <h3 class="zlabel" id="kmb-h-{bike.id}">{t('Ride ledger · km history')}</h3>
  <div class="tot">
    <div><span class="bignum num">{total.km != null ? num(total.km) : '–'} km</span><small>{bike.name}{total.kmDate ? `, ${t('as of {date}', { date: dateOf(total.kmDate) })}` : ''}</small></div>
    {#if n.open.length}<div class="wait"><span class="bignum num">+{num(waiting)} km</span><small>{tn(n.open.length, '{n} ride waits for you', '{n} rides wait for you')}</small></div>{/if}
  </div>
  <p class="expl">{t('The km are the sum of the rides.')} {tn(n.rides, '{n} ride', '{n} rides')}{n.hand ? `, ${tn(n.hand, '{n} entry by hand', '{n} entries by hand')}` : ''}{n.corrections ? `, ${tn(n.corrections, '{n} correction', '{n} corrections')}` : ''}. {t('Nothing is overwritten: every change is its own entry with a date and a source.')}</p>

  <div class="bar">
    <div class="acts">
      <button type="button" class="btn hi" aria-expanded={form === 'ride'} onclick={() => openForm('ride')}>{t('Enter km')}</button>
      <button type="button" class="btn" aria-expanded={form === 'corr'} onclick={() => openForm('corr')}>{t('Correction')}</button>
      <a class="btn" href={bikesHash({ tab: 'care', bike: bike.id, view: 'import' })}>{t('Import rides')}</a>
    </div>
    <div class="filt" role="group" aria-label={t('Show entries')}>
      {#each FILTERS as f (f)}
        <button type="button" class="fchip f-{f}" aria-pressed={filter === f} onclick={() => ((filter = f), (all = false))}>
          {f === 'all' ? t('All|entries') : f === 'open' ? `${t('unclear')} ${n.open.length}` : `${t('Corrections')} ${n.corrections}`}
        </button>
      {/each}
    </div>
  </div>

  {#if form}
    <form class="fm surf" onsubmit={saveForm}>
      <p class="fh">{form === 'corr' ? t('Correction with a reason') : t('A ride by hand')}</p>
      <label><span class="lbl">{t('Date')}</span><DateInput bind:value={fDate} /></label>
      <label><span class="lbl">{form === 'corr' ? t('km (minus takes km off)') : 'km'}</span><input class="inp num" type="text" inputmode="decimal" autocomplete="off" bind:value={fKm} placeholder={form === 'corr' ? '-6' : '22'} /></label>
      <label class="wide"><span class="lbl">{form === 'corr' ? t('Reason') : t('Name (optional)')}</span><input class="inp" type="text" autocomplete="off" bind:value={fName} placeholder={form === 'corr' ? t('e.g. ride counted twice, both units ran') : t('e.g. commute without a unit')} /></label>
      {#if fErr}<p class="err" role="alert">{fErr}</p>{/if}
      <div class="fb"><button type="submit" class="btn ink">{t('Save')}</button><button type="button" class="btn" onclick={() => (form = null)}>{t('Cancel')}</button></div>
    </form>
  {/if}

  {#if rows.length}
    <div class="cols" aria-hidden="true"><span>{t('Date')}</span><span>{t('Ride · unit · profile')}</span><span class="r">km</span><span>{t('Source · how sure')}</span><span class="r">{t('Bike km after')}</span><span></span></div>
    <ul class="rows">
      {#each visible as r (r.id)}
        <li class="row" class:open={r.state === 'open'} class:gone={r.state === 'removed'}>
          <span class="d num">{dateOf(r.date)}</span>
          <span class="w">
            <b>{entryTitle(r)}</b>
            {#if entryDetail(r)}<small>{entryDetail(r)}</small>{/if}
            {#if r.state === 'open'}
              <small class="why">{t('Counts only after you confirm it.')} {reasonText(r.reason, nameOf)}</small>
              <span class="pick" role="group" aria-label={t('Which bike?')}>
                {#each offers(r) as id (id)}<button type="button" class="btn sm" onclick={() => confirm(r, id)}>{nameOf(id)}</button>{/each}
                <button type="button" class="btn sm" aria-expanded={otherFor === r.id} onclick={() => (otherFor = otherFor === r.id ? null : r.id)}>{t('other …')}</button>
                {#if otherFor === r.id}
                  <select class="sel mini" aria-label={t('Bike')} onchange={(e) => e.currentTarget.value && confirm(r, e.currentTarget.value)}>
                    <option value="">{t('Choose a bike')}</option>
                    {#each bikes as b (b.id)}<option value={b.id}>{b.name}</option>{/each}
                  </select>
                {/if}
              </span>
            {:else if r.state === 'removed'}
              <small class="why">{t('Left out: does not count.')}</small>
            {/if}
          </span>
          <span class="k num" class:neg={r.km < 0}>{r.kind === 'correction' || r.kind === 'reading' ? `${r.km > 0 ? '+' : ''}${num(r.km)}` : num(r.km)} km</span>
          <span class="s"><KmChips source={r.source} kind={r.kind} sure={r.kind === 'ride' ? r.sure : null} /></span>
          <span class="a num">{r.after != null ? `${num(Math.round(r.after))} km` : '–'}</span>
          <span class="m">
            <button type="button" class="more" aria-expanded={editing === r.id} aria-label={t('Change or leave out: {what}', { what: entryTitle(r) })} onclick={() => edit(r)}><MoreHorizontal size={18} aria-hidden="true" /></button>
          </span>
          {#if editing === r.id}
            <div class="ed">
              <label><span class="lbl">{t('Bike')}</span>
                <select class="sel" bind:value={eBike}>
                  <option value="">{t('no bike yet (unclear)')}</option>
                  {#each bikes as b (b.id)}<option value={b.id}>{b.name}</option>{/each}
                </select>
              </label>
              <label><span class="lbl">km</span><input class="inp num" type="text" inputmode="decimal" bind:value={eKm} /></label>
              <label><span class="lbl">{t('Date')}</span><DateInput bind:value={eDate} /></label>
              <label class="wide"><span class="lbl">{r.kind === 'correction' ? t('Reason') : t('Name|ride')}</span><input class="inp" type="text" bind:value={eName} /></label>
              <div class="fb">
                <button type="button" class="btn ink sm" onclick={() => saveEdit(r)}>{t('Save')}</button>
                {#if r.state === 'removed'}
                  <button type="button" class="btn sm" onclick={() => takeBack(r)}>{t('Take back')}</button>
                  <button type="button" class="btn sm" onclick={() => remove(r)}>{t('Remove for good')}</button>
                {:else}
                  <button type="button" class="btn sm" onclick={() => leaveOut(r)}>{t('Leave out')}</button>
                {/if}
              </div>
            </div>
          {/if}
        </li>
      {/each}
    </ul>
    {#if shownRows.length > LIMIT}
      <button type="button" class="btn sm allbtn" onclick={() => (all = !all)}>{all ? t('Show fewer') : t('Show all {n}', { n: shownRows.length })}</button>
    {/if}
    <p class="hint">{t('Tap ⋯ on a row to change it or leave it out. A left-out ride stays visible as an entry until you remove it.')}</p>
  {:else}
    <p class="hint">{t('No entries yet. Enter the km by hand or import your rides (Strava activities.csv, FIT files).')}</p>
  {/if}
</section>

{#if notice}
  {#key notice.id}<p class="notice" role="status"><span>{notice.text}</span>{#if notice.undo}<button type="button" class="undo" onclick={undo}>{t('Undo')}</button>{/if}</p>{/key}
{/if}

<style>
  .kmbook {
    margin: 12px 0 16px;
  }
  .banner {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 6px 12px;
    margin: 0 0 12px;
    padding: 10px 14px;
    border-radius: var(--radius);
    background: var(--ink);
    color: var(--paper);
    font-size: var(--fs-small);
  }
  .bacts {
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }
  .blink,
  .bx {
    min-height: 44px;
    min-width: 44px;
    padding: 0 8px;
    border: 0;
    background: none;
    color: var(--paper);
    font: 600 var(--fs-small) var(--font-body);
    text-decoration: underline;
    cursor: pointer;
  }
  .bx {
    text-decoration: none;
    font-size: var(--fs-sub);
  }
  .kmbook .zlabel {
    margin-top: 0;
  }
  .tot {
    display: flex;
    flex-wrap: wrap;
    gap: 8px 32px;
    margin: 4px 0 6px;
  }
  .tot > div {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }
  .tot small {
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .wait .bignum {
    color: var(--bad);
  }
  .expl {
    margin: 4px 0 10px;
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .bar {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 8px 16px;
    margin: 0 0 8px;
  }
  .acts,
  .filt {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
  .fchip {
    min-height: 44px;
    padding: 0 12px;
    border: 1px solid var(--line);
    border-radius: 999px;
    background: var(--paper);
    color: var(--ink-2);
    font: 500 var(--fs-small) var(--font-body);
    cursor: pointer;
  }
  .fchip[aria-pressed='true'] {
    border-color: var(--ink);
    background: var(--paper-2);
    color: var(--ink);
  }
  .f-open {
    border-color: var(--bad);
    color: var(--bad);
  }
  .f-corr {
    background: var(--warn-soft);
    color: var(--warn);
  }
  .fm {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
    gap: 10px 14px;
    margin: 4px 0 12px;
    padding: 12px 14px;
  }
  .fm .fh,
  .fm .wide,
  .fm .fb,
  .fm .err {
    grid-column: 1 / -1;
  }
  .fh {
    margin: 0;
    font-weight: 600;
  }
  .fb {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
  .err {
    margin: 0;
    color: var(--bad);
    font-size: var(--fs-small);
  }
  .cols,
  .row {
    display: grid;
    grid-template-columns: 130px minmax(0, 1fr) 72px minmax(150px, 190px) 120px 44px;
    gap: 4px 14px;
    align-items: center;
  }
  .cols {
    padding: 6px 8px;
    border-bottom: 1px solid var(--line);
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .r,
  .k,
  .a {
    text-align: right;
  }
  .rows {
    list-style: none;
    margin: 0;
    padding: 0;
  }
  .row {
    padding: 8px;
    border-bottom: 1px solid var(--line);
  }
  .row.open {
    border-radius: var(--radius);
    background: var(--bad-soft);
  }
  .row.gone .w b,
  .row.gone .k {
    text-decoration: line-through;
    color: var(--ink-3);
  }
  .d {
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .w {
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
  }
  .w b {
    font-weight: 600;
    overflow-wrap: break-word;
  }
  .w small {
    color: var(--ink-3);
    font-size: var(--fs-small);
    overflow-wrap: break-word;
  }
  .w small.why {
    color: var(--bad);
    font-weight: 500;
  }
  .pick {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin-top: 4px;
  }
  .pick .btn {
    min-height: 44px;
  }
  .sel.mini {
    width: auto;
    min-height: 44px;
  }
  .k {
    font-weight: 600;
    white-space: nowrap;
  }
  .k.neg {
    color: var(--warn);
  }
  .a {
    color: var(--ink-2);
    font-size: var(--fs-small);
    white-space: nowrap;
  }
  .more {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 44px;
    height: 44px;
    border: 0;
    border-radius: var(--radius);
    background: none;
    color: var(--ink-2);
    cursor: pointer;
  }
  .more:hover {
    background: var(--paper-2);
  }
  .ed {
    grid-column: 1 / -1;
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 10px 14px;
    padding: 10px 0 4px;
  }
  .ed .wide,
  .ed .fb {
    grid-column: 1 / -1;
  }
  .allbtn {
    margin-top: 8px;
    min-height: 44px;
  }
  .hint {
    margin: 10px 0 0;
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .notice {
    position: fixed;
    left: 50%;
    transform: translateX(-50%);
    bottom: calc(16px + env(safe-area-inset-bottom));
    z-index: 30;
    display: flex;
    align-items: center;
    gap: 12px;
    width: max-content;
    max-width: min(560px, calc(100vw - 32px));
    margin: 0;
    padding: 10px 14px;
    border-radius: var(--radius);
    background: var(--ink);
    color: var(--paper);
    font-size: var(--fs-small);
    box-shadow: 0 4px 16px var(--shadow);
  }
  .undo {
    min-height: 40px;
    padding: 0 10px;
    border: 1px solid var(--paper);
    border-radius: 6px;
    background: none;
    color: var(--paper);
    font: 600 var(--fs-small) var(--font-body);
    cursor: pointer;
  }
  /* Phone: date and km on top, the ride, then the chips and the km after. */
  @media (max-width: 760px) {
    .cols {
      display: none;
    }
    .row {
      grid-template-columns: minmax(0, 1fr) auto 44px;
      grid-template-areas: 'd k m' 'w w w' 's a a';
      gap: 2px 10px;
      padding: 8px 4px;
    }
    .d {
      grid-area: d;
    }
    .k {
      grid-area: k;
    }
    .m {
      grid-area: m;
    }
    .w {
      grid-area: w;
    }
    .s {
      grid-area: s;
    }
    .a {
      grid-area: a;
    }
    .fm,
    .ed {
      grid-template-columns: minmax(0, 1fr);
    }
    .notice {
      bottom: calc(84px + env(safe-area-inset-bottom));
    }
  }
</style>
