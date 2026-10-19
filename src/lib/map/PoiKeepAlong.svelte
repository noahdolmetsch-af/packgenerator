<script>
  /**
   * «Orte auf der Karte» 1a (Noah 19.10.2026 20:26): when a map strip is kept for offline, the places of
   * every kind along the route are kept too (Overpass in chunks with a pause, poisearch.js keepAlong),
   * so «Along the route» works offline. One line in «Map offline»: how many are kept.
   *
   * Props: line ([[lat, lon]]), tripId, run (a number: each new value starts a keep, 0 = only show).
   */
  import { t, tn, num } from '../i18n.svelte.js';
  import { keepAlong, keptAlong } from './poisearch.js';
  import { placeStore } from './poiprefs.js';

  let { line = [], tripId = null, run = 0, fetcher = undefined } = $props();

  let count = $state(0);
  let state = $state('idle'); // idle | loading | done | failed
  let prog = $state(null);

  $effect(() => {
    const l = $state.snapshot(line);
    const id = tripId;
    keptAlong(placeStore, id, l).then((n) => (count = n));
  });

  let last = 0;
  $effect(() => {
    const n = run;
    if (!n || n === last || !Array.isArray(line) || line.length < 2) return;
    last = n;
    keep();
  });

  async function keep() {
    if (state === 'loading') return;
    if (typeof navigator !== 'undefined' && navigator.onLine === false) return;
    state = 'loading';
    prog = null;
    const r = await keepAlong($state.snapshot(line), tripId, { store: placeStore, onProgress: (p) => (prog = p), ...(fetcher ? { fetcher } : {}) });
    if (r.count || (r.chunks && r.failed < r.chunks)) {
      count = r.count;
      state = r.failed ? 'failed' : 'done';
    } else state = 'failed';
  }
</script>

{#if state === 'loading'}
  <p class="rc-note" aria-live="polite" data-poi-keep="loading">
    {prog ? t('Keeping places along the route: part {done} of {total} …|poi', { done: prog.done, total: prog.total }) : t('Keeping places along the route …|poi')}
  </p>
{:else if count}
  <p class="rc-note" data-poi-keep="done">
    {tn(count, 'Places along the route: {n} kept', 'Places along the route: {n} kept', { n: num(count) })}{#if state === 'failed'}{' · '}{t('some parts could not be loaded|poi')}{/if}
  </p>
{:else if state === 'failed'}
  <p class="rc-note" data-poi-keep="failed">{t('The places along the route could not be kept now (OpenStreetMap busy). Keep the strip again later.|poi')}</p>
{/if}
