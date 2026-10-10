<script>
  /**
   * v0.68.0 «Q1 Jeder km zählt» (Q1.3 a, Q1.4 a, Q1.5 a): «Import rides» (Bikes › Care › Import rides).
   * Files: the Strava export activities.csv (with the bike column «Activity Gear») and Garmin FIT files
   * (unit, profile and the serial numbers of the bike's sensors). Every ride gets a bike by the rule
   * Sensor › Strava bike › profile rule › you; on top «Check»: contradictions, unusual distances, rides
   * without a bike. Then per bike, the sure ones folded. Per ride: the bike to choose plus chips where
   * it comes from and how sure it is. The rules sit right here and can be changed at any time.
   * Nothing is taken over before «Take over»; afterwards «Undo» on the bike page takes it all back.
   */
  import { liveQuery } from 'dexie';
  import { ChevronDown, ChevronRight, X, Upload } from '@lucide/svelte';
  import { db } from '../db.js';
  import { sortBikes, bikesHash } from '../bikes.js';
  import { parseStravaCsv, parseFit, planImport, importEntries, reasonText, sensorShort, signals, entryId } from '../kmbook.js';
  import { loadRules, saveRules, applyImport } from '../kmbookdb.js';
  import KmChips from './KmChips.svelte';
  import Empty from '../ui/Empty.svelte';
  import { t, tn, num, dateOf } from '../i18n.svelte.js';

  let { bikeId = null } = $props();

  const bikesQ = liveQuery(() => db.bikes.toArray());
  const bookQ = liveQuery(() => db.kmBook.toArray());
  const bikes = $derived(sortBikes($bikesQ ?? []));
  const entries = $derived($bookQ ?? []);
  const nameOf = (id) => bikes.find((b) => b.id === id)?.name ?? '–';
  const back = $derived(bikesHash({ tab: 'care', bike: bikeId, open: !!bikeId }));

  let rules = $state([]);
  loadRules(db).then((r) => (rules = r));
  async function setRules(next) {
    rules = next;
    await saveRules(db, $state.snapshot(next));
  }

  /* ---------- files ---------- */
  let files = $state([]); // [{ id, name, kind, records, error }]
  let busy = $state(false);
  let input;
  async function textOrBytes(file) {
    if (/\.gz$/i.test(file.name) && typeof DecompressionStream === 'function') {
      const raw = await new Response(file.stream().pipeThrough(new DecompressionStream('gzip'))).arrayBuffer();
      return { name: file.name.replace(/\.gz$/i, ''), buf: raw };
    }
    return { name: file.name, buf: await file.arrayBuffer() };
  }
  async function add(list) {
    busy = true;
    for (const file of list) {
      try {
        const { name, buf } = await textOrBytes(file);
        const bytes = new Uint8Array(buf);
        const isFit = bytes.length > 12 && String.fromCharCode(bytes[8], bytes[9], bytes[10], bytes[11]) === '.FIT';
        if (isFit) {
          const r = parseFit(bytes, name);
          files = [...files, { id: entryId(), name: file.name, kind: 'fit', records: [r], device: r.device, error: r.cycling ? '' : t('no ride (another sport)') }];
        } else {
          const { rides, other } = parseStravaCsv(new TextDecoder().decode(bytes));
          files = [...files, { id: entryId(), name: file.name, kind: 'csv', records: rides, other }];
        }
      } catch (err) {
        files = [...files, { id: entryId(), name: file.name, kind: 'bad', records: [], error: err.message }];
      }
    }
    busy = false;
    if (input) input.value = '';
  }
  const removeFile = (id) => (files = files.filter((f) => f.id !== id));
  const records = $derived(files.flatMap((f) => f.records));
  const csvFiles = $derived(files.filter((f) => f.kind === 'csv'));
  const fitFiles = $derived(files.filter((f) => f.kind === 'fit'));

  /* ---------- the plan and your choices ---------- */
  const plan = $derived(records.length ? planImport($state.snapshot(records), { bikes: $state.snapshot(bikes), rules: $state.snapshot(rules), entries }) : null);
  let choices = $state({}); // key → { bikeId, confirm, take }
  const choose = (key, c) => (choices = { ...choices, [key]: { ...(choices[key] ?? {}), ...c } });
  /** A row as it will be taken over: its bike, where from, how sure (after your choice). */
  function eff(row) {
    const c = choices[row.key] ?? {};
    if (c.bikeId !== undefined && c.bikeId !== row.bikeId) return { bikeId: c.bikeId || null, by: 'user', sure: c.bikeId ? 'user' : 'unclear' };
    if (c.confirm && row.bikeId) return { bikeId: row.bikeId, by: row.sure === 'unclear' ? 'user' : row.by, sure: row.sure === 'unclear' ? 'user' : row.sure };
    return { bikeId: row.bikeId, by: row.by, sure: row.sure };
  }
  const live = $derived(plan ? plan.rows.filter((r) => !r.dup || choices[r.key]?.take) : []);
  const checkRows = $derived(live.filter((r) => eff(r).sure === 'unclear'));
  const perBike = $derived(
    bikes.map((b) => {
      const rows = plan ? plan.rows.filter((r) => (r.dup && !choices[r.key]?.take ? r.bikeId === b.id : eff(r).bikeId === b.id && eff(r).sure !== 'unclear')) : [];
      const fresh = rows.filter((r) => !r.dup || choices[r.key]?.take);
      return { bike: b, rows, fresh, km: Math.round(fresh.reduce((s, r) => s + r.ride.km, 0)), dups: rows.length - fresh.length };
    }),
  );
  let openBikes = $state({});
  const isOpen = (id) => openBikes[id] ?? id === (bikeId ?? perBike.filter((x) => x.rows.length).sort((a, b) => b.rows.length - a.rows.length)[0]?.bike.id);
  const total = $derived({ n: live.length, km: Math.round(live.reduce((s, r) => s + r.ride.km, 0)), dup: plan ? plan.rows.length - live.length : 0, open: checkRows.length });

  const detail = (r) =>
    r.dup === 'merged'
      ? [r.ride.device, t('the same ride, second unit')].filter(Boolean).join(' · ')
      : r.dup === 'known'
        ? t('{source} · already in the ride ledger', { source: r.ride.source === 'fit' ? t('FIT file') : 'Strava' })
        : r.dup === 'start'
          ? t('before the start value, counted in it')
          : [r.ride.device, r.ride.profile ? t('Profile {name}', { name: r.ride.profile }) : '', ...(r.ride.sensors ?? []).slice(0, 1).map((s) => `${t('Sensor')} ${sensorShort(s.fp)}`), !r.ride.device && r.ride.gear ? t('Strava bike {gear}', { gear: r.ride.gear }) : ''].filter(Boolean).join(' · ');
  const DUP = { merged: 'duplicate: merged', known: 'duplicate: already in', start: 'in the start value' };

  /* ---------- rules (Q1.5): changeable here at any time ---------- */
  let editRules = $state(false);
  let adding = $state(false);
  let nKind = $state('profile');
  let nValue = $state('');
  let nBikes = $state([]);
  const KIND = { sensor: 'Sensor', profile: 'Profile', gear: 'Strava bike' };
  const toggleIn = (list, id) => (list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);
  const setRuleBikes = (id, bikeIds) => setRules(rules.map((r) => (r.id === id ? { ...r, bikeIds } : r)));
  const dropRule = (id) => setRules(rules.filter((r) => r.id !== id));
  async function addRule(kind = nKind, value = nValue, bikeIds = nBikes) {
    if (!String(value).trim() || !bikeIds.length) return;
    await setRules([...rules.filter((r) => !(r.kind === kind && r.value.toLowerCase() === String(value).trim().toLowerCase())), { id: entryId(), kind, value: String(value).trim(), bikeIds }]);
    adding = false;
    nValue = '';
    nBikes = [];
  }
  const ruleOrder = { sensor: 0, gear: 1, profile: 2 };
  const sortedRules = $derived([...rules].sort((a, b) => ruleOrder[a.kind] - ruleOrder[b.kind]));
  /** What the files show and no rule knows yet: new sensors (with the bike Strava names most), unknown Strava bikes. */
  const hints = $derived.by(() => {
    if (!plan) return [];
    const out = [];
    const ctx = { bikes, rules };
    const fps = new Map();
    for (const r of plan.rows) {
      const s = signals(r.ride, ctx);
      for (const x of r.ride.sensors ?? []) {
        if (rules.some((u) => u.kind === 'sensor' && u.value.toLowerCase() === x.fp.toLowerCase())) continue;
        const m = fps.get(x.fp) ?? { kind: x.kind, votes: {} };
        if (s.gear) m.votes[s.gear] = (m.votes[s.gear] ?? 0) + 1;
        fps.set(x.fp, m);
      }
      if (s.gearUnknown && !out.some((h) => h.kind === 'gear' && h.value === r.ride.gear)) out.push({ kind: 'gear', value: r.ride.gear, guess: '' });
    }
    for (const [fp, m] of fps) out.unshift({ kind: 'sensor', value: fp, sensor: m.kind, guess: Object.entries(m.votes).sort((a, b) => b[1] - a[1])[0]?.[0] ?? '' });
    return out;
  });
  let hintPick = $state({});

  /* ---------- take over ---------- */
  let done = $state('');
  async function takeOver() {
    if (!plan || !live.length) return;
    busy = true;
    const importId = entryId();
    const list = importEntries($state.snapshot(plan), $state.snapshot(choices), importId);
    const text = t('Just taken over: {rides} from {files}.', {
      rides: tn(list.length, '{n} ride', '{n} rides'),
      files: [csvFiles.length ? csvFiles.map((f) => f.name).join(', ') : '', fitFiles.length ? tn(fitFiles.length, '{n} FIT file', '{n} FIT files') : ''].filter(Boolean).join(t(' and ')),
    });
    const strava = Object.fromEntries(Object.entries(plan.strava).filter(([id]) => bikes.some((b) => b.id === id)));
    await applyImport(db, { entries: list, strava, importId, files: files.map((f) => f.name), text });
    busy = false;
    const target = bikeId ?? list.find((e) => e.bikeId)?.bikeId ?? null;
    location.hash = bikesHash({ tab: 'care', bike: target, open: !!target });
  }
