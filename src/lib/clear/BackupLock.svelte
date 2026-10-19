<script>
  /**
   * Paket Q #135 «Sicherung mit Passwort» (Noah 19.10.2026 «3»: off at the start, switched on here):
   * a switch and a password. When on, every backup file (Export, Send, the folder backup) is locked
   * with the password; opening it asks for the password. The password stays on this device.
   */
  import { liveQuery } from 'dexie';
  import { Lock } from '@lucide/svelte';
  import { db } from '../db.js';
  import { t } from '../i18n.svelte.js';
  import { LOCK_KEY, setLock, clearLock } from '../backupcrypt.js';

  const q = liveQuery(() => db.meta.get(LOCK_KEY));
  const on = $derived(!!$q?.on);
  let editing = $state(false);
  let pw = $state('');
  let pw2 = $state('');
  let msg = $state('');
  const MIN = 6;

  function toggle(e) {
    msg = '';
    if (e.currentTarget.checked) {
      editing = true;
      e.currentTarget.checked = false; // on only after a password was saved
    } else {
      clearLock(db);
      editing = false;
      msg = t('Backups are saved without a password again.');
    }
  }
  async function save(e) {
    e.preventDefault();
    if (pw.length < MIN) return (msg = t('At least {n} characters, please.', { n: MIN }));
    if (pw !== pw2) return (msg = t('The two passwords are not the same.'));
    await setLock(db, pw);
    pw = pw2 = '';
    editing = false;
    msg = t('Saved. From now on every backup file is locked with this password.');
  }
</script>

<section class="ich-sec" aria-labelledby="lock-h" data-section="backup-lock">
  <div class="ich-h"><div><h2 id="lock-h">{t('Backup with a password')}</h2><p class="ich-hs">{t('Optional. Locks your backup files, e.g. in Google Drive.')}</p></div></div>
  <div class="card ich-body">
    <label class="lk-row">
      <span class="ich-ib"><Lock size={18} aria-hidden="true" /></span>
      <span class="lk-m"><b>{t('Lock backups with a password')}</b><small>{on ? t('On: export, send and the folder backup are locked.') : t('Off: backup files are readable without a password.')}</small></span>
      <input type="checkbox" role="switch" checked={on || editing} onchange={toggle} data-lock-switch />
    </label>
    {#if editing || (on && editing)}
      <form class="lk-form" onsubmit={save}>
        <p class="small"><strong>{t('Important: if you forget the password, nobody can open these backups, not even the app.')}</strong></p>
        <label>{t('Password')}<input type="password" autocomplete="new-password" bind:value={pw} data-lock-pw /></label>
        <label>{t('Password again')}<input type="password" autocomplete="new-password" bind:value={pw2} data-lock-pw2 /></label>
        <div class="ich-acts">
          <button type="button" class="btn" onclick={() => ((editing = false), (pw = pw2 = ''))}>{t('Cancel')}</button>
          <button type="submit" class="btn hi" data-lock-save>{t('Save password')}</button>
        </div>
      </form>
    {:else if on}
      <button type="button" class="btn sm" onclick={() => (editing = true)}>{t('Change password')}</button>
    {/if}
    {#if msg}<p class="msg" role="status">{msg}</p>{/if}
  </div>
</section>

<style>
  .lk-row {
    display: flex;
    align-items: center;
    gap: 12px;
  }
  .lk-m {
    display: grid;
    flex: 1;
  }
  .lk-m small {
    color: var(--ink-2);
  }
  .lk-form {
    display: grid;
    gap: var(--sp-2);
    margin-top: var(--sp-3);
  }
  .lk-form label {
    display: grid;
    gap: 4px;
  }
</style>
