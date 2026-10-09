<script>
  import { tidyData } from './tidy.js';
  import { blocksAfterImport } from './updates.js';
  import { liveQuery } from 'dexie';
  import { db, DATA_TABLES } from './db.js';
  import { restoreBackup, validateBackup, countRows, downloadBackup, importImpact, shareBackup, lastChangeOf, markImported, compareStates, LAST_CHANGE } from './backup.js';
  import { phone } from './media.svelte.js';
  import { Send, ChevronRight } from '@lucide/svelte';
  import Help from './ui/Help.svelte';
  import { isDemoFile, startDemo, demoState } from './demo.js';
  import { isFavoritesFile, planFavorites, favoritesTemplate } from './favorites.js';
  import { isGearImportFile } from './gearimport.js';
  import { isSpecsFile, specEntries, findBike, planSpecs, applySpecs } from './bikespecs.js';
  import { stageImport } from './gear/importdb.js';
  import { TEMPLATES_KEY, upsert } from './templates.js';
  import { folderBackupSupported, folderStatus, chooseFolder, allowAgain, forgetFolder, watchForChanges } from './folderBackup.js';
  import { t, tn, locale } from './i18n.svelte.js';

  // liveQuery re-runs the query whenever the database changes, so the counts stay current.
  const counts = liveQuery(async () => {
    const out = {};
    for (const k of DATA_TABLES) out[k] = await db.table(k).count();
    return out;
  });

  let message = $state('');
  // A parsed backup file waiting for "Replace" or "Merge". $state.raw keeps it a plain object:
  // the database can only store plain data, not Svelte's reactive wrappers.
  let pending = $state.raw(null);
  let folder = $state({ state: 'off' });

  let countsOpen = $state(false);
  const LABELS = {
    items: 'Gear + wishlist', kits: 'Old kits (now templates)', trips: 'Trips', debriefs: 'Debriefs', learnings: 'Learnings',
    events: 'Events', maintenance: 'Maintenance tasks', bikes: 'Bikes', containers: 'Bags', weightChecks: 'Weight checks', settings: 'Settings',
    visits: 'Workshop visits', photos: 'Photos', notes: 'Notes', flowActs: 'Flow activities', flowLog: 'Flow ticks', flowChecks: 'Daily checks',
  };

  async function refreshFolder() {
    if (folderBackupSupported) folder = await folderStatus(db);
  }
  $effect(() => {
    refreshFolder();
    if (folderBackupSupported) watchForChanges(db, refreshFolder);
  });

  async function exportFile() {
    await downloadBackup(db);
    message = t('Backup file downloaded.');
  }

  // v0.34.0 (L10, Noah a): plan on the computer, pack on the phone. One button makes the backup file
  // and hands it to the share sheet (Android: mail, chat, nearby share), else downloads it as before.
  let sending = $state(false);
  async function sendFile() {
    sending = true;
    try {
      const how = await shareBackup(db);
      if (how !== 'cancelled') message = how === 'shared' ? t('Backup file sent. On the other device: Import backup.') : t('Backup file downloaded. Send it to the other device and import it there.');
    } catch (err) {
      message = `${t('The backup file could not be made.')} ${err.message}`;
    } finally {
      sending = false;
    }
  }
  // When the data on this device last changed (shown small, and compared with a file on import).
  const changeQ = liveQuery(() => db.meta.get(LAST_CHANGE));
  const when = (iso) => new Date(iso).toLocaleString(locale(), { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

  async function pickFile(event) {
    const file = event.target.files[0];
    event.target.value = '';
    if (!file) return;
    try {
      const data = JSON.parse(await file.text());
      // v0.36.0 (Noah 1a): the reviewed gear list is no backup either. It waits on "Import prüfen"
      // (#/gear/import); nothing goes into the gear before it is checked there.
      if (isGearImportFile(data)) {
        const problems = await stageImport(db, data, file.name);
        if (problems.length) {
          pending = null;
          message = `${problems.map((p) => t(p)).join(' ')} ${t('Nothing was changed.')}`;
          return;
        }
        pending = { data, name: file.name, gear: { items: data.items.length, learnings: data.learnings?.length ?? 0 } };
        message = '';
        return;
      }
      // v0.48.0 (Noah): a bike's spec sheet (kind 'bikeSpecs') fills the bike whose name matches.
      // Nothing filled is overwritten without a tick here.
      if (isSpecsFile(data)) {
        const bikes = await db.bikes.toArray();
        const specs = specEntries(data).map((entry) => {
          const bike = findBike(bikes, entry.bike);
          return { entry, bike, plan: bike ? planSpecs(bike, entry) : null };
        });
        pending = { data, name: file.name, specs, allow: [] };
        message = '';
        return;
      }
      // The favourites list (Noah, 4.10.2026) is no backup: it only adds stars and new items.
      if (isFavoritesFile(data)) {
        pending = { data, name: file.name, fav: planFavorites(data, await db.items.toArray()) };
        message = '';
        return;
      }
      const problems = validateBackup(data);
      if (problems.length) {
        pending = null;
        message = `${problems.join(' ')} ${t('Nothing was changed.')}`;
        return;
      }
      // v0.27.0 (Noah 1a, AP22): what Replace and Merge would do, compared with this device, before anything runs.
      const existing = {};
      for (const k of DATA_TABLES) existing[k] = await db.table(k).toCollection().primaryKeys();
      // v0.34.0 (L10): newer or older than the data on this device, said before anything is replaced.
      const state = compareStates(data.lastChange ?? null, await lastChangeOf(db), data.exportedAt ?? null);
      pending = { data, name: file.name, counts: countRows(data), impact: importImpact(data, existing), state };
      message = '';
    } catch {
      pending = null;
      message = `${file.size ? t('This file could not be read.') : t('This file is empty.')} ${t('Nothing was changed.')}`;
    }
  }

  const demoQ = liveQuery(() => demoState(db));
  async function beginDemo() {
    try {
      await startDemo(db, pending.data);
      await tidyData(db);
      message = t('Demo started: {name}. "End demo" in the yellow bar puts your data back.', { name: pending.data.demo.name });
      pending = null;
    } catch (err) {
      message = `${t('The demo did not start, nothing was changed.')} ${err.message}`;
    }
  }

  async function applyFavorites() {
    try {
      const listKey = pending.data.list?.key;
      await db.transaction('rw', db.items, db.settings, async () => {
        // Planned again inside the write, against the inventory as it is now.
        const plan = planFavorites(pending.data, await db.items.toArray());
        for (const u of plan.updates) await db.items.update(u.id, u.changes);
        if (plan.adds.length) await db.items.bulkPut(plan.adds);
        const tpl = favoritesTemplate(await db.items.toArray(), { id: listKey, name: pending.data.list?.name ?? listKey });
        const list = (await db.settings.get(TEMPLATES_KEY))?.value ?? [];
        await db.settings.put({ key: TEMPLATES_KEY, value: upsert(list, tpl) });
      });
      message = t('Favourites applied: {stars} items got a star, {adds} new items, template "{name}".', { stars: pending.fav.updates.length, adds: pending.fav.adds.length, name: pending.data.list?.name });
      pending = null;
    } catch (err) {
      message = `${t('Nothing was changed.')} ${err.message}`;
    }
  }

  /** v0.48.0: the spec sheet into the bikes; planned again against the bike as it is now. */
  async function applySpecsFile() {
    try {
      const allow = new Set(pending.allow);
      let n = 0;
      await db.transaction('rw', db.bikes, async () => {
        for (const s of pending.specs.filter((x) => x.bike)) {
          const bike = await db.bikes.get(s.bike.id);
          if (!bike) continue;
          const plan = planSpecs(bike, s.entry);
          n += plan.fills.length + plan.conflicts.filter((c) => allow.has(`${bike.id}|${c.id}`)).length;
          const mine = new Set([...allow].filter((x) => x.startsWith(`${bike.id}|`)).map((x) => x.slice(bike.id.length + 1)));
          await db.bikes.update(bike.id, applySpecs(bike, plan, mine));
        }
      });
      message = tn(n, 'Spec sheet imported: {n} value.', 'Spec sheet imported: {n} values.');
      pending = null;
    } catch (err) {
      message = `${t('Import failed, nothing was changed.')} ${err.message}`;
    }
  }
  function toggleAllow(id, on) {
    pending = { ...pending, allow: on ? [...pending.allow, id] : pending.allow.filter((x) => x !== id) };
  }
  const shownValue = (v) => (v == null || v === '' ? '–' : String(v));

  async function applyImport(mode) {
    try {
      await restoreBackup(db, pending.data, mode);
      await blocksAfterImport(db, pending.data, mode); // v0.33.0: old data in the file gets the building blocks too
      await tidyData(db);
      await markImported(db, pending.data, mode); // v0.34.0 (L10): the device now holds the file's state
      message = mode === 'replace' ? t('Imported {name} (replaced all data).', { name: pending.name }) : t('Imported {name} (merged).', { name: pending.name });
      pending = null;
    } catch (err) {
      message = `${t('Import failed, nothing was changed.')} ${err.message}`;
    }
  }

  async function pickFolder() {
    try {
      await chooseFolder(db);
      message = t('Auto-backup is on.');
    } catch (err) {
      if (err.name !== 'AbortError') message = t('Could not use that folder.');
    }
    refreshFolder();
  }
</script>

<section class="card" aria-labelledby="data-title">
  <!-- v0.40.0 (design check R1): one summary line "48 items · 8 trips · 3 bikes"; the other counts
       folded, without the zeros; the explanations behind "?". -->
  <div class="dhead">
    <h2 id="data-title">{t('Your data')}</h2>
    <Help label={t('Your data')}><p>{t('Everything is stored in this browser on this device. Use a backup file to move it to your other device.')}</p></Help>
  </div>

  {#if $counts}
    <!-- a button, not a <details>: "Your data" itself sits in a <details> on Today -->
    <div class="cfold" class:open={countsOpen}>
      <button type="button" class="csum" aria-expanded={countsOpen} aria-controls="data-counts" onclick={() => (countsOpen = !countsOpen)}><span class="num">{[tn($counts.items ?? 0, '{n} item', '{n} items'), tn($counts.trips ?? 0, '{n} trip', '{n} trips'), tn($counts.bikes ?? 0, '{n} bike', '{n} bikes')].join(' · ')}</span><ChevronRight class="chev" size={16} aria-hidden="true" /></button>
      {#if countsOpen}
        <dl class="counts" id="data-counts">
          {#each DATA_TABLES.filter((k) => $counts[k]) as k (k)}
            <div><dt>{LABELS[k] ? t(LABELS[k]) : k}</dt><dd class="num">{$counts[k]}</dd></div>
          {/each}
        </dl>
      {/if}
    </div>
  {/if}

  <div class="row">
    <button type="button" class="hi" onclick={exportFile} disabled={!!$demoQ} title={$demoQ ? t('Off while the demo runs') : undefined}>{t('Export backup')}</button>
    <label class="btn">{t('Import backup')}<input type="file" accept="application/json,.json,text/plain,.txt" onchange={pickFile} hidden /></label>
    <button type="button" class="send" onclick={sendFile} disabled={!!$demoQ || sending} title={$demoQ ? t('Off while the demo runs') : undefined}><Send size={16} aria-hidden="true" />{phone.matches ? t('Send to computer') : t('Send to phone')}</button>
  </div>
  <div class="small quiet sendhelp">{#if $changeQ?.at}<span>{t('Last change on this device: {when}.', { when: when($changeQ.at) })}</span>{/if}<Help label={t('How sending works')}><p>{t('Send: the backup file goes to the share sheet (mail, chat, nearby), or is downloaded. On the other device: Import backup.')}</p></Help></div>

  {#if $demoQ}<p class="small">{t('A demo is running: backups are off until you end it (yellow bar on top).')}</p>{/if}

  {#if pending?.gear}
    <!-- v0.36.0 (Noah 1a): the gear list goes to the staging page first. -->
    <div class="confirm" role="dialog" aria-label={t('Check import')}>
      <p><strong>{pending.name}</strong>: {t('a gear list with {items} items and {learnings} learnings. Nothing is changed yet: check it first.', { items: pending.gear.items, learnings: pending.gear.learnings })}</p>
      <div class="row">
        <a class="btn hi" href="#/gear/import" onclick={() => (pending = null)}>{t('Check import')}</a>
        <button type="button" onclick={() => (pending = null)}>{t('Later')}</button>
      </div>
      <p class="small">{t('The list waits under Gear → ••• → Check import.')}</p>
    </div>
  {:else if pending?.specs}
    <!-- v0.48.0 (Noah): a bike's spec sheet. Empty fields are filled; a field with another value only with a tick. -->
    <div class="confirm" role="dialog" aria-label={t('Import spec sheet')}>
      {#each pending.specs as s, i (i)}
        {#if !s.bike}
          <p><strong>{s.entry.bike || '–'}</strong>: {t('no bike with this name. Nothing is changed for it.')}</p>
        {:else}
          <p><strong>{s.bike.name}</strong>: {t('{fills} empty fields get a value, {same} are the same already.', { fills: s.plan.fills.length, same: s.plan.same })}{#if s.plan.added.length} {t('New own parts: {names}.', { names: s.plan.added.join(', ') })}{/if}</p>
          {#if s.plan.conflicts.length}
            <p class="small">{t('These fields already have another value. Tick the ones the file may overwrite:')}</p>
            <ul class="specc">
              {#each s.plan.conflicts as c (c.id)}
                {@const id = `${s.bike.id}|${c.id}`}
                <li><label><input type="checkbox" checked={pending.allow.includes(id)} onchange={(e) => toggleAllow(id, e.currentTarget.checked)} /> <span><b>{c.target === 'geo' ? t('Geometry') : c.target === 'fit' ? `${t('Fit and setup')}: ${t(c.label)}` : c.label}</b> · {shownValue(c.old)} → {shownValue(c.value)}</span></label></li>
              {/each}
            </ul>
          {/if}
          {#if s.plan.unknown.length}<p class="small">{t('Not known, left out: {names}.', { names: s.plan.unknown.join(', ') })}</p>{/if}
        {/if}
      {/each}
      <div class="row">
        <button type="button" class="hi" onclick={applySpecsFile} disabled={!pending.specs.some((x) => x.bike)}>{t('Import spec sheet')}</button>
        <button type="button" onclick={() => (pending = null)}>{t('Cancel')}</button>
      </div>
    </div>
  {:else if pending?.fav}
    <div class="confirm" role="dialog" aria-label={t('Apply favourites')}>
      <p><strong>{pending.data.list?.name}</strong>: {t('{stars} items in your gear get a ★, {adds} new items are added, and a template with all favourites is saved.', { stars: pending.fav.updates.length, adds: pending.fav.adds.length })}</p>
      <p class="small">{t('Weights, bags and everything else you typed in stay as they are. Nothing is deleted.')}</p>
      <div class="row">
        <button type="button" class="hi" onclick={applyFavorites} disabled={!!$demoQ}>{t('Apply favourites')}</button>
        <button type="button" onclick={() => (pending = null)}>{t('Cancel')}</button>
      </div>
      {#if $demoQ}<p class="small">{t('End the running demo first, else the stars would vanish with it.')}</p>{/if}
    </div>
  {:else if pending && isDemoFile(pending.data)}
    <div class="confirm" role="dialog" aria-label={t('Start demo')}>
      <p><strong>{pending.data.demo.name}</strong> {tn(pending.counts.trips, 'is a demo with {n} trip.', 'is a demo with {n} trips.')}</p>
      <p class="small">{t('Your data is kept aside first. "End demo" puts it back exactly as it is now; everything done in the demo is removed then. Backups are off while the demo runs.')}</p>
      <div class="row">
        <button type="button" class="hi" onclick={beginDemo} disabled={!!$demoQ}>{t('Start demo')}</button>
        <button type="button" onclick={() => (pending = null)}>{t('Cancel')}</button>
      </div>
      {#if $demoQ}<p class="small">{t('End the running demo first.')}</p>{/if}
    </div>
  {:else if pending}
    <div class="confirm" role="dialog" aria-label={t('Import backup')}>
      <p>
        <strong>{pending.name}</strong> {t('contains {items}, {trips} and {learnings}.', { items: tn(pending.counts.items, '{n} gear item', '{n} gear items'), trips: tn(pending.counts.trips, '{n} trip', '{n} trips'), learnings: tn(pending.counts.learnings, '{n} learning', '{n} learnings') })}
      </p>
      <!-- v0.34.0 (L10): is the file newer or older than this device? -->
      {#if pending.state.kind !== 'unknown'}
        <p class="state"><i class="badge {pending.state.kind}">{pending.state.kind === 'newer' ? t('Newer') : pending.state.kind === 'older' ? t('Older') : t('Same state')}</i>
          {pending.state.kind === 'newer' ? t('This file is newer than the data on this device (file {file}, this device {local}).', { file: when(pending.state.file), local: when(pending.state.local) }) : pending.state.kind === 'older' ? t('This file is older than the data on this device (file {file}, this device {local}). Replace would put the older state here.', { file: when(pending.state.file), local: when(pending.state.local) }) : t('This file has the same state as this device ({file}).', { file: when(pending.state.file) })}</p>
      {:else if pending.state.exported}
        <p class="state"><i class="badge">{t('Date unknown')}</i> {t('The file was saved {date} by an older version; the app cannot tell if it is newer than the data on this device.', { date: when(pending.state.exported) })}</p>
      {/if}
      <!-- v0.27.0 (Noah 1a, AP22): the scope and what gets overwritten, before the button. -->
      <ul class="impact">
        <li>{t('Replace all data: deletes everything on this device ({now} records, trips: {trips}) and puts the file in its place ({file} records).', { now: pending.impact.now, trips: pending.impact.nowTrips, file: pending.impact.file })}{#if pending.impact.lost}{' '}<strong>{t('Only on this device, so lost with Replace: {lost} records (trips: {lostTrips}).', { lost: pending.impact.lost, lostTrips: pending.impact.lostTrips })}</strong>{/if}</li>
        <li>{t('Merge: new from the file: {added}; same ID, overwritten by the file: {same}; nothing is deleted.', { added: pending.impact.added, same: pending.impact.same })}</li>
      </ul>
      <div class="row">
        <button type="button" class="hi" onclick={() => applyImport('replace')}>{t('Replace all data')}</button>
        <button type="button" onclick={() => applyImport('merge')}>{t('Merge')}</button>
        <button type="button" onclick={() => (pending = null)}>{t('Cancel')}</button>
      </div>
      <p class="small">{t('Replace: the file becomes your data. Merge: records from the file are added or overwrite the same ID.')}</p>
    </div>
  {/if}

  {#if folderBackupSupported}
    <div class="dhead"><h3>{t('Auto-backup to a folder')}</h3>{#if folder.state === 'off'}<Help label={t('Auto-backup to a folder')}><p>{t('Pick a folder (for example one that syncs to the cloud). After every change the app writes the newest backup there, plus one file per day.')}</p></Help>{/if}</div>
    {#if folder.state === 'off'}
      <button type="button" onclick={pickFolder}>{t('Choose folder')}</button>
    {:else if folder.state === 'needs-ok'}
      <p>{t('Folder')} <strong>{folder.name}</strong>: {t('chosen, but the browser needs your OK again after a restart.')}</p>
      <div class="row">
        <button type="button" class="hi" onclick={async () => { await allowAgain(db); refreshFolder(); }}>{t('Allow backup')}</button>
        <button type="button" onclick={async () => { await forgetFolder(db); refreshFolder(); }}>{t('Stop auto-backup')}</button>
      </div>
    {:else}
      <p>
        {t('On: writing to')} <strong>{folder.name}</strong>.
        {folder.lastWrite ? t('Last backup {when}.', { when: new Date(folder.lastWrite).toLocaleString(locale()) }) : ''}
      </p>
      <button type="button" onclick={async () => { await forgetFolder(db); refreshFolder(); }}>{t('Stop auto-backup')}</button>
    {/if}
  {/if}

  {#if message}<p class="msg" role="status">{message}</p>{/if}
</section>

<style>
  .card {
    background: var(--paper);
    border: 1px solid var(--line);
    border-radius: 6px;
    padding: 16px;
    margin-top: 28px;
  }
  h2,
  h3 {
    font-family: var(--font-title);
    font-weight: 800;
    margin: 0 0 6px;
    line-height: var(--lh-title);
  }
  h2 {
    font-size: var(--fs-section);
  }
  h3 {
    font-size: 22px;
    margin-top: 20px;
  }
  p {
    margin: 0 0 12px;
    color: var(--ink-2);
  }
  .dhead {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 4px 8px;
  }
  .dhead h2,
  .dhead h3 {
    margin-bottom: 0;
  }
  .cfold {
    margin: 4px 0 12px;
  }
  .csum {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    min-height: 44px;
    padding: 0;
    border: 0;
    background: none;
    color: var(--ink-2);
    font: inherit;
    cursor: pointer;
  }
  .cfold.open .csum :global(.chev) {
    transform: rotate(90deg);
  }
  .sendhelp {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 4px 8px;
  }
  .counts {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    gap: 6px 16px;
    margin: 0 0 14px;
  }
  .counts div {
    display: flex;
    justify-content: space-between;
    border-bottom: 1px solid var(--line);
    padding: 2px 0;
  }
  dd {
    margin: 0;
    font-weight: 700;
  }
  .row {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
  button,
  .btn {
    font: 600 15px var(--font-body);
    padding: 10px 14px;
    border-radius: 4px;
    border: 1.5px solid var(--line-strong);
    background: var(--paper);
    color: var(--ink);
    cursor: pointer;
  }
  a.btn {
    display: inline-flex;
    align-items: center;
    text-decoration: none;
  }
  a.btn.hi,
  a.btn.hi:visited {
    color: var(--hi-ink);
  }
  .hi {
    background: var(--hi);
    border-color: var(--hi);
    color: var(--hi-ink);
  }
  .confirm {
    margin-top: 14px;
    padding: 12px;
    border: 2px dashed var(--hi);
    border-radius: 6px;
    background: var(--hi-soft);
  }
  .impact {
    margin: 0 0 12px;
    padding-left: 20px;
    color: var(--ink-2);
    font-size: 15px;
  }
  .impact li + li {
    margin-top: 4px;
  }
  .specc {
    list-style: none;
    margin: 6px 0 12px;
    padding: 0;
  }
  .specc label {
    display: flex;
    align-items: center;
    gap: 10px;
    min-height: 44px;
    font-size: var(--fs-small);
    overflow-wrap: break-word;
  }
  .specc input {
    width: 20px;
    height: 20px;
    flex: none;
  }
  .small {
    font-size: 14px;
    margin: 10px 0 0;
  }
  .send {
    display: inline-flex;
    align-items: center;
    gap: 8px;
  }
  .quiet {
    color: var(--ink-3);
  }
  .state {
    color: var(--ink);
  }
  .badge {
    display: inline-block;
    font-style: normal;
    font-size: 12px;
    font-weight: 600;
    padding: 2px 8px;
    border-radius: 99px;
    background: var(--paper-2);
    color: var(--ink-2);
    margin-right: 4px;
  }
  /* v0.40.0 (Noah 6a): badges neutral grey; only an urgent one has a small coloured dot. */
  .badge.older {
    background: var(--paper-2);
    color: var(--ink-2);
  }
  .badge.older::before {
    content: '';
    display: inline-block;
    width: 7px;
    height: 7px;
    margin-right: 5px;
    border-radius: 50%;
    vertical-align: 1px;
    background: var(--warn);
  }
  @media (pointer: coarse) {
    button,
    .btn {
      min-height: 44px;
    }
  }
  .msg {
    margin-top: 12px;
    font-weight: 600;
    color: var(--ink);
  }
</style>
