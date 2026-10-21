<script>
  /**
   * Paket Y «Meine Webcams» (Noah 20.10.2026 «unbedingt»): add any webcam (name + address), rename, order
   * with arrows and drag, mark one as home cam (small on Heute), delete with the app's question and Undo.
   * A picture address shows the live picture (fetched anew every 5 minutes), any other page opens.
   * The list lives only on this device (webcams.js); bergfex and the pass roads are links.
   * A cam can get a place (the place search): then it shows as a point on the live map.
   */
  import { liveQuery } from 'dexie';
  import { Plus, Pencil, Trash2, Home as HomeIcon, ExternalLink, MapPin, Search, X } from '@lucide/svelte';
  import { db } from '../db.js';
  import { WEBCAMS_KEY, BERGFEX, PASSES, camsOf, addCam, renameCam, removeCam, setHome, setPlace, moveCam, isImage, freshSrc, camLabel, cleanUrl } from './webcams.js';
  import SortArrows from '../ui/SortArrows.svelte';
  import SortGrip from '../ui/SortGrip.svelte';
  import { sortable } from '../ui/sortable.js';
  import RenameSheet from '../ui/RenameSheet.svelte';
  import { askDelete, deleteWithUndo } from '../ui/ask.js';
  import { searchPlace } from '../weather.js';
  import { t } from '../i18n.svelte.js';

  const camsQ = liveQuery(() => db.settings.get(WEBCAMS_KEY));
  const cams = $derived(camsOf($camsQ?.value));
  const save = (list) => db.settings.put({ key: WEBCAMS_KEY, value: list });

  let name = $state('');
  let url = $state('');
  let home = $state(false);
  let msg = $state('');
  let renaming = $state(null);
  let now = $state(Date.now());
  $effect(() => {
    const id = setInterval(() => (now = Date.now()), 60_000);
    return () => clearInterval(id);
  });

  async function add(e) {
    e.preventDefault();
    if (!cleanUrl(url)) {
      msg = t('This is not a web address. Copy it from the browser, e.g. https://…');
      return;
    }
    await save(addCam(cams, { name, url, home }));
    name = '';
    url = '';
    home = false;
    msg = '';
  }
  async function del(c) {
    const ok = await askDelete({ title: t('Delete «{name}»?', { name: camLabel(c) }), text: t('Only the entry goes; the webcam itself stays where it is.') });
    if (ok !== 'delete') return;
    const before = cams;
    await deleteWithUndo({ run: () => save(removeCam(cams, c.id)), undo: () => save(before), text: t('«{name}» deleted.', { name: camLabel(c) }), name: camLabel(c) });
  }
  const move = (from, to) => save(moveCam(cams, from, to));

  /* a place for the live map */
  let placing = $state(null); // the cam id
  let pq = $state('');
  let pfound = $state([]);
  let pmsg = $state('');
  async function findPlace(e) {
    e.preventDefault();
    pmsg = '';
    try {
      pfound = await searchPlace(pq);
      if (!pfound.length) pmsg = t('No place found.');
    } catch {
      pfound = [];
      pmsg = t('The place search did not answer. Try again later.');
    }
  }
  async function pick(c, p) {
    await save(setPlace(cams, c.id, { name: p.name, lat: p.lat, lon: p.lon }));
    placing = null;
    pq = '';
    pfound = [];
  }
  const openPlace = (c) => ((placing = placing === c.id ? null : c.id), (pq = ''), (pfound = []), (pmsg = ''));
</script>

