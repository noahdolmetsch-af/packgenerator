<script>
  /**
   * Paket P8 «Fotoalbum», mockup «Foto» (right panel): one photo big, «1 von 5». An album photo: caption, place (with
   * your earlier places as suggestions), date, «Auf Heute zeigen», delete (asked first, with Undo). A bike or trip photo
   * comes by itself: it says where it lives and opens it there (changed and deleted there).
   */
  import { untrack } from 'svelte';
  import { X, Trash2, ChevronLeft, ChevronRight, ExternalLink } from '@lucide/svelte';
  import { backClose } from '../ui/backclose.js';
  import { t } from '../i18n.svelte.js';

  let { photo, pos = 1, total = 1, places = [], onsave, ondelete, onstep, onclose } = $props();

  let f = $state(untrack(() => ({ caption: photo.caption, place: photo.place, day: photo.day, greet: photo.greet })));
  let dialog;
  $effect(() => {
    if (!dialog.open) dialog.showModal();
  });
  const own = $derived(photo.kind === 'album');
  const FROM = { setup: 'Setup photo of the bike «{name}»', wear: 'Wear photo of the bike «{name}»', pack: 'Photo before packing, bike «{name}»', note: 'From a note on the trip «{name}»' };
  async function save(e) {
    e.preventDefault();
    await onsave?.($state.snapshot(f));
    dialog.close();
  }
</script>

<dialog class="sheet from-below fa-ps" bind:this={dialog} use:backClose onclose={() => onclose?.()} aria-labelledby="fa-ps-h" data-photo-sheet>
  <form onsubmit={save}>
    <div class="fa-ps-head">
      <h2 id="fa-ps-h">{t('Photo')} <small class="num">{t('{n} of {total}', { n: pos, total })}</small></h2>
      <button type="button" class="fa-ps-ib" aria-label={t('Close')} onclick={() => dialog.close()}><X size={20} aria-hidden="true" /></button>
    </div>
    <div class="fa-ps-pic">
      <img src={photo.src} alt={photo.caption || photo.place || t('Photo')} />
      {#if total > 1}
        <button type="button" class="fa-ps-nav fa-ps-prev" aria-label={t('Previous photo')} disabled={pos <= 1} onclick={() => onstep?.(-1)}><ChevronLeft size={22} aria-hidden="true" /></button>
        <button type="button" class="fa-ps-nav fa-ps-next" aria-label={t('Next photo')} disabled={pos >= total} onclick={() => onstep?.(1)}><ChevronRight size={22} aria-hidden="true" /></button>
      {/if}
    </div>
    {#if own}
      <label class="fa-ps-lab">{t('Caption')}<input class="inp" maxlength="60" bind:value={f.caption} placeholder={t('e.g. rest by the lake')} data-photo-caption /></label>
      <label class="fa-ps-lab">{t('Place|photo')}<input class="inp" maxlength="60" list="fa-places" bind:value={f.place} placeholder={t('e.g. above the lake')} data-photo-place /></label>
      <datalist id="fa-places">{#each places as p (p)}<option value={p}></option>{/each}</datalist>
      <label class="fa-ps-lab">{t('Date')}<input class="inp" type="date" bind:value={f.day} data-photo-day /></label>
      <label class="fa-ps-sw"><input type="checkbox" bind:checked={f.greet} data-photo-greet /><span>{t('Show on Today')}</span></label>
      <p class="fa-ps-fine">{t('Only on this device and in the backup.')}</p>
      <div class="fa-ps-foot">
        <button type="button" class="btn" onclick={() => ondelete?.()} data-photo-delete><Trash2 size={16} aria-hidden="true" />{t('Delete')}</button>
        <button type="submit" class="btn hi" data-photo-save>{t('Save')}</button>
      </div>
    {:else}
      <p class="fa-ps-from">{t(FROM[photo.sub] ?? 'From the app', { name: photo.place })}{photo.day ? ` · ${photo.day.split('-').reverse().join('.')}` : ''}</p>
      {#if photo.caption}<p class="fa-ps-cap">{photo.caption}</p>{/if}
      <p class="fa-ps-fine">{t('This photo comes by itself. Change or delete it where it lives.')}</p>
      <div class="fa-ps-foot">
        <a class="btn hi" href={photo.href} onclick={() => dialog.close()} data-photo-open><ExternalLink size={16} aria-hidden="true" />{photo.kind === 'bike' ? t('Open the bike') : t('Open the trip')}</a>
      </div>
    {/if}
  </form>
</dialog>

<style>
  .fa-ps {
    width: min(560px, calc(100vw - 24px));
  }
  .fa-ps-head {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 12px;
  }
  .fa-ps-head h2 {
    margin: 0;
    font-size: var(--fs-section);
  }
  .fa-ps-head small {
    color: var(--ink-3);
    font-size: var(--fs-small);
    font-weight: 400;
  }
  .fa-ps-ib {
    flex: none;
    display: grid;
    place-items: center;
    width: 44px;
    height: 44px;
    margin: -6px -6px 0 0;
    border: 0;
    background: none;
    color: var(--ink-2);
    cursor: pointer;
  }
  .fa-ps-pic {
    position: relative;
    margin: 10px 0 4px;
  }
  .fa-ps-pic img {
    display: block;
    width: 100%;
    max-height: 50vh;
    object-fit: contain;
    border-radius: var(--r-ctl);
    background: var(--paper-2);
  }
  .fa-ps-nav {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    display: grid;
    place-items: center;
    width: 44px;
    height: 44px;
    border: 0;
    border-radius: 50%;
    background: var(--paper);
    color: var(--ink);
    box-shadow: var(--shadow);
    cursor: pointer;
  }
  .fa-ps-nav:disabled {
    opacity: 0.4;
  }
  .fa-ps-prev {
    left: 8px;
  }
  .fa-ps-next {
    right: 8px;
  }
  .fa-ps-lab {
    display: grid;
    gap: 4px;
    margin: 12px 0 0;
    font-size: var(--fs-small);
    font-weight: 600;
    color: var(--ink-2);
  }
  .fa-ps-lab .inp {
    min-height: 44px;
    min-width: 0;
    font-weight: 400;
  }
  .fa-ps-sw {
    display: flex;
    align-items: center;
    gap: 10px;
    min-height: 44px;
    margin-top: 10px;
  }
  .fa-ps-sw input {
    width: 22px;
    height: 22px;
  }
  .fa-ps-from,
  .fa-ps-cap {
    margin: 8px 0 0;
    overflow-wrap: break-word;
  }
  .fa-ps-fine {
    margin: 8px 0 0;
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .fa-ps-foot {
    display: flex;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 8px;
    margin-top: 16px;
    padding-top: 12px;
    border-top: 1px solid var(--line);
  }
  .fa-ps-foot .btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    min-height: 44px;
  }
</style>
