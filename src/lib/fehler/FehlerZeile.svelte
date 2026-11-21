<script>
  /**
   * UEBERGANG-FEHLERZEILE: a small card at the end of Ich › Daten that says how many errors the app has noted on this
   * device (src/lib/fehler/felog.js), with «Copy» and «Clear». It goes away when the Logbuch (L1b) shows the errors:
   * delete this file, its import and its use in src/lib/DataPanel.svelte, and the strings in src/lib/i18n/de/fehlermelder.js.
   */
  import { Bug } from '@lucide/svelte';
  import { t, tn, locale } from '../i18n.svelte.js';
  import { offerDone } from '../ui/rename.svelte.js';
  import { list, clear, copyText } from './felog.js';

  let entries = $state(list());
  const newest = $derived([...entries].reverse().slice(0, 5));
  const when = (at) => new Date(at).toLocaleString(locale(), { day: 'numeric', month: 'numeric', hour: '2-digit', minute: '2-digit' });
  async function copy() {
    try {
      await navigator.clipboard.writeText(copyText(entries));
      offerDone(t('Copied.'), () => {});
    } catch {
      offerDone(t('Copying did not work. Select the line and copy it by hand.'), () => {});
    }
  }
  function forget() {
    clear();
    entries = list();
  }
</script>

<section class="ich-sec" aria-labelledby="fe-h" data-section="fehler">
  <div class="ich-h"><div><h2 id="fe-h">{t('Noted errors')}</h2></div></div>
  <ul class="card ich-list">
    <li class="fe-top">
      <span class="ich-ib"><Bug size={18} aria-hidden="true" /></span>
      <span class="ich-m">
        <b data-fehler-count>{entries.length ? tn(entries.length, '{n} error noted', '{n} errors noted') : t('No errors noted')}</b>
        <small>{t('The app notes errors only on this device. Nothing is sent. It stores no names or values, only the error text, the page and the time.')}</small>
      </span>
    </li>
    {#if entries.length}
      <li class="fe-out" data-fehler-out>
        <ul class="fe-list">
          {#each newest as e (e.at + e.message)}
            <li><span class="num">{when(e.at)}</span> · {e.page} · {e.message}</li>
          {/each}
        </ul>
        <div class="fe-acts">
          <button type="button" class="fe-btn" onclick={copy} data-fehler-copy>{t('Copy the errors')}</button>
          <button type="button" class="fe-btn" onclick={forget} data-fehler-clear>{t('Clear the list')}</button>
        </div>
      </li>
    {/if}
  </ul>
</section>

<style>
  .fe-top {
    padding: 10px 0;
    display: flex;
    gap: 10px;
    align-items: flex-start;
  }
  .fe-out {
    padding: 4px 0 12px;
  }
  .fe-list {
    margin: 0 0 8px;
    padding: 0;
    list-style: none;
    font-size: var(--fs-small);
    line-height: 1.4;
    overflow-wrap: break-word;
  }
  .fe-list li {
    padding: 4px 0;
  }
  .fe-acts {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
  .fe-btn {
    min-height: 44px;
    padding: 0 14px;
    border: 1px solid var(--line);
    border-radius: 10px;
    background: none;
    color: var(--ink);
    font: inherit;
    cursor: pointer;
  }
</style>
