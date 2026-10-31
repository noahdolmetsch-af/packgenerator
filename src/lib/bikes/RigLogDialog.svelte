<script>
  /**
   * UC3-3: write down one change of the setup (or change one): the day, the kind, before and after,
   * why, and the weight it adds or saves. entry: the entry to change, or a draft (a workshop job
   * offered for the log), or null for a new one.
   */
  import { keepTyped } from '../ui/keeptyped.js';
  import { backClose } from '../ui/backclose.js';
  import { X } from '@lucide/svelte';
  import './velo-dlg.css';
  import { LOG_KINDS, newLogEntry } from '../rig.js';
  import { localDay } from '../localday.js';
  import { t, tn, dateOf } from '../i18n.svelte.js';
  import PhotoPick from '../ui/PhotoPick.svelte';
  import { shrinkImage } from '../photo.js';
  import { makeSaved, savedCount, fitSnapshot, MAX_PHOTOS } from './rueckbau.js'; // Velo-Idee 73

  let { entry = null, bike = null, onsave, ondelete, onclose } = $props();

  // The dialog edits a copy of the entry as it was when it opened.
  // svelte-ignore state_referenced_locally
  const isNew = !entry?.id;
  // svelte-ignore state_referenced_locally
  let draft = $state({ date: entry?.date ?? localDay(), kind: entry?.kind ?? 'drive', title: entry?.title ?? '', before: entry?.before ?? '', after: entry?.after ?? '', why: entry?.why ?? '', deltaG: entry?.deltaG ?? '' });
  let error = $state('');
  // Velo-Idee 73 «Setup zurückbauen»: a new entry keeps the measures as they are now (and up to 3 photos)
  // svelte-ignore state_referenced_locally
  const nowCount = bike ? savedCount(fitSnapshot(bike)) : 0;
  // svelte-ignore state_referenced_locally
  let keep = $state(!entry?.saved && nowCount > 0);
  // svelte-ignore state_referenced_locally
  let photos = $state([...(entry?.saved?.photos ?? [])]);
  let reading = $state(false);
  async function addPhoto(file) {
    reading = true;
    try {
      photos = [...photos, await shrinkImage(file, 1400, 0.82)].slice(0, MAX_PHOTOS);
    } catch (err) {
      error = err?.message || t('This photo could not be read.');
    } finally {
      reading = false;
    }
  }
  let dialog;
  $effect(() => {
    dialog.showModal();
  });

  function save(event) {
    event.preventDefault();
    if (!draft.title.trim() && !(draft.before.trim() && draft.after.trim())) {
      error = t('Write what you changed.');
      return;
    }
    const title = draft.title.trim() || `${draft.before.trim()} → ${draft.after.trim()}`;
    // keep: the measures now; else the measures kept before (if any); photos go with either
    const saved = keep && bike ? makeSaved(bike, photos, draft.date) : entry?.saved ? { ...entry.saved, photos: $state.snapshot(photos) } : photos.length ? { fit: {}, photos: $state.snapshot(photos), at: draft.date } : null;
    const made = newLogEntry({ ...draft, saved, title, deltaG: String(draft.deltaG).replace(/[^\d+-]/g, ''), source: entry?.source ?? null, part: entry?.part ?? null }, { id: entry?.id ?? `log-${Date.now().toString(36)}`, now: entry?.at });
    onsave?.($state.snapshot(entry?.id ? { ...made, backAsked: !!entry.backAsked } : made));
    dialog.close();
  }
</script>

