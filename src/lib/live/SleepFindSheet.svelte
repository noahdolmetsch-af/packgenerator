<script>
  /**
   * Schlafplatz finden, Schritt 1 (Noah 28.10.2026 «1b 2a 3a und b 4a»): the window of the live map menu.
   * Roofs around you from OpenStreetMap (shelters, huts, bivouac boxes, bus stops with a roof) and your own
   * places to sleep, nearest first. «Hin» plans the way there (the detour window); «Hier speichern» keeps
   * where you stand as your own place; own places can be renamed and deleted, with Undo. Nothing is
   * requested or planned without a tap.
   */
  import { X, MapPin, Pencil, Trash2, Search, Tent } from '@lucide/svelte';
  import { backClose } from '../ui/backclose.js';
  import { offerDone } from '../ui/rename.svelte.js';
  import { ownQuery, saveOwn, putOwn, newPoint } from '../map/ownpoints.js';
  import { SLEEP_KINDS, loadSleepAround, findSpots } from './schlafplatz.js';
  import { t, num } from '../i18n.svelte.js';

  let { here = null, onhin, onclose } = $props();
  let dialog = $state();
  $effect(() => {
    if (dialog && !dialog.open) dialog.showModal();
  });

  const ownQ = ownQuery();
  const own = $derived($ownQ ?? []);
  let list = $state.raw([]);
  let loaded = $state(false);
  let busy = $state(false);
  let err = $state('');
  let kinds = $state(SLEEP_KINDS.map((k) => k.key));
  const spots = $derived(findSpots({ here, list, own, kinds }));
  const fmtKm = (v) => (v < 1 ? t('{m} m', { m: num(Math.round(v * 100) * 10) }) : t('{d} km', { d: num(v) }));

  async function search() {
    if (busy || !here) return;
    busy = true;
    err = '';
    try {
      list = await loadSleepAround(here);
      loaded = true;
    } catch (e) {
      err =
        e?.message === 'busy'
          ? t('All OpenStreetMap servers are full or too slow right now.|poi') + ' ' + t('Try again in a minute.|poi')
          : navigator.onLine === false
            ? t('You are offline. Try again with internet.')
            : t('Could not load. Try again later.');
    } finally {
      busy = false;
    }
  }
  const toggle = (k) => (kinds = kinds.includes(k) ? kinds.filter((x) => x !== k) : [...kinds, k]);

  // your own places
  let name = $state('');
  async function saveHere() {
    if (!here) return;
    const p = newPoint({ lat: here.lat, lon: here.lon, name: name.trim() || t('Place to sleep'), kind: 'sleep' });
    const before = await saveOwn((l) => [...l, p]);
    name = '';
    offerDone(t('Saved as your place to sleep.'), () => putOwn(before));
  }
  let editId = $state(null);
  let draft = $state('');
  async function rename(s) {
    const next = draft.trim();
    editId = null;
    if (!next || next === s.name) return;
    const before = await saveOwn((l) => l.map((p) => (p.id === s.ownId ? { ...p, name: next } : p)));
    offerDone(t('Renamed to «{name}».', { name: next }), () => putOwn(before));
  }
  async function remove(s) {
    const before = await saveOwn((l) => l.filter((p) => p.id !== s.ownId));
    offerDone(t('Deleted «{name}».', { name: s.name || t('Place to sleep') }), () => putOwn(before));
  }
  const nameOf = (s) => s.name || (s.source === 'own' ? t('Place to sleep') : t(SLEEP_KINDS.find((k) => k.key === s.spot)?.name ?? 'Hut and shelter'));
  function hin(s) {
    onhin?.({ lat: s.lat, lon: s.lon, name: nameOf(s) });
    dialog.close();
  }
</script>

