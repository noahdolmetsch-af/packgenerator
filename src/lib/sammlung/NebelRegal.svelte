<script>
  /**
   * «Nebelmeer» shelf of the Sammel-Wand (Noah 06.11.2026 «1-5a», answer 4a): the days you were above the fog, each with
   * a name, a date, the fog height and a photo (an album photo, so it is in the Fotoalbum too). A day is saved by a tap
   * on the card «Sun above the fog» or added here by hand. Change, photo and delete (with Undo) are here, because the
   * days have no other home. A quiet count «n fog sea days this winter»; no goal, no streak. Rules: nebelmeer.js.
   */
  import { liveQuery } from 'dexie';
  import { db } from '../db.js';
  import { t, tn, num, locale } from '../i18n.svelte.js';
  import { localDay } from '../localday.js';
  import { shrinkImage } from '../photo.js';
  import { newAlbumPhoto } from '../album/fotos.js';
  import { askDelete, deleteWithUndo } from '../ui/ask.js';
  import { KEY, daysOf, valueOf, addDay, patchDay, removeDay, winterCount } from './nebelmeer.js';
  import { CloudFog, Plus, Pencil, Trash2, Camera, ChevronDown, ChevronUp } from '@lucide/svelte';

  /** How many days the shelf shows before «Show all». */
  const SHOWN = 3;

  const dataQ = liveQuery(async () => {
    const days = daysOf((await db.settings.get(KEY))?.value);
    const photos = days.some((d) => d.photoId) ? await db.photos.bulkGet(days.map((d) => d.photoId).filter(Boolean)) : [];
    return { days, thumbs: new Map(photos.filter(Boolean).map((p) => [p.id, p.data])) };
  });
  const days = $derived($dataQ?.days ?? []);
  const thumbs = $derived($dataQ?.thumbs ?? new Map());
  const today = localDay();
  const count = $derived(winterCount(days, today));
  let all = $state(false);
  const shown = $derived(all ? days : days.slice(0, SHOWN));

  let form = $state(null); // { id | null, title, date, topM }
  let error = $state('');
  let fileEl = $state(null);
  let photoFor = $state(null); // the day id that gets the next chosen photo ('' = the form)
  let picked = $state(null); // { name, data } for a new day

  const dayText = (d) => (d ? new Date(`${d}T12:00:00Z`).toLocaleDateString(locale(), { timeZone: 'UTC', day: 'numeric', month: 'short', year: 'numeric' }) : '');
  const save = (list) => db.settings.put({ key: KEY, value: valueOf(list) });

  function open(d = null) {
    error = '';
    picked = null;
    form = d ? { id: d.id, title: d.title, date: d.date, topM: d.topM ?? '' } : { id: null, title: '', date: today, topM: '' };
  }
  const close = () => {
    form = null;
    picked = null;
    error = '';
  };

  /** The photo as an album photo; → its id. */
  async function keepPhoto(data, day, title) {
    const rec = { ...newAlbumPhoto(data, { day, place: title }), name: title || t('Fog sea') };
    await db.photos.put(rec);
    return rec.id;
  }

  async function choose(e) {
    const file = e.currentTarget.files?.[0];
    e.currentTarget.value = '';
    if (!file) return;
    error = '';
    try {
      const data = await shrinkImage(file);
      if (photoFor) {
        const d = days.find((x) => x.id === photoFor);
        const id = await keepPhoto(data, d?.date ?? today, d?.title ?? '');
        await save(patchDay(days, photoFor, { photoId: id }));
      } else picked = { name: file.name, data };
    } catch (err) {
      error = err?.message || t('This photo could not be read. Please choose a JPG or PNG.');
    }
  }
  const choosePhoto = (forId) => {
    photoFor = forId;
    fileEl?.click();
  };

  async function submit(e) {
    e.preventDefault();
    if (!form) return;
    const title = form.title.trim();
    const top = Number(form.topM);
    const fields = { date: form.date, title, topM: form.topM === '' || !Number.isFinite(top) || top <= 0 ? null : top };
    try {
      if (form.id) await save(patchDay(days, form.id, fields));
      else {
        const photoId = picked ? await keepPhoto(picked.data, form.date, title) : null;
        await save(addDay(days, { ...fields, photoId }));
      }
      close();
    } catch (err) {
      console.error(err);
      error = t('Saving did not work. Nothing was changed.');
    }
  }

  async function del(d) {
    const name = d.title || dayText(d.date);
    if ((await askDelete({ title: t('Remove «{name}»?', { name }), text: t('The day leaves the shelf. A photo stays in the photo album.') })) !== 'delete') return;
    const before = days;
    await deleteWithUndo({ run: () => save(removeDay(days, d.id)), undo: () => save(before), text: t('«{name}» removed.', { name }), name });
    if (form?.id === d.id) close();
  }
</script>

