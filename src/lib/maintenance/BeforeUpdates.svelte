<script>
  /**
   * BF4 «Sicherung vor jedem Update» (Noah 13.10.2026, built without mockups at his word): under Ich ›
   * Daten und Backup a quiet section «Before updates». The copies the app kept before its last updates
   * (version, date, records), each with «Back to the state before …»: it asks first, keeps a copy of
   * now (so it can be undone), then the copy replaces all data. The switch turns the copies off.
   */
  import { liveQuery } from 'dexie';
  import { db } from '../db.js';
  import { snapDb, listSnapshots, restoreSnapshot } from './snapshots.js';
  import { MAINT_KEY, maintOf, saveMaint } from './settings.js';
  import { tidyData } from '../tidy.js';
  import { settling } from '../settled.js';
  import { markImported } from '../backup.js';
  import { shortVersion } from '../whatsnew.js';
  import { t, tn, locale } from '../i18n.svelte.js';
  import { History } from '@lucide/svelte';
  import './maint.css';

  const sdb = snapDb();
  const listQ = liveQuery(() => listSnapshots(sdb));
  const setQ = liveQuery(async () => maintOf((await db.settings.get(MAINT_KEY))?.value));
  let asking = $state(null);
  let busy = $state(false);
  let message = $state('');
  let sec = $state();
  const when = (iso) => new Date(iso).toLocaleString(locale(), { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  const current = typeof __APP_VERSION__ === 'string' ? __APP_VERSION__ : '';
  const backLabel = (s) => (s.kind === 'update' ? t('Back to the state before {v}', { v: shortVersion(s.to ?? current) }) : s.kind === 'import' ? t('Back to the state before the import') : t('Undo going back'));
  // P3b «Daten sicher» (rule 5a): the copies before an import stand here too
  const rowName = (s) => (s.kind === 'update' ? t('Version {v}', { v: shortVersion(s.version ?? '?') }) : s.kind === 'import' ? t('Before an import') : t('Before going back'));

  // from the news banner (#/me/data?at=before-updates): this section in view
  $effect(() => {
    if (sec && /[?&]at=before-updates\b/.test(location.hash)) sec.scrollIntoView({ block: 'start' });
  });

  async function goBack(s) {
    busy = true;
    try {
      await settling(async () => {
        const snap = await restoreSnapshot(db, sdb, s.id, { current });
        await tidyData(db);
        await markImported(db, snap.data, 'replace');
      });
      message = t('Done: your data is back at the state of {when}. The state before is kept as a copy here.', { when: when(s.at) });
    } catch (err) {
      message = `${t('Nothing was changed.')} ${err?.message ?? ''}`.trim();
    } finally {
      busy = false;
      asking = null;
    }
  }
</script>

<section class="ich-sec" id="before-updates" aria-labelledby="bu-h" data-section="before-updates" bind:this={sec}>
  <div class="ich-h"><div><h2 id="bu-h">{t('Before updates')}</h2><p class="ich-hs">{t('A copy of your data before every update and every import, only on this device. The last 3 stay.')}</p></div></div>
  <ul class="card ich-list">
    {#each $listQ ?? [] as s (s.id)}
      <li class="ich-row ich-wrap" data-snapshot={s.kind}>
        <span class="ich-ib"><History size={18} aria-hidden="true" /></span>
        <span class="ich-m">
          <b>{rowName(s)}</b>
          <small>{when(s.at)} · {tn(s.rows ?? 0, '{n} record', '{n} records')}</small>
        </span>
        <button type="button" class="btn sm" onclick={() => ((asking = s), (message = ''))} disabled={busy}>{backLabel(s)}</button>
      </li>
      {#if asking?.id === s.id}
        <li class="ask"><div role="dialog" aria-label={backLabel(s)}>
          <p>{t('All data on this device is replaced by the copy of {when}. The state now is kept as a copy first, so you can go back again.', { when: when(s.at) })}</p>
          <div class="ich-acts end">
            <button type="button" class="btn" onclick={() => (asking = null)}>{t('Cancel')}</button>
            <button type="button" class="btn hi" onclick={() => goBack(s)} disabled={busy}>{t('Go back')}</button>
          </div>
        </div></li>
      {/if}
    {:else}
      <li class="ich-row empty"><span class="ich-m"><small>{t('No copy yet: the first one is made before the next update.')}</small></span></li>
    {/each}
    <li>
      <label class="ich-row">
        <span class="ich-m"><b>{t('Backup before every update')}</b><small>{t('Not in exports and backup files')}</small></span>
        <input type="checkbox" role="switch" class="mt-sw" checked={$setQ?.snap ?? true} disabled={!$setQ} onchange={(e) => saveMaint(db, { snap: e.currentTarget.checked })} />
      </label>
    </li>
  </ul>
  {#if message}<p class="ich-help" role="status">{message}</p>{/if}
</section>

<style>
  .ask {
    padding: 12px 0;
  }
  .ask p {
    margin: 0 0 10px;
    color: var(--ink-2);
    font-size: var(--fs-small);
    overflow-wrap: break-word;
  }
  .end {
    justify-content: flex-end;
  }
  .empty {
    min-height: 48px;
  }
</style>
