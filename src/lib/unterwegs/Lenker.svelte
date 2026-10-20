<script>
  /**
   * Paket K #114 «Lenker-Ansicht» (Noah 19.10.2026 «2 a und b möglich»): the whole screen, turned
   * sideways where the phone allows it, with big numbers for the handlebar. At the start time, km,
   * metres up and the next meal; «Zahlen wählen» lets you pick up to 6 and order them (arrows and drag).
   * «Mit GPS messen» measures the km while this view is open; the location is never stored.
   * lenker.js holds the rules. ctx: the numbers Unterwegs knows (see tileValues).
   */
  import { liveQuery } from 'dexie';
  import { db } from '../db.js';
  import { t } from '../i18n.svelte.js';
  import { distKm } from '../route.js';
  import { LENKER_KEY, TILES, MAX_TILES, tilesOf, toggleTile, moveTile, tileValues, addFix } from './lenker.js';
  import { sortable } from '../ui/sortable.js';
  import SortArrows from '../ui/SortArrows.svelte';
  import SortGrip from '../ui/SortGrip.svelte';
  import { X, SlidersHorizontal, LocateFixed, Check } from '@lucide/svelte';

  let { ctx = {}, onclose } = $props();
  const lenkerQ = liveQuery(() => db.settings.get(LENKER_KEY));
  const tiles = $derived(tilesOf($lenkerQ?.value));
  const save = (list) => db.settings.put({ key: LENKER_KEY, value: { tiles: list } });
  const TILE = Object.fromEntries(TILES.map((x) => [x.key, x]));

  let now = $state(Date.now());
  $effect(() => {
    const id = setInterval(() => (now = Date.now()), 5000);
    return () => clearInterval(id);
  });
  let track = $state(null);
  let watch = null;
  let gpsMsg = $state('');
  function gps(on) {
    gpsMsg = '';
    if (watch != null) navigator.geolocation?.clearWatch(watch);
    watch = null;
    if (!on) return (track = null);
    if (!navigator.geolocation) return (gpsMsg = t('This device has no location.'));
    track = { km: 0, kmh: null, last: null };
    watch = navigator.geolocation.watchPosition(
      (p) => (track = addFix(track, { lat: p.coords.latitude, lon: p.coords.longitude, acc: p.coords.accuracy, speed: p.coords.speed, at: p.timestamp }, distKm)),
      () => {
        gpsMsg = t('Your location is not available. The km stay a guess.');
        gps(false);
      },
      { enableHighAccuracy: true, maximumAge: 5000 },
    );
  }
  const vals = $derived(tileValues({ ...ctx, now, gps: track ? { km: track.km, kmh: track.kmh } : null }));

  let box;
  let choose = $state(false);
  $effect(() => {
    // the whole screen and sideways, where the browser allows it (Chrome on Android in full screen)
    const el = box;
    (async () => {
      try {
        await el?.requestFullscreen?.();
        await screen.orientation?.lock?.('landscape');
      } catch {
        /* not allowed here: the view still fills the window */
      }
    })();
    const key = (e) => e.key === 'Escape' && close();
    document.addEventListener('keydown', key);
    return () => {
      document.removeEventListener('keydown', key);
      if (watch != null) navigator.geolocation?.clearWatch(watch);
      try {
        screen.orientation?.unlock?.();
      } catch {
        /* nothing to undo */
      }
      if (document.fullscreenElement) document.exitFullscreen?.().catch(() => {});
    };
  });
  const close = () => onclose?.();
</script>

