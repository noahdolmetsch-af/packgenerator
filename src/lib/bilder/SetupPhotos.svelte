<script>
  /**
   * «Bilder in der App» 2a (Noah 20.10.2026): the setup photos of a bike as a timeline, newest first,
   * grouped by month: each with its day and name. «+ Photo» right here (phone: the camera opens at once),
   * so a past setup can be added from Bike care and the Workshop too. Each photo: change the day, rename,
   * show it pale behind the bike (Bike care, Workshop, Pack), remove (ask, then 4 s Undo).
   * The same photos as Bikes › Setup › Photos (table photos, only on this device and in the backup).
   */
  import { X, ImagePlus, Pencil, CalendarDays, Image as ImageIcon, Trash2 } from '@lucide/svelte';
  import { liveQuery } from 'dexie';
  import CameraButton from '../ui/CameraButton.svelte';
  import DateInput from '../ui/DateInput.svelte';
  import Lightbox from '../ui/Lightbox.svelte';
  import RenameSheet from '../ui/RenameSheet.svelte';
  import MoreMenu from '../care/MoreMenu.svelte';
  import { offerRename } from '../ui/rename.svelte.js';
  import { askDelete, deleteWithUndo } from '../ui/ask.js';
  import { backClose } from '../ui/backclose.js';
  import { setupTimeline, shrinkImage, bikePhotoDrawn } from '../photo.js';
  import { localDay } from '../localday.js';
  import { db } from '../db.js';
  import { t, tn, dateOf, locale } from '../i18n.svelte.js';

  let { bike, onclose } = $props();
  let dialog;
  const photosQ = liveQuery(() => db.photos.toArray());
  // svelte-ignore state_referenced_locally
  const bikeQ = liveQuery(() => db.bikes.get(bike.id));
  const cur = $derived($bikeQ ?? bike);
  const groups = $derived(setupTimeline(cur, $photosQ ?? []));
  const flat = $derived(groups.flatMap((g) => g.items));
  let adding = $state(false);
  let msg = $state('');
  let dayOf = $state(null); // the photo whose day is changed
  let renaming = $state(null);
  let shown = $state(null);

  $effect(() => {
    dialog.showModal();
  });
  const monthName = (m) => (m ? new Date(`${m}-15T12:00:00`).toLocaleDateString(locale(), { month: 'long', year: 'numeric' }) : t('No date'));

  async function add(event) {
    const files = [...(event.currentTarget.files ?? [])];
    event.currentTarget.value = '';
    if (!files.length) return;
    adding = true;
    msg = '';
    const failed = [];
    const first = !flat.length;
    let n = 0;
    for (const file of files) {
      try {
        const data = await shrinkImage(file);
        await db.photos.put({ id: `photo-${Date.now().toString(36)}-${n}`, bikeId: cur.id, name: file.name.replace(/\.[^.]+$/, '').slice(0, 40) || t('Setup'), tripId: null, main: first && n === 0, data, day: localDay(), addedAt: new Date().toISOString() });
        n++;
      } catch (err) {
        failed.push(`${file.name}: ${err.message || t('This photo could not be read.')}`);
      }
    }
    if (failed.length) msg = failed.join(' ');
    adding = false;
  }
  async function setMain(p) {
    const mine = ($photosQ ?? []).filter((x) => x.bikeId === cur.id);
    await db.transaction('rw', db.photos, async () => {
      for (const x of mine) await db.photos.update(x.id, { main: x.id === p.id });
    });
  }
  async function setDay(p, day) {
    if (/^\d{4}-\d{2}-\d{2}$/.test(day)) await db.photos.update(p.id, { day });
    dayOf = null;
  }
  async function rename(name) {
    const p = renaming;
    const next = name.slice(0, 60);
    await db.photos.update(p.id, { name: next });
    offerRename(next, () => db.photos.update(p.id, { name: p.name }));
  }
  async function remove(p) {
    if ((await askDelete({ title: t('Remove the photo "{name}"?', { name: p.name }), text: t('You can bring it back for 4 seconds afterwards.'), label: t('Remove') })) !== 'delete') return;
    const bikeId = cur.id;
    await deleteWithUndo({
      run: async () => {
        if (p.stored) {
          const rec = await db.photos.get(p.id);
          await db.photos.delete(p.id);
          return { rec };
        }
        const photo = (await db.bikes.get(bikeId))?.photo ?? null;
        await db.bikes.update(bikeId, { photo: null });
        return { photo };
      },
      undo: (was) => (was.rec ? db.photos.put(was.rec) : was.photo ? db.bikes.update(bikeId, { photo: was.photo }) : null),
      text: t('"{name}" removed.', { name: p.name }),
      name: p.name,
    });
  }
  // Paket NE 1146 (Noah 20.10.2026 «1b»): draw on a setup photo in the big view
  async function drawn(pic, args) {
    const d = bikePhotoDrawn(cur.id, flat.find((x) => x.id === pic.id), args);
    await db.table(d.table).update(d.id, d.patch);
  }
  const actionsOf = (p) => [
    ...(p.main ? [] : [{ name: t('Show behind the bike'), explain: t('Pale behind the bike in Bike care, Workshop and Pack'), icon: ImageIcon, run: () => setMain(p) }]),
    ...(p.stored ? [{ name: t('Change the day'), explain: t('The day of this setup'), icon: CalendarDays, run: () => (dayOf = p.id) }, { name: t('Rename'), explain: t('Name of the photo'), icon: Pencil, run: () => (renaming = p) }] : []),
    { name: t('Remove'), explain: t('You can bring it back for 4 seconds afterwards.'), icon: Trash2, run: () => remove(p) },
  ];
