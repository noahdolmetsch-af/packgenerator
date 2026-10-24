<script>
  /**
   * Paket P8 «Fotoalbum» (Noah 21.10.2026 «7a», mockups design/fotoalbum): Ich › Fotoalbum (#/me/album). All photos of
   * the app by month (and their places) or by place; chips Alle / Album / Velo / Tour. Your own album photos are added
   * here (several at once, made small), changed and deleted in the photo window; bike and trip photos come by themselves.
   * At the end: «Ein Foto auf Heute» (the album's switch, as under Was mir gut tut) and how much space the photos take.
   */
  import { liveQuery } from 'dexie';
  import { Plus, Images, MapPin, CalendarDays } from '@lucide/svelte';
  import { db } from '../lib/db.js';
  import { KINDS, allPhotos, countKinds, ofKind, byMonth, byPlace, placesOf, newAlbumPhoto, albumPatch, sizeOf } from '../lib/album/fotos.js';
  import { ALBUM_KEY, albumCfgOf } from '../lib/wohl.js';
  import { shrinkImage } from '../lib/photo.js';
  import { localDay } from '../lib/localday.js';
  import { askDelete, deleteWithUndo, saveFailed } from '../lib/ui/ask.js';
  import { offerDone } from '../lib/ui/rename.svelte.js';
  import VeloHead from '../lib/bikes/VeloHead.svelte';
  import Empty from '../lib/ui/Empty.svelte';
  import PhotoSheet from '../lib/album/PhotoSheet.svelte';
  import { t, tn, locale } from '../lib/i18n.svelte.js';
  import '../lib/ich/ich.css';

  const q = liveQuery(async () => {
    const [photos, notes, trips, bikes, cfg] = await Promise.all([db.photos.toArray(), db.notes.toArray(), db.trips.toArray(), db.bikes.toArray(), db.settings.get(ALBUM_KEY)]);
    return { list: allPhotos({ photos, notes, trips, bikes }), cfg: albumCfgOf(cfg?.value) };
  });
  const list = $derived($q?.list ?? []);
  const cfg = $derived($q?.cfg ?? { greet: true });
  const counts = $derived(countKinds(list));

  let kind = $state('all');
  let view = $state('month');
  const shown = $derived(ofKind(list, kind));
  const groups = $derived(view === 'month' ? byMonth(shown) : byPlace(shown));
  const flat = $derived(groups.flatMap((g) => g.photos));
  const monthName = (key) => (key ? new Date(`${key}-15T12:00:00`).toLocaleDateString(locale(), { month: 'long', year: 'numeric' }) : t('Without a date'));
  const mb = (n) => (n / 1048576).toLocaleString(locale(), { maximumFractionDigits: 1 });
  const TAG = { album: 'Album|photos', bike: 'Bike|photos', tour: 'Trip|photos' };

  let openId = $state(null);
  const openIdx = $derived(flat.findIndex((x) => x.id === openId));
  const open = $derived(openIdx >= 0 ? flat[openIdx] : null);

  let busy = $state(0);
  let msg = $state('');
  let fileEl;
  async function addFiles(e) {
    const files = [...(e.currentTarget.files ?? [])];
    e.currentTarget.value = '';
    msg = '';
    const ids = [];
    for (const file of files) {
      busy = files.length - ids.length;
      try {
        const data = await shrinkImage(file, 1200, 0.8);
        const rec = newAlbumPhoto(data, { day: localDay() });
        await db.photos.put(rec);
        ids.push(rec.id);
      } catch (err) {
        msg = err.message || t('This photo could not be read.');
      }
    }
    busy = 0;
    if (ids.length) {
      kind = kind === 'all' || kind === 'album' ? kind : 'album';
      offerDone(tn(ids.length, '{n} photo added to the album.', '{n} photos added to the album.'), () => db.photos.bulkDelete(ids));
    }
  }
  async function saveOpen(f) {
    try {
      await db.photos.update(open.id, albumPatch(f));
    } catch (err) {
      saveFailed(err);
    }
  }
  async function deleteOpen() {
    const p = open;
    const name = p.caption || p.place || t('Photo');
    if ((await askDelete({ title: t('Delete the photo «{name}»?', { name }), text: t('Only this photo goes.') })) !== 'delete') return;
    openId = null;
    const rec = await db.photos.get(p.id);
    await deleteWithUndo({ run: () => db.photos.delete(p.id), undo: () => rec && db.photos.put(rec), text: t('Photo «{name}» deleted.', { name }), name });
  }
  const step = (d) => {
    const n = flat[openIdx + d];
    if (n) openId = n.id;
  };
  const setGreet = (on) => db.settings.put({ key: ALBUM_KEY, value: { greet: on } }).catch(saveFailed);
