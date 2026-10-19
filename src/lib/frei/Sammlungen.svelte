<script>
  /**
   * Paket T «Freie Zeit» › Meine Sammlungen (#/me/frei/sammlungen) and one collection
   * (#/me/frei/sammlung/<id>). Start collections: favourite places, good moments, photo series,
   * recipes («4a»: ingredients to the shopping list), songs, photo stories, together, missions. A place
   * keeps a sound name and, since «4b wenn nicht zu gross», a recording of up to 30 s (SoundRec, no
   * library); «Recordings in the backup» can leave them out of backup files. Collections are groups: rename, sort (arrows and drag), delete (asks where the
   * entries go, «Without a collection» first), own ones added. Entries: add, change, delete with Undo.
   * Photos stay on the device and in the backup (made small first, photo.js).
   */
  import { Plus, Pencil, X, Search, MapPin, ShoppingCart, Share2, ChevronRight, Link2 } from '@lucide/svelte';
  import { liveQuery } from 'dexie';
  import Crumb from '../flow/kit/Crumb.svelte';
  import FreiSheet from './FreiSheet.svelte';
  import RenameSheet from '../ui/RenameSheet.svelte';
  import GroupDeleteSheet from '../ui/GroupDeleteSheet.svelte';
  import SortGrip from '../ui/SortGrip.svelte';
  import SortArrows from '../ui/SortArrows.svelte';
  import PhotoPick from '../ui/PhotoPick.svelte';
  import SoundRec from './SoundRec.svelte';
  import { soundsInBackup } from './sound.js';
  import { sortable } from '../ui/sortable.js';
  import { askDelete, deleteWithUndo, saveFailed } from '../ui/ask.js';
  import { offerDone } from '../ui/rename.svelte.js';
  import { db } from '../db.js';
  import { cfgQuery, changeCfg, restoreCfg, putRow, deleteRow, restoreRow, moveEntries, restoreRows } from '../freidb.js';
  import { collsOf, collName, fieldsOf, COLL_TYPES, newEntry, linesOf, entrySub, filterEntries, sortEntries, seriesOf, togetherText, collHref, collOfHash, freiPart, uid } from '../frei.js';
  import { shrinkImage } from '../photo.js';
  import { loadLists, changeList, restoreLists } from './shoplist.js';
  import { localDay } from '../localday.js';
  import { phone } from '../media.svelte.js';
  import { t, tn, locale } from '../i18n.svelte.js';

  let { hash = '' } = $props();
  const today = localDay();
  const q = cfgQuery();
  const cfg = $derived($q ?? {});
  const colls = $derived(collsOf(cfg));
  const shown = $derived(colls.filter((c) => !c.hidden));
  const rowsQ = liveQuery(() => db.frei.where('kind').equals('entry').toArray());
  const rows = $derived($rowsQ ?? []);
  const live = $derived(new Set(shown.map((c) => c.id)));
  const orphans = $derived(rows.filter((r) => !live.has(r.coll)));
  const countOf = (id) => rows.filter((r) => r.coll === id).length;

  const part = $derived(freiPart(hash));
  const openId = $derived(part === 'sammlung' ? collOfHash(hash) : '');
  const coll = $derived(openId === '-' ? { id: '-', type: 'free', name: t('Without a collection'), orphan: true } : colls.find((c) => c.id === openId) ?? null);
  const fields = $derived(fieldsOf(coll));
  const tagField = $derived(fields.find((f) => f.kind === 'tags'));
  let tag = $state('');
  let search = $state('');
  const entries = $derived(coll ? sortEntries(filterEntries(coll.orphan ? orphans : rows.filter((r) => r.coll === coll.id), { tag, q: search })) : []);
  const fmtDay = (d) => (d ? new Date(`${d}T12:00:00Z`).toLocaleDateString(locale(), { day: 'numeric', month: 'short', year: 'numeric' }) : '');

  /* ---------- collections: rename, sort, delete, add ---------- */
  let renaming = $state(null);
  let deleting = $state(null);
  let newColl = $state('');
  const saveColls = (list) => changeCfg((c) => ({ ...c, colls: list.map((x) => ({ id: x.id, type: x.type, name: x.name, own: x.own, hidden: x.hidden })) }));
  async function renameColl(name) {
    const c = renaming;
    const next = String(name ?? '').trim();
    await saveColls(colls.map((x) => (x.id === c.id ? { ...x, name: next && next !== t(COLL_TYPES[c.type].name) ? next : c.own ? c.name : null } : x)));
  }
  async function deleteColl(to) {
    const c = deleting;
    const before = await changeCfg((v) => ({ ...v, colls: collsOf(v).map((x) => ({ id: x.id, type: x.type, name: x.name, own: x.own, hidden: x.id === c.id ? true : x.hidden })) }));
    const moved = await moveEntries(c.id, to ?? '');
    offerDone(t('"{name}" deleted.', { name: collName(c, t) }), async () => {
      await restoreCfg(before);
      await restoreRows(moved);
    });
    if (openId === c.id) location.hash = '#/me/frei/sammlungen';
  }
  async function addColl(e) {
    e.preventDefault();
    const name = newColl.trim();
    if (!name) return;
    await saveColls([...colls, { id: uid('coll'), type: 'free', name, own: true, hidden: false }]);
    newColl = '';
  }
  const ids = () => shown.map((c) => c.id);
  function reorder(id, to) {
    const list = [...shown];
    const [c] = list.splice(list.findIndex((x) => x.id === id), 1);
    list.splice(to, 0, c);
    return saveColls([...list, ...colls.filter((x) => x.hidden)]);
  }
  const onmove = (from, to) => reorder(ids()[from], to);
  const step = (id, dir) => {
    const i = ids().indexOf(id);
    const to = Math.min(Math.max(i + dir, 0), ids().length - 1);
    return to === i ? null : reorder(id, to);
  };

  /* ---------- entries: add, change, delete ---------- */
  let edit = $state(null); // { id?, coll, title, data, photos, place }
  let photoBusy = $state(false);
  const openNew = () => (edit = { id: null, coll: coll.orphan ? shown[0]?.id ?? '' : coll.id, title: '', data: {}, photos: [], place: null, sound: null });
  const openEdit = (e) => (edit = JSON.parse(JSON.stringify({ id: e.id, coll: e.coll, title: e.title, data: { ...e.data, ...Object.fromEntries(fields.filter((f) => f.kind === 'lines').map((f) => [f.key, (e.data?.[f.key] ?? []).join('\n')])) }, photos: e.photos ?? [], place: e.place ?? null, sound: e.sound ?? null, at: e.at, day: e.day })));
  async function saveEdit() {
    if (!edit.title.trim()) return t('Please give it a name.');
    const data = { ...edit.data };
    for (const f of fieldsOf(colls.find((c) => c.id === edit.coll) ?? coll)) if (f.kind === 'lines') data[f.key] = linesOf(data[f.key] ?? '');
    const rec = newEntry(edit.coll, { title: edit.title, data, photos: edit.photos, place: edit.place, sound: edit.sound }, { id: edit.id ?? undefined, day: edit.day ?? today });
    try {
      await putRow(edit.id ? { ...rec, at: edit.at } : rec);
    } catch (err) {
      return saveFailed(err);
    }
    offerDone(t('Saved.'));
  }
  const setSoundsBackup = (on) => changeCfg((c) => ({ ...c, soundsBackup: on }));
  async function removeEntry() {
    const e = edit;
    const answer = await askDelete({ title: t('Delete «{name}»?', { name: e.title }), text: t('The entry and its photos go. You can undo this for a few seconds.') });
    if (answer !== 'delete') return false;
    await deleteWithUndo({ run: () => deleteRow(e.id), undo: (rec) => restoreRow(rec), text: t('"{name}" deleted.', { name: e.title }), name: e.title });
  }
  async function addPhoto(file) {
    photoBusy = true;
    try {
      const src = await shrinkImage(file);
      edit.photos = [...edit.photos, { src, day: today }];
    } catch (err) {
      offerDone(err.message);
    } finally {
      photoBusy = false;
    }
  }
  const dropPhoto = (n) => (edit.photos = edit.photos.filter((_, i) => i !== n));
  const toggleTag = (key, x) => {
    const cur = new Set(edit.data[key] ?? []);
    cur.has(x) ? cur.delete(x) : cur.add(x);
    edit.data = { ...edit.data, [key]: [...cur] };
  };
  let placeMsg = $state('');
  function here() {
    placeMsg = t('Looking for your position …');
    navigator.geolocation?.getCurrentPosition(
      (p) => {
        edit.place = { ...(edit.place ?? {}), lat: Math.round(p.coords.latitude * 1e5) / 1e5, lon: Math.round(p.coords.longitude * 1e5) / 1e5 };
        placeMsg = '';
      },
      () => (placeMsg = t('The position is not available. Type the name of the place instead.')),
      { enableHighAccuracy: true, timeout: 15000 },
    );
  }
  const mapUrl = (p) => `https://www.google.com/maps/search/?api=1&query=${p.lat},${p.lon}`;

  /* ---------- actions of a collection ---------- */
  async function toShopping(e) {
    const items = e.data?.ingredients ?? [];
    if (!items.length) return offerDone(t('This recipe has no ingredients yet.'));
    const before = await loadLists();
    const list = await changeList(items, t('Shopping list'));
    offerDone(tn(items.length, '{n} ingredient is on your shopping list.', '{n} ingredients are on your shopping list.'), () => restoreLists(before));
    return list;
  }
  async function share(text) {
    try {
      if (navigator.share) await navigator.share({ text });
      else {
        await navigator.clipboard.writeText(text);
        offerDone(t('Copied. Paste it into a message.'));
      }
    } catch {
      /* closed */
    }
  }
  let compare = $state({});
  const thumb = (e) => e.photos?.[e.photos.length - 1]?.src ?? null;
