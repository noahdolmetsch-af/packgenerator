<script>
  /**
   * Paket VG 1129 «Verschleiss-Fotos» (Noah 20.10.2026 «2a»): Bikes › Care › «Wear photos»
   * (#/bikes?tab=care&view=photos&bike=<id>). Per bike a photo of the chain, the chainring and the tyre with
   * date and km; the old one next to the new one with a slider; a hint when a new photo is due (every X km,
   * set on the page «Verschleiss», switchable). The photos stay on this device (db.photos, field `wear`).
   */
  import { liveQuery } from 'dexie';
  import { Trash2, Camera } from '@lucide/svelte';
  import { db } from '../db.js';
  import { t, num, dateOf } from '../i18n.svelte.js';
  import { sortBikes } from '../bikes.js';
  import { localDay } from '../localday.js';
  import { partName } from '../care.js';
  import { shrinkImage } from '../photo.js';
  import { SHOT_PARTS, shotsOf, shotDue, prefsOf, PREFS_KEY } from '../griff.js';
  import { askDelete, deleteWithUndo } from '../ui/ask.js';
  import { offerDone } from '../ui/rename.svelte.js';
  import PhotoPick from '../ui/PhotoPick.svelte';
  import DrawOn from '../draw/DrawOn.svelte'; // Paket NE 1146 (Noah 20.10.2026 «1b»): draw on a wear photo
  import GriffHead from './GriffHead.svelte';
  import GhostCamera from './GhostCamera.svelte'; // Velo-Idee 75: the camera with the old photo on top
  import './griff.css';

  let { bikeId = null } = $props();
  const today = localDay();
  const bikesQ = liveQuery(() => db.bikes.toArray());
  const photosQ = liveQuery(() => db.photos.filter((p) => !!p.wear).toArray());
  const prefsQ = liveQuery(() => db.settings.get(PREFS_KEY));
  const bikes = $derived(sortBikes($bikesQ ?? []));
  const bike = $derived(bikes.find((b) => b.id === bikeId) ?? bikes[0] ?? null);
  const photos = $derived($photosQ ?? []);
  const every = $derived(prefsOf($prefsQ?.value).shotEveryKm);
  let busy = $state('');
  let msg = $state('');
  let pick = $state({}); // { [key]: { a: id, b: id } } the two photos compared
  let cut = $state({}); // { [key]: 0–100 } the slider
  let ghostFor = $state(null); // the part key whose camera with template is open

  async function add(key, file) {
    busy = key;
    msg = '';
    try {
      const data = await shrinkImage(file, 1400, 0.82);
      const id = `wear-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
      await db.photos.put({ id, bikeId: bike.id, name: partName({ key }), tripId: null, main: false, wear: key, date: today, km: typeof bike.km === 'number' ? bike.km : null, data, addedAt: new Date().toISOString() });
      offerDone(t('Photo saved: {part}, {date}.', { part: partName({ key }), date: dateOf(today) }), () => db.photos.delete(id));
    } catch (err) {
      msg = err?.message || t('This photo could not be read.');
    } finally {
      busy = '';
    }
  }
  async function remove(p) {
    if ((await askDelete({ title: t('Delete the photo of {date}?', { date: dateOf(p.date) }), text: t('Only this photo goes. You can bring it back for 4 seconds afterwards.') })) !== 'delete') return;
    await deleteWithUndo({
      name: dateOf(p.date),
      text: t('Photo deleted.'),
      run: async () => {
        const rec = await db.photos.get(p.id);
        await db.photos.delete(p.id);
        return rec;
      },
      undo: (rec) => rec && db.photos.put(rec),
    });
  }
  const pair = (key, list) => {
    const a = list.find((p) => p.id === pick[key]?.a) ?? list[0];
    const b = list.find((p) => p.id === pick[key]?.b) ?? list.at(-1);
    return { a, b };
  };
  const label = (p) => `${dateOf(p.date)}${typeof p.km === 'number' ? ` · ${num(p.km)} km` : ''}`;
</script>

<div class="gp">
  <GriffHead {bikes} {bike} view="photos" title={t('Wear photos')} sub={t('Chain, chainring and tyre: the old photo next to the new one')} />
  {#if !bike}
    <p class="quiet">{t('No bike yet. Add a bike under Bikes first.')}</p>
  {:else}
    <p class="quiet">{t('Take a photo from the same side each time, in good light. The photos stay on this device.')}</p>
    {#if msg}<p class="err" role="alert">{msg}</p>{/if}
    {#each SHOT_PARTS as key (key)}
      {@const list = shotsOf(photos, bike.id, key)}
      {@const due = shotDue(bike, photos, key, every)}
      {@const pr = pair(key, list)}
      <section class="gcard" aria-labelledby="ws-{key}" data-shots={key}>
        <h2 id="ws-{key}"><Camera size={18} aria-hidden="true" />{partName({ key })}</h2>
        {#if due?.due}<p class="warn" data-shot-due>{due.since == null ? t('No photo yet.') : t('New photo due: {km} km since the last one.', { km: num(due.since) })}</p>{/if}
        {#if list.length >= 2}
          <div class="cmp" style:--cut="{cut[key] ?? 50}%" data-shot-compare>
            <img class="old" src={pr.a.data} alt={t('{part}, {when}', { part: partName({ key }), when: label(pr.a) })} />
            <img class="new" src={pr.b.data} alt={t('{part}, {when}', { part: partName({ key }), when: label(pr.b) })} />
          </div>
          <input class="slide" type="range" min="0" max="100" value={cut[key] ?? 50} oninput={(e) => (cut = { ...cut, [key]: Number(e.currentTarget.value) })} aria-label={t('Slide between old and new')} />
          <div class="row">
            <label class="grow"><span class="quiet">{t('Old')}</span> <select class="sel" value={pr.a.id} onchange={(e) => (pick = { ...pick, [key]: { ...pr, a: e.currentTarget.value, b: pr.b.id } })}>{#each list as p (p.id)}<option value={p.id}>{label(p)}</option>{/each}</select></label>
            <label class="grow"><span class="quiet">{t('New')}</span> <select class="sel" value={pr.b.id} onchange={(e) => (pick = { ...pick, [key]: { a: pr.a.id, b: e.currentTarget.value } })}>{#each list as p (p.id)}<option value={p.id}>{label(p)}</option>{/each}</select></label>
          </div>
        {:else if list.length === 1}
          <img class="one" src={list[0].data} alt={t('{part}, {when}', { part: partName({ key }), when: label(list[0]) })} />
          <p class="quiet">{t('With a second photo you can compare old and new.')}</p>
        {/if}
        {#if list.length}
          <ul class="list">{#each [...list].reverse() as p (p.id)}<li data-shot={p.id}><span class="grow">{label(p)}</span><DrawOn src={p.data} list={[p.data]} inks={p.inks} icon cls="ib" onsave={({ list: l, inks }) => db.photos.update(p.id, { data: l[0], inks })} data-shot-draw /><button type="button" class="ib" aria-label={t('Delete the photo of {date}', { date: dateOf(p.date) })} onclick={() => remove(p)}><Trash2 size={16} aria-hidden="true" /></button></li>{/each}</ul>
        {/if}
        <div class="row">
          {#if list.length}<button type="button" class="btn hi sm" onclick={() => (ghostFor = key)} data-shot-ghost={key}><Camera size={16} aria-hidden="true" />{t('Photo with template')}</button>{/if}
          <PhotoPick onfile={(f) => add(key, f)} busy={busy === key} has={list.length > 0} camera="Take photo" again="New photo" />
        </div>
      </section>
    {/each}
  {/if}
</div>

{#if ghostFor && bike}
  {@const last = shotsOf(photos, bike.id, ghostFor).at(-1) ?? null}
  <GhostCamera title={t('Photograph: {part}', { part: partName({ key: ghostFor }) })} ghost={last} onphoto={(f) => add(ghostFor, f)} onclose={() => (ghostFor = null)} />
{/if}

<style>
  .cmp {
    position: relative;
    aspect-ratio: 4 / 3;
    border-radius: 10px;
    overflow: hidden;
    background: var(--paper-2);
  }
  .cmp img {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  .cmp .new {
    clip-path: inset(0 0 0 var(--cut));
  }
  .slide {
    width: 100%;
    min-height: 44px;
  }
  .one {
    display: block;
    width: 100%;
    max-width: 420px;
    border-radius: 10px;
  }
</style>
