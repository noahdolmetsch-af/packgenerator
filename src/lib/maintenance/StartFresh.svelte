<script>
  /**
   * Paket H (Noah 19.10.2026 «1a aber nutzer kann alle daten jederzeit reseten also auf null setzen und so
   * frisch beginnen mit allem»): Ich › Daten und Backup › «Start fresh». It asks once, keeps a copy of now
   * (under «Before updates», so the way back stays), then empties every list. «Undo» right after brings
   * everything back. Only this device's own settings (language, tips) stay.
   */
  import { db } from '../db.js';
  import { snapDb, resetAll, undoReset } from './snapshots.js';
  import { tidyData } from '../tidy.js';
  import { settling } from '../settled.js';
  import { offerDone } from '../ui/rename.svelte.js';
  import { t } from '../i18n.svelte.js';
  import { RotateCcw } from '@lucide/svelte';
  import './maint.css';

  let asking = $state(false);
  let busy = $state(false);
  let message = $state('');
  const current = typeof __APP_VERSION__ === 'string' ? __APP_VERSION__ : null;

  async function startFresh() {
    busy = true;
    message = '';
    try {
      const sdb = snapDb();
      let id = null;
      await settling(async () => {
        id = await resetAll(db, sdb, { current });
        await tidyData(db);
      });
      asking = false;
      offerDone(t('Everything is deleted. A copy stays under «Before updates».'), async () => {
        await settling(async () => {
          await undoReset(db, sdb, id);
          await tidyData(db);
        });
        offerDone(t('Your data is back.'));
      }, 10000);
    } catch (err) {
      message = `${t('Nothing was changed.')} ${err?.message ?? ''}`.trim();
    } finally {
      busy = false;
    }
  }
</script>

<section class="ich-sec" id="start-fresh" aria-labelledby="sf-h" data-section="start-fresh">
  <div class="ich-h"><div><h2 id="sf-h">{t('Start fresh')}</h2><p class="ich-hs">{t('Delete all data and begin from zero, as on the first day.')}</p></div></div>
  <div class="card ich-body">
    {#if asking}
      <div class="sf-ask" role="dialog" aria-labelledby="sf-q">
        <p id="sf-q"><b>{t('Really delete all data?')}</b></p>
        <p>{t('Gear, trips, bikes, notes, lists and settings on this device are deleted. A copy stays under «Before updates», so you can go back. With automatic sync on, the other device starts fresh too.')}</p>
        <div class="ich-acts end">
          <button type="button" class="btn" onclick={() => (asking = false)} disabled={busy}>{t('Cancel')}</button>
          <button type="button" class="btn del" onclick={startFresh} disabled={busy}>{busy ? t('Deleting …') : t('Delete everything')}</button>
        </div>
      </div>
    {:else}
      <div class="ich-acts">
        <button type="button" class="btn" onclick={() => (asking = true)}><RotateCcw size={16} aria-hidden="true" />{t('Start fresh …')}</button>
      </div>
    {/if}
    {#if message}<p class="ich-help" role="status">{message}</p>{/if}
  </div>
</section>

<style>
  .sf-ask p {
    margin: 0 0 10px;
    color: var(--ink-2);
    font-size: var(--fs-small);
    overflow-wrap: break-word;
  }
  .sf-ask p b {
    color: var(--ink);
    font-size: var(--fs-body);
  }
  .end {
    justify-content: flex-end;
  }
</style>