</script>

{#if part === 'sammlungen' || !coll}
  <div class="fz" data-page="sammlungen">
    <Crumb path={[{ href: '#/me', label: t('Me|place') }, { href: '#/me/frei', label: t('Free time') }]} here={t('My collections')} />
    <h1 class="fz-h1" tabindex="-1" data-page-title>{t('My collections')}</h1>
    <p class="fz-intro">{t('Keep what is worth keeping: places, moments, photo series, recipes, songs. Rename, sort or delete the collections, or start your own.')}</p>
    <ul class="fz-box fz-list" use:sortable={{ onmove }} aria-label={t('My collections')}>
      {#each shown as c, n (c.id)}
        <li class="fz-row" data-sort-id={c.id} data-coll={c.id}>
          <SortGrip name={collName(c, t)} onstep={(dir) => step(c.id, dir)} />
          <a class="fz-row-main" href={collHref(c.id)}><b>{collName(c, t)}</b><small>{tn(countOf(c.id), '{n} entry', '{n} entries')} · {t(COLL_TYPES[c.type].hint)}</small></a>
          {#if !phone.matches}<SortArrows name={collName(c, t)} i={n} n={shown.length} onstep={(dir) => step(c.id, dir)} />{/if}
          <button type="button" class="fz-icon" aria-label={t('Rename {name}', { name: collName(c, t) })} onclick={() => (renaming = c)} data-coll-rename><Pencil size={18} aria-hidden="true" /></button>
          <button type="button" class="fz-icon" aria-label={t('Delete {name}', { name: collName(c, t) })} onclick={() => (deleting = c)} data-coll-delete><X size={18} aria-hidden="true" /></button>
        </li>
      {/each}
      {#if orphans.length}
        <li class="fz-row"><a class="fz-row-main" href={collHref('-')}><b>{t('Without a collection')}</b><small>{tn(orphans.length, '{n} entry', '{n} entries')}</small></a><ChevronRight size={18} aria-hidden="true" /></li>
      {/if}
    </ul>
    <form class="fz-inline" onsubmit={addColl}>
      <input class="inp" maxlength="40" bind:value={newColl} aria-label={t('New collection')} placeholder={t('New collection, e.g. Books to read')} data-new-coll />
      <button type="submit" class="btn"><Plus size={16} aria-hidden="true" />{t('Add')}</button>
    </form>
  </div>
{:else}
  <div class="fz" data-page="sammlung" data-coll-open={coll.id}>
    <Crumb path={[{ href: '#/me/frei', label: t('Free time') }, { href: '#/me/frei/sammlungen', label: t('My collections') }]} here={collName(coll, t)} />
    <h1 class="fz-h1" tabindex="-1" data-page-title>{collName(coll, t)}</h1>
    <p class="fz-intro">{t(COLL_TYPES[coll.type].hint)}</p>
    <div class="fz-acts">
      <button type="button" class="btn hi" onclick={openNew} data-new-entry><Plus size={16} aria-hidden="true" />{t('New entry')}</button>
    </div>
    {#if tagField}
      <div class="fz-chips" role="group" aria-label={t(tagField.label)}>
        <button type="button" class="fz-chip" aria-pressed={!tag} onclick={() => (tag = '')}>{t('All')}</button>
        {#each tagField.options as x (x)}<button type="button" class="fz-chip" aria-pressed={tag === x} onclick={() => (tag = tag === x ? '' : x)} data-tag={x}>{t(x)}</button>{/each}
      </div>
    {/if}
    {#if rows.filter((r) => r.coll === coll.id).length > 6}
      <label class="fz-inline fzc-search"><Search size={18} aria-hidden="true" /><input class="inp" type="search" bind:value={search} placeholder={t('Search')} aria-label={t('Search')} /></label>
    {/if}
    {#if fieldsOf(coll).some((f) => f.kind === 'sound')}
      <label class="fz-row fzc-sb"><input type="checkbox" checked={soundsInBackup(cfg)} onchange={(ev) => setSoundsBackup(ev.currentTarget.checked)} data-sounds-backup /><span>{t('Recordings in the backup')}<small class="fz-note">{t('Off: backup files stay small, but the recordings are only on this device. A backup loaded later has no recordings.')}</small></span></label>
    {/if}
    {#if !entries.length}<p class="fz-empty">{tag || search ? t('Nothing fits this filter.') : t('Nothing here yet. Your first entry is one tap away.')}</p>{/if}
    <div class="fz-grid">
      {#each entries as e (e.id)}
        {@const series = coll.type === 'series' ? seriesOf(e.photos) : []}
        <article class="fz-box" data-entry={e.id}>
          <div class="fzc-head">
            {#if thumb(e) && coll.type !== 'series'}<img class="fzc-thumb" src={thumb(e)} alt="" />{/if}
            <button type="button" class="fz-row-main" onclick={() => openEdit(e)} data-entry-open>
              <b>{e.title}</b>
              {#if entrySub(e, coll)}<small>{entrySub(e, coll)}</small>{/if}
              <small>{fmtDay(e.day)}</small>
            </button>
            <button type="button" class="fz-icon" aria-label={t('Change {name}', { name: e.title })} onclick={() => openEdit(e)}><Pencil size={18} aria-hidden="true" /></button>
          </div>
          {#if series.length}
            {@const n = Math.min(compare[e.id] ?? series.length - 1, series.length - 1)}
            <figure class="fzc-series">
              <img src={series[n].src} alt={t('{name}, photo {i} of {n}', { name: e.title, i: n + 1, n: series.length })} />
              <figcaption class="fz-note">{fmtDay(series[n].day)}</figcaption>
            </figure>
            {#if series.length > 1}
              <label class="fz-lab">{t('Slide through the photos')}<input type="range" min="0" max={series.length - 1} value={n} oninput={(ev) => (compare = { ...compare, [e.id]: Number(ev.currentTarget.value) })} data-series-slider /></label>
            {/if}
          {/if}
          {#if e.sound?.src}<audio class="fzc-audio" controls preload="none" src={e.sound.src} aria-label={t('Sound of {name}', { name: e.title })}></audio>{/if}
          <div class="fz-acts">
            {#if e.place?.lat}<a class="btn sm" href={mapUrl(e.place)} target="_blank" rel="noopener"><MapPin size={16} aria-hidden="true" />{t('On the map')}</a>{/if}
            {#if e.data?.link}<a class="btn sm" href={e.data.link} target="_blank" rel="noopener"><Link2 size={16} aria-hidden="true" />{t('Open the link')}</a>{/if}
            {#if coll.type === 'recipes'}<button type="button" class="btn sm" onclick={() => toShopping(e)} data-to-shopping><ShoppingCart size={16} aria-hidden="true" />{t('Ingredients to the shopping list')}</button>{/if}
            {#if coll.type === 'together'}<button type="button" class="btn sm" onclick={() => share(togetherText(e, t))}><Share2 size={16} aria-hidden="true" />{t('Share')}</button>{/if}
          </div>
        </article>
      {/each}
    </div>
  </div>
{/if}

{#if edit}
  {@const ecoll = colls.find((c) => c.id === edit.coll) ?? coll}
  <FreiSheet title={edit.id ? t('Change entry') : t('New entry')} sub={collName(ecoll, t)} onsave={saveEdit} ondelete={edit.id ? removeEntry : null} onclose={() => (edit = null)}>
    {#each fieldsOf(ecoll) as f (f.key)}
      {#if f.kind === 'title'}
        <label class="fz-lab">{t(f.label)}<input class="inp" maxlength="120" bind:value={edit.title} data-field="title" /></label>
      {:else if f.kind === 'text' || f.kind === 'link'}
        <label class="fz-lab">{t(f.label)}<input class="inp" type={f.kind === 'link' ? 'url' : 'text'} maxlength={f.kind === 'link' ? 600 : 200} value={edit.data[f.key] ?? ''} oninput={(ev) => (edit.data = { ...edit.data, [f.key]: ev.currentTarget.value })} data-field={f.key} /></label>
      {:else if f.kind === 'long' || f.kind === 'lines'}
        <label class="fz-lab">{t(f.label)}<textarea class="inp" rows="4" maxlength="4000" value={edit.data[f.key] ?? ''} oninput={(ev) => (edit.data = { ...edit.data, [f.key]: ev.currentTarget.value })} data-field={f.key}></textarea></label>
      {:else if f.kind === 'tags'}
        <div class="fz-lab"><span>{t(f.label)}</span>
          <div class="fz-chips">{#each f.options as x (x)}<button type="button" class="fz-chip" aria-pressed={(edit.data[f.key] ?? []).includes(x)} onclick={() => toggleTag(f.key, x)} data-tag-edit={x}>{t(x)}</button>{/each}</div>
        </div>
      {:else if f.kind === 'place'}
        <div class="fz-lab"><span>{t(f.label)}</span>
          <div class="fz-acts">
            <button type="button" class="btn sm" onclick={here} data-here><MapPin size={16} aria-hidden="true" />{t('Use where I am')}</button>
            {#if edit.place?.lat}<span class="fz-note">{edit.place.lat}, {edit.place.lon}</span><button type="button" class="btn sm" onclick={() => (edit.place = null)}>{t('Remove the position')}</button>{/if}
          </div>
          {#if placeMsg}<p class="fz-note" role="status">{placeMsg}</p>{/if}
        </div>
      {:else if f.kind === 'sound'}
        <div class="fz-lab"><span>{t(f.label)}</span><SoundRec bind:value={edit.sound} /></div>
      {:else if f.kind === 'photos'}
        <div class="fz-lab"><span>{t(f.label)}</span>
          {#if f.series && edit.photos.length}
            <p class="fz-note">{t('Line up the next photo with the last one, from the same spot:')}</p>
            <img class="fzc-ghost" src={edit.photos[edit.photos.length - 1].src} alt={t('The last photo')} />
          {/if}
          {#if edit.photos.length}
            <div class="fz-thumbs">
              {#each edit.photos as p, n (p.src.slice(-40) + n)}
                <span class="fzc-ph"><img src={p.src} alt="" /><button type="button" class="fzc-phx" aria-label={t('Remove photo {i}', { i: n + 1 })} onclick={() => dropPhoto(n)}><X size={14} aria-hidden="true" /></button></span>
              {/each}
            </div>
          {/if}
          <PhotoPick onfile={addPhoto} busy={photoBusy} has={!!edit.photos.length} again="Add a photo" />
        </div>
      {/if}
    {/each}
    {#if !coll?.orphan || edit.id}
      <label class="fz-lab">{t('Collection')}
        <select class="inp" bind:value={edit.coll}>{#each shown as c (c.id)}<option value={c.id}>{collName(c, t)}</option>{/each}</select>
      </label>
    {/if}
  </FreiSheet>
{/if}
{#if renaming}
  <RenameSheet kicker={t('Collection')} title={t('Rename collection')} value={collName(renaming, t)} hint={t('Empty brings back the original name.')} empty={renaming.own ? '' : t('original name')} onsave={renameColl} onclose={() => (renaming = null)} />
{/if}
{#if deleting}
  <GroupDeleteSheet
    title={t('Delete collection «{name}»?', { name: collName(deleting, t) })}
    count={countOf(deleting.id)}
    what={(n) => tn(n, '{n} entry', '{n} entries')}
    none={t('Without a collection')}
    noneHint={t('They stay and show under «Without a collection».')}
    targets={shown.filter((c) => c.id !== deleting.id).map((c) => ({ id: c.id, name: collName(c, t) }))}
    onconfirm={deleteColl}
    onclose={() => (deleting = null)}
  />
{/if}

<style>
  .fzc-head {
    display: flex;
    align-items: flex-start;
    gap: 10px;
  }
  .fzc-thumb {
    flex: none;
    width: 64px;
    height: 64px;
    border-radius: 10px;
    object-fit: cover;
  }
  .fzc-series {
    margin: 0;
  }
  .fzc-series img {
    display: block;
    width: 100%;
    max-height: 320px;
    border-radius: 10px;
    object-fit: cover;
  }
  .fzc-ghost {
    width: 100%;
    max-height: 200px;
    border-radius: 10px;
    object-fit: cover;
    opacity: 0.45;
  }
  .fzc-ph {
    position: relative;
  }
  .fzc-phx {
    position: absolute;
    top: 2px;
    right: 2px;
    display: grid;
    place-items: center;
    width: 28px;
    height: 28px;
    padding: 0;
    border: 0;
    border-radius: 999px;
    background: var(--paper);
    color: var(--ink);
    cursor: pointer;
  }
  .fzc-search {
    align-items: center;
    color: var(--ink-3);
  }
  .fzc-audio {
    width: 100%;
    max-width: 360px;
  }
  .fzc-sb span {
    display: flex;
    flex-direction: column;
  }
</style>
