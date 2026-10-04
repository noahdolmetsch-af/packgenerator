<script>
  import { tidyBrands } from './brand.js';
  import { liveQuery } from 'dexie';
  import { db, DATA_TABLES } from './db.js';
  import { buildBackup, restoreBackup, validateBackup, countRows, backupFileName } from './backup.js';
  import { folderBackupSupported, folderStatus, chooseFolder, allowAgain, forgetFolder, watchForChanges } from './folderBackup.js';

  // liveQuery re-runs the query whenever the database changes, so the counts stay current.
  const counts = liveQuery(async () => {
    const out = {};
    for (const t of DATA_TABLES) out[t] = await db.table(t).count();
    return out;
  });

  let message = $state('');
  // A parsed backup file waiting for "Replace" or "Merge". $state.raw keeps it a plain object:
  // the database can only store plain data, not Svelte's reactive wrappers.
  let pending = $state.raw(null);
  let folder = $state({ state: 'off' });

  const LABELS = {
    items: 'Gear + wishlist', kits: 'Kits', trips: 'Trips', debriefs: 'Debriefs', learnings: 'Learnings',
    events: 'Events', maintenance: 'Maintenance tasks', bikes: 'Bikes', weightChecks: 'Weight checks', settings: 'Settings',
  };

  async function refreshFolder() {
    if (folderBackupSupported) folder = await folderStatus(db);
  }
  $effect(() => {
    refreshFolder();
    if (folderBackupSupported) watchForChanges(db, refreshFolder);
  });

  async function exportFile() {
    const data = await buildBackup(db);
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = backupFileName();
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    message = 'Backup file downloaded.';
  }

  async function pickFile(event) {
    const file = event.target.files[0];
    event.target.value = '';
    if (!file) return;
    try {
      const data = JSON.parse(await file.text());
      const problems = validateBackup(data);
      if (problems.length) {
        message = problems.join(' ');
        return;
      }
      pending = { data, name: file.name, counts: countRows(data) };
      message = '';
    } catch {
      message = 'This file could not be read.';
    }
  }

  async function applyImport(mode) {
    try {
      await restoreBackup(db, pending.data, mode);
      await tidyBrands(db);
      message = `Imported ${pending.name} (${mode === 'replace' ? 'replaced all data' : 'merged'}).`;
      pending = null;
    } catch (err) {
      message = `Import failed, nothing was changed. ${err.message}`;
    }
  }

  async function pickFolder() {
    try {
      await chooseFolder(db);
      message = 'Auto-backup is on.';
    } catch (err) {
      if (err.name !== 'AbortError') message = 'Could not use that folder.';
    }
    refreshFolder();
  }
</script>

<section class="card" aria-labelledby="data-title">
  <h2 id="data-title">Your data</h2>
  <p>Everything is stored in this browser on this device. Use a backup file to move it to your other device.</p>

  {#if $counts}
    <dl class="counts">
      {#each DATA_TABLES as t (t)}
        <div><dt>{LABELS[t]}</dt><dd>{$counts[t]}</dd></div>
      {/each}
    </dl>
  {/if}

  <div class="row">
    <button type="button" class="hi" onclick={exportFile}>Export backup</button>
    <label class="btn">Import backup<input type="file" accept="application/json,.json" onchange={pickFile} hidden /></label>
  </div>

  {#if pending}
    <div class="confirm" role="dialog" aria-label="Import backup">
      <p>
        <strong>{pending.name}</strong> contains {pending.counts.items} gear items, {pending.counts.trips} trips and
        {pending.counts.learnings} learnings.
      </p>
      <div class="row">
        <button type="button" class="hi" onclick={() => applyImport('replace')}>Replace all data</button>
        <button type="button" onclick={() => applyImport('merge')}>Merge</button>
        <button type="button" onclick={() => (pending = null)}>Cancel</button>
      </div>
      <p class="small">Replace: the file becomes your data. Merge: records from the file are added or overwrite the same ID.</p>
    </div>
  {/if}

  {#if folderBackupSupported}
    <h3>Auto-backup to a folder</h3>
    {#if folder.state === 'off'}
      <p>Pick a folder (for example one that syncs to the cloud). After every change the app writes the newest backup there, plus one file per day.</p>
      <button type="button" onclick={pickFolder}>Choose folder</button>
    {:else if folder.state === 'needs-ok'}
      <p>Folder <strong>{folder.name}</strong> is chosen, but the browser needs your OK again after a restart.</p>
      <div class="row">
        <button type="button" class="hi" onclick={async () => { await allowAgain(db); refreshFolder(); }}>Allow backup</button>
        <button type="button" onclick={async () => { await forgetFolder(db); refreshFolder(); }}>Stop auto-backup</button>
      </div>
    {:else}
      <p>
        On: writing to <strong>{folder.name}</strong>.
        {folder.lastWrite ? `Last backup ${new Date(folder.lastWrite).toLocaleString()}.` : ''}
      </p>
      <button type="button" onclick={async () => { await forgetFolder(db); refreshFolder(); }}>Stop auto-backup</button>
    {/if}
  {/if}

  {#if message}<p class="msg" role="status">{message}</p>{/if}
</section>

<style>
  .card {
    background: var(--paper);
    border: 2px solid var(--ink);
    border-radius: 6px;
    padding: 16px;
    margin-top: 28px;
  }
  h2,
  h3 {
    font-family: var(--font-title);
    font-weight: 800;
    text-transform: uppercase;
    margin: 0 0 6px;
    line-height: 0.95;
  }
  h2 {
    font-size: 30px;
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
    border: 2px solid var(--ink);
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