<p class="rc-note">{t('Add any webcam with its address. A picture address (ending in .jpg or .png) shows the live picture here; other pages open with a tap. Your list stays on this device only.')}</p>
{#if cams.length}
  <ul class="wc-list" use:sortable={{ onmove: (from, to) => move(from, to) }} data-webcam-list>
    {#each cams as c, i (c.id)}
      <li class="wc-row" data-sort-id={c.id} data-webcam={c.id}>
        <div class="wc-top">
          <SortGrip name={camLabel(c)} onstep={(dir) => move(i, i + dir)} />
          <a class="wc-name" href={c.url} target="_blank" rel="noopener noreferrer"><b>{camLabel(c)}</b>{#if c.home}<small>{t('Home cam · on Today')}</small>{/if}<ExternalLink size={14} aria-hidden="true" /></a>
          <SortArrows name={camLabel(c)} {i} n={cams.length} onstep={(dir) => move(i, i + dir)} />
        </div>
        {#if c.place}<p class="wc-place" data-webcam-place><MapPin size={14} aria-hidden="true" />{t('On the live map: {place}', { place: c.place.name || t('your place') })}</p>{/if}
        {#if isImage(c.url)}<img class="wc-img" src={freshSrc(c.url, now)} alt={t('Webcam {name}', { name: camLabel(c) })} loading="lazy" referrerpolicy="no-referrer" />{/if}
        <div class="wc-acts">
          <button type="button" class="btn sm" aria-pressed={c.home} onclick={() => save(setHome(cams, c.id))} data-webcam-home><HomeIcon size={16} aria-hidden="true" />{c.home ? t('Home cam') : t('Make home cam')}</button>
          <button type="button" class="btn sm" onclick={() => (renaming = c)} data-webcam-rename><Pencil size={16} aria-hidden="true" />{t('Rename')}</button>
          <button type="button" class="btn sm" aria-expanded={placing === c.id} onclick={() => openPlace(c)} data-webcam-setplace><MapPin size={16} aria-hidden="true" />{c.place ? t('Change place') : t('Place on the map')}</button>
          {#if c.place}<button type="button" class="btn sm" onclick={() => save(setPlace(cams, c.id, null))} data-webcam-noplace><X size={16} aria-hidden="true" />{t('Off the map')}</button>{/if}
          <button type="button" class="btn sm" onclick={() => del(c)} data-webcam-delete><Trash2 size={16} aria-hidden="true" />{t('Delete')}</button>
        </div>
        {#if placing === c.id}
          <form class="wc-search" onsubmit={findPlace} data-webcam-placeform>
            <p class="rc-note">{t('Where is the webcam? Then it shows as a point on the live map, under «My points».')}</p>
            <div class="wc-srow">
              <input class="inp" type="search" bind:value={pq} placeholder={t('Place, e.g. a village or a pass')} aria-label={t('Place of the webcam')} data-webcam-pq />
              <button type="submit" class="btn sm" disabled={pq.trim().length < 2}><Search size={16} aria-hidden="true" />{t('Search')}</button>
            </div>
            {#if pfound.length}
              <ul class="wc-found">
                {#each pfound as p, k (k)}<li><button type="button" class="btn sm" onclick={() => pick(c, p)} data-webcam-found>{p.name}{#if p.detail}<small>{p.detail}</small>{/if}</button></li>{/each}
              </ul>
            {/if}
            {#if pmsg}<p class="rc-warn" role="alert">{pmsg}</p>{/if}
          </form>
        {/if}
      </li>
    {/each}
  </ul>
{:else}
  <p class="rc-empty" data-webcam-empty>{t('No webcams yet.')}</p>
{/if}

<form class="wc-add" onsubmit={add} data-webcam-add>
  <input class="inp" type="text" bind:value={name} placeholder={t('Name, e.g. Lake at home')} aria-label={t('Name')} maxlength="60" data-webcam-name />
  <input class="inp" type="url" bind:value={url} placeholder="https://…" aria-label={t('Address of the webcam')} data-webcam-url />
  <label class="wc-home"><input type="checkbox" bind:checked={home} />{t('Home cam (small on Today)')}</label>
  <button type="submit" class="btn" disabled={!url.trim()}><Plus size={18} aria-hidden="true" />{t('Add webcam')}</button>
  {#if msg}<p class="rc-warn" role="alert">{msg}</p>{/if}
</form>
<p class="rc-note">{t('A webcam behind a login opens in the browser, where you sign in yourself; the app never keeps a password.')}</p>
<div class="rc-acts">
  <a class="btn sm" href={BERGFEX} target="_blank" rel="noopener noreferrer">{t('Webcams on bergfex')}<ExternalLink size={14} aria-hidden="true" /></a>
  <a class="btn sm" href={PASSES} target="_blank" rel="noopener noreferrer">{t('Passes open or closed')}<ExternalLink size={14} aria-hidden="true" /></a>
</div>

{#if renaming}
  {@const c = renaming}
  <RenameSheet kicker={t('Webcam')} title={t('Rename webcam')} value={c.name} empty={t('Without a name the address shows.')} onsave={(n) => save(renameCam(cams, c.id, n))} onclose={() => (renaming = null)} />
{/if}

<style>
  .wc-list {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    gap: 10px;
  }
  .wc-row {
    display: grid;
    gap: 6px;
    padding: 8px;
    border: 1px solid var(--line);
    border-radius: 10px;
    background: var(--paper);
  }
  .wc-top {
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .wc-name {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 2px 8px;
    color: var(--ink);
    overflow-wrap: break-word;
  }
  .wc-name small {
    color: var(--ok);
  }
  .wc-img {
    width: 100%;
    max-height: 260px;
    object-fit: cover;
    border-radius: 8px;
    background: var(--paper-2);
  }
  .wc-acts {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }
  .wc-place {
    display: flex;
    align-items: center;
    gap: 6px;
    margin: 0;
    color: var(--ink-2);
    overflow-wrap: break-word;
  }
  .wc-search {
    display: grid;
    gap: 6px;
  }
  .wc-srow {
    display: flex;
    gap: 6px;
  }
  .wc-srow .inp {
    flex: 1;
    min-width: 0;
  }
  .wc-found {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    gap: 4px;
  }
  .wc-found .btn {
    width: 100%;
    justify-content: flex-start;
    flex-wrap: wrap;
    gap: 2px 8px;
    text-align: left;
  }
  .wc-found small {
    color: var(--ink-2);
  }
  .wc-add {
    display: grid;
    gap: 8px;
    margin-top: 6px;
  }
  .wc-home {
    display: flex;
    align-items: center;
    gap: 8px;
  }
</style>