</script>

<div class="ich-page fa" data-page="album">
  <VeloHead crumbs={[{ label: t('Me|place'), href: '#/me' }]} title={t('Photo album')} sub={$q ? tn(counts.all, 'All photos of the app · {n} photo', 'All photos of the app · {n} photos') : ''} />

  <div class="fa-bar">
    <div class="fa-chips" role="group" aria-label={t('Show')}>
      {#each KINDS as k (k.key)}
        <button type="button" class="fa-chip" aria-pressed={kind === k.key} onclick={() => (kind = k.key)} data-album-kind={k.key}>{t(k.name)} <span class="num">{counts[k.key]}</span></button>
      {/each}
    </div>
    <label class="btn hi fa-add" data-album-add><Plus size={16} aria-hidden="true" />{t('Add photos')}<input bind:this={fileEl} type="file" accept="image/*" multiple onchange={addFiles} hidden data-album-file /></label>
  </div>
  <div class="fa-bar fa-bar2">
    <div class="fa-chips" role="group" aria-label={t('Sort|photos')}>
      <button type="button" class="fa-chip" aria-pressed={view === 'month'} onclick={() => (view = 'month')} data-album-view="month"><CalendarDays size={16} aria-hidden="true" />{t('By month')}</button>
      <button type="button" class="fa-chip" aria-pressed={view === 'place'} onclick={() => (view = 'place')} data-album-view="place"><MapPin size={16} aria-hidden="true" />{t('By place')}</button>
    </div>
    <p class="fa-hint">{t('Bike and trip photos come by themselves; change or delete them at the bike or the trip.')}</p>
  </div>
  {#if busy}<p class="fa-busy" role="status">{tn(busy, 'Making {n} photo small …', 'Making {n} photos small …')}</p>{/if}
  {#if msg}<p class="err" role="alert">{msg}</p>{/if}

  {#if $q && !shown.length}
    <Empty icon={Images} title={kind === 'all' ? t('No photos yet') : t('No photos here')} text={t('Add your own photos: a view, a rest, a good day. Photos of bikes and notes on trips come by themselves.')} action={{ label: t('Add photos'), onclick: () => fileEl?.click() }} />
  {:else}
    {#each groups as g (g.key)}
      <section class="fa-group" aria-labelledby="fa-g-{g.key || 'none'}" data-album-group={g.key}>
        <h2 id="fa-g-{g.key || 'none'}" class="fa-gh">
          {#if view === 'month'}{monthName(g.key)}{:else}{g.key || t('Without a place')}{/if}
          <small class="num">{tn(g.photos.length, '{n} photo', '{n} photos')}{#if view === 'month' && g.places.length}{' · '}{g.places.slice(0, 3).join(', ')}{#if g.places.length > 3}{' …'}{/if}{/if}</small>
        </h2>
        <ul class="fa-grid">
          {#each g.photos as p (p.id)}
            <li>
              <button type="button" class="fa-tile" onclick={() => (openId = p.id)} aria-label={t('Open the photo {name}', { name: p.caption || p.place || p.day })} data-album-photo={p.kind}>
                <img src={p.src} alt="" loading="lazy" />
                <span class="fa-tag">{t(TAG[p.kind])}</span>
                {#if p.kind === 'album' && !p.greet}<span class="fa-off">{t('not on Today')}</span>{/if}
                <span class="fa-cap">{p.caption || p.place || ''}</span>
              </button>
            </li>
          {/each}
        </ul>
      </section>
    {/each}
  {/if}

  <section class="card fa-home" aria-labelledby="fa-home-h" data-album-home>
    <h2 id="fa-home-h">{t('On Today')}</h2>
    <label class="fa-sw"><input type="checkbox" checked={cfg.greet} onchange={(e) => setGreet(e.currentTarget.checked)} data-album-greet /><span><b>{t('A photo on Today')}</b><small>{t('One of your album photos, another one each time; switch single photos off in the photo window.')}</small></span></label>
    <p class="fa-fine">{tn(counts.all, '{n} photo', '{n} photos')} · {mb(sizeOf(list))} MB · {t('only on this device, in the backup')}</p>
  </section>
</div>

{#if open}
  {#key open.id}
    <PhotoSheet photo={open} pos={openIdx + 1} total={flat.length} places={placesOf(list)} onsave={saveOpen} ondelete={deleteOpen} onstep={step} onclose={() => (openId = null)} />
  {/key}
{/if}

<style>
  .fa {
    max-width: 1100px;
  }
  .fa-bar {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 10px 12px;
    margin: 0 0 10px;
  }
  .fa-bar2 {
    justify-content: flex-start;
    margin-bottom: 18px;
  }
  .fa-chips {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }
  .fa-chip {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    min-height: 44px;
    padding: 4px 14px;
    border: 1px solid var(--line);
    border-radius: 999px;
    background: var(--paper);
    color: var(--ink);
    font: inherit;
    font-size: var(--fs-small);
    cursor: pointer;
  }
  .fa-chip[aria-pressed='true'] {
    background: var(--ink);
    border-color: var(--ink);
    color: var(--paper);
  }
  .fa-add {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    min-height: 44px;
    cursor: pointer;
  }
  .fa-hint,
  .fa-busy,
  .fa-fine {
    margin: 0;
    color: var(--ink-3);
    font-size: var(--fs-small);
    overflow-wrap: break-word;
    min-width: 0;
  }
  .fa-group {
    margin: 0 0 22px;
  }
  .fa-gh {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    gap: 4px 10px;
    margin: 0 2px 10px;
    font-size: var(--fs-section);
    overflow-wrap: break-word;
  }
  .fa-gh small {
    color: var(--ink-3);
    font-size: var(--fs-small);
    font-weight: 400;
  }
  .fa-grid {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(min(46%, 180px), 1fr));
    gap: 8px;
  }
  .fa-tile {
    position: relative;
    display: block;
    width: 100%;
    aspect-ratio: 4 / 3;
    padding: 0;
    border: 0;
    border-radius: var(--radius-card);
    overflow: hidden;
    background: var(--paper-2);
    cursor: pointer;
  }
  .fa-tile img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }
  .fa-tag,
  .fa-off {
    position: absolute;
    top: 6px;
    padding: 2px 8px;
    border-radius: 999px;
    background: var(--scrim);
    color: var(--paper);
    font-size: var(--fs-tiny);
  }
  .fa-tag {
    left: 6px;
  }
  .fa-off {
    right: 6px;
  }
  .fa-cap {
    position: absolute;
    left: 0;
    right: 0;
    bottom: 0;
    padding: 14px 8px 6px;
    background: linear-gradient(transparent, var(--scrim));
    color: var(--paper);
    font-size: var(--fs-small);
    text-align: left;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .fa-cap:empty {
    display: none;
  }
  .fa-home {
    display: grid;
    gap: 10px;
    padding: 14px 16px;
    margin-top: 8px;
  }
  .fa-home h2 {
    margin: 0;
    font-size: var(--fs-section);
  }
  .fa-sw {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    min-height: 44px;
  }
  .fa-sw input {
    flex: none;
    width: 22px;
    height: 22px;
    margin-top: 2px;
  }
  .fa-sw span {
    display: grid;
    gap: 2px;
  }
  .fa-sw small {
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
</style>
