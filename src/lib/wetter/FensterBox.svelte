<script>
  /**
   * A window for an outside page (Noah 04.11.2026 «1a», «3a»): the Landi rain radar and the SRF Meteo webcams
   * on the weather page. Closed at first; the page loads only when it is opened (nothing is fetched by
   * itself). Many sites do not allow to be shown in another page, and the app cannot see that. So the way out
   * is always there: «Open in a new tab», and «Stays empty? Show only the button» remembers it for this
   * window on this device (db setting, device only).
   */
  import { liveQuery } from 'dexie';
  import { ExternalLink, ChevronDown } from '@lucide/svelte';
  import { db } from '../db.js';
  import { t } from '../i18n.svelte.js';

  let { id, title, url, why = '', height = 420 } = $props();

  const KEY = 'wxFramesOff';
  const offQ = liveQuery(() => db.settings.get(KEY));
  const isOff = $derived(($offQ?.value ?? []).includes(id));
  let open = $state(false);

  async function setOff(on) {
    const cur = (await db.settings.get(KEY))?.value ?? [];
    const next = on ? [...new Set([...cur, id])] : cur.filter((x) => x !== id);
    await db.settings.put({ key: KEY, value: next });
  }
</script>

<section class="card wx-fb" aria-labelledby="wx-fb-{id}" data-wx-window={id}>
  <h2 id="wx-fb-{id}" class="wx-fb-h">
    <button type="button" class="wx-fb-toggle" aria-expanded={open} onclick={() => (open = !open)} data-wx-window-toggle={id}>
      <span>{title}</span><ChevronDown size={18} aria-hidden="true" class={open ? 'up' : ''} />
    </button>
  </h2>
  {#if why}<p class="rc-note">{why}</p>{/if}
  {#if open}
    {#if navigator.onLine === false}
      <p class="rc-note">{t('You are offline right now. The window needs the internet.')}</p>
    {:else if isOff}
      <p class="rc-note" data-wx-window-off>{t('This window stays closed on this device. The page opens in a new tab.')}</p>
      <button type="button" class="btn sm" onclick={() => setOff(false)}>{t('Try the window again')}</button>
    {:else}
      <iframe class="wx-fb-frame" src={url} title={title} style="height:{height}px" loading="lazy" referrerpolicy="no-referrer" sandbox="allow-scripts allow-same-origin allow-popups allow-forms"></iframe>
      <p class="rc-note">{t('The window stays empty? Then the site does not allow it.')}</p>
      <button type="button" class="btn sm" onclick={() => setOff(true)} data-wx-window-giveup={id}>{t('Stays empty? Show only the button')}</button>
    {/if}
  {/if}
  <a class="btn" href={url} target="_blank" rel="noopener noreferrer" data-wx-window-tab={id}>{t('Open in a new tab')}<ExternalLink size={14} aria-hidden="true" /></a>
</section>

<style>
  .wx-fb {
    padding: 12px;
    display: grid;
    gap: 8px;
  }
  .wx-fb-h {
    margin: 0;
    font-size: var(--fs-sub);
  }
  .wx-fb-toggle {
    width: 100%;
    min-height: 44px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    border: 0;
    background: none;
    color: var(--ink);
    font: inherit;
    text-align: left;
    cursor: pointer;
  }
  .wx-fb-toggle :global(.up) {
    transform: rotate(180deg);
  }
  .wx-fb-frame {
    width: 100%;
    border: 1px solid var(--line);
    border-radius: 10px;
    background: var(--paper-2);
  }
</style>
