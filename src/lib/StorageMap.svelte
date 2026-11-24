<script>
  /**
   * «Speicher auf diesem Gerät» (Noah 23.11.2026): under Ich › Daten, one tap measures where the browser's storage of
   * this app goes (caches by kind, data tables) and says in words whether the big number is real space or only
   * Chrome's padding for map tiles. Read only; one line to copy. Nothing leaves the device by itself.
   */
  import { HardDrive } from '@lucide/svelte';
  import { db, DATA_TABLES } from './db.js';
  import { t, tn, locale } from './i18n.svelte.js';
  import { offerDone } from './ui/rename.svelte.js';
  import { readCaches, readTables, readCopies, verdict, countedBytes, OPAQUE_PAD } from './storagemap.js';
  import { snapDb } from './maintenance/snapshots.js';

  let busy = $state(false);
  let res = $state(null);
  let failed = $state(false);

  const size = (b) => {
    const mb = b / 1048576;
    if (mb >= 1024) return `${(mb / 1024).toLocaleString(locale(), { maximumFractionDigits: 1 })} GB`;
    return `${mb.toLocaleString(locale(), { maximumFractionDigits: mb < 10 ? 1 : 0 })} MB`;
  };

  async function measure() {
    busy = true;
    failed = false;
    try {
      const est = (await navigator.storage?.estimate?.()) ?? {};
      const [caches, tables, copies] = await Promise.all([readCaches(), readTables(db, DATA_TABLES), readCopies(snapDb()).catch(() => ({ n: 0, bytes: 0 }))]);
      res = { usage: est.usage ?? 0, quota: est.quota ?? 0, caches, tables, copies, v: verdict({ usage: est.usage ?? 0, caches, tables: [...tables, { name: 'copies', rows: copies.n, bytes: copies.bytes }] }) };
    } catch {
      failed = true;
    } finally {
      busy = false;
    }
  }

  const dataBytes = $derived(res ? res.tables.reduce((n, x) => n + x.bytes, 0) : 0);
  // one line for the chat: browser total, then every cache and the data, with real and counted sizes
  const line = $derived(
    res
      ? [
          `${t('Browser counts')}: ${size(res.usage)}`,
          ...res.caches.map((c) => `${c.known ? t(c.label) : c.label}: ${tn(c.entries, '{n} entry', '{n} entries')}${c.opaque ? `, ${c.opaque} ${t('unreadable')}` : ''}, ${size(c.bytes)}`),
          `${t('Your data')}: ${size(dataBytes)}`,
          ...(res.copies?.n ? [`${t('Copies before updates')}: ${tn(res.copies.n, '{n} copy', '{n} copies')}, ${size(res.copies.bytes)}`] : []),
        ].join(' · ')
      : '',
  );
  async function copy() {
    try {
      await navigator.clipboard.writeText(line);
      offerDone(t('Copied.'), () => {});
    } catch {
      /* the line stays visible to copy by hand */
    }
  }
</script>

<section class="ich-sec" aria-labelledby="sm-h" data-storage-map>
  <div class="ich-h"><div><h2 id="sm-h">{t('Storage on this device')}</h2></div></div>
  <div class="card ich-body">
    {#if !res}
      <p class="fine">{t('Shows where the storage of this app goes. Nothing is changed or deleted.')}</p>
      <button type="button" class="btn" onclick={measure} disabled={busy} data-storage-measure><HardDrive size={16} aria-hidden="true" />{busy ? t('Measuring…') : t('Measure storage')}</button>
      {#if failed}<p class="fine">{t('This browser does not tell. Nothing was changed.')}</p>{/if}
    {:else}
      <p class="big"><b>{size(res.usage)}</b> <span class="fine">{t('counted by the browser for this app')}</span></p>
      {#if res.v.kind === 'padding'}
        <p data-verdict="padding">{t('{n} map pictures are counted by Chrome with about {mb} MB each, although each one is small. That makes about {size} of this number, not real space. Your data is not affected.', { n: res.v.opaqueCount, mb: OPAQUE_PAD / 1048576, size: size(res.v.opaquePad) })}</p>
      {:else if res.v.kind === 'ai'}
        <p data-verdict="ai">{t('The AI models on this device take most of it. They are kept only here and can be downloaded again.')}</p>
      {:else}
        <p data-verdict="ok">{t('Nothing unusual: the numbers below add up.')}</p>
      {/if}
      <ul class="rows">
        {#each res.caches as c (c.name)}
          <li>
            <span class="nm">{c.known ? t(c.label) : c.label}<small>{tn(c.entries, '{n} entry', '{n} entries')}{#if c.opaque}{' · '}{t('{n} of them unreadable', { n: c.opaque })}{/if}</small></span>
            <span class="val">{size(c.bytes)}{#if c.opaque}<small>{t('counted: {size}', { size: size(countedBytes(c)) })}</small>{/if}</span>
          </li>
        {/each}
        <li>
          <span class="nm">{t('Your data')}<small>{t('items, trips, notes, photos')}</small></span>
          <span class="val">{size(dataBytes)}</span>
        </li>
        {#if res.copies?.n}
          <li data-copies>
            <span class="nm">{t('Copies before updates')}<small>{tn(res.copies.n, '{n} copy', '{n} copies')}{' · '}{t('each holds all your data · under «More»')}</small></span>
            <span class="val">{size(res.copies.bytes)}</span>
          </li>
        {/if}
      </ul>
      <div class="acts">
        <button type="button" class="btn sm" onclick={measure} disabled={busy}>{t('Measure again')}</button>
        <button type="button" class="btn sm" onclick={copy} data-storage-copy>{t('Copy the line')}</button>
      </div>
      <p class="fine line" data-storage-line>{line}</p>
    {/if}
  </div>
</section>

<style>
  .fine {
    margin: 0 0 10px;
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .big {
    margin: 0 0 8px;
    font-size: var(--fs-sub);
  }
  .rows {
    list-style: none;
    margin: 10px 0;
    padding: 0;
  }
  .rows li {
    display: flex;
    justify-content: space-between;
    gap: 12px;
    border-bottom: 1px solid var(--line);
    padding: 6px 0;
  }
  .rows small {
    display: block;
    color: var(--ink-2);
    font-size: var(--fs-small);
    font-weight: 400;
  }
  .nm {
    overflow-wrap: break-word;
  }
  .val {
    flex: none;
    text-align: right;
    font-weight: 600;
  }
  .acts {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
  .line {
    margin-top: 10px;
    overflow-wrap: break-word;
    user-select: all;
  }
</style>
