<script>
  /**
   * «Eine Seite pro Gipfel» (Noah 24.11.2026 «alle 1-5 zusammen», Gipfelbuch ausbauen, idea 3): Auswerten › Gipfelbuch ›
   * one place, #/flow/gipfelbuch/<id>. The visits of the place, newest first, each with its day, where it came from,
   * the temperature, the time up (a climb of the activity that carries the name of the place), photos (Strava's and
   * your own) and a note; the fastest time up on top. Everything can be changed, added and removed with Undo; the weather
   * of a day without Strava values comes on a tap (Open-Meteo, needs a place with coordinates).
   */
  import { liveQuery } from 'dexie';
  import { Mountain, Star, Camera, X } from '@lucide/svelte';
  import PageHead from '../../lib/ui/PageHead.svelte';
  import Empty from '../../lib/ui/Empty.svelte';
  import CoreLine from '../../lib/ui/CoreLine.svelte';
  import MainBar from '../../lib/ui/MainBar.svelte';
  import Crumb from '../../lib/flow/kit/Crumb.svelte';
  import PlaceSheet from '../../lib/flow/PlaceSheet.svelte';
  import { db } from '../../lib/db.js';
  import { GB_KEY, bookOf, placeRows, placeById, addVisit, editPlace, editVisit, removeVisit, removePlace, visitFacts, fastestUp, clock, starsOfPlace, sportOf, PLACE_WORD } from '../../lib/gipfelbuch.js';
  import { FOTO_KEY, fotosOf, addFoto, removeFoto, pruneFotos } from '../../lib/gipfelfotos.js';
  import { shrinkImage } from '../../lib/photo.js';
  import { fetchTourWeather } from '../../lib/touren/tourwx.js';
  import { localDay } from '../../lib/localday.js';
  import { t, tn, num, locale } from '../../lib/i18n.svelte.js';

  let { id = '' } = $props();
  const today = localDay();
  const q = liveQuery(async () => {
    const [row, fo, acts, rides, flowActs] = await Promise.all([db.settings.get(GB_KEY), db.settings.get(FOTO_KEY), db.activities.toArray(), db.rides.toArray(), db.flowActs.toArray()]);
    return { book: bookOf(row?.value), fotos: fotosOf(fo?.value), acts, rides, others: [...new Set(flowActs.map((a) => a.name).filter(Boolean))] };
  });
  const data = $derived($q);
  const book = $derived(data?.book ?? bookOf(null));
  const place = $derived(placeById(book, id));
  const row = $derived(placeRows(book).find((r) => r.place.id === id) ?? null);
  const sources = $derived({ acts: data?.acts ?? [], rides: data?.rides ?? [] });
  const visits = $derived(row ? [...row.visits].reverse().map((v) => ({ v, f: visitFacts(v, row.place, sources) })) : []);
  const fast = $derived(place ? fastestUp(book, id, sources) : null);
  const stars = $derived(place ? starsOfPlace(book, id) : []);
  const fotos = $derived(data?.fotos ?? {});

  let sheet = $state(null); // 'visit' | 'edit'
  let undo = $state(null); // { text, book, fotos }
  let noteFor = $state(null); // visit id whose note is being typed
  let noteText = $state('');
  let msg = $state('');
  let busy = $state('');

  const putBook = (nb) => db.settings.put({ key: GB_KEY, value: JSON.parse(JSON.stringify(nb)) });
  const putFotos = (f) => db.settings.put({ key: FOTO_KEY, value: JSON.parse(JSON.stringify(f)) });
  const save = async (nb, text = '', nf = null) => {
    if (text) undo = { text, book, fotos };
    await putBook(nb);
    if (nf) await putFotos(nf);
  };
  const undoNow = async () => {
    if (!undo) return;
    await putBook(undo.book);
    await putFotos(undo.fotos);
    undo = null;
  };

  const dayLong = (day) => (day ? new Date(`${day}T12:00:00Z`).toLocaleDateString(locale(), { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }) : '');
  const m = (v) => (v == null ? '–' : `${num(v)} m`);
  const sportName = (p) => (p.sport === 'other' && p.label ? p.label : t(sportOf(p.sport).name));
  const starText = (s) => (s.kind === 'pass2000' ? t('First pass over 2000 m') : s.kind === 'passes' ? t('{n} passes by bike', { n: s.n }) : s.kind === 'top' ? t('Highest point {year}', { year: s.year }) : t('5 new places in {year}', { year: s.year }));
  const where = (f) => (f.source === 'strava' ? t('Strava ride') : f.source === 'gpx' ? t('Ride from a file') : t('Entered by hand'));
  const temp = (v, f) => {
    const lo = f.tmin ?? v.wx?.tmin;
    const hi = f.tmax ?? v.wx?.tmax;
    const mm = v.wx?.mm;
    const parts = [];
    if (lo != null && hi != null) parts.push(lo === hi ? `${lo} °C` : `${lo} – ${hi} °C`);
    if (mm != null) parts.push(mm > 0 ? t('{mm} mm rain', { mm: num(mm) }) : t('dry'));
    return parts.join(' · ');
  };

  const canWx = (v, f) => place?.lat != null && place?.lon != null && f.tmin == null && !v.wx;
  async function getWx(v) {
    busy = v.id;
    msg = '';
    try {
      const w = await fetchTourWeather({ lat: place.lat, lon: place.lon }, v.day, v.day, today);
      const d = w.days[0];
      if (!d || (d.min == null && d.max == null)) throw new Error('empty');
      await save(editVisit(book, v.id, { wx: { tmin: Math.round(d.min), tmax: Math.round(d.max), mm: d.rainMm ?? null } }));
    } catch {
      msg = t('The weather of that day could not be loaded. Please check the connection and try again.');
    }
    busy = '';
  }
  async function pickPhoto(v, e) {
    const file = e.currentTarget.files?.[0];
    e.currentTarget.value = '';
    if (!file) return;
    msg = '';
    try {
      const url = await shrinkImage(file, 900, 0.75);
      await putFotos(addFoto(fotos, v.id, url));
    } catch (err) {
      msg = err?.message || t('This photo could not be read. Please choose a JPG or PNG.');
    }
  }
  const dropPhoto = async (v, i) => {
    undo = { text: t('Photo removed'), book, fotos };
    await putFotos(removeFoto(fotos, v.id, i));
  };
  const openNote = (v) => {
    noteFor = v.id;
    noteText = v.note ?? '';
  };
  async function saveNote(v) {
    await save(editVisit(book, v.id, { note: noteText }));
    noteFor = null;
  }
  const dropVisit = (v) => save(removeVisit(book, v.id), t('Visit of {day} removed', { day: dayLong(v.day) }), pruneFotos(fotos, removeVisit(book, v.id)));
  const dropPlace = () => {
    const name = place.name;
    save(removePlace(book, id), t('«{name}» removed', { name }), pruneFotos(fotos, removePlace(book, id)));
    location.hash = '#/flow/gipfelbuch';
  };

  function onsave(val) {
    if (sheet === 'edit') return save(editPlace(book, id, { name: val.name, sport: val.sport, ele: val.ele, label: val.label, note: val.note }));
    return save(addVisit(book, id, { day: val.day, ref: 'hand' }), t('Visit added to {name}', { name: place.name }));
  }
  const sheetPlace = $derived(!place ? {} : { ...place, day: today });
