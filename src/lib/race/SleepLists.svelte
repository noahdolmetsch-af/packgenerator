<script>
  /**
   * Paket U4 · 1141 Schlafplätze anderer Fahrer: load a list of the organiser or of other riders (GPX
   * waypoints, KML/KMZ, CSV; a file or a link) as your own places to sleep. Each list keeps its name (src)
   * and is a layer of its own in «Where do I sleep tonight?» («From a list»); your own spots of earlier
   * races show too. Everything stays on this device (own points, ownpoints.js); nothing is shared. A link
   * is read straight from the browser: a site that does not allow it gets a clear message (download the
   * file and choose it here). Ride with GPS links go through the app's own server like elsewhere.
   */
  import { Upload, Link, Trash2 } from '@lucide/svelte';
  import RaceBox from './RaceBox.svelte';
  import { ownQuery, saveOwn, srcOf, sourcesOf, removeSource, renameSource } from '../map/ownpoints.js';
  import { placesFromFile, importPoints, kmzText, fileKind, MAX_FILE_MB } from '../map/placefiles.js';
  import { parseRwgpsLink, fetchRwgpsGpx } from '../sources/rwgps.js';
  import { ownSpots } from './sleep.js';
  import { askDelete, deleteWithUndo } from '../ui/ask.js';
  import { t, num } from '../i18n.svelte.js';

  let { ctx } = $props();
  const ownQ = ownQuery();
  const own = $derived($ownQ ?? []);
  const near = $derived(ownSpots(own, ctx.pts));
  const lists = $derived(sourcesOf(own.filter((p) => p.kind === 'sleep' && p.src)).map((s) => ({ ...s, near: near.filter((p) => p.src === s.src).length })));
  const mine = $derived(near.filter((p) => p.spot === 'own').length);
  let allSleep = $state(true);
  let link = $state('');
  let busy = $state(false);
  let msg = $state(null);
  let input = $state();

  async function take(name, text) {
    const r = placesFromFile(name, text);
    if (r.error) {
      msg = { bad: true, text: r.error === 'unknown' ? t('This kind of file is not known. Use GPX, KML, KMZ or CSV.|poi') : r.error === 'empty' ? t('No places with a position found in the file.|poi') : t('The file could not be read.|poi') };
      return;
    }
    const src = srcOf(name.replace(/\.(gpx|kml|kmz|csv|txt|tsv)$/i, '')) || srcOf(name);
    const places = allSleep ? r.places.map((p) => ({ ...p, kind: 'sleep' })) : r.places;
    let old = 0;
    await saveOwn((list) => {
      old = list.filter((p) => p.src === src).length;
      return [...list.filter((p) => p.src !== src), ...importPoints(places, src)];
    });
    const sleep = places.filter((p) => p.kind === 'sleep').length;
    msg = { bad: false, text: [t('Loaded from «{name}»: {n} places.|poi', { name: src, n: num(places.length) }), old ? t('The {n} from before are replaced.|poi', { n: num(old) }) : '', allSleep ? '' : t('{n} of them are places to sleep.', { n: num(sleep) })].filter(Boolean).join(' ') };
  }
  async function fromFile(e) {
    const f = e.currentTarget.files?.[0];
    if (!f) return;
    busy = true;
    msg = null;
    try {
      if (f.size > MAX_FILE_MB * 1024 * 1024) return (msg = { bad: true, text: t('The file is too big (at most {mb} MB).|poi', { mb: MAX_FILE_MB }) });
      if (fileKind(f.name) === 'kmz') {
        const text = await kmzText(await f.arrayBuffer());
        if (!text) return (msg = { bad: true, text: t('No KML file found inside the KMZ.|poi') });
        await take(f.name.replace(/\.kmz$/i, '.kml'), text);
      } else await take(f.name, await f.text());
    } catch {
      msg = { bad: true, text: t('The file could not be read.|poi') };
    } finally {
      busy = false;
      if (input) input.value = '';
    }
  }
  async function fromLink(e) {
    e.preventDefault();
    const url = link.trim();
    if (!url) return;
    busy = true;
    msg = null;
    try {
      if (parseRwgpsLink(url)) {
        const r = await fetchRwgpsGpx(url);
        await take(r.file, r.gpx);
      } else {
        if (!/^https:\/\//i.test(url)) throw new Error(t('Use a link that starts with https://.'));
        let res;
        try {
          res = await fetch(url);
        } catch {
          throw new Error(navigator.onLine === false ? t('You are offline. Try again with internet.') : t('This site does not let the app read the file. Download the file there and choose it here.'));
        }
        if (!res.ok) throw new Error(t('The link answered with an error. Check it, or download the file and choose it here.'));
        const buf = await res.arrayBuffer();
        const name = decodeURIComponent(new URL(url).pathname.split('/').filter(Boolean).at(-1) || new URL(url).hostname);
        const head = new Uint8Array(buf.slice(0, 2));
        const text = head[0] === 0x50 && head[1] === 0x4b ? await kmzText(buf) : new TextDecoder().decode(buf);
        await take(/\.(gpx|kml|csv)$/i.test(name) ? name : `${name}.${/<kml[\s>]/i.test(text) ? 'kml' : /<gpx[\s>]/i.test(text) ? 'gpx' : 'csv'}`, text);
      }
      link = '';
    } catch (err) {
      msg = { bad: true, text: err?.message || t('The file could not be read.|poi') };
    } finally {
      busy = false;
    }
  }
  async function drop(s) {
    if ((await askDelete({ title: t('Delete «{name}»?', { name: s.src }), text: t('Its {n} places are removed from all maps.', { n: num(s.n) }) })) !== 'delete') return;
    let before = null;
    await deleteWithUndo({
      run: () => saveOwn((list) => ((before = list), removeSource(list, s.src))),
      undo: () => before && saveOwn(() => before),
      text: t('«{name}» deleted.', { name: s.src }),
      name: s.src,
    });
  }
</script>

<RaceBox id="sleep-lists" title={t('Places to sleep from lists')} what="Loads a list of places to sleep from the organiser or other riders (GPX waypoints, KML, KMZ or CSV; a file or a link) as your own places. Your own spots of earlier races show too." why="Riders before you know the good bus stops and barns; with their list you find them at night." from="The file or link you choose. Everything stays on this device; nothing is shared.">
  <label class="rc-inline"><input type="checkbox" bind:checked={allSleep} data-sleep-all />{t('All places in the list are places to sleep')}</label>
  <div class="rc-acts">
    <label class="btn"><Upload size={18} aria-hidden="true" />{busy ? t('Loading…') : t('Choose a file')}<input bind:this={input} hidden type="file" accept=".gpx,.kml,.kmz,.csv,.txt,application/gpx+xml,application/vnd.google-earth.kml+xml" onchange={fromFile} disabled={busy} data-sleep-file /></label>
  </div>
  <form class="rc-inline sll-link" onsubmit={fromLink}>
    <input class="inp" type="url" inputmode="url" placeholder="https://…" bind:value={link} aria-label={t('Link to a list')} data-sleep-link />
    <button type="submit" class="btn" disabled={busy || !link.trim()} data-sleep-link-go><Link size={18} aria-hidden="true" />{t('Load')}</button>
  </form>
  {#if msg}<p class={msg.bad ? 'rc-warn' : 'rc-ok'} role="status" data-sleep-list-msg>{msg.text}</p>{/if}
  {#if lists.length}
    <ul class="rc-list">
      {#each lists as s (s.src)}
        <li class="rc-row" data-sleep-src>
          <span class="rc-row-main"><input class="inp" value={s.src} aria-label={t('Name of the list')} onchange={(e) => { const to = e.currentTarget.value; if (srcOf(to) && srcOf(to) !== s.src) saveOwn((list) => renameSource(list, s.src, to)); }} data-sleep-src-name /><small>{t('{n} places, {m} of them near this route', { n: num(s.n), m: num(s.near) })}</small></span>
          <button type="button" class="rc-icon" aria-label={t('Delete «{name}»?', { name: s.src })} onclick={() => drop(s)}><Trash2 size={18} aria-hidden="true" /></button>
        </li>
      {/each}
    </ul>
    <p class="rc-note">{t('Single places of a list: on the map under «My own places».')}</p>
  {/if}
  <p class="rc-note" data-sleep-mine>{t('Your own places to sleep near this route: {n}', { n: num(mine) })}</p>
</RaceBox>

<style>
  .sll-link .inp {
    flex: 1 1 12em;
    min-width: 0;
  }
</style>
