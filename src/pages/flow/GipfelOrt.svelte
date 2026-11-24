<script>
  /**
   * «Eine Seite pro Gipfel» (Noah 24.11.2026 «alle 1-5 zusammen», Gipfelbuch ausbauen, idea 3): Auswerten › Gipfelbuch ›
   * one place, #/flow/gipfelbuch/<id>. The visits of the place, newest first, each with its day, where it came from,
   * the temperature, the time up (a climb of the activity that carries the name of the place), photos (Strava's and
   * your own) and a note; the fastest time up on top. Everything can be changed, added and removed with Undo; the weather
   * of a day without Strava values comes on a tap (Open-Meteo, needs a place with coordinates).
   */
  import { liveQuery } from 'dexie';
  import { Mountain, Star, Camera, X, Pencil, Sun, Ellipsis } from '@lucide/svelte';
  import Empty from '../../lib/ui/Empty.svelte';
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
  const dayShort = (day) => (day ? new Date(`${day}T12:00:00Z`).toLocaleDateString(locale(), { day: 'numeric', month: 'numeric', year: '2-digit', timeZone: 'UTC' }) : '–');
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
      <div class="hero" data-gp-hero>
        <svg class="sil" viewBox="0 0 390 120" preserveAspectRatio="none" aria-hidden="true">
          <path class="far" d="M0 120V70l50-24 45 28 60-52 70 62 45-30 60 40 60-32V120Z" />
          <path class="near" d="M0 120V92l70-30 55 34 65-50 70 56 60-34 70 28V120Z" />
        </svg>
        <small>{[sportName(place), t(PLACE_WORD[place.sport] ?? 'Place|gb')].join(' · ')}</small>
        <h1>{place.name}</h1>
        {#if place.ele != null}<span class="ele num">{m(place.ele)}</span>{/if}
      </div>
      {#if row}
        <div class="tiles" data-core-line>
          <div><b class="num">{row.n}</b><small>{tn(row.n, 'visit', 'visits')}</small></div>
          <div><b class="num">{dayShort(row.first)}</b><small>{t('first time')}</small></div>
          <div><b class="num">{fast ? clock(fast.s) : '–'}</b><small>{t('fastest time up')}</small></div>
        </div>
      {/if}
    {:else}
      <h1 class="plain">{t('Summit book')}</h1>
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
          {#each visits as { v, f }, i (v.id)}
            {@const own = fotos[v.id] ?? []}
            <li data-gp-visit={v.id} class:first={i === visits.length - 1}>
              <span class="pt" aria-hidden="true"></span>
              <div class="top">
                <b>{dayLong(v.day)}</b>
                <small>{[where(f), f.title ? `«${f.title}»` : '', v.hm != null ? `${num(v.hm)} Hm` : ''].filter(Boolean).join(' · ')}</small>
              </div>
              {#if temp(v, f) || f.up}
                <p class="facts">
                  {#if temp(v, f)}<span class="mark" data-gp-wx>{temp(v, f)}</span>{/if}
                  {#if f.up}<span class="mark" data-gp-up class:best={fast?.visitId === v.id}>{fast?.visitId === v.id && visits.length > 1 ? '★ ' : ''}{t('Time up')} <b class="num">{clock(f.up.s)}</b>{fast?.visitId === v.id && visits.length > 1 ? ` · ${t('fastest')}` : ''}</span>{/if}
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
                <button type="button" class="qa" onclick={() => openNote(v)} data-gp-note-open><Pencil size={16} aria-hidden="true" />{v.note ? t('Change note') : t('Note')}</button>
                {#if own.length < 3}<label class="qa"><Camera size={16} aria-hidden="true" />{t('Photo')}<input type="file" accept="image/*" onchange={(e) => pickPhoto(v, e)} hidden data-gp-photo /></label>{/if}
                {#if canWx(v, f)}<button type="button" class="qa" disabled={busy === v.id} onclick={() => getWx(v)} data-gp-getwx title={t('Get the weather of that day')}><Sun size={16} aria-hidden="true" />{t('Weather')}</button>{/if}
                {#if visits.length > 1}
                  <details class="more">
                    <summary aria-label={t('More')}><Ellipsis size={18} aria-hidden="true" /></summary>
                    <button type="button" class="link" onclick={() => dropVisit(v)} data-gp-drop>{t('Remove this visit')}</button>
                  </details>
                {/if}
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
  .ph {
    display: flex;
    flex-direction: column;
    gap: var(--sp-3);
  }
  .hero {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 2px;
    min-height: 150px;
    padding: var(--sp-4);
    border-radius: 16px;
    background: var(--ok-soft);
    overflow: hidden;
  }
  .hero > :not(.sil) {
    position: relative;
  }
  .hero small {
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .hero h1,
  .plain {
    margin: 0;
    font: 700 var(--fs-page) / 1.15 var(--font-title);
    overflow-wrap: break-word;
  }
  .ele {
    margin-top: var(--sp-2);
    padding: 2px 12px;
    border-radius: 99px;
    background: var(--paper);
    font-weight: 600;
  }
  .sil {
    position: absolute;
    right: 0;
    bottom: 0;
    left: 0;
    width: 100%;
    height: 60%;
  }
  .sil .far {
    fill: var(--accent);
    opacity: 0.18;
  }
  .sil .near {
    fill: var(--accent);
    opacity: 0.3;
  }
  .tiles {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: var(--sp-2);
  }
  .tiles div {
    min-width: 0;
    padding: var(--sp-3);
    border: 1px solid var(--line);
    border-radius: 12px;
    background: var(--paper);
  }
  .tiles b {
    display: block;
    font: 600 var(--fs-sub) / 1.2 var(--font-body);
    overflow-wrap: break-word;
  }
  .tiles small {
    display: block;
    margin-top: 2px;
    color: var(--ink-3);
    font-size: var(--fs-tiny);
    line-height: 1.3;
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
  .vis {
    margin-top: var(--sp-3);
  }
  .vis li {
    position: relative;
    display: flex;
    flex-direction: column;
    gap: var(--sp-2);
    padding: 0 0 var(--sp-4) var(--sp-5);
  }
  .vis li::before {
    content: '';
    position: absolute;
    top: 14px;
    bottom: -2px;
    left: 5px;
    width: 2px;
    background: var(--line);
  }
  .vis li:last-child::before {
    display: none;
  }
  .pt {
    position: absolute;
    top: 4px;
    left: 0;
    width: 12px;
    height: 12px;
    box-sizing: border-box;
    border: 2px solid var(--accent);
    border-radius: 99px;
    background: var(--paper);
  }
  .vis li.first .pt {
    background: var(--accent);
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
  .mark {
    padding: 2px 10px;
    border-radius: 8px;
    background: var(--paper-2);
  }
  .mark.best {
    background: var(--warn-soft);
    color: var(--warn);
  }
  .qa {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    min-height: 44px;
    padding: 0 10px 0 0;
    border: 0;
    background: none;
    color: var(--accent);
    font: 600 var(--fs-small) / 1.3 var(--font-body);
    cursor: pointer;
  }
  .more {
    position: relative;
    margin-left: auto;
  }
  .more summary {
    display: grid;
    place-items: center;
    width: 44px;
    height: 44px;
    border-radius: 99px;
    color: var(--ink-2);
    list-style: none;
    cursor: pointer;
  }
  .more summary::-webkit-details-marker {
    display: none;
  }
  .more[open] {
    flex: 1 1 100%;
  }
  .more[open] summary {
    margin-left: auto;
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
    font-style: italic;
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