</script>

<div class="hob gp">
  <header class="ph">
    <Crumb path={[{ href: '#/auswerten', label: t('Analysis|place') }, { href: '#/flow/gipfelbuch', label: t('Summit book') }]} here={place?.name ?? t('Summit book')} />
    {#if place}
      <PageHead title={place.name} text={[sportName(place), t(PLACE_WORD[place.sport] ?? 'Place|gb'), place.ele != null ? m(place.ele) : ''].filter(Boolean).join(' · ')} />
      {#if row}<CoreLine parts={[{ v: row.n, label: tn(row.n, 'visit', 'visits') }, { v: dayLong(row.first), label: t('first time') }, fast ? { v: clock(fast.s), label: t('fastest time up') } : null]} />{/if}
    {:else}
      <PageHead title={t('Summit book')} text="" />
    {/if}
  </header>

  {#if data}
    {#if !place}
      <section data-gp-missing>
        <Empty icon={Mountain} level={2} title={t('This place is not in your summit book (any more)')} text={t('It may have been removed. The summit book lists every place you have.')} action={{ label: t('Open the summit book'), href: '#/flow/gipfelbuch' }} />
      </section>
    {:else}
      {#if undo}<p class="undo" role="status">{undo.text} <button type="button" class="link" onclick={undoNow}>{t('Undo')}</button></p>{/if}
      {#if msg}<p class="err" role="alert">{msg}</p>{/if}

      {#if stars.length}
        <ul class="stars" aria-label={t('Milestones from here')}>{#each stars as s (s.id)}<li><Star size={14} aria-hidden="true" /> {starText(s)}</li>{/each}</ul>
      {/if}

      <section class="gpc" aria-labelledby="gp-vis-h">
        <h2 id="gp-vis-h">{t('Visits')}</h2>
        <ul class="vis">
          {#each visits as { v, f } (v.id)}
            {@const own = fotos[v.id] ?? []}
            <li data-gp-visit={v.id}>
              <div class="top">
                <b>{dayLong(v.day)}</b>
                <small>{[where(f), f.title ? `«${f.title}»` : '', v.hm != null ? `${num(v.hm)} Hm` : ''].filter(Boolean).join(' · ')}</small>
              </div>
              {#if temp(v, f) || f.up}
                <p class="facts">
                  {#if temp(v, f)}<span data-gp-wx>{temp(v, f)}</span>{/if}
                  {#if f.up}<span data-gp-up class:best={fast?.visitId === v.id}>{t('Time up')} <b class="num">{clock(f.up.s)}</b>{fast?.visitId === v.id && visits.length > 1 ? ` · ${t('fastest')}` : ''}</span>{/if}
                </p>
              {/if}
              {#if f.photos.length || own.length}
                <div class="pics">
                  {#each f.photos as u (u)}<img src={u} alt={t('Photo of the ride')} loading="lazy" referrerpolicy="no-referrer" />{/each}
                  {#each own as u, i (i)}
                    <span class="own"><img src={u} alt={t('Your photo')} /><button type="button" class="x" aria-label={t('Remove photo')} onclick={() => dropPhoto(v, i)}><X size={14} aria-hidden="true" /></button></span>
                  {/each}
                </div>
              {/if}
              {#if noteFor === v.id}
                <form class="noteform" onsubmit={(e) => { e.preventDefault(); saveNote(v); }}>
                  <textarea class="inp" rows="3" maxlength="500" bind:value={noteText} aria-label={t('Note')} placeholder={t('What was it like up there?')} data-gp-note-input></textarea>
                  <span class="acts"><button type="submit" class="btn sm hi">{t('Save')}</button><button type="button" class="btn sm" onclick={() => (noteFor = null)}>{t('Cancel')}</button></span>
                </form>
              {:else if v.note}
                <p class="note" data-gp-note>{v.note}</p>
              {/if}
              <div class="acts">
                <button type="button" class="btn sm" onclick={() => openNote(v)} data-gp-note-open>{v.note ? t('Change note') : t('Add a note')}</button>
                {#if own.length < 3}<label class="btn sm cam"><Camera size={16} aria-hidden="true" />{t('Add a photo')}<input type="file" accept="image/*" onchange={(e) => pickPhoto(v, e)} hidden data-gp-photo /></label>{/if}
                {#if canWx(v, f)}<button type="button" class="btn sm" disabled={busy === v.id} onclick={() => getWx(v)} data-gp-getwx>{t('Get the weather of that day')}</button>{/if}
                {#if visits.length > 1}<button type="button" class="link" onclick={() => dropVisit(v)}>{t('Remove this visit')}</button>{/if}
              </div>
            </li>
          {/each}
        </ul>
      </section>

      {#if place.note}<section class="gpc"><h2>{t('Note about the place')}</h2><p class="note">{place.note}</p></section>{/if}

      <p class="next">
        {t('Next:')} <a href="#/flow/gipfelbuch">{t('All places')}</a> · <a href="#/neuland">{t('New ground')}</a> · <a href="#/debrief/sammlung">{t('Collection wall')}</a>
      </p>
      <p class="acts end">
        <button type="button" class="btn" onclick={() => (sheet = 'edit')} data-gp-edit>{t('Change place')}</button>
        <button type="button" class="link" onclick={dropPlace} data-gp-remove>{t('Remove place')}</button>
      </p>
    {/if}
  {/if}
</div>

{#if place}<MainBar main={{ label: t('One more visit'), onclick: () => (sheet = 'visit'), arrow: false }} />{/if}

{#if sheet && place}
  {#key sheet}
    <PlaceSheet title={sheet === 'edit' ? t('Change place') : t('One more visit')} place={sheetPlace} withDay={sheet !== 'edit'} others={data?.others ?? []} {onsave} onclose={() => (sheet = null)} />
  {/key}
{/if}

<style>
  .hob {
    display: flex;
    flex-direction: column;
    gap: var(--sp-4);
    max-width: 760px;
    margin: 0 auto;
    min-width: 0;
  }
  .hob :global(.pagehead) {
    margin: 0;
  }
  .ph {
    display: flex;
    flex-direction: column;
    gap: var(--sp-1);
  }
  h2 {
    margin: 0;
    font: 600 var(--fs-sub) / 1.3 var(--font-body);
  }
  .gpc {
    padding: var(--sp-4);
    border: 1px solid var(--line);
    border-radius: 12px;
    background: var(--paper);
  }
  ul {
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .vis li {
    display: flex;
    flex-direction: column;
    gap: var(--sp-2);
    padding: var(--sp-3) 0;
    border-top: 1px solid var(--line);
  }
  .vis li:first-child {
    margin-top: var(--sp-2);
  }
  .top b {
    display: block;
    overflow-wrap: break-word;
  }
  .top small {
    display: block;
    color: var(--ink-3);
    font-size: var(--fs-small);
    overflow-wrap: break-word;
  }
  .facts {
    display: flex;
    flex-wrap: wrap;
    gap: var(--sp-1) var(--sp-3);
    margin: 0;
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .facts .best {
    color: var(--warn);
  }
  .pics {
    display: flex;
    flex-wrap: wrap;
    gap: var(--sp-2);
  }
  .pics img {
    width: 120px;
    height: 90px;
    object-fit: cover;
    border-radius: 8px;
    background: var(--paper-2);
  }
  .own {
    position: relative;
    display: inline-block;
  }
  .x {
    position: absolute;
    top: 2px;
    right: 2px;
    display: grid;
    place-items: center;
    width: 28px;
    height: 28px;
    border: 1px solid var(--line-strong);
    border-radius: 99px;
    background: var(--paper);
    color: var(--ink);
    cursor: pointer;
  }
  .note {
    margin: 0;
    color: var(--ink-2);
    overflow-wrap: break-word;
    white-space: pre-wrap;
  }
  .noteform {
    display: flex;
    flex-direction: column;
    gap: var(--sp-2);
  }
  .acts {
    display: flex;
    flex-wrap: wrap;
    gap: var(--sp-2);
    align-items: center;
  }
  .acts.end {
    margin: 0;
  }
  .cam {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    cursor: pointer;
  }
  .stars {
    display: flex;
    flex-wrap: wrap;
    gap: var(--sp-2);
  }
  .stars li {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 4px 10px;
    border-radius: 8px;
    background: var(--warn-soft);
    font-size: var(--fs-small);
  }
  .undo,
  .err,
  .next {
    margin: 0;
    color: var(--ink-2);
    font-size: var(--fs-small);
    overflow-wrap: break-word;
  }
  .err {
    color: var(--danger, var(--ink));
  }
  .next a {
    color: var(--ink);
  }
  .link {
    min-height: 44px;
    padding: 0 4px;
    border: 0;
    background: none;
    color: var(--ink);
    font: inherit;
    text-decoration: underline;
    cursor: pointer;
  }
</style>
