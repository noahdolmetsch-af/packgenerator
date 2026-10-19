<script>
  /**
   * «Heute lädt nicht» (Noah 19.10.2026): one line on top while the database cannot open, because another
   * tab or the installed app window still runs the older version (dbwait.js). It says what to do and offers
   * «Reload». It goes away by itself once the other window is closed and the data is there. In the old tab
   * it says that a newer version is open (Dexie has closed the database there so the new one can open).
   */
  import { db } from '../db.js';
  import { watchDbOpen } from '../dbwait.js';
  import { t } from '../i18n.svelte.js';

  let wait = $state({ blocked: false, slow: false, newer: false });
  $effect(() => watchDbOpen(db, (s) => (wait = s)));
</script>

{#if wait.newer}
  <div class="dbw" role="alert" data-db-wait="newer">
    <p><strong>{t('A newer version is open.')}</strong> {t('The app was updated in another tab or window. Reload this page to go on.')}</p>
    <button type="button" class="btn" onclick={() => location.reload()}>{t('Reload')}</button>
  </div>
{:else if wait.blocked || wait.slow}
  <div class="dbw" role="alert" data-db-wait={wait.blocked ? 'blocked' : 'slow'}>
    <p>
      <strong>{t('Your data is waiting.')}</strong>
      {t('The app is still open in another tab or window (also the installed app window). Close it there; then your data appears here.')}
    </p>
    <button type="button" class="btn" onclick={() => location.reload()}>{t('Reload')}</button>
  </div>
{/if}

<style>
  .dbw {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--sp-2) var(--sp-3);
    padding: var(--sp-3) var(--sp-4);
    font-size: var(--fs-small);
    color: var(--ink);
    background: var(--paper-2, var(--paper));
    border-bottom: 1px solid var(--line);
  }
  .dbw p {
    flex: 1 1 260px;
    margin: 0;
  }
  .dbw .btn {
    min-height: 44px;
  }
</style>