<dialog class="sheet from-below sf" bind:this={dialog} use:backClose={() => dialog.close()} onclose={() => onclose?.()} aria-labelledby="sf-h" data-live-sleep-sheet>
  <div class="sf-head">
    <h2 id="sf-h">{t('Find a place to sleep')}</h2>
    <button type="button" class="rc-icon" aria-label={t('Close')} onclick={() => dialog.close()}><X size={20} aria-hidden="true" /></button>
  </div>
  <p class="rc-note">{t('Shelters, huts, bivouac boxes and bus stops with a roof around you, and your own places. Only tips.')}</p>
  {#if !here}<p class="rc-warn" role="status">{t('Waiting for the GPS …')}</p>{/if}

  <div class="sf-chips" role="group" aria-label={t('Show')}>
    {#each SLEEP_KINDS as k (k.key)}
      <button type="button" class="sf-chip" aria-pressed={kinds.includes(k.key)} onclick={() => toggle(k.key)} data-live-sleep-kind={k.key}>{t(k.name)}</button>
    {/each}
  </div>
  <div class="sf-acts">
    <button type="button" class="btn hi" onclick={search} disabled={busy || !here} data-live-sleep-search><Search size={18} aria-hidden="true" />{busy ? t('Searching…') : loaded ? t('Search again') : t('Search around me')}</button>
  </div>
  {#if err}<p class="rc-warn" role="alert" data-live-sleep-error>{err}</p>{/if}

  {#if spots.length}
    <ul class="rc-list" data-live-sleep-list>
      {#each spots as s (s.id)}
        <li class="sf-row" data-live-sleep-spot={s.source}>
          <Tent size={18} aria-hidden="true" />
          <span class="sf-main">
            {#if editId === s.id}
              <form
                class="sf-edit"
                onsubmit={(e) => {
                  e.preventDefault();
                  rename(s);
                }}
              >
                <label class="sr" for="sf-rename">{t('Name')}</label>
                <!-- svelte-ignore a11y_autofocus -->
                <input id="sf-rename" class="inp" bind:value={draft} autofocus data-live-sleep-rename-input />
                <button type="submit" class="btn sm hi" data-live-sleep-rename-keep>{t('Save')}</button>
                <button type="button" class="btn sm" onclick={() => (editId = null)}>{t('Cancel')}</button>
              </form>
            {:else}
              <b>{nameOf(s)}</b>
              <small>{[t(SLEEP_KINDS.find((k) => k.key === s.spot)?.name ?? 'Hut and shelter'), fmtKm(s.distKm)].join(' · ')}</small>
            {/if}
          </span>
          <span class="sf-btns">
            <button type="button" class="btn sm" onclick={() => hin(s)} data-live-sleep-go><MapPin size={16} aria-hidden="true" />{t('Go there')}</button>
            {#if s.source === 'own' && editId !== s.id}
              <button type="button" class="btn sm" aria-label={t('Rename')} onclick={() => ((editId = s.id), (draft = s.name))} data-live-sleep-rename><Pencil size={16} aria-hidden="true" /></button>
              <button type="button" class="btn sm" aria-label={t('Delete')} onclick={() => remove(s)} data-live-sleep-delete><Trash2 size={16} aria-hidden="true" /></button>
            {/if}
          </span>
        </li>
      {/each}
    </ul>
  {:else if loaded}
    <p class="rc-empty" data-live-sleep-empty>{t('No roofs found within {km} km. Save your own place below.', { km: 8 })}</p>
  {/if}

  <h3 class="sf-h3">{t('Save where I am')}</h3>
  <form
    class="sf-edit"
    onsubmit={(e) => {
      e.preventDefault();
      saveHere();
    }}
  >
    <label class="sr" for="sf-name">{t('Name')}</label>
    <input id="sf-name" class="inp" bind:value={name} placeholder={t('Name (optional)')} data-live-sleep-name />
    <button type="submit" class="btn hi" disabled={!here} data-live-sleep-save>{t('Save as place to sleep')}</button>
  </form>
  <p class="rc-src">{t('Places from OpenStreetMap (free, map data © OpenStreetMap).')}</p>
</dialog>

<style>
  .sf-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
  }
  .sf-head h2 {
    margin: 0;
  }
  .sf-h3 {
    margin: 14px 0 6px;
    font-size: var(--fs-sub);
  }
  .sf-chips,
  .sf-acts,
  .sf-edit,
  .sf-btns {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin: 8px 0;
  }
  .sf-chip {
    min-height: 44px;
    padding: 8px 13px;
    border: 1px solid var(--line-strong);
    border-radius: 999px;
    background: var(--paper);
    color: var(--ink);
    font: 500 var(--fs-body) var(--font-body);
    cursor: pointer;
  }
  .sf-chip[aria-pressed='true'] {
    background: var(--ink);
    border-color: var(--ink);
    color: var(--paper);
  }
  .sf-row {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 0;
    border-bottom: 1px solid var(--line);
  }
  .sf-main {
    display: flex;
    flex-direction: column;
    min-width: 0;
    flex: 1;
  }
  .sf-main b {
    overflow-wrap: break-word;
  }
  .sf-main small {
    color: var(--ink-2);
  }
  .sf-btns {
    margin: 0;
    flex: none;
  }
  .sf-edit .input {
    flex: 1;
    min-width: 8em;
  }
</style>
