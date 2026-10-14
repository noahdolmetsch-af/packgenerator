<script>
  import { tidyData } from './tidy.js';
  import { settling } from './settled.js';
  import { blocksAfterImport } from './updates.js';
  import { liveQuery } from 'dexie';
  import { db, DATA_TABLES } from './db.js';
  import { restoreBackup, validateBackup, countRows, downloadBackup, importImpact, shareBackup, lastChangeOf, markImported, compareStates, LAST_CHANGE, LAST_BACKUP, backupDue } from './backup.js';
  import { phone } from './media.svelte.js';
  import { Send, ChevronRight, Bike, Star, CirclePlay, QrCode, Check } from '@lucide/svelte';
  import './ich/ich.css';
  import Help from './ui/Help.svelte';
  import BeforeUpdates from './maintenance/BeforeUpdates.svelte';
  import { isDemoFile, startDemo, demoState } from './demo.js';
  import { isFavoritesFile, planFavorites, favoritesTemplate } from './favorites.js';
  import { isGearImportFile } from './gearimport.js';
  import { isSpecsFile, specEntries, findBike, planSpecs, applySpecs } from './bikespecs.js';
  import { stageImport } from './gear/importdb.js';
  import { TEMPLATES_KEY, upsert } from './templates.js';
  import { folderBackupSupported, folderStatus, chooseFolder, allowAgain, forgetFolder, onFolderWritten } from './folderBackup.js';
  import { t, tn, locale } from './i18n.svelte.js';
  import HealthCard from './health/HealthCard.svelte';
  import { health } from './health/client.svelte.js';

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
    visits: 'Workshop visits', photos: 'Photos', notes: 'Notes', flowActs: 'Flow activities', flowLog: 'Flow ticks', flowChecks: 'Daily checks', healthDays: 'Fitbit days',
  };

  async function refreshFolder() {
    if (folderBackupSupported) folder = await folderStatus(db);
  }
  $effect(() => {
    refreshFolder();
    // the watch itself runs from the app start (main.js); the panel only shows the new state
    return onFolderWritten(refreshFolder);
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
  // Design-Refresh P9 (B20 «Status-Ampel»): is everything in order? Only what the app knows itself:
  // the last backup file, the folder backup and how full the browser's storage is.
  const lastQ = liveQuery(() => db.meta.get(LAST_BACKUP));
  let storage = $state(null);
  $effect(() => {
    navigator.storage?.estimate?.().then((e) => (storage = e?.quota ? { used: e.usage ?? 0, quota: e.quota } : null), () => {});
  });
  const lastIso = $derived([$lastQ?.at, folder.lastWrite].filter(Boolean).sort().at(-1) ?? null);
  const due = $derived(backupDue(lastIso));
  const mb = (bytes) => (bytes / 1048576).toLocaleString(locale(), { maximumFractionDigits: 1 });
  // state: 'ok' (green), 'warn' (yellow, its button beside it) or 'off' (grey: the folder backup is a
  // suggestion, never a must, so «off» is not yellow).
  const lights = $derived.by(() => {
    const out = [{ key: 'backup', name: 'Backup', state: due.due ? 'warn' : 'ok', line: due.days == null ? t('no backup yet') : tn(due.days, 'last backup {n} day ago', 'last backup {n} days ago') }];
    if (folderBackupSupported) out.push({ key: 'folder', name: 'Auto-backup to a folder', state: folder.state === 'on' ? 'ok' : folder.state === 'needs-ok' ? 'warn' : 'off', line: folder.state === 'on' ? `${t('On: writing to')} ${folder.name}` : folder.state === 'needs-ok' ? t('chosen, but the browser needs your OK again after a restart.') : t('off|backup') });
    if (storage) {
      const pct = Math.min(100, Math.round((storage.used / storage.quota) * 100));
      out.push({ key: 'storage', name: 'Storage', state: pct < 80 ? 'ok' : 'warn', line: t('{pct} % used · {mb} MB', { pct, mb: mb(storage.used) }) });
    }
    // Fitbit (mockup G2): grey while not connected (a suggestion, never a must), yellow when the last fetch failed.
    if (health.prefs.connected) {
      const sync = health.prefs.lastSync;
      out.push({ key: 'fitbit', name: 'Fitbit', state: ['google_login_needed', 'not_connected'].includes(health.error) ? 'warn' : 'ok', line: sync ? t('connected · as of {when}', { when: when(sync) }) : t('connected|fitbit') });
    } else out.push({ key: 'fitbit', name: 'Fitbit', state: 'off', line: t('not connected|fitbit') });
    return out;
  });
  const greens = $derived(lights.filter((l) => l.state === 'ok').length);
  let fileEl = $state();
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
      await settling(async () => {
        await startDemo(db, pending.data);
        await tidyData(db);
      });
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
      await settling(async () => {
        await restoreBackup(db, pending.data, mode);
        await blocksAfterImport(db, pending.data, mode); // v0.33.0: old data in the file gets the building blocks too
        await tidyData(db);
        await markImported(db, pending.data, mode); // v0.34.0 (L10): the device now holds the file's state
      });
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

<!-- Design-Refresh P9 (I2, Noah 12.10.2026 «Runde 16 freigegeben»; B20 «Status-Ampel»): the page «Daten und
     Backup» in two columns. Left: «Everything in order?» (a dot per thing the app knows: the backup,
     the folder backup, the storage; a yellow one has its button beside it), Backup (export, send,
     import, then «Check import»), the folder backup. Right: your data (the counts), other data (to the
     phone, a bike spec sheet, favourites, a demo file: all through the one import), and the promise.
     v0.40.0 (design check R1): one summary line "48 items · 8 trips · 3 bikes"; the other counts
     folded, without the zeros; the explanations behind "?". -->
<div class="datapanel ich-cols">
  <div class="ich-main">
    <section class="ich-sec" aria-labelledby="lights-h">
      <div class="ich-h"><div><h2 id="lights-h">{t('Everything in order?')}</h2><p class="ich-hs">{t('{n} of {all} green', { n: greens, all: lights.filter((l) => l.state !== 'off').length })} · {t('If something is yellow, its button is beside it.')}</p></div></div>
      <ul class="card ich-list">
        {#each lights as l (l.key)}
          <li class="ich-row ich-wrap light">
            <span class="dot {l.state}" aria-hidden="true"></span>
            <span class="ich-m"><b>{t(l.name)}</b><small>{l.line}</small></span>
            <span class="sr">{l.state === 'ok' ? t('in order') : l.state === 'warn' ? t('to do') : t('off|backup')}</span>
            {#if l.state === 'warn' && l.key === 'backup'}<button type="button" class="btn sm" onclick={exportFile} disabled={!!$demoQ}>{t('Now|do')}</button>
            {:else if l.state === 'warn' && l.key === 'fitbit'}<a class="btn sm" href="#/me/fitbit">{t('Now|do')}</a>
            {:else if l.state === 'warn' && l.key === 'folder'}<button type="button" class="btn sm" onclick={async () => { await allowAgain(db); refreshFolder(); }}>{t('Now|do')}</button>{/if}
          </li>
        {/each}
      </ul>
    </section>

    <section class="ich-sec" aria-labelledby="data-title">
      <div class="ich-h"><div><h2 id="data-title">{t('Backup')}</h2>{#if $changeQ?.at}<p class="ich-hs">{t('Last change on this device: {when}.', { when: when($changeQ.at) })}</p>{/if}</div></div>
      <div class="card ich-body">
        <div class="ich-acts">
          <button type="button" class="btn hi" onclick={exportFile} disabled={!!$demoQ} title={$demoQ ? t('Off while the demo runs') : undefined}>{t('Export backup')}</button>
          <button type="button" class="btn" onclick={sendFile} disabled={!!$demoQ || sending} title={$demoQ ? t('Off while the demo runs') : undefined}><Send size={16} aria-hidden="true" />{phone.matches ? t('Send to computer') : t('Send to phone')}</button>
          <label class="btn">{t('Import backup')}<input bind:this={fileEl} type="file" accept="application/json,.json,text/plain,.txt" onchange={pickFile} hidden /></label>
        </div>
        <p class="ich-help">{t('Send: the backup file goes to the share sheet (mail, chat, nearby), or is downloaded. On the other device: Import backup.')}</p>

        {#if $demoQ}<p class="small">{t('A demo is running: backups are off until you end it (yellow bar on top).')}</p>{/if}

        {#if pending?.gear}
          <!-- v0.36.0 (Noah 1a): the gear list goes to the staging page first. -->
          <div class="confirm" role="dialog" aria-label={t('Check import')}>
            <p><strong>{pending.name}</strong>: {t('a gear list with {items} items and {learnings} learnings. Nothing is changed yet: check it first.', { items: pending.gear.items, learnings: pending.gear.learnings })}</p>
            <div class="ich-acts end">
              <button type="button" class="btn" onclick={() => (pending = null)}>{t('Later')}</button>
              <a class="btn hi" href="#/gear/import" onclick={() => (pending = null)}>{t('Check import')}</a>
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
            <div class="ich-acts end">
              <button type="button" class="btn" onclick={() => (pending = null)}>{t('Cancel')}</button>
              <button type="button" class="btn hi" onclick={applySpecsFile} disabled={!pending.specs.some((x) => x.bike)}>{t('Import spec sheet')}</button>
            </div>
          </div>
        {:else if pending?.fav}
          <div class="confirm" role="dialog" aria-label={t('Apply favourites')}>
            <p><strong>{pending.data.list?.name}</strong>: {t('{stars} items in your gear get a ★, {adds} new items are added, and a template with all favourites is saved.', { stars: pending.fav.updates.length, adds: pending.fav.adds.length })}</p>
            <p class="small">{t('Weights, bags and everything else you typed in stay as they are. Nothing is deleted.')}</p>
            <div class="ich-acts end">
              <button type="button" class="btn" onclick={() => (pending = null)}>{t('Cancel')}</button>
              <button type="button" class="btn hi" onclick={applyFavorites} disabled={!!$demoQ}>{t('Apply favourites')}</button>
            </div>
            {#if $demoQ}<p class="small">{t('End the running demo first, else the stars would vanish with it.')}</p>{/if}
          </div>
        {:else if pending && isDemoFile(pending.data)}
          <div class="confirm" role="dialog" aria-label={t('Start demo')}>
            <p><strong>{pending.data.demo.name}</strong> {tn(pending.counts.trips, 'is a demo with {n} trip.', 'is a demo with {n} trips.')}</p>
            <p class="small">{t('Your data is kept aside first. "End demo" puts it back exactly as it is now; everything done in the demo is removed then. Backups are off while the demo runs.')}</p>
            <div class="ich-acts end">
              <button type="button" class="btn" onclick={() => (pending = null)}>{t('Cancel')}</button>
              <button type="button" class="btn hi" onclick={beginDemo} disabled={!!$demoQ}>{t('Start demo')}</button>
            </div>
            {#if $demoQ}<p class="small">{t('End the running demo first.')}</p>{/if}
          </div>
        {:else if pending}
          <div class="confirm" role="dialog" aria-label={t('Import backup')}>
            <h3 class="ch">{t('Check import')}</h3>
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
            <div class="ich-acts end">
              <button type="button" class="btn" onclick={() => (pending = null)}>{t('Cancel')}</button>
              <button type="button" class="btn" onclick={() => applyImport('merge')}>{t('Merge')}</button>
              <button type="button" class="btn hi" onclick={() => applyImport('replace')}>{t('Replace all data')}</button>
            </div>
            <p class="small">{t('Replace: the file becomes your data. Merge: records from the file are added or overwrite the same ID.')}</p>
          </div>
        {/if}

        {#if message}<p class="msg" role="status">{message}</p>{/if}
      </div>
    </section>

    <!-- «App-Wartung» BF4 (Noah 13.10.2026): the copies made before the last updates -->
    <BeforeUpdates />

    {#if folderBackupSupported}
      <section class="ich-sec" aria-labelledby="fold-h">
        <div class="ich-h"><div class="dhead"><h2 id="fold-h">{t('Auto-backup to a folder')}</h2>{#if folder.state === 'off'}<Help label={t('Auto-backup to a folder')}><p>{t('Pick a folder (for example one that syncs to the cloud). After every change the app writes the newest backup there, plus one file per day.')}</p></Help>{/if}</div></div>
        <div class="card ich-body fold">
          {#if folder.state === 'off'}
            <p class="ftext">{t('Pick a folder (for example one that syncs to the cloud). After every change the app writes the newest backup there, plus one file per day.')}</p>
            <button type="button" class="btn" onclick={pickFolder}>{t('Choose folder')}</button>
          {:else if folder.state === 'needs-ok'}
            <p class="ftext">{t('Folder')} <strong>{folder.name}</strong>: {t('chosen, but the browser needs your OK again after a restart.')}</p>
            <div class="ich-acts">
              <button type="button" class="btn" onclick={async () => { await forgetFolder(db); refreshFolder(); }}>{t('Stop auto-backup')}</button>
              <button type="button" class="btn" onclick={async () => { await allowAgain(db); refreshFolder(); }}>{t('Allow backup')}</button>
            </div>
          {:else}
            <p class="ftext">
              <span>{t('On: writing to')} <strong>{folder.name}</strong>.</span>
              <small>{folder.lastWrite ? t('Last backup {when}.', { when: new Date(folder.lastWrite).toLocaleString(locale()) }) : ''} {t('After every change the newest backup, plus one file per day.')}</small>
            </p>
            <button type="button" class="btn" onclick={async () => { await forgetFolder(db); refreshFolder(); }}>{t('Stop auto-backup')}</button>
          {/if}
        </div>
      </section>
    {/if}
  </div>

  <div class="ich-side">
    <!-- Fitbit über Google (mockup G2): how current each value is, fetch, choose values, disconnect -->
    <HealthCard />
    <section class="ich-sec" aria-labelledby="yd-h">
      <div class="ich-h"><div class="dhead"><h2 id="yd-h">{t('Your data')}</h2><Help label={t('Your data')}><p>{t('Everything is stored in this browser on this device. Use a backup file to move it to your other device.')}</p></Help></div></div>
      {#if $counts}
        <!-- a button, not a <details>: the counts open in place -->
        <div class="card ich-body cfold" class:open={countsOpen}>
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
    </section>

    <section class="ich-sec" aria-labelledby="od-h">
      <div class="ich-h"><div><h2 id="od-h">{t('Other data')}</h2></div></div>
      <ul class="card ich-list">
        <li><a class="ich-row" href="#/me/phone"><span class="ich-ib"><QrCode size={18} aria-hidden="true" /></span><span class="ich-m"><b>{t('To the phone')}</b><small>{t('Open the app on the phone with a code')}</small></span><ChevronRight class="ich-chev" size={18} aria-hidden="true" /></a></li>
        <!-- the same import as «Import backup»: the app knows the kind of file by its content -->
        <li><button type="button" class="ich-row" onclick={() => fileEl?.click()}><span class="ich-ib"><Bike size={18} aria-hidden="true" /></span><span class="ich-m"><b>{t('Bike spec sheet')}</b><small>{t('Fit and geometry from a file')}</small></span><ChevronRight class="ich-chev" size={18} aria-hidden="true" /></button></li>
        <li><button type="button" class="ich-row" onclick={() => fileEl?.click()}><span class="ich-ib"><Star size={18} aria-hidden="true" /></span><span class="ich-m"><b>{t('Favourites from a list')}</b><small>{t('Stars and a template from a list')}</small></span><ChevronRight class="ich-chev" size={18} aria-hidden="true" /></button></li>
        <li><button type="button" class="ich-row" onclick={() => fileEl?.click()}><span class="ich-ib"><CirclePlay size={18} aria-hidden="true" /></span><span class="ich-m"><b>{t('Demo from a file')}</b><small>{t('The yellow bar on top brings your data back')}</small></span><ChevronRight class="ich-chev" size={18} aria-hidden="true" /></button></li>
      </ul>
    </section>
    <p class="ich-fine"><Check size={16} aria-hidden="true" /><span>{t('Nothing leaves the device unless you send a backup yourself.')}</span></p>
  </div>
</div>

<style>
  .light {
    min-height: 56px;
  }
  .dot {
    flex: none;
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background: var(--line);
  }
  .dot.ok {
    background: var(--ok);
  }
  .dot.warn {
    background: var(--warn);
  }
  .dhead {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 4px 8px;
  }
  .end {
    justify-content: flex-end;
    margin-top: 12px;
  }
  .ftext {
    display: flex;
    flex-direction: column;
    gap: 2px;
    margin: 0 0 12px;
    color: var(--ink);
    overflow-wrap: break-word;
  }
  .ftext small {
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .fold {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 8px 16px;
  }
  .fold .ftext {
    flex: 1 1 16em;
    margin: 0;
  }
  .cfold {
    padding-block: 4px;
  }
  .csum {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    min-height: 44px;
    padding: 0;
    border: 0;
    background: none;
    color: var(--ink);
    font: inherit;
    cursor: pointer;
  }
  .cfold.open .csum :global(.chev) {
    transform: rotate(90deg);
  }
  .counts {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    gap: 6px 16px;
    margin: 0 0 12px;
  }
  .counts div {
    display: flex;
    justify-content: space-between;
    gap: 8px;
    border-bottom: 1px solid var(--line);
    padding: 2px 0;
    font-size: var(--fs-small);
  }
  dd {
    margin: 0;
    font-weight: 600;
  }
  .confirm {
    margin-top: 16px;
    padding: 14px 16px;
    border-radius: 14px;
    background: var(--paper-2);
  }
  .confirm p {
    margin: 0 0 10px;
    color: var(--ink-2);
    overflow-wrap: break-word;
  }
  .ch {
    margin: 0 0 6px;
    font: 600 var(--fs-sub) / 1.25 var(--font-body);
  }
  .impact {
    margin: 0 0 4px;
    padding-left: 20px;
    color: var(--ink-2);
    font-size: var(--fs-small);
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
  .small,
  .confirm p.small {
    margin: 10px 0 0;
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .state {
    color: var(--ink);
  }
  .badge {
    display: inline-block;
    font-style: normal;
    font-size: var(--fs-tiny);
    font-weight: 600;
    padding: 2px 8px;
    border-radius: 99px;
    background: var(--paper);
    color: var(--ink-2);
    margin-right: 4px;
  }
  /* v0.40.0 (Noah 6a): badges neutral grey; only an urgent one has a small coloured dot. */
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
  .msg {
    margin: 12px 0 0;
    font-weight: 600;
    color: var(--ink);
  }
</style>
