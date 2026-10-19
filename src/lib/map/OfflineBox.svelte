<script>
  /**
   * Paket U3 «Karte offline» (Noah 19.10.2026 «3a und b möglich»): keep a strip of the map along a route
   * on this phone. Choose the ground (swisstopo in Switzerland, the free map for all countries) and the
   * width, see the size first, then «Keep for offline» with progress, pause and cancel. The kept strips
   * can be renamed and deleted (Undo for 4 s: the tiles go only after that). Logic: offline.js.
   *
   * Props: ctx (a race ctx: ctx.route.line, ctx.trip) or line / name / tripId for any tour with a route.
   */
  import { onMount } from 'svelte';
  import { liveQuery } from 'dexie';
  import { Download, Pause, Play, X, Pencil, Trash2, RotateCw } from '@lucide/svelte';
  import RaceBox from '../race/RaceBox.svelte';
  import RenameSheet from '../ui/RenameSheet.svelte';
  import { askDelete, deleteWithUndo } from '../ui/ask.js';
  import { offerRename } from '../ui/rename.svelte.js';
  import { UNDO_MS } from '../ui/undo.js';
  import { keepState, askKeep } from '../storagekeep.js';
  import { db } from '../db.js';
  import { pickGround, groundOf } from './sources.js';
  import { STRIPS_KEY, WIDTHS, groundsFor, planStrip, estimateBytes, fmtBytes, keepStrip, removeStrip, undoRemove, sweep, renameStrip, presentIds, storageInfo, kindOfGround } from './offline.js';
  import { t, tn, locale } from '../i18n.svelte.js';
  import '../race/race.css';

  let { ctx = null, line = null, name = '', tripId = null } = $props();

  const theLine = $derived(line ?? ctx?.route?.line ?? []);
  const theName = $derived(name || ctx?.trip?.title || ctx?.trip?.name || '');
  const theTrip = $derived(tripId ?? ctx?.trip?.id ?? null);

  // the grounds' own names (sources.js GROUNDS, German in de/karte.js)
  const groundName = (k) => t(groundOf(k).name);

  const grounds = $derived(groundsFor(theLine));
  const first = $derived(theLine.find((p) => Array.isArray(p)) ?? null);
  let chosen = $state('');
  const ground = $derived(grounds.includes(chosen) ? chosen : grounds.includes(pickGround('auto', first?.[0], first?.[1]).key) ? pickGround('auto', first?.[0], first?.[1]).key : 'vector');
  let width = $state(1);
  const plan = $derived(theLine.length > 1 ? planStrip(theLine, { ground, bufferKm: width }) : null);
  const guess = $derived(plan ? estimateBytes(plan.count, ground) : 0);

  const stripsQ = liveQuery(() => db.settings.get(STRIPS_KEY));
  const strips = $derived(Array.isArray($stripsQ?.value?.strips) ? $stripsQ.value.strips : []);
  let present = $state(new Set());
  $effect(() => {
    const list = strips;
    presentIds(list).then((s) => (present = s), () => {});
  });

  let run = $state(null); // { done, total, bytes, failed, state }
  let runner = $state.raw(null);
  let msg = $state('');
  let storage = $state(null);
  let keep = $state('unknown');
  let renaming = $state(null);

  const refreshStorage = async () => {
    storage = await storageInfo();
    keep = await keepState();
  };
  onMount(() => {
    sweep(db).catch(() => {});
    refreshStorage();
  });

  const pct = $derived(run && run.total ? Math.round((run.done / run.total) * 100) : 0);
  const busy = $derived(run && (run.state === 'running' || run.state === 'paused' || run.state === 'idle'));
  const dateOf = (iso) => (iso ? new Date(iso).toLocaleDateString(locale(), { day: 'numeric', month: 'numeric', year: 'numeric' }) : '');

  async function start(g = ground, w = width, label = '', replaceId = null) {
    if (busy || !plan) return;
    msg = '';
    if (typeof caches === 'undefined') return void (msg = t('This browser cannot keep map tiles. Try Chrome or Safari.'));
    if (navigator.onLine === false) return void (msg = t('You are offline. Try again with internet.'));
    // ask the browser once to keep the data for good (else it may clear the tiles when space runs low)
    if (keep === 'not') keep = await askKeep();
    run = { done: 0, total: 0, bytes: 0, failed: 0, state: 'idle' };
    try {
      const res = await keepStrip(
        db,
        { line: $state.snapshot(theLine), name: label || `${theName ? `${theName} · ` : ''}${groundName(g)}`, tripId: theTrip, ground: g, bufferKm: w },
        { onProgress: (p) => (run = p), onRunner: (r) => (runner = r) },
      );
      if (res.cancelled) {
        run = null;
        msg = t('Cancelled. Nothing was kept.');
      } else {
        run = { ...run, state: 'done', bytes: res.strip.bytes };
        if (replaceId) await removeStrip(db, replaceId).catch(() => {});
        msg = res.failed ? tn(res.failed, 'Kept: {size}. {n} tile could not be loaded.', 'Kept: {size}. {n} tiles could not be loaded.', { size: fmtBytes(res.strip.bytes) }) : t('Kept: {size}. The map now works here without the internet.', { size: fmtBytes(res.strip.bytes) });
      }
    } catch (err) {
      console.error(err);
      run = null;
      msg = err?.name === 'QuotaExceededError' ? t('The phone is full. Delete an older strip or choose a narrower one.') : t('Could not load. Try again later.');
    } finally {
      runner = null;
      refreshStorage();
    }
  }

  async function del(s) {
    const answer = await askDelete({ title: t('Delete «{name}»?', { name: s.name }), text: t('The map tiles of this strip leave the phone. Other strips keep theirs.') });
    if (answer !== 'delete') return;
    await deleteWithUndo({
      run: async () => {
        const saved = await removeStrip(db, s.id);
        // the tiles go only after the undo window
        saved.timer = setTimeout(() => sweep(db).then(refreshStorage, () => {}), UNDO_MS + 500);
        return saved;
      },
      undo: async (saved) => {
        clearTimeout(saved.timer);
        await undoRemove(db, saved);
      },
      text: t('«{name}» deleted.', { name: s.name }),
      name: s.name,
    });
  }

  async function rename(s, next) {
    const old = s.name;
    const n = String(next ?? '').trim();
    if (!n || n === old) return;
    await renameStrip(db, s.id, n);
    offerRename(n, () => renameStrip(db, s.id, old));
  }