<div class="lenker" bind:this={box} role="dialog" aria-modal="true" aria-label={t('Handlebar view')} data-lenker>
  <div class="bar">
    <button type="button" class="lb" aria-label={t('Close')} onclick={close}><X size={28} aria-hidden="true" /></button>
    <button type="button" class="lb" aria-pressed={!!track} onclick={() => gps(!track)} data-lenker-gps><LocateFixed size={24} aria-hidden="true" /><span>{track ? t('GPS on') : t('Measure with GPS')}</span></button>
    <button type="button" class="lb" aria-expanded={choose} onclick={() => (choose = !choose)} data-lenker-choose><SlidersHorizontal size={24} aria-hidden="true" /><span>{t('Choose numbers')}</span></button>
  </div>
  {#if gpsMsg}<p class="msg" role="status">{gpsMsg}</p>{/if}
  {#if choose}
    <div class="choose">
      <p class="hint">{t('Up to {n} numbers. Tap to show or hide; order them with the arrows or by dragging.', { n: MAX_TILES })}</p>
      <div class="pick">
        {#each TILES as x (x.key)}
          <button type="button" class="pk" aria-pressed={tiles.includes(x.key)} disabled={!tiles.includes(x.key) && tiles.length >= MAX_TILES} onclick={() => save(toggleTile(tiles, x.key))}>{#if tiles.includes(x.key)}<Check size={18} aria-hidden="true" />{/if}{t(x.label)}</button>
        {/each}
      </div>
      <ol class="order" use:sortable={{ onmove: (from, to) => save(moveTile(tiles, from, to)) }}>
        {#each tiles as k, i (k)}
          <li data-sort-id={k}><SortGrip name={t(TILE[k].label)} onstep={(dir) => save(moveTile(tiles, i, i + dir))} /><span>{t(TILE[k].label)}</span><SortArrows name={t(TILE[k].label)} {i} n={tiles.length} onstep={(dir) => save(moveTile(tiles, i, i + dir))} /></li>
        {/each}
      </ol>
    </div>
  {:else}
    <ul class="tiles n{tiles.length}">
      {#each tiles as k (k)}
        {@const v = vals[k]}
        <li data-tile={k}>
          <span class="lab">{t(TILE[k].label)}{#if v.guess}{' '}· {t('about|guess')}{/if}</span>
          <b class="num">{v.value}{#if TILE[k].unit && v.value !== '–'}<small>{TILE[k].unit}</small>{/if}</b>
        </li>
      {/each}
    </ul>
  {/if}
</div>

<style>
  .lenker {
    position: fixed;
    inset: 0;
    z-index: 1000;
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding: max(10px, env(safe-area-inset-top)) max(10px, env(safe-area-inset-right)) max(10px, env(safe-area-inset-bottom)) max(10px, env(safe-area-inset-left));
    background: var(--paper);
    color: var(--ink);
    overflow: auto;
    /* the big numbers of the handlebar view grow with the screen */
    --fs-lenker-num: clamp(2.6rem, 13vmin, 7rem);
    --fs-lenker-lab: clamp(0.9rem, 2.4vmin, 1.3rem);
  }
  .bar {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
  .lb {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    min-height: 56px;
    min-width: 56px;
    padding: 0 14px;
    border: 1px solid var(--line);
    border-radius: 14px;
    background: var(--paper-2);
    color: var(--ink);
    font: 600 var(--fs-body) / 1.2 var(--font-body);
    cursor: pointer;
  }
  .lb[aria-pressed='true'] {
    background: var(--ink);
    color: var(--paper);
  }
  .tiles {
    flex: 1;
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 8px;
    margin: 0;
    padding: 0;
    list-style: none;
  }
  @media (orientation: landscape) {
    .tiles.n3,
    .tiles.n5,
    .tiles.n6 {
      grid-template-columns: repeat(3, minmax(0, 1fr));
    }
  }
  .tiles li {
    display: flex;
    flex-direction: column;
    justify-content: center;
    min-width: 0;
    padding: 8px 14px;
    border-radius: 16px;
    background: var(--paper-2);
  }
  .lab {
    font-size: var(--fs-lenker-lab);
    color: var(--ink-2);
    overflow-wrap: break-word;
  }
  .tiles b {
    font-size: var(--fs-lenker-num);
    font-weight: 700;
    line-height: 1.05;
    overflow-wrap: break-word;
  }
  .tiles small {
    margin-left: 6px;
    font-size: var(--fs-lenker-lab);
    font-weight: 600;
  }
  .msg,
  .hint {
    margin: 0;
  }
  .choose {
    display: grid;
    gap: 12px;
  }
  .pick {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
  .pk {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    min-height: 48px;
    padding: 0 14px;
    border: 1px solid var(--line);
    border-radius: 999px;
    background: var(--paper);
    color: var(--ink);
    cursor: pointer;
  }
  .pk[aria-pressed='true'] {
    background: var(--paper-2);
    font-weight: 600;
  }
  .order {
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .order li {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 8px 0;
    border-bottom: 1px solid var(--line);
    background: var(--paper);
  }
  .order li span {
    flex: 1;
    min-width: 0;
  }
</style>