</script>

{#snippet bikePick(r, unclear)}
  {@const e = eff(r)}
  <select class="sel bp" class:none={!e.bikeId} aria-label={t('Bike for {ride}', { ride: r.ride.name || dateOf(r.ride.date) })} value={e.bikeId ?? ''} onchange={(ev) => choose(r.key, { bikeId: ev.currentTarget.value || null, confirm: false })}>
    {#if !e.bikeId}<option value="">{t('unclear, please choose')}</option>{/if}
    {#each bikes as b (b.id)}<option value={b.id}>{b.name}</option>{/each}
  </select>
  <KmChips by={e.by} sure={e.sure} extra={!unclear ? t('new') : null} />
  {#if unclear && e.bikeId}<button type="button" class="btn sm" onclick={() => choose(r.key, { confirm: true })}>{t('confirm')}</button>{/if}
{/snippet}

{#snippet ride(r, unclear = false)}
  <li class="ir" class:dup={r.dup && !choices[r.key]?.take}>
    <span class="d num">{dateOf(r.ride.date)}</span>
    <span class="w"><b>{r.ride.name || (r.ride.source === 'fit' ? t('Ride from {unit}', { unit: r.ride.device || t('FIT file') }) : t('Ride'))}</b><small>{detail(r)}</small></span>
    <span class="k num">{num(r.ride.km)} km</span>
    <span class="c">
      {#if r.dup && !choices[r.key]?.take}
        <span class="dupchip">{t(DUP[r.dup])}</span>
        {#if r.dup !== 'merged'}<button type="button" class="lnk" onclick={() => choose(r.key, { take: true })}>{t('take anyway')}</button>{/if}
      {:else}
        {@render bikePick(r, unclear)}
      {/if}
    </span>
    {#if unclear && r.reason && eff(r).sure === 'unclear'}<small class="why">{reasonText(r.reason, nameOf)}</small>{/if}
  </li>
{/snippet}

<div class="kmi">
  <p class="crumb"><a href={back}>‹ {t('Care')}</a> · {t('Import rides')}</p>
  <h2 class="title">{t('Import rides')}</h2>
  <p class="sub">
    {#if plan}{tn(plan.rows.length, '{n} ride read.', '{n} rides read.')}{/if}
    {t('Every ride gets a bike. Tap to change it. Nothing is taken over before you tap «Take over».')}
  </p>

  <div class="grid">
    <div class="main">
      {#if !plan}
        <Empty text={t('Choose the Strava export activities.csv (Strava › Settings › Download your data) and/or FIT files from your Garmin. The file stays on this device.')} action={{ label: t('Choose files'), onclick: () => input?.click() }} />
      {:else}
        {#if checkRows.length}
          <section class="check surf" aria-labelledby="chk-h">
            <div class="ch"><h3 id="chk-h">{t('Check')} · {checkRows.length}</h3><span>{t('They count only when you confirm them.')}</span></div>
            <ul class="list">{#each checkRows as r (r.key)}{@render ride(r, true)}{/each}</ul>
          </section>
        {/if}
        {#each perBike as x (x.bike.id)}
          <section class="pb surf" aria-labelledby="pb-{x.bike.id}">
            <div class="ch">
              <h3 id="pb-{x.bike.id}">{x.bike.name}</h3>
              {#if x.rows.length}
                <span class="num">{t('{n} new', { n: x.fresh.length })} · {num(x.km)} km{#if x.dups} · {tn(x.dups, '{n} duplicate', '{n} duplicates')}{/if}
                  <button type="button" class="lnk" aria-expanded={isOpen(x.bike.id)} onclick={() => (openBikes = { ...openBikes, [x.bike.id]: !isOpen(x.bike.id) })}>{isOpen(x.bike.id) ? t('hide') : t('show')}</button>
                </span>
              {:else}<span>{t('no rides')}</span>{/if}
            </div>
            {#if isOpen(x.bike.id) && x.rows.length}<ul class="list">{#each x.rows as r (r.key)}{@render ride(r)}{/each}</ul>{/if}
          </section>
        {/each}
      {/if}
    </div>

    <aside class="side">
      <section class="surf box" aria-labelledby="f-h">
        <h3 id="f-h" class="zlabel">{t('Files')}</h3>
        {#if files.length}
          <ul class="files">
            {#each files as f (f.id)}
              <li>
                <span class="fn"><b>{f.name}</b>{#if f.kind === 'csv'} · Strava{:else if f.kind === 'fit' && f.device} · {f.device}{/if}{#if f.error}<small class="err">{f.error}</small>{/if}</span>
                <span class="num">{tn(f.records.filter((r) => r.cycling !== false).length, '{n} ride', '{n} rides')}</span>
                <button type="button" class="ix" aria-label={t('Remove {file}', { file: f.name })} onclick={() => removeFile(f.id)}><X size={16} aria-hidden="true" /></button>
              </li>
            {/each}
          </ul>
        {/if}
        <input bind:this={input} class="sr" type="file" multiple accept=".csv,.fit,.gz,.txt" aria-label={t('Choose files')} onchange={(e) => add([...e.currentTarget.files])} />
        <button type="button" class="btn" disabled={busy} onclick={() => input?.click()}><Upload size={16} aria-hidden="true" />{files.length ? t('Add a file') : t('Choose files')}</button>
      </section>

      <section class="surf box" aria-labelledby="r-h">
        <div class="rh"><h3 id="r-h" class="zlabel">{t('Rules')}</h3><button type="button" class="lnk" aria-expanded={editRules} onclick={() => (editRules = !editRules)}>{editRules ? t('done|rules') : t('change')}</button></div>
        <p class="quiet">{t('In this order. The first that fits counts.')}</p>
        <ol class="rules">
          {#each sortedRules.filter((r) => r.kind === 'sensor') as r (r.id)}{@render rule(r)}{/each}
          <li><span class="rk">{t('Bike in Strava')}<small>{t('column «Activity Gear»')}</small></span><b>{t('as Strava')}</b></li>
          {#each sortedRules.filter((r) => r.kind !== 'sensor') as r (r.id)}{@render rule(r)}{/each}
          <li><span class="rk">{t('otherwise')}</span><b>{t('unclear, you choose')}</b></li>
        </ol>
        <p class="quiet">{t('A contradiction or an unusual distance: the ride goes to «Check». The app never guesses silently.')}</p>
        {#if hints.length}
          <p class="lbl">{t('New in these files')}</p>
          <ul class="hints">
            {#each hints as h (h.kind + h.value)}
              <li>
                <span>{h.kind === 'sensor' ? `${t('Sensor')} ${sensorShort(h.value)}` : t('Strava bike «{gear}»', { gear: h.value })}</span>
                <select class="sel" aria-label={t('Bike')} value={hintPick[h.kind + h.value] ?? h.guess} onchange={(e) => (hintPick = { ...hintPick, [h.kind + h.value]: e.currentTarget.value })}>
                  <option value="">{t('Choose a bike')}</option>
                  {#each bikes as b (b.id)}<option value={b.id}>{b.name}</option>{/each}
                </select>
                <button type="button" class="btn sm" disabled={!(hintPick[h.kind + h.value] ?? h.guess)} onclick={() => addRule(h.kind, h.value, [hintPick[h.kind + h.value] ?? h.guess])}>{t('as a rule')}</button>
              </li>
            {/each}
          </ul>
        {/if}
        {#if adding}
          <div class="newrule">
            <label><span class="lbl">{t('Kind')}</span>
              <select class="sel" bind:value={nKind}>{#each Object.entries(KIND) as [k, n] (k)}<option value={k}>{t(n)}</option>{/each}</select>
            </label>
            <label><span class="lbl">{nKind === 'sensor' ? t('Serial number') : nKind === 'gear' ? t('Name in Strava') : t('Profile name')}</span><input class="inp" type="text" bind:value={nValue} /></label>
            <div class="bchips" role="group" aria-label={t('Bike')}>{#each bikes as b (b.id)}<button type="button" class="bchip" aria-pressed={nBikes.includes(b.id)} onclick={() => (nBikes = toggleIn(nBikes, b.id))}>{b.name}</button>{/each}</div>
            <div class="fb"><button type="button" class="btn ink sm" disabled={!nValue.trim() || !nBikes.length} onclick={() => addRule()}>{t('Add')}</button><button type="button" class="btn sm" onclick={() => (adding = false)}>{t('Cancel')}</button></div>
          </div>
        {:else}
          <button type="button" class="btn sm" onclick={() => (adding = true)}>+ {t('Rule')}</button>
        {/if}
      </section>

      {#if plan}
        <section class="surf box" aria-labelledby="u-h">
          <h3 id="u-h" class="zlabel">{t('Take over')}</h3>
          <dl class="sum">
            <div><dt>{t('new rides')}</dt><dd class="num">{num(total.n)} · {num(total.km)} km</dd></div>
            <div><dt>{t('duplicates, merged')}</dt><dd class="num">{num(total.dup)}</dd></div>
            <div><dt>{t('to check, not counting yet')}</dt><dd class="num" class:bad={total.open}>{num(total.open)}</dd></div>
          </dl>
          <div class="fb">
            <button type="button" class="btn hi" disabled={busy || !total.n} onclick={takeOver}>{t('Take over')}</button>
            <a class="btn" href={back}>{t('Cancel')}</a>
          </div>
          <p class="quiet">{t('Afterwards «Undo» takes it all back.')}</p>
        </section>
      {/if}
    </aside>
  </div>
</div>

{#snippet rule(r)}
  <li>
    <span class="rk">{r.kind === 'sensor' ? `${t('Sensor')} ${sensorShort(r.value)}` : r.kind === 'gear' ? t('Strava bike «{gear}»', { gear: r.value }) : t('Profile {name}', { name: r.value })}{#if r.kind === 'profile' && r.bikeIds.length > 1}<small>{t('{n} bikes, so only sure with Strava', { n: r.bikeIds.length })}</small>{/if}</span>
    {#if editRules}
      <span class="bchips" role="group" aria-label={t('Bike')}>
        {#each bikes as b (b.id)}<button type="button" class="bchip" aria-pressed={r.bikeIds.includes(b.id)} onclick={() => setRuleBikes(r.id, toggleIn(r.bikeIds, b.id))}>{b.name}</button>{/each}
        <button type="button" class="ix" aria-label={t('Delete the rule')} onclick={() => dropRule(r.id)}><X size={16} aria-hidden="true" /></button>
      </span>
    {:else}
      <b>{r.bikeIds.map(nameOf).join(' · ') || '–'}</b>
    {/if}
  </li>
{/snippet}

<style>
  .kmi {
    margin: 0 0 24px;
  }
  .crumb {
    margin: 0 0 6px;
    font-size: var(--fs-small);
    color: var(--ink-2);
  }
  .crumb a {
    display: inline-flex;
    align-items: center;
    min-height: 44px;
    font-weight: 600;
  }
  .kmi > .title {
    margin: 0;
  }
  .sub {
    margin: 4px 0 16px;
    color: var(--ink-2);
  }
  .grid {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(260px, 340px);
    gap: 16px 24px;
    align-items: start;
  }
  .main,
  .side {
    display: grid;
    gap: 14px;
    min-width: 0;
  }
  .grid .surf {
    padding: 14px 18px;
  }
  .check {
    border-color: var(--bad);
    background: var(--bad-soft);
  }
  .ch {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 4px 12px;
    padding-bottom: 8px;
    border-bottom: 1px solid var(--line);
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .ch h3 {
    margin: 0;
    color: var(--ink);
    font: 600 var(--fs-sub) / 1.3 var(--font-body);
  }
  .list {
    list-style: none;
    margin: 0;
    padding: 0;
  }
  .ir {
    display: grid;
    grid-template-columns: 90px minmax(0, 1fr) 70px minmax(0, 1.1fr);
    gap: 4px 14px;
    align-items: center;
    padding: 10px 0;
    border-bottom: 1px solid var(--line);
  }
  .ir:last-child {
    border-bottom: 0;
  }
  .d {
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .w {
    display: flex;
    flex-direction: column;
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
  .k {
    text-align: right;
    font-weight: 600;
    white-space: nowrap;
  }
  .ir.dup .w b,
  .ir.dup .k {
    color: var(--ink-3);
  }
  .ir.dup .k {
    text-decoration: line-through;
  }
  .c {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 6px;
  }
  .bp {
    width: auto;
    max-width: 100%;
    min-height: 44px;
  }
  .bp.none {
    border-style: dashed;
    color: var(--bad);
  }
  .c .btn.sm {
    min-height: 44px;
  }
  .dupchip {
    padding: 2px 10px;
    border-radius: 999px;
    background: var(--paper-2);
    color: var(--ink-2);
    font-size: var(--fs-tiny);
    font-weight: 500;
  }
  .why {
    grid-column: 2 / -1;
    color: var(--bad);
    font-size: var(--fs-small);
    font-weight: 500;
  }
  .lnk {
    min-height: 44px;
    padding: 0 4px;
    border: 0;
    background: none;
    color: var(--accent);
    font: 600 var(--fs-small) var(--font-body);
    text-decoration: underline;
    cursor: pointer;
  }
  .box {
    display: grid;
    gap: 8px;
  }
  .box .zlabel {
    margin: 0;
  }
  .files,
  .rules,
  .hints {
    list-style: none;
    margin: 0;
    padding: 0;
  }
  .files li {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto 44px;
    gap: 8px;
    align-items: center;
    padding: 6px 0;
    border-top: 1px solid var(--line);
    font-size: var(--fs-small);
  }
  .fn {
    display: flex;
    flex-direction: column;
    min-width: 0;
    overflow-wrap: break-word;
  }
  .err {
    color: var(--bad);
  }
  .ix {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 44px;
    height: 44px;
    border: 0;
    background: none;
    color: var(--ink-3);
    cursor: pointer;
  }
  .rh {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  .quiet {
    margin: 0;
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .rules {
    counter-reset: rule;
  }
  .rules li {
    counter-increment: rule;
    display: grid;
    grid-template-columns: 22px minmax(0, 1fr) auto;
    gap: 4px 8px;
    align-items: start;
    padding: 8px 0;
    border-top: 1px solid var(--line);
    font-size: var(--fs-small);
  }
  .rules li::before {
    content: counter(rule);
    font-weight: 600;
  }
  .rk {
    display: flex;
    flex-direction: column;
    min-width: 0;
  }
  .rk small {
    color: var(--ink-3);
  }
  .rules b {
    text-align: right;
  }
  .rules .bchips {
    grid-column: 2 / -1;
  }
  .bchips {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }
  .bchip {
    min-height: 44px;
    padding: 0 10px;
    border: 1.5px solid var(--line);
    border-radius: 10px;
    background: var(--paper);
    color: var(--ink);
    font: 500 var(--fs-small) var(--font-body);
    cursor: pointer;
  }
  .bchip[aria-pressed='true'] {
    border-color: var(--hi);
    background: var(--hi-soft);
  }
  .hints li {
    display: grid;
    gap: 6px;
    padding: 6px 0;
    border-top: 1px solid var(--line);
    font-size: var(--fs-small);
  }
  .newrule {
    display: grid;
    gap: 8px;
  }
  .fb {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
  .sum {
    margin: 0;
  }
  .sum div {
    display: flex;
    justify-content: space-between;
    gap: 8px;
    padding: 4px 0;
  }
  .sum dt {
    color: var(--ink-2);
  }
  .sum dd {
    margin: 0;
    font-weight: 600;
  }
  .sum dd.bad {
    color: var(--bad);
  }
  @media (max-width: 900px) {
    .grid {
      grid-template-columns: minmax(0, 1fr);
    }
  }
  @media (max-width: 640px) {
    .grid .surf {
      padding: 12px 14px;
    }
    .ir {
      grid-template-columns: minmax(0, 1fr) auto;
      grid-template-areas: 'd k' 'w w' 'c c' 'y y';
    }
    .d {
      grid-area: d;
    }
    .k {
      grid-area: k;
    }
    .w {
      grid-area: w;
    }
    .c {
      grid-area: c;
    }
    .why {
      grid-area: y;
    }
  }
</style>
