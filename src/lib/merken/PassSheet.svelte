<script>
  /**
   * Pflanzenpass (996 Ideen UC-257-I1): one entry of a plant's passport in a window: an observation of the
   * spot (sun, wind, how wet the soil stays, a photo, a note) or a move to another place. Every part is
   * optional and can be deselected (tap the chosen chip again). onsave(entry) gets a clean entry (plantpass.js).
   * entry: the entry to change, or null for a new one; kind: 'obs' | 'move' for a new one.
   */
  import { backClose } from '../ui/backclose.js';
  import { t } from '../i18n.svelte.js';
  import { localDay } from '../localday.js';
  import { shrinkImage } from '../photo.js';
  import CameraButton from '../ui/CameraButton.svelte';
  import { SUN, WIND, WET, passEntry } from './plantpass.js';
  import { X, Image as ImageIcon, Trash2 } from '@lucide/svelte';
  import '../bikes/velo-dlg.css';

  let { name = '', entry = null, kind = 'obs', place = '', onsave, onclose } = $props();
  let dialog;
  // svelte-ignore state_referenced_locally
  const e0 = entry ?? {};
  // svelte-ignore state_referenced_locally
  const k = entry?.kind ?? kind;
  let day = $state(e0.day ?? localDay());
  let where = $state(e0.place ?? (k === 'move' ? '' : place ?? ''));
  let sun = $state(e0.sun ?? null);
  let wind = $state(e0.wind ?? null);
  let wet = $state(e0.wet ?? null);
  let photo = $state(e0.photo ?? null);
  let note = $state(e0.note ?? '');
  let error = $state('');
  $effect(() => {
    dialog.showModal();
  });
  async function addPhoto(ev) {
    const f = ev.currentTarget.files?.[0];
    ev.currentTarget.value = '';
    if (!f) return;
    try {
      photo = await shrinkImage(f, 900, 0.78);
    } catch {
      error = t('The picture could not be read.');
    }
  }
  function save(ev) {
    ev.preventDefault();
    const e = passEntry({ id: e0.id, day, kind: k, place: where, sun, wind, wet, photo, note });
    if (!e) return (error = k === 'move' ? t('Write the new place.') : t('Choose at least one observation, a photo or a note.'));
    onsave?.(e);
    dialog.close();
  }
  const pick = (cur, key) => (cur === key ? null : key);
</script>

<dialog use:backClose class="sheet vdlg" bind:this={dialog} onclose={onclose} aria-labelledby="ps-h" data-pass-sheet>
  <form onsubmit={save} novalidate>
    <div class="vd-head">
      <div class="vd-t">
        <h2 id="ps-h" class="title">{k === 'move' ? t('Moved to another place') : t('Observation of the spot')}</h2>
        <p class="vd-sub">{name}</p>
      </div>
      <button type="button" class="vd-x" aria-label={t('Close')} onclick={() => dialog.close()}><X size={20} aria-hidden="true" /></button>
    </div>
    <label class="fld"><span class="lbl">{t('Day')}</span><input class="inp" type="date" bind:value={day} max={localDay()} /></label>
    {#if k === 'move'}
      <label class="fld"><span class="lbl">{t('New place|plant')}</span><input class="inp" bind:value={where} maxlength="60" placeholder={t('e.g. Terrace, east corner')} data-pass-place /></label>
    {:else}
      <p class="ps-l">{t('Sun')}</p>
      <div class="vd-chips" role="group" aria-label={t('Sun')}>{#each SUN as x (x.key)}<button type="button" class="vd-chip" aria-pressed={sun === x.key} onclick={() => (sun = pick(sun, x.key))} data-pass-sun={x.key}>{t(x.label)}</button>{/each}</div>
      <p class="ps-l">{t('Wind')}</p>
      <div class="vd-chips" role="group" aria-label={t('Wind')}>{#each WIND as x (x.key)}<button type="button" class="vd-chip" aria-pressed={wind === x.key} onclick={() => (wind = pick(wind, x.key))}>{t(x.label)}</button>{/each}</div>
      <p class="ps-l">{t('Soil')}</p>
      <div class="vd-chips" role="group" aria-label={t('Soil')}>{#each WET as x (x.key)}<button type="button" class="vd-chip" aria-pressed={wet === x.key} onclick={() => (wet = pick(wet, x.key))}>{t(x.label)}</button>{/each}</div>
    {/if}
    <p class="ps-l">{t('Photo (optional)')}</p>
    <div class="ph">
      {#if photo}
        <img src={photo} alt="" />
        <button type="button" class="btn sm" onclick={() => (photo = null)}><Trash2 size={16} aria-hidden="true" />{t('Remove the photo')}</button>
      {:else}
        <label class="btn sm"><ImageIcon size={16} aria-hidden="true" />{t('Choose a photo')}<input type="file" accept="image/*" hidden onchange={addPhoto} /></label>
        <CameraButton onchange={addPhoto} />
      {/if}
    </div>
    <label class="fld"><span class="lbl">{t('Note (optional)')}</span><input class="inp" bind:value={note} maxlength="300" placeholder={t('e.g. Afternoon sun from 14:00, the wind dries the pot')} /></label>
    {#if error}<p class="err" role="alert">{error}</p>{/if}
    <div class="vd-foot">
      <button type="button" class="btn" onclick={() => dialog.close()}>{t('Cancel')}</button>
      <button type="submit" class="btn hi" data-pass-save>{t('Save')}</button>
    </div>
  </form>
</dialog>

<style>
  .ps-l {
    margin: 10px 0 6px;
  }
  .ph {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;
    margin: 0 0 10px;
  }
  .ph img {
    width: 96px;
    height: 96px;
    border-radius: var(--r-ctl);
    object-fit: cover;
  }
</style>
