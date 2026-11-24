<script>
  /**
   * «Heute passt», where to start (Challenges nach Gelegenheit, Noah 23.11.2026 «1b»): the trip tips start from
   * home by default. Here the user can choose «From here» (the location is asked only on this tap and is not
   * kept), search any place (the place search of the trip weather) or go back to home. Nothing is saved: the
   * choice lives in the window of TripTips until the page is left.
   * home { name, lat, lon } or null; onpick({ kind: 'home' | 'here' | 'place', name, lat, lon }); onclose().
   */
  import { searchPlace } from '../weather.js';
  import { backClose } from '../ui/backclose.js';
  import { t } from '../i18n.svelte.js';
  import { X, Search, MapPin, LocateFixed, House } from '@lucide/svelte';
  import '../bikes/velo-dlg.css';
  import '../ich/ich.css';

  let { home = null, onpick, onclose } = $props();

  let dialog;
  $effect(() => {
    if (dialog && !dialog.open) dialog.showModal();
  });
  let q = $state('');
  let found = $state([]);
  let searching = $state(false);
  let locating = $state(false);
  let msg = $state('');

  function pick(x) {
    onpick?.(x);
    dialog?.close();
  }
  async function search(event) {
    event.preventDefault();
    searching = true;
    msg = '';
    try {
      found = await searchPlace(q);
      if (!found.length) msg = t('No place found. Try another spelling.');
    } catch (err) {
      msg = err?.outage ? err.message : t('No connection. Place search needs the internet.');
    } finally {
      searching = false;
    }
  }
  function here() {
    msg = '';
    if (!navigator.geolocation) return (msg = t('Your location is not available here. Search a place instead.'));
    locating = true;
    navigator.geolocation.getCurrentPosition(
      (p) => {
        locating = false;
        pick({ kind: 'here', name: t('Here'), lat: p.coords.latitude, lon: p.coords.longitude });
      },
      () => {
        locating = false;
        msg = t('Your location is not available here. Search a place instead.');
      },
      { timeout: 8000, maximumAge: 300000 },
    );
  }
  const key = (p) => `${p.lat},${p.lon}`;
</script>

<dialog class="sheet vdlg" bind:this={dialog} use:backClose {onclose} aria-labelledby="sps-h" data-start-sheet>
  <div class="vd-head">
    <div class="vd-t">
      <h2 id="sps-h" class="title">{t('Where do you start?')}</h2>
      <p class="vd-sub">{t('The tips then count from this place. Nothing is saved.')}</p>
    </div>
    <button type="button" class="vd-x" aria-label={t('Close')} onclick={() => dialog.close()}><X size={20} aria-hidden="true" /></button>
  </div>

  <ul class="card ich-list">
    {#if home}
      <li>
        <button type="button" class="ich-row" onclick={() => pick({ kind: 'home', name: t('Home|start place'), lat: home.lat, lon: home.lon })} data-start-home>
          <span class="ich-ib"><House size={18} aria-hidden="true" /></span>
          <span class="ich-m"><b>{t('Home|start place')}</b>{#if home.name}<small>{home.name}</small>{/if}</span>
        </button>
      </li>
    {/if}
    <li>
      <button type="button" class="ich-row" disabled={locating} onclick={here} data-start-here>
        <span class="ich-ib"><LocateFixed size={18} aria-hidden="true" /></span>
        <span class="ich-m"><b>{t('From here')}</b><small>{locating ? t('Looking for your location …') : t('Asks for your location once, keeps nothing')}</small></span>
      </button>
    </li>
  </ul>

  <form class="find" onsubmit={search}>
    <label class="fld"><span class="lbl">{t('Another place, e.g. Aarau')}</span><input class="inp" bind:value={q} autocomplete="off" data-start-q /></label>
    <button type="submit" class="btn" disabled={searching || q.trim().length < 2}><Search size={16} aria-hidden="true" />{t('Find')}</button>
  </form>
  {#if found.length}
    <ul class="vd-panel hits" aria-label={t('Places found')}>
      {#each found as p (key(p))}
        <li>
          <button type="button" class="ich-row" onclick={() => pick({ kind: 'place', name: p.name, lat: p.lat, lon: p.lon })} data-start-hit>
            <span class="ich-ib"><MapPin size={18} aria-hidden="true" /></span>
            <span class="ich-m"><b>{p.name}</b>{#if p.detail}<small>{p.detail}</small>{/if}</span>
          </button>
        </li>
      {/each}
    </ul>
  {/if}
  {#if msg}<p class="msg" role="alert">{msg}</p>{/if}
  <p class="fine">{t('The search needs the internet.')}</p>
</dialog>

<style>
  .find {
    display: flex;
    align-items: flex-end;
    gap: 10px;
    margin-top: 14px;
  }
  .fld {
    flex: 1;
    min-width: 0;
  }
  .hits {
    margin-top: 12px;
  }
  .msg {
    margin: 10px 0 0;
    color: var(--ink);
    font-size: var(--fs-small);
  }
  .fine {
    margin: 12px 0 0;
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
</style>
