<script>
  /**
   * Paket VG 1131 «Velo verpacken» (Noah 20.10.2026 «4»): Bikes › Care › «Pack the bike»
   * (#/bikes?tab=care&view=bikepack&bike=<id>). A checklist for the bike box or bag on the train or plane:
   * the points are the person's own (add, rename, move with arrows and drag, delete with Undo; the app's
   * points are a start), ticks per bike and day, and photos before packing for a damage claim (db.photos,
   * field `pack`, they stay on this device).
   */
  import { liveQuery } from 'dexie';
  import { Plus, Pencil, Trash2, Camera, RotateCcw } from '@lucide/svelte';
  import { db } from '../db.js';
  import { t, dateOf } from '../i18n.svelte.js';
  import { sortBikes } from '../bikes.js';
  import { localDay } from '../localday.js';
  import { shrinkImage } from '../photo.js';
  import { PACK_KEY, packOf, addPackItem, renamePackItem, removePackItem, movePackItem, tickPack, ticksOf, clearPack } from '../griff.js';
  import { changeSetting, putSetting } from '../griffdb.js';
  import { askDelete, deleteWithUndo } from '../ui/ask.js';
  import { offerDone } from '../ui/rename.svelte.js';
  import SortGrip from '../ui/SortGrip.svelte';
  import SortArrows from '../ui/SortArrows.svelte';
  import { sortable } from '../ui/sortable.js';
  import PhotoPick from '../ui/PhotoPick.svelte';
  import DrawOn from '../draw/DrawOn.svelte'; // Paket NE 1146 (Noah 20.10.2026 «1b»): draw on a photo before packing
  import GriffHead from './GriffHead.svelte';
  import './griff.css';

  let { bikeId = null } = $props();
  const today = localDay();
  const bikesQ = liveQuery(() => db.bikes.toArray());
  const packQ = liveQuery(() => db.settings.get(PACK_KEY));
  const photosQ = liveQuery(() => db.photos.filter((p) => !!p.pack).toArray());
  const bikes = $derived(sortBikes($bikesQ ?? []));
  const bike = $derived(bikes.find((b) => b.id === bikeId) ?? bikes[0] ?? null);
  const rec = $derived(packOf($packQ?.value));
  const ticks = $derived(bike ? ticksOf(rec, bike.id, today) : []);
  const shots = $derived(bike ? ($photosQ ?? []).filter((p) => p.bikeId === bike.id).sort((a, b) => String(b.date).localeCompare(String(a.date))) : []);
  const change = (fn) => changeSetting(PACK_KEY, null, (old) => fn(packOf(old)));
  const label = (x) => (x.std ? t(x.text) : x.text);

  let newText = $state('');
  let editing = $state(null);
  let editText = $state('');
  let busy = $state(false);
  let msg = $state('');

  async function add(e) {
    e.preventDefault();
    if (!newText.trim()) return (msg = t('Type a point.'));
    await change((r) => addPackItem(r, newText, `pk-${Date.now().toString(36)}`));
    offerDone(t('"{name}" added.', { name: newText.trim() }));
    newText = '';
    msg = '';
  }
  async function rename(e, x) {
    e.preventDefault();
    if (!editText.trim()) return (msg = t('Type a point.'));
    await change((r) => renamePackItem(r, x.id, editText));
    editing = null;
    msg = '';
  }
  async function remove(x) {
    if ((await askDelete({ title: t('Delete "{name}"?', { name: label(x) }), text: t('Only this point goes.') })) !== 'delete') return;
    await deleteWithUndo({
      name: label(x),
      text: t('"{name}" deleted.', { name: label(x) }),
      run: () => change((r) => removePackItem(r, x.id)),
      undo: (before) => putSetting(PACK_KEY, before),
    });
  }
  const move = (from, to) => change((r) => movePackItem(r, from, to));
  const tick = (x) => change((r) => tickPack(r, bike.id, x.id, today));
  async function restart() {
    const before = await change((r) => clearPack(r, bike.id));
    offerDone(t('All ticks cleared.'), () => putSetting(PACK_KEY, before));
  }
  async function addShot(file) {
    busy = true;
    try {
      const data = await shrinkImage(file, 1400, 0.82);
      const id = `pack-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
      await db.photos.put({ id, bikeId: bike.id, name: t('Before packing'), tripId: null, main: false, pack: true, date: today, data, addedAt: new Date().toISOString() });
      offerDone(t('Photo saved.'), () => db.photos.delete(id));
    } catch (err) {
      msg = err?.message || t('This photo could not be read.');
    } finally {
      busy = false;
    }
  }
  async function removeShot(p) {
    if ((await askDelete({ title: t('Delete the photo of {date}?', { date: dateOf(p.date) }), text: t('Only this photo goes. You can bring it back for 4 seconds afterwards.') })) !== 'delete') return;
    await deleteWithUndo({
      name: dateOf(p.date),
      text: t('Photo deleted.'),
      run: async () => {
        const r = await db.photos.get(p.id);
        await db.photos.delete(p.id);
        return r;
      },
      undo: (r) => r && db.photos.put(r),
    });
  }
</script>

<div class="gp">
  <GriffHead {bikes} {bike} view="bikepack" title={t('Pack the bike')} sub={t('For the bike box or bag on the train or plane, with photos before packing')} />
  {#if !bike}
    <p class="quiet">{t('No bike yet. Add a bike under Bikes first.')}</p>
  {:else}
    <section class="gcard" aria-labelledby="bp-list">
      <h2 id="bp-list">{t('Checklist')} <small class="quiet">{t('{n} of {m} done', { n: ticks.filter((id) => rec.items.some((x) => x.id === id)).length, m: rec.items.length })}</small></h2>
      <p class="quiet">{t('The points are a start: change, move or delete them. The ticks are for today and this bike.')}</p>
      <ul class="list" use:sortable={{ onmove: move }}>
        {#each rec.items as x, i (x.id)}
          <li data-sort-id={x.id} data-pack-item={x.id}>
            <SortGrip name={label(x)} onstep={(dir) => move(i, i + dir)} />
            {#if editing === x.id}
              <form class="row grow" onsubmit={(e) => rename(e, x)}>
                <input class="inp grow" type="text" maxlength="120" bind:value={editText} aria-label={t('Point')} />
                <button type="submit" class="btn sm">{t('Save')}</button>
                <button type="button" class="btn sm" onclick={() => (editing = null)}>{t('Cancel')}</button>
              </form>
            {:else}
              <label class="grow tk"><input type="checkbox" checked={ticks.includes(x.id)} onchange={() => tick(x)} data-pack-tick /> <span>{label(x)}</span></label>
              <SortArrows name={label(x)} {i} n={rec.items.length} onstep={(dir) => move(i, i + dir)} />
              <button type="button" class="ib" aria-label={t('Edit {name}', { name: label(x) })} onclick={() => ((editing = x.id), (editText = label(x)))}><Pencil size={16} aria-hidden="true" /></button>
              <button type="button" class="ib" aria-label={t('Delete {name}', { name: label(x) })} onclick={() => remove(x)} data-pack-delete><Trash2 size={16} aria-hidden="true" /></button>
            {/if}
          </li>
        {/each}
      </ul>
      <form class="row" onsubmit={add}>
        <input class="inp grow" type="text" maxlength="120" placeholder={t('e.g. Spare hanger in the box')} aria-label={t('New point')} bind:value={newText} data-pack-new />
        <button type="submit" class="btn sm" data-pack-add><Plus size={16} aria-hidden="true" />{t('Add|part')}</button>
      </form>
      {#if ticks.length}<p><button type="button" class="lnk" onclick={restart}><RotateCcw size={14} aria-hidden="true" />{t('Clear all ticks')}</button></p>{/if}
      {#if msg}<p class="err" role="alert">{msg}</p>{/if}
    </section>
    <section class="gcard" aria-labelledby="bp-shots">
      <h2 id="bp-shots"><Camera size={18} aria-hidden="true" />{t('Photos before packing')}</h2>
      <p class="quiet">{t('From all sides, with the date: if the bike arrives damaged, you can show how it was. They stay on this device.')}</p>
      {#if shots.length}
        <div class="shots">{#each shots as p (p.id)}<figure data-pack-shot={p.id}><img src={p.data} alt={t('Before packing, {date}', { date: dateOf(p.date) })} /><figcaption><span class="grow">{dateOf(p.date)}</span><DrawOn src={p.data} list={[p.data]} inks={p.inks} icon cls="ib" onsave={({ list, inks }) => db.photos.update(p.id, { data: list[0], inks })} data-pack-draw /><button type="button" class="ib" aria-label={t('Delete the photo of {date}', { date: dateOf(p.date) })} onclick={() => removeShot(p)}><Trash2 size={16} aria-hidden="true" /></button></figcaption></figure>{/each}</div>
      {/if}
      <div class="row"><PhotoPick onfile={addShot} {busy} has={shots.length > 0} camera="Take photo" again="Another photo" /></div>
    </section>
  {/if}
</div>

<style>
  .tk {
    display: flex;
    align-items: center;
    gap: 8px;
    min-height: 44px;
    min-width: 0;
    overflow-wrap: break-word;
  }
  .shots {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
    gap: 8px;
  }
  figure {
    margin: 0;
  }
  figure img {
    width: 100%;
    aspect-ratio: 4 / 3;
    object-fit: cover;
    border-radius: 8px;
  }
  figcaption {
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-size: var(--fs-small);
    color: var(--ink-2);
  }
</style>