<section class="card shelf" aria-labelledby="wa-fog" data-shelf="fog">
  <div class="sh">
    <h2 id="wa-fog"><CloudFog size={18} aria-hidden="true" />{t('Fog sea')}{#if days.length}<span class="cnt num">{days.length}</span>{/if}</h2>
    <button type="button" class="btn sm" onclick={() => open()} data-fog-add><Plus size={16} aria-hidden="true" />{t('Add a day')}</button>
  </div>

  <p class="quiet" data-fog-count>
    {#if count.n}{tn(count.n, '{n} fog sea day this winter.', '{n} fog sea days this winter.')}{:else}{t('No fog sea day this winter yet. Fog does not come on command.')}{/if}
  </p>

  {#if shown.length}
    <ul class="days">
      {#each shown as d (d.id)}
        <li data-fog-day={d.id}>
          {#if thumbs.get(d.photoId)}
            <img class="thumb" src={thumbs.get(d.photoId)} alt={t('Photo of {name}', { name: d.title || dayText(d.date) })} loading="lazy" />
          {:else}
            <button type="button" class="thumb none" onclick={() => choosePhoto(d.id)} aria-label={t('Add a photo')} data-fog-photo={d.id}><Camera size={18} aria-hidden="true" /></button>
          {/if}
          <div class="txt">
            <b>{d.title || t('Fog sea')}</b>
            <small>{[dayText(d.date), d.topM ? t('fog up to {m} m', { m: num(d.topM) }) : ''].filter(Boolean).join(' · ')}</small>
          </div>
          <span class="acts">
            {#if thumbs.get(d.photoId)}<button type="button" class="ic" onclick={() => choosePhoto(d.id)} aria-label={t('Change the photo')}><Camera size={16} aria-hidden="true" /></button>{/if}
            <button type="button" class="ic" onclick={() => open(d)} aria-label={t('Change')} data-fog-edit={d.id}><Pencil size={16} aria-hidden="true" /></button>
            <button type="button" class="ic" onclick={() => del(d)} aria-label={t('Remove')} data-fog-del={d.id}><Trash2 size={16} aria-hidden="true" /></button>
          </span>
        </li>
      {/each}
    </ul>
    {#if days.length > SHOWN}
      <button type="button" class="btn btn-link sm" onclick={() => (all = !all)} data-fog-all>
        {#if all}{t('Show fewer')}<ChevronUp size={14} aria-hidden="true" />{:else}{tn(days.length - SHOWN, 'Show {n} more day', 'Show {n} more days')}<ChevronDown size={14} aria-hidden="true" />{/if}
      </button>
    {/if}
  {:else}
    <p class="quiet" data-shelf-empty>{t('No fog sea day yet. On a day with fog and sun above it, «Remember today» on Today saves it; you can also add a day here, with a photo.')}</p>
  {/if}

  {#if form}
    <form class="form" onsubmit={submit} data-fog-form aria-label={form.id ? t('Change this fog sea day') : t('Add a day')}>
      <label for="fog-title">{t('Name (e.g. the ride)')}</label>
      <input id="fog-title" bind:value={form.title} maxlength="60" placeholder={t('e.g. Hochplateau round')} />
      <label for="fog-date">{t('Day')}</label>
      <input id="fog-date" type="date" bind:value={form.date} required />
      <label for="fog-m">{t('Fog top in m (if you know it)')}</label>
      <input id="fog-m" type="number" inputmode="numeric" min="0" max="4000" bind:value={form.topM} />
      {#if !form.id}
        <div class="fa">
          <button type="button" class="btn sm" onclick={() => choosePhoto('')} data-fog-pick><Camera size={16} aria-hidden="true" />{picked ? t('Change the photo') : t('Add a photo')}</button>
          {#if picked}<small class="quiet">{picked.name}</small>{/if}
        </div>
      {/if}
      {#if error}<p class="err" role="alert" data-fog-error>{error}</p>{/if}
      <div class="fa">
        <button type="submit" class="btn hi" data-fog-save>{t('Save')}</button>
        <button type="button" class="btn" onclick={close}>{t('Cancel')}</button>
      </div>
    </form>
  {:else if error}
    <p class="err" role="alert" data-fog-error>{error}</p>
  {/if}

  <input bind:this={fileEl} type="file" accept="image/*" class="file" onchange={choose} tabindex="-1" aria-hidden="true" />
</section>

<style>
  .shelf {
    padding: 14px 16px;
  }
  h2 {
    display: flex;
    align-items: center;
    gap: 8px;
    margin: 0;
    font: 600 var(--fs-h3, 1.05rem) / 1.2 var(--font-body);
  }
  .cnt {
    color: var(--ink-3);
    font-weight: 500;
  }
  .sh {
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 8px 12px;
    margin-bottom: 10px;
  }
  .quiet {
    margin: 0 0 8px;
    font-size: var(--fs-small);
    color: var(--ink-3);
  }
  .days {
    display: grid;
    gap: 6px;
    margin: 0 0 8px;
    padding: 0;
    list-style: none;
  }
  .days li {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr) auto;
    align-items: center;
    gap: 10px;
    padding: 6px 8px;
    border: 1px solid var(--card-line);
    border-radius: var(--radius-card);
  }
  .thumb {
    width: 48px;
    height: 48px;
    border-radius: 8px;
    object-fit: cover;
    background: var(--paper-2);
  }
  .thumb.none {
    display: grid;
    place-items: center;
    border: 1px dashed var(--card-line);
    color: var(--ink-3);
    cursor: pointer;
  }
  .txt {
    display: grid;
    min-width: 0;
  }
  .txt b {
    overflow-wrap: break-word;
  }
  .txt small {
    color: var(--ink-3);
  }
  .acts {
    display: flex;
    gap: 2px;
  }
  .ic {
    display: grid;
    place-items: center;
    min-width: 44px;
    min-height: 44px;
    border: 0;
    background: none;
    color: var(--ink-2);
    cursor: pointer;
  }
  .form {
    display: grid;
    gap: 6px;
    margin-top: 10px;
    padding-top: 10px;
    border-top: 1px solid var(--card-line);
  }
  .form label {
    font-size: var(--fs-small);
    color: var(--ink-3);
  }
  .form input:not(.file) {
    min-height: 44px;
    padding: 0 10px;
    border: 1px solid var(--card-line);
    border-radius: 8px;
    background: var(--paper);
    color: var(--ink);
    font: inherit;
  }
  .fa {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;
  }
  .err {
    margin: 0;
    color: var(--bad);
    font-size: var(--fs-small);
  }
  .file {
    position: absolute;
    width: 1px;
    height: 1px;
    opacity: 0;
    pointer-events: none;
  }
</style>
