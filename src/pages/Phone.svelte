<script>
  /**
   * Design-Refresh P9 (B35 «QR-Code» on «Aufs Handy», Noah 11.10.2026 «Bausteine 1–35 freigegeben»):
   * Ich › Daten › Aufs Handy (#/me/phone). A QR code with the app's address: the phone camera opens
   * the same app there. The data goes as before with the backup file: «Send to phone» here (the share
   * sheet, else a download), then «Import backup» on the phone. No account, no server: the code holds
   * only the address, never data. Right: when the last backup file was made.
   */
  import { liveQuery } from 'dexie';
  import { plainError } from '../lib/clear/errors.js'; // Paket Q #127: plain words instead of technical text
  import { db } from '../lib/db.js';
  import { shareBackup, LAST_BACKUP } from '../lib/backup.js';
  import { demoState } from '../lib/demo.js';
  import { phone } from '../lib/media.svelte.js';
  import { t, locale } from '../lib/i18n.svelte.js';
  import VeloHead from '../lib/bikes/VeloHead.svelte';
  import QrCode from '../lib/ich/QrCode.svelte';
  import { Send, Check, Database } from '@lucide/svelte';
  import '../lib/ich/ich.css';

  const appUrl = `${location.origin}${location.pathname}`;
  const lastQ = liveQuery(() => db.meta.get(LAST_BACKUP));
  const demoQ = liveQuery(() => demoState(db));
  const when = (iso) => new Date(iso).toLocaleString(locale(), { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

  let sending = $state(false);
  let message = $state('');
  async function send() {
    sending = true;
    try {
      const how = await shareBackup(db);
      if (how !== 'cancelled') message = how === 'shared' ? t('Backup file sent. On the other device: Import backup.') : t('Backup file downloaded. Send it to the other device and import it there.');
    } catch (err) {
      message = `${t('The backup file could not be made.')} ${t(plainError(err))}`;
    } finally {
      sending = false;
    }
  }
  const STEPS = ['Scan the code: the app opens on the phone', 'Here: send the backup file to the phone', 'On the phone: Me › Data and backup › Import backup'];
</script>

<div class="phonepage ich-page">
  <VeloHead crumbs={[{ label: t('Me|place'), href: '#/me' }, { label: t('Data'), href: '#/me/data' }]} title={t('To the phone')} sub={t('No account and no internet server')} />

  <div class="ich-cols">
    <div class="ich-main">
      <section class="ich-sec" aria-labelledby="scan-h">
        <div class="ich-h"><div><h2 id="scan-h">{t('Scan')}</h2><p class="ich-hs">{t('Open the camera on the phone')}</p></div></div>
        <div class="card ich-body scan">
          <QrCode text={appUrl} label={t('QR code with the address of the app')} />
          <div class="st">
            <b>{t('Scan with the phone')}</b>
            <small>{location.host}</small>
            <small>{t('The code holds only the address of the app, never your data.')}</small>
          </div>
        </div>
      </section>

      <section class="ich-sec" aria-labelledby="how-h">
        <div class="ich-h"><div><h2 id="how-h">{t('How it works')}</h2><p class="ich-hs">{t('3 steps')}</p></div></div>
        <ol class="card ich-list steps">
          {#each STEPS as s (s)}<li class="ich-row"><span class="ich-ib"><Check size={18} aria-hidden="true" /></span><span class="ich-m"><b>{t(s)}</b></span></li>{/each}
        </ol>
        <div class="ich-acts go">
          <button type="button" class="btn hi" onclick={send} disabled={!!$demoQ || sending} title={$demoQ ? t('Off while the demo runs') : undefined}><Send size={16} aria-hidden="true" />{phone.matches ? t('Send to computer') : t('Send to phone')}</button>
        </div>
        {#if message}<p class="msg" role="status">{message}</p>{/if}
      </section>
    </div>

    <div class="ich-side">
      <section class="ich-sec" aria-labelledby="last-h">
        <div class="ich-h"><div><h2 id="last-h">{t('Last backup file')}</h2></div></div>
        <div class="card ich-list">
          <div class="ich-row"><span class="ich-ib"><Database size={18} aria-hidden="true" /></span><span class="ich-m"><b>{$lastQ?.at ? when($lastQ.at) : t('no backup yet')}</b><small>{t('made on this device')}</small></span></div>
        </div>
      </section>
    </div>
  </div>
</div>

<style>
  .phonepage {
    max-width: 1100px;
  }
  .scan {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 16px 20px;
  }
  .st {
    flex: 1 1 14em;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  .st b {
    font-weight: 600;
  }
  .st small {
    color: var(--ink-3);
    font-size: var(--fs-small);
    overflow-wrap: break-word;
  }
  .go {
    margin-top: 12px;
  }
  .msg {
    margin: 12px 0 0;
    font-weight: 600;
    color: var(--ink);
  }
</style>
