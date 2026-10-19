<script>
  /**
   * Paket M «Tour-Tagebuch von selbst» (Noah 19.10.2026 «1a», Frage 1 «1b»): in the debrief of a trip.
   * The first time the debrief opens, a draft is written from the Strava rides of those days, uploaded
   * rides, the weather, the notes on the way and «Was war neu?» (tagebuch.js). Everything can be changed;
   * «Neu entwerfen» writes it again. Photos of those days stay on this device (fotos.js).
   * The whole diary can be switched off here (settings 'tagebuch' { on }).
   */
  import { liveQuery } from 'dexie';
  import { db } from '../db.js';
  import { t, tn } from '../i18n.svelte.js';
  import { diaryFacts, diaryDraft, tripDays, DIARY_KEY } from './tagebuch.js';
  import { tripPhotos, addTripPhotos, removeTripPhoto, filesOfDays, fileDay, FOTO_MAX, FOTOS_PER_TRIP } from './fotos.js';
  import { shrinkImage } from '../photo.js';
  import Btn from '../ui/Btn.svelte';
  import { BookHeart, RefreshCw, Copy, Share2, ImagePlus, X } from '@lucide/svelte';

  /** trip, d: the debrief being edited (its state object), persist: saves d, notes: tripNotes(...), rides: db.rides of the trip, neu: «Was war neu?» lines */
  let { trip, d, persist, notes = [], rides = [], neu = [] } = $props(); // neu: null while it loads

  const prefQ = liveQuery(() => db.settings.get(DIARY_KEY).then((r) => r ?? null)); // null = no record yet (on)
  const on = $derived($prefQ === undefined ? null : $prefQ?.value?.on !== false);
  const days = $derived(tripDays(trip));
  const actsQ = $derived(days.length ? liveQuery(() => db.activities.where('day').between(days[0], days.at(-1), true, true).toArray()) : null);
  const facts = $derived(diaryFacts({ trip, activities: $actsQ ?? [], rides, notes, evening: d?.evening ?? {} }));

  let photos = $state([]);
  let msg = $state('');
  let busy = $state(false);
  let ready = $state(false);
  let box = $state(null);

  $effect(() => {
    const id = trip?.id;
    if (!id) return;
    tripPhotos(id).then((p) => (photos = p));
  });

  // The draft comes when the debrief is opened (Frage 1 «1b»), once: after that it is the user's text.
  $effect(() => {
    if (on !== true || !d || ready || !$actsQ || neu === null) return;
    ready = true;
    if (!d.diary?.text) {
      d.diary = { text: diaryDraft({ trip, facts, neu: neu ?? [], photos: photos.length }), at: new Date().toISOString(), edited: false };
      persist();
    }
  });

  function edit(e) {
    d.diary = { ...(d.diary ?? {}), text: e.currentTarget.value, edited: true, at: d.diary?.at ?? new Date().toISOString() };
    grow();
    persist();
  }
  function grow() {
    if (!box) return;
    box.style.height = 'auto';
    box.style.height = `${Math.min(box.scrollHeight + 4, 900)}px`;
  }
  $effect(() => {
    void d?.diary?.text;
    if (box) queueMicrotask(grow);
  });

  function redraft() {
    if (d.diary?.edited && !confirm(t('Write the draft again? Your changes to the diary are replaced.'))) return;
    d.diary = { text: diaryDraft({ trip, facts, neu: neu ?? [], photos: photos.length }), at: new Date().toISOString(), edited: false };
    persist();
    msg = t('New draft written.');
  }
  async function copy() {
    try {
      await navigator.clipboard.writeText(d.diary?.text ?? '');
      msg = t('Copied.');
    } catch {
      msg = t('Could not copy. Select the text and copy it yourself.');
    }
  }
  const canShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function';
  async function share() {
    try {
      await navigator.share({ title: trip.title || t('Tour diary'), text: d.diary?.text ?? '' });
    } catch {
      /* closed */
    }
  }

  async function pick(e) {
    const files = [...(e.currentTarget.files ?? [])];
    e.currentTarget.value = '';
    if (!files.length) return;
    busy = true;
    msg = '';
    try {
      const keep = filesOfDays(files, days[0], days.at(-1));
      const room = Math.max(0, FOTOS_PER_TRIP - photos.length);
      const use = keep.slice(0, room);
      const out = [];
      for (const f of use) out.push({ day: fileDay(f), data: await shrinkImage(f, FOTO_MAX, 0.8) });
      if (out.length) photos = await addTripPhotos(trip.id, out);
      const other = files.length - keep.length;
      const full = keep.length - use.length;
      msg = [out.length ? tn(out.length, '{n} photo added.', '{n} photos added.') : '', other ? tn(other, '{n} photo from other days left out.', '{n} photos from other days left out.') : '', full ? t('At most {n} photos per trip.', { n: FOTOS_PER_TRIP }) : ''].filter(Boolean).join(' ');
    } catch (err) {
      msg = err?.message || t('Could not save. Please try again.');
    } finally {
      busy = false;
    }
  }
  async function drop(id) {
    photos = await removeTripPhoto(trip.id, id);
  }
  const setOn = (v) => db.settings.put({ key: DIARY_KEY, value: { ...($prefQ?.value ?? {}), on: v } });
