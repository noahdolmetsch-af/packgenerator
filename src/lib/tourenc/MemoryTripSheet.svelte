<script>
  /**
   * Touren c 67 «Alte Reise ohne GPS ergänzen»: the window behind «Add an old trip» on Vergangene Touren. Name, first
   * day, days, where, what you remember, a photo (optional). Saves a finished trip without numbers (memorytrip.js)
   * and offers Undo. onclose().
   */
  import { tick } from 'svelte';
  import { X, ImagePlus } from '@lucide/svelte';
  import { db } from '../db.js';
  import { t } from '../i18n.svelte.js';
  import { localDay } from '../localday.js';
  import { shrinkImage } from '../photo.js';
  import { backClose } from '../ui/backclose.js';
  import { offerDone } from '../ui/rename.svelte.js';
  import { memoryTrip, memoryError } from './memorytrip.js';
  import '../ui/daumen.css';

  let { onclose } = $props();
  let dialog;
  let first;
  let title = $state('');
  let startDate = $state('');
  let days = $state(1);
  let place = $state('');
  let text = $state('');
  let photo = $state(null);
  let error = $state('');
  let busy = $state(false);

  $effect(() => {
    dialog.showModal();
    tick().then(() => first?.focus());
  });

  async function pickPhoto(e) {
    const f = e.currentTarget.files?.[0];
    if (!f) return;
    try {
      photo = await shrinkImage(f);
      error = '';
    } catch (x) {
      error = x?.message ?? String(x);
    }
  }

  async function save(e) {
    e?.preventDefault();
    if (busy) return;
    const why = memoryError({ title, startDate, days }, localDay());
    if (why) return (error = t(why));
    busy = true;
    try {
      const { trip, debrief, note } = memoryTrip({ title, startDate, days, place, text, photo });
      await db.transaction('rw', [db.trips, db.debriefs, db.notes], async () => {
        await db.trips.add(trip);
        await db.debriefs.put(debrief);
        if (note) await db.notes.put(note);
      });
      dialog.close();
      offerDone(t('«{name}» is now under Past trips.', { name: trip.title }), () =>
        db.transaction('rw', [db.trips, db.debriefs, db.notes], async () => {
          await db.trips.delete(trip.id);
          await db.debriefs.delete(trip.id);
          if (note) await db.notes.delete(note.id);
        }),
      );
    } catch (x) {
      error = x?.message ?? String(x);
    } finally {
      busy = false;
    }
  }
</script>

<dialog class="sheet from-below memtrip" bind:this={dialog} use:backClose={() => dialog.close()} onclose={() => onclose?.()} aria-labelledby="mt-h" data-memory-sheet>
  <form onsubmit={save} novalidate>
    <div class="head">
      <div>
        <p class="kick">{t('From memory')}</p>
        <h2 id="mt-h">{t('Add an old trip')}</h2>
      </div>
      <button type="button" class="ib" aria-label={t('Close')} onclick={() => dialog.close()}><X size={20} aria-hidden="true" /></button>
    </div>
    <p class="hint">{t('For a trip without a GPS file. Only what you remember: the app makes up no km and no times.')}</p>
    <label class="fld"><span class="lbl">{t('Name')}</span><input class="inp" bind:this={first} bind:value={title} maxlength="80" autocomplete="off" placeholder={t('e.g. Across the Jura')} data-memory-title /></label>
    <div class="two">
      <label class="fld"><span class="lbl">{t('First day')}</span><input class="inp" type="date" bind:value={startDate} max={localDay()} data-memory-start /></label>
      <label class="fld"><span class="lbl">{t('Days')}</span><input class="inp num" type="number" min="1" max="365" bind:value={days} data-memory-days /></label>
    </div>
    <label class="fld"><span class="lbl">{t('Where')} <small>{t('optional')}</small></span><input class="inp" bind:value={place} maxlength="120" autocomplete="off" placeholder={t('e.g. Jura, from Basel to Geneva')} data-memory-place /></label>
    <label class="fld"><span class="lbl">{t('What you remember')} <small>{t('optional')}</small></span><textarea class="inp" rows="3" bind:value={text} maxlength="2000" placeholder={t('e.g. Rain on day two, the best camp by the lake')} data-memory-text></textarea></label>
    <div class="fld">
      <span class="lbl">{t('Photo')} <small>{t('optional')}</small></span>
      {#if photo}
        <span class="ph"><img src={photo} alt={t('Photo of the trip')} /><button type="button" class="btn sm" onclick={() => (photo = null)}>{t('Remove photo')}</button></span>
      {:else}
        <label class="btn pick"><ImagePlus size={18} aria-hidden="true" />{t('Choose a photo')}<input type="file" accept="image/*" onchange={pickPhoto} data-memory-photo /></label>
      {/if}
    </div>
    {#if error}<p class="err" role="alert">{error}</p>{/if}
    <div class="foot daumen-foot">
      <button type="submit" class="btn hi" disabled={busy} data-memory-save>{t('Save')}</button>
      <button type="button" class="btn" onclick={() => dialog.close()}>{t('Cancel')}</button>
    </div>
  </form>
</dialog>

<style>
  .memtrip { width: min(480px, calc(100vw - 24px)); }
  form { display: grid; gap: 10px; }
  .head { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; }
  .kick { margin: 0; font-size: var(--fs-small); font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; color: var(--ink-3); }
  h2 { margin: 2px 0 0; font-size: var(--fs-section); }
  .ib { flex: none; display: grid; place-items: center; width: 44px; height: 44px; margin: -6px -6px 0 0; border: 0; border-radius: 10px; background: none; color: var(--ink-2); cursor: pointer; }
  .hint { margin: 0; font-size: var(--fs-small); color: var(--ink-2); }
  .fld { display: grid; gap: 4px; min-width: 0; }
  .lbl small { color: var(--ink-3); font-weight: 400; }
  .fld :global(.inp) { width: 100%; min-height: 44px; }
  .two { display: grid; grid-template-columns: minmax(0, 2fr) minmax(0, 1fr); gap: 8px; }
  .pick { position: relative; overflow: hidden; justify-self: start; }
  .pick input { position: absolute; inset: 0; opacity: 0; cursor: pointer; }
  .ph { display: flex; align-items: center; gap: 10px; }
  .ph img { width: 72px; height: 72px; object-fit: cover; border-radius: 8px; }
  .err { margin: 0; color: var(--bad); font-size: var(--fs-small); }
  .foot { display: flex; gap: 8px; padding-top: 12px; border-top: 1px solid var(--line); }
  @media (max-width: 719px) { .foot .btn.hi { flex: 1; } }
</style>