<dialog use:keepTyped={'riglog:' + (entry?.id ?? 'new')} class="sheet vdlg" bind:this={dialog} use:backClose {onclose} aria-labelledby="lg-h">
  <form onsubmit={save} novalidate>
    <div class="vd-head">
      <div class="vd-t">
        <h2 id="lg-h">{isNew ? t('Write down a change') : t('Change entry')}</h2>
        {#if entry?.source?.label}<p class="vd-sub meta">{entry.source.label}</p>{/if}
      </div>
      <button type="button" class="vd-x" aria-label={t('Close')} onclick={() => dialog.close()}><X size={18} aria-hidden="true" /></button>
    </div>
    <div class="grid">
      <label><span class="lbl">{t('Day')}</span><input class="inp" type="date" bind:value={draft.date} /></label>
      <label>
        <span class="lbl">{t('Kind|log')}</span>
        <select class="sel" bind:value={draft.kind}>{#each LOG_KINDS as k (k.key)}<option value={k.key}>{t(k.name)}</option>{/each}</select>
      </label>
      <label class="wide"><span class="lbl">{t('What changed')}</span><input class="inp" bind:value={draft.title} placeholder={t('e.g. Chainring 40 → 38 T.')} /></label>
      <label><span class="lbl">{t('Before')}</span><input class="inp" bind:value={draft.before} /></label>
      <label><span class="lbl">{t('After')}</span><input class="inp" bind:value={draft.after} /></label>
      <label class="wide"><span class="lbl">{t('Why')}</span><input class="inp" bind:value={draft.why} /></label>
      <label><span class="lbl">{t('Weight change (g)')}</span><input class="inp num" type="text" inputmode="numeric" bind:value={draft.deltaG} placeholder={t('e.g. +180 or -90')} /></label>
    </div>
    {#if bike}
      <fieldset class="keep" data-riglog-keep>
        <legend class="lbl">{t('Keep the old setting')}</legend>
        {#if nowCount}
          <label class="ck"><input type="checkbox" bind:checked={keep} />{entry?.saved ? t('Keep the measures as they are now (replaces the kept ones)') : tn(nowCount, 'Keep the {n} measure as it is now', 'Keep the {n} measures as they are now')}</label>
        {:else if !entry?.saved}
          <p class="hint">{t('No measures on this bike yet. Type them under Setup, then the app can keep them.')}</p>
        {/if}
        {#if entry?.saved && !keep}<p class="hint">{tn(savedCount(entry.saved.fit), '{n} measure kept from {date}', '{n} measures kept from {date}', { date: dateOf(entry.saved.at) })}</p>{/if}
        {#if photos.length}
          <div class="pics">{#each photos as src, n (n)}<span class="pic"><img {src} alt={t('Photo {n}', { n: n + 1 })} /><button type="button" aria-label={t('Remove photo {n}', { n: n + 1 })} onclick={() => (photos = photos.filter((_, i) => i !== n))}><X size={14} aria-hidden="true" /></button></span>{/each}</div>
        {/if}
        {#if photos.length < MAX_PHOTOS}<PhotoPick onfile={addPhoto} busy={reading} has={photos.length > 0} camera="Photo of the old setting" />{/if}
        <p class="hint">{t('So you can go back later: the measures and photos stay with this entry.')}</p>
      </fieldset>
    {/if}
    <p class="err" role="alert">{error}</p>
    <div class="vd-foot">
      {#if !isNew}<button type="button" class="btn del" onclick={() => (ondelete?.(entry), dialog.close())}>{t('Delete')}</button>{/if}
      <button type="button" class="btn" onclick={() => dialog.close()}>{t('Cancel')}</button>
      <button type="submit" class="btn hi">{t('Save')}</button>
    </div>
  </form>
</dialog>

<style>
  .keep {
    margin: 14px 0 0;
    padding: 12px;
    border: 1px solid var(--line);
    border-radius: 12px;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .keep .hint {
    margin: 0;
    font-size: var(--fs-small);
    color: var(--ink-3);
  }
  .ck {
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: 8px;
    min-height: 40px;
  }
  .ck input {
    width: 20px;
    height: 20px;
  }
  .pics {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
  }
  .pic {
    position: relative;
  }
  .pic img {
    width: 84px;
    height: 84px;
    object-fit: cover;
    border-radius: 8px;
    display: block;
  }
  .pic button {
    position: absolute;
    top: 2px;
    right: 2px;
    width: 28px;
    height: 28px;
    border: 0;
    border-radius: 50%;
    background: var(--ink);
    color: var(--paper);
    display: grid;
    place-items: center;
    cursor: pointer;
  }
  .grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
  }
  .wide {
    grid-column: 1 / -1;
  }
  label {
    display: flex;
    flex-direction: column;
    gap: 4px;
    min-width: 0;
  }
  .err:empty {
    display: none;
  }
  .err {
    color: var(--bad);
    margin: 8px 0 0;
  }
  @media (max-width: 520px) {
    .grid {
      grid-template-columns: 1fr;
    }
  }
</style>