</script>

<dialog class="sheet from-below sps" bind:this={dialog} use:backClose={() => dialog.close()} onclose={() => onclose?.()} aria-labelledby="sps-h" data-setup-photos>
  <div class="head">
    <div>
      <p class="kick">{cur.name}</p>
      <h2 id="sps-h">{t('Setup photos')}</h2>
    </div>
    <button type="button" class="ib" aria-label={t('Close')} onclick={() => dialog.close()}><X size={20} aria-hidden="true" /></button>
  </div>
  <p class="lead">{t('Your setups over time, newest first. The photo marked «behind the bike» shows pale at the top of Bike care, Workshop and Pack.')}</p>
  <div class="addrow">
    <CameraButton onchange={add} disabled={adding} />
    <label class="btn sm"><ImagePlus size={16} aria-hidden="true" />{adding ? t('Reading…') : t('+ Photo')}<input type="file" accept="image/*" multiple onchange={add} hidden disabled={adding} data-setup-add /></label>
  </div>
  {#if msg}<p class="err" role="alert">{msg}</p>{/if}

  {#if !flat.length}
    <p class="empty">{t('No setup photo yet. Add one of how the bike looks now; later ones line up here by date.')}</p>
  {:else}
    <ol class="tl" aria-label={t('Setup photos, newest first')}>
      {#each groups as g (g.month)}
        <li class="mon">
          <h3>{monthName(g.month)}</h3>
          <ul>
            {#each g.items as p (p.id)}
              <li class="item" data-setup-photo={p.id}>
                <button type="button" class="th" onclick={() => (shown = flat.findIndex((x) => x.id === p.id))} aria-label={t('Open photo {name}', { name: p.name })}><img src={p.src} alt="" loading="lazy" /></button>
                <span class="m">
                  <b>{p.name}</b>
                  <small>{[p.day ? dateOf(p.day) : t('No date'), p.main ? t('behind the bike') : ''].filter(Boolean).join(' · ')}</small>
                  {#if dayOf === p.id}<DateInput class="inp day" value={p.day ?? localDay()} onchange={(v) => setDay(p, v)} aria-label={t('Day of the setup')} />{/if}
                </span>
                <MoreMenu label={p.name} actions={actionsOf(p)} />
              </li>
            {/each}
          </ul>
        </li>
      {/each}
    </ol>
    <p class="count">{tn(flat.length, '{n} photo', '{n} photos')}</p>
  {/if}
  <div class="foot daumen-foot">
    <button type="button" class="btn hi" onclick={() => dialog.close()}>{t('Done')}</button>
  </div>
</dialog>

{#if shown != null && flat[shown]}
  <Lightbox list={flat.map((p) => ({ id: p.id, src: p.src, inks: p.inks, name: p.name, sub: p.day ? dateOf(p.day) : '' }))} start={shown} onclose={() => (shown = null)} ondraw={drawn} />
{/if}
{#if renaming}
  <RenameSheet kicker={t('Photo')} title={t('Rename photo')} value={renaming.name} onsave={rename} onclose={() => (renaming = null)} />
{/if}

<style>
  .sps {
    width: min(560px, calc(100vw - 24px));
  }
  .head {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 12px;
    margin: 0 0 8px;
  }
  .kick {
    margin: 0;
    font-size: var(--fs-small);
    font-weight: 700;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: var(--ink-3);
  }
  h2 {
    margin: 2px 0 0;
    font-size: var(--fs-section);
  }
  .ib {
    flex: none;
    display: grid;
    place-items: center;
    width: 44px;
    height: 44px;
    margin: -6px -6px 0 0;
    border: 0;
    border-radius: 10px;
    background: none;
    color: var(--ink-2);
    cursor: pointer;
  }
  .lead,
  .empty,
  .count {
    margin: 0 0 10px;
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .addrow {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin: 0 0 14px;
  }
  .err {
    color: var(--bad);
    font-size: var(--fs-small);
  }
  .tl,
  .tl ul {
    list-style: none;
    margin: 0;
    padding: 0;
  }
  /* the timeline: a quiet line on the left, the months as small titles on it */
  .tl {
    border-left: 2px solid var(--line);
    padding-left: 14px;
  }
  .mon + .mon {
    margin-top: 12px;
  }
  h3 {
    position: relative;
    margin: 0 0 6px;
    font-size: var(--fs-small);
    font-weight: 700;
    color: var(--ink-2);
  }
  h3::before {
    content: '';
    position: absolute;
    left: -20px;
    top: 50%;
    width: 10px;
    height: 10px;
    margin-top: -5px;
    border-radius: 50%;
    background: var(--paper);
    border: 2px solid var(--accent);
  }
  .item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 6px 0;
  }
  .th {
    flex: none;
    padding: 0;
    border: 1px solid var(--line);
    border-radius: 10px;
    overflow: hidden;
    background: var(--paper-2);
    cursor: zoom-in;
  }
  .th img {
    display: block;
    width: 64px;
    height: 64px;
    object-fit: cover;
  }
  .m {
    flex: 1 1 auto;
    min-width: 0;
    display: grid;
    gap: 2px;
  }
  .m b {
    overflow-wrap: break-word;
  }
  .m small {
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .foot {
    display: flex;
    gap: 8px;
    margin-top: 14px;
  }
</style>
