<script>
  import { tidyData } from './tidy.js';
  import { liveQuery } from 'dexie';
  import { db, DATA_TABLES } from './db.js';
  import { restoreBackup, validateBackup, countRows, downloadBackup, importImpact } from './backup.js';
  import { isDemoFile, startDemo, demoState } from './demo.js';
  import { isFavoritesFile, planFavorites, favoritesTemplate } from './favorites.js';
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

  const LABELS = {
    items: 'Gear + wishlist', kits: 'Kits', trips: 'Trips', debriefs: 'Debriefs', learnings: 'Learnings',
    events: 'Events', maintenance: 'Maintenance tasks', bikes: 'Bikes', containers: 'Bags', weightChecks: 'Weight checks', settings: 'Settings',
    visits: 'Workshop visits', photos: 'Photos', notes: 'Notes',
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

  async function pickFile(event) {
    const file = event.target.files[0];
    event.target.value = '';
    if (!file) return;
    try {
      const data = JSON.parse(await file.text());
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
      pending = { data, name: file.name, counts: countRows(data), impact: importImpact(data, existing) };
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

  async function applyImport(mode) {
    try {
      await restoreBackup(db, pending.data, mode);
      await tidyData(db);
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
  <h2 id="data-title">{t('Your data')}</h2>
  <p>{t('Everything is stored in this browser on this device. Use a backup file to move it to your other device.')}</p>

  {#if $counts}
    <dl class="counts">
      {#each DATA_TABLES as k (k)}
        <div><dt>{LABELS[k] ? t(LABELS[k]) : k}</dt><dd>{$counts[k]}</dd></div>
      {/each}
    </dl>
  {/if}

  <div class="row">
    <button type="button" class="hi" onclick={exportFile} disabled={!!$demoQ} title={$demoQ ? t('Off while the demo runs') : undefined}>{t('Export backup')}</button>
    <label class="btn">{t('Import backup')}<input type="file" accept="application/json,.json" onchange={pickFile} hidden /></label>
  </div>

  {#if $demoQ}<p class="small">{t('A demo is running: backups are off until you end it (yellow bar on top).')}</p>{/if}

  {#if pending?.fav}
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
        <strong>{pending.name}</strong> {t('contains {items} gear items, {trips} trips and {learnings} learnings.', { items: pending.counts.items, trips: pending.counts.trips, learnings: pending.counts.learnings })}
      </p>
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
    <h3>{t('Auto-backup to a folder')}</h3>
    {#if folder.state === 'off'}
      <p>{t('Pick a folder (for example one that syncs to the cloud). After every change the app writes the newest backup there, plus one file per day.')}</p>
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
  .hi {
    background: var(--hi);
    border-color: var(--hi);
    color: #fff;
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
  .small {
    font-size: 14px;
    margin: 10px 0 0;
  }
  .msg {
    margin-top: 12px;
    font-weight: 600;
    color: var(--ink);
  }
</style>