</script>

{#if on === false}
  <section class="rv-sec tb off" aria-label={t('Tour diary')} data-tagebuch="off">
    <p class="tp-muted tp-small">{t('Tour diary is off.')} <button type="button" class="tp-link" onclick={() => setOn(true)}>{t('Switch on')}</button></p>
  </section>
{:else if on === true && d}
  <section class="rv-sec tb" aria-labelledby="tb-h" data-tagebuch>
    <div class="rv-h"><div><h2 id="tb-h"><BookHeart size={18} aria-hidden="true" /> {t('Tour diary')}</h2><p class="rv-sub">{d.diary?.edited ? t('your text') : t('a draft from your rides, weather and notes · change anything')}</p></div></div>
    <div class="rv-box pad">
      <textarea bind:this={box} class="inp tb-text" rows="8" value={d.diary?.text ?? ''} oninput={edit} aria-label={t('Tour diary')}></textarea>
      {#if photos.length}
        <ul class="tb-photos" aria-label={t('Photos of the trip')}>
          {#each photos as p (p.id)}
            <li><img src={p.data} alt={t('Photo from {day}', { day: p.day })} loading="lazy" /><button type="button" class="tb-x" aria-label={t('Remove photo')} onclick={() => drop(p.id)}><X size={14} aria-hidden="true" /></button></li>
          {/each}
        </ul>
      {/if}
      <div class="rowacts tb-acts">
        <label class="btn k tb-pick" aria-disabled={busy}><ImagePlus size={17} aria-hidden="true" /><span class="kl">{busy ? t('Adding …') : t('Photos of those days')}</span><input type="file" accept="image/*" multiple onchange={pick} disabled={busy} hidden /></label>
        <Btn icon={RefreshCw} label={t('New draft')} onclick={redraft} />
        <Btn icon={Copy} label={t('Copy')} onclick={copy} />
        {#if canShare}<Btn icon={Share2} label={t('Share')} onclick={share} />{/if}
      </div>
      <p class="tp-muted tp-small">{t('Photos stay on this device: not in the backup and not synced.')}</p>
      {#if msg}<p class="tp-small" role="status">{msg}</p>{/if}
      <p class="tp-small"><button type="button" class="tp-link" onclick={() => setOn(false)}>{t('Switch off tour diary')}</button></p>
    </div>
  </section>
{/if}

<style>
  .tb h2 {
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }
  .tb-text {
    width: 100%;
    min-height: 10rem;
    font: inherit;
    line-height: 1.5;
    resize: vertical;
    box-sizing: border-box;
  }
  .tb-photos {
    list-style: none;
    margin: 10px 0 0;
    padding: 0;
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(88px, 1fr));
    gap: 6px;
  }
  .tb-photos li {
    position: relative;
  }
  .tb-photos img {
    width: 100%;
    aspect-ratio: 1;
    object-fit: cover;
    border-radius: 8px;
    display: block;
  }
  .tb-x {
    position: absolute;
    top: 4px;
    right: 4px;
    width: 28px;
    height: 28px;
    border-radius: 50%;
    border: 0;
    background: var(--paper);
    color: var(--ink);
    display: grid;
    place-items: center;
    cursor: pointer;
  }
  .tb-acts {
    margin-top: 10px;
    flex-wrap: wrap;
  }
  .tb-pick {
    cursor: pointer;
  }
  .tb.off {
    margin-top: 0;
  }
</style>