</script>

<RaceBox
  id="map-offline"
  title={t('Map offline')}
  what="Keeps a narrow strip of the map along the route on this phone, so the map works without the internet."
  why="In the mountains and abroad you often have no signal. The kept strip shows the map there all the same."
  from="swisstopo (free Swiss open data) in Switzerland, OpenFreeMap (free, all countries) everywhere. The tiles stay in this browser."
>
  <div class="om" data-map-offline>
    {#if !plan}
      <p class="rc-note" data-om-noline>{t('This tour has no route yet. Load a GPX file first, then you can keep the map along it.')}</p>
    {:else}
      <p class="rc-note">{t('Choose the map and how wide the strip is. You see the size before anything is loaded.')}</p>

      <div class="om-lab">{t('Map')}</div>
      <div class="rc-chips" role="group" aria-label={t('Map')}>
        {#each grounds as g (g)}
          <button type="button" class="rc-chip" aria-pressed={ground === g} disabled={busy} onclick={() => (chosen = g)} data-om-ground={g}>{groundName(g)}</button>
        {/each}
      </div>
      {#if grounds.length > 1}<p class="rc-note">{t('National map, winter map and aerial photo come from swisstopo and cover Switzerland. The free map covers all countries.')}</p>{/if}

      <div class="om-lab">{t('Width of the strip')}</div>
      <div class="rc-chips" role="group" aria-label={t('Width of the strip')}>
        {#each WIDTHS as w (w)}
          <button type="button" class="rc-chip" aria-pressed={width === w} disabled={busy} onclick={() => (width = w)} data-om-width={w}>{t('{km} km each side', { km: w })}</button>
        {/each}
      </div>

      <p class="om-size" data-om-estimate>
        {tn(plan.count, 'About {n} map tile, about {size}.', 'About {n} map tiles, about {size}.', { size: fmtBytes(guess) })}
        {#if storage}<span class="om-sub">{t('Free on this phone: {size}.', { size: fmtBytes(storage.free) })}</span>{/if}
      </p>
      {#if plan.tooBig}
        <p class="rc-warn" data-om-toobig>{t('The route is too long for one strip. Choose 1 km, or keep it in parts later.')}</p>
      {:else if plan.cut}
        <p class="rc-note" data-om-cut>{t('Long route: details up to zoom {z}, so the strip stays small.', { z: plan.maxZoom })}</p>
      {/if}

      {#if busy}
        <div class="om-run" data-om-run={run.state}>
          <progress max={run.total || 1} value={run.done} aria-label={t('Loading the map')} data-om-progress></progress>
          <p class="rc-note" aria-live="polite">
            {run.state === 'paused' ? t('Paused: {done} of {total} tiles.', { done: run.done, total: run.total }) : t('Loading slowly, to be fair to the free map service: {done} of {total} tiles ({pct} %).', { done: run.done, total: run.total, pct })}
          </p>
          <div class="rc-acts">
            {#if run.state === 'paused'}
              <button type="button" class="btn sm" onclick={() => runner?.resume()} data-om-resume><Play size={16} aria-hidden="true" />{t('Resume')}</button>
            {:else}
              <button type="button" class="btn sm" onclick={() => runner?.pause()} disabled={!runner} data-om-pause><Pause size={16} aria-hidden="true" />{t('Pause')}</button>
            {/if}
            <button type="button" class="btn sm" onclick={() => runner?.cancel()} disabled={!runner} data-om-cancel><X size={16} aria-hidden="true" />{t('Cancel')}</button>
          </div>
        </div>
      {:else}
        <button type="button" class="btn hi om-go" disabled={plan.tooBig} onclick={() => start()} data-om-keep><Download size={18} aria-hidden="true" />{t('Keep for offline')}</button>
      {/if}
    {/if}
    {#if msg}<p class={run?.state === 'done' ? 'rc-ok' : 'rc-note'} role="status" data-om-msg data-om-done={run?.state === 'done' ? '' : undefined}>{msg}</p>{/if}

    {#if strips.length}
      <div class="om-lab">{t('Kept on this phone')}</div>
      <ul class="rc-list" data-om-strips>
        {#each strips as s (s.id)}
          <li class="rc-row" data-om-strip={s.id}>
            <div class="om-main">
              <b>{s.name}</b>
              <small>
                {#if present.has(s.id)}
                  {t('{size} · {date} · {km} km each side', { size: fmtBytes(s.bytes), date: dateOf(s.createdAt), km: s.bufferKm })}
                {:else}
                  {t('Not on this phone (kept on another device or cleared by the browser).')}
                {/if}
              </small>
            </div>
            {#if !present.has(s.id) && s.ground}
              <button type="button" class="rc-icon" aria-label={t('Load «{name}» again', { name: s.name })} disabled={busy || theLine.length < 2} onclick={() => start(s.ground, s.bufferKm || 1, s.name, s.id)} data-om-again={s.id}><RotateCw size={18} aria-hidden="true" /></button>
            {/if}
            <button type="button" class="rc-icon" aria-label={t('Rename «{name}»', { name: s.name })} onclick={() => (renaming = s)} data-om-rename={s.id}><Pencil size={18} aria-hidden="true" /></button>
            <button type="button" class="rc-icon" aria-label={t('Delete «{name}»', { name: s.name })} onclick={() => del(s)} data-om-delete={s.id}><Trash2 size={18} aria-hidden="true" /></button>
          </li>
        {/each}
      </ul>
    {/if}

    {#if storage}
      <p class="rc-note" data-om-storage>{t('This browser uses {used} on this phone; {free} are still free.', { used: fmtBytes(storage.used), free: fmtBytes(storage.free) })}</p>
    {/if}
    {#if keep === 'not'}
      <p class="rc-note" data-om-keepstate>{t('The browser may clear kept maps when the phone runs low on space. On the first download the app asks it to keep them.')}</p>
    {/if}
    <p class="rc-note" data-om-terms>{t('swisstopo is free for fair use, so the app loads slowly and at most a narrow strip. OpenStreetMap and OpenTopoMap forbid downloads for offline use, so they only work with the internet.')}</p>
    {#if kindOfGround(ground) === 'vector'}<p class="rc-note">{t('Free map: © OpenFreeMap © OpenMapTiles © OpenStreetMap.')}</p>{/if}
  </div>
</RaceBox>

{#if renaming}
  {@const s = renaming}
  <RenameSheet kicker={t('Map strip')} title={t('Rename map strip')} value={s.name} onsave={(n) => rename(s, n)} onclose={() => (renaming = null)} />
{/if}

<style>
  .om {
    display: flex;
    flex-direction: column;
    gap: 8px;
    min-width: 0;
  }
  .om-lab {
    margin-top: 4px;
    color: var(--ink-2);
    font: 600 var(--fs-label)/1.3 var(--font-body);
  }
  .om-size {
    margin: 4px 0 0;
    font-size: var(--fs-body);
    overflow-wrap: break-word;
  }
  .om-sub {
    display: block;
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .om-run {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  .om-run progress {
    width: 100%;
    height: 12px;
    accent-color: var(--accent);
  }
  .om-go {
    align-self: flex-start;
    min-height: 44px;
  }
  .om-main {
    display: flex;
    flex: 1 1 auto;
    flex-direction: column;
    min-width: 0;
  }
  .om-main b {
    font-weight: 600;
    overflow-wrap: break-word;
  }
  .om-main small {
    color: var(--ink-3);
    font-size: var(--fs-small);
    overflow-wrap: break-word;
  }
</style>
