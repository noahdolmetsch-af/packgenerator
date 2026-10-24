<script>
  /**
   * Paket S «Reise-Spur» (Noah 19.10.2026 «1a und b möglich 2a 3a 4a 5a»): one tour as a journey.
   * The zoomable map with the line of every day, the places, notes and photos (2a); day by day the
   * timeline with gaps and where the line comes from (spec 6); the read link for the family (4a); the
   * travel book as PDF (spec 6) and the Neuland of this tour (tie to Paket M).
   * Photos stay on this device (3a). Loaded only when opened (App: dynamic import), with its map.
   * #/spur/<tripId>
   */
  import { liveQuery } from 'dexie';
  import { Map as MapIcon, Share2, Trash2, Copy, RefreshCw, FileDown, MapPin, Pencil, Route as RouteIcon } from '@lucide/svelte';
  import { db } from '../lib/db.js';
  import { t, tn, num, locale } from '../lib/i18n.svelte.js';
  import PathHead from '../lib/ui/PathHead.svelte';
  import Empty from '../lib/ui/Empty.svelte';
  import Skeleton from '../lib/ui/Skeleton.svelte';
  import RenameSheet from '../lib/ui/RenameSheet.svelte';
  import { askDelete, deleteWithUndo } from '../lib/ui/ask.js';
  import { offerDone } from '../lib/ui/rename.svelte.js';
  import { openTrip } from '../lib/nav.js';
  import { activitiesForTrip } from '../lib/training.js';
  import { strava, loadLine } from '../lib/strava/client.svelte.js';
  import { tourSpur, shownLines, mapPoints, zurichTime } from '../lib/spur/spur.js';
  import { decodePolyline } from '../lib/spur/polyline.js';
  import { neuland } from '../lib/spur/neuland.js';
  import { linkPayload, putLink, deleteLink, linkOf, LINK_ERRORS } from '../lib/spur/link.js';
  import TourMap from '../lib/spur/TourMap.svelte';
  import PlaceSheet from '../lib/spur/PlaceSheet.svelte';
  import RecordButton from '../lib/spur/RecordButton.svelte';
  import { localDay } from '../lib/localday.js';
  import { daySum, durText } from '../lib/live/after.js';

  let { id = '' } = $props();
  // svelte-ignore state_referenced_locally
  const tripQ = liveQuery(() => db.trips.get(id));
  const actsQ = liveQuery(() => db.activities.toArray());
  const bookQ = liveQuery(() => db.kmBook.toArray());
  const ridesQ = liveQuery(() => db.rides.toArray());
  // svelte-ignore state_referenced_locally
  const tracksQ = liveQuery(() => db.tracks.where('tripId').equals(id).toArray());
  // svelte-ignore state_referenced_locally
  const notesQ = liveQuery(() => db.notes.filter((x) => x.tripId === id).toArray());

  const trip = $derived($tripQ ?? null);
  // the path back «Tour» opens this trip in Packen
  $effect(() => {
    if (trip) openTrip(trip.id);
  });
  const acts = $derived(trip ? activitiesForTrip(trip, $actsQ ?? [], $bookQ ?? []) : []);
  const spur = $derived(trip ? tourSpur(trip, { acts, rides: $ridesQ ?? [], tracks: $tracksQ ?? [], notes: $notesQ ?? [] }) : null);
  const lines = $derived(shownLines(spur));
  const points = $derived(mapPoints(spur));
  const today = localDay();

  let dayPick = $state(null); // null: all days
  const focus = $derived.by(() => {
    if (!spur || dayPick == null) return null;
    const d = spur.days.find((x) => x.day === dayPick);
    return d ? { lines: d.lines.filter((l) => !l.hidden).map((l) => l.pts), points: [...d.places, ...d.notes].filter((x) => x.pos).map((x) => x.pos) } : null;
  });
  const mapLines = $derived(dayPick == null ? lines : lines.filter((l) => l.day === dayPick));
  const mapPts = $derived(dayPick == null ? points : points.filter((p) => p.day === dayPick));
  let picked = $state(null);

  const dayName = (d) => new Date(`${d}T12:00:00`).toLocaleDateString(locale(), { weekday: 'short', day: 'numeric', month: 'long' });
  const SRC = { strava: 'Strava / Garmin', gpx: 'GPX', rec: 'Recorded|spur' };
  const range = $derived(spur?.days.length ? (spur.days.length === 1 ? dayName(spur.days[0].day) : `${dayName(spur.days[0].day)} – ${dayName(spur.days.at(-1).day)}`) : '');

  /* ---------- lines missing (rides fetched before the list carried the line) ---------- */
  let fetching = $state(false);
  let fetchMsg = $state('');
  const noLine = $derived(acts.filter((a) => !a.line));
  async function fetchLines() {
    fetching = true;
    fetchMsg = '';
    let got = 0;
    try {
      for (const a of noLine.slice(0, 30)) if (await loadLine(db, a.id)) got++;
      fetchMsg = got ? tn(got, '{n} line fetched.', '{n} lines fetched.') : t('Strava sent no line (an indoor ride, or the route is hidden).');
    } catch {
      fetchMsg = t('Strava could not be reached. Try again later.');
    } finally {
      fetching = false;
    }
  }

  /* ---------- places: add, rename, delete (rule 18) ---------- */
  let addPlace = $state(false);
  let renaming = $state(null);
  async function renamePlace(p, text) {
    await db.tracks.update(p.id, { text });
    offerDone(t('Saved.'));
  }
  async function dropTrack(x, name) {
    const ok = await askDelete({ title: t('Delete "{name}"?', { name }), text: x.kind === 'rec' ? t('The recorded line goes. A Strava or Garmin ride stays.') : t('The place goes from the map and the days.') });
    if (ok !== 'delete') return;
    await deleteWithUndo({ run: async () => (await db.tracks.delete(x.id), x), undo: (saved) => db.tracks.put(saved), text: t('"{name}" deleted.', { name }), name });
    if (picked?.id === x.id) picked = null;
  }
  const recOf = (lineId) => ($tracksQ ?? []).find((x) => x.kind === 'rec' && lineId.startsWith(`t-${x.id}-`));

  /* ---------- read link for the family (4a) ---------- */
  let optPlaces = $state(true);
  let optNotes = $state(false);
  let optCut = $state(true);
  let linkBusy = $state(false);
  let linkErr = $state('');
  const link = $derived(trip?.spurLink ?? null);
  const linkUrl = $derived(link ? linkOf(link.id, link.key) : '');
  async function share() {
    linkBusy = true;
    linkErr = '';
    try {
      const made = await putLink(linkPayload(trip, spur, { places: optPlaces, notes: optNotes, cut: optCut }), link);
      await db.trips.update(trip.id, { spurLink: { ...made, opts: { places: optPlaces, notes: optNotes, cut: optCut } } });
      offerDone(link ? t('Link updated.') : t('Link made. Send it to your family.'));
    } catch (e) {
      linkErr = t(LINK_ERRORS[e?.code] ?? LINK_ERRORS.server_error);
    } finally {
      linkBusy = false;
    }
  }
  $effect(() => {
    const o = trip?.spurLink?.opts;
    if (o) {
      optPlaces = o.places !== false;
      optNotes = !!o.notes;
      optCut = o.cut !== false;
    }
  });
  async function copy() {
    try {
      await navigator.clipboard.writeText(linkUrl);
      offerDone(t('Link copied.'));
    } catch {
      linkErr = t('Copying did not work: hold the link and copy it.');
    }
  }
  async function send() {
    try {
      await navigator.share({ title: trip.title, text: t('Follow my tour «{name}»', { name: trip.title }), url: linkUrl });
    } catch {
      /* closed */
    }
  }
  async function unshare() {
    const ok = await askDelete({ title: t('Delete the link?'), text: t('Whoever has it can no longer open it. Your tour stays here.'), label: t('Delete link') });
    if (ok !== 'delete') return;
    linkBusy = true;
    try {
      await deleteLink(link);
      await db.trips.update(trip.id, { spurLink: null });
      offerDone(t('Link deleted.'));
    } catch (e) {
      linkErr = t(LINK_ERRORS[e?.code] ?? LINK_ERRORS.server_error);
    } finally {
      linkBusy = false;
    }
  }

  /* ---------- travel book (PDF) ---------- */
  let bookBusy = $state(false);
  async function book() {
    bookBusy = true;
    try {
      const { makeBook } = await import('../lib/spur/book.js');
      const bytes = await makeBook(trip, spur, { tr: t, dayName });
      const url = URL.createObjectURL(new Blob([bytes], { type: 'application/pdf' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = `${(trip.title || 'Reisebuch').replace(/[^\p{L}\p{N} _-]/gu, '').trim() || 'Reisebuch'}.pdf`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 30_000);
    } catch (e) {
      console.error(e);
      offerDone(t('The travel book could not be made. Try again.'));
    } finally {
      bookBusy = false;
    }
  }

  /* ---------- Neuland of this tour ---------- */
  let showNeu = $state(false);
  const neu = $derived.by(() => {
    if (!showNeu || !spur) return null;
    const mine = new Set(lines.map((l) => l.id));
    const others = [
      ...($actsQ ?? []).filter((a) => a.line && !mine.has(`a-${a.id}`)).map((a) => ({ day: a.day, pts: decodePolyline(a.line) })),
      ...($ridesQ ?? []).filter((r) => Array.isArray(r.line) && !mine.has(`r-${r.id}`)).map((r) => ({ day: r.date, pts: r.line })),
    ];
    const res = neuland([...others, ...lines.map((l) => ({ day: l.day, pts: l.pts }))]);
    const fresh = new Set();
    for (const d of spur.days) for (const c of res.byDay.get(d.day) ?? []) fresh.add(c);
    return { fresh, n: fresh.size };
  });
</script>

{#if $tripQ === undefined}
  <Skeleton rows={4} />
{:else if !trip}
  <Empty icon={RouteIcon} title={t('Trip not found')} text={t('It may have been deleted.')} action={{ label: t('To the trips'), onclick: () => (location.hash = '#/trips') }} />
{:else}
  <div class="spur-page">
    <PathHead crumbs={[{ label: t('Trips|place'), href: '#/trips' }, { label: trip.title, href: '#/pack' }]} here={t('Travel track')} title={trip.title} sub={[range, spur.km ? `${num(spur.km)} km` : '', tn(spur.days.length, '{n} day', '{n} days')].filter(Boolean).join(' · ')} />
    <p class="intro tp-muted">{t('The line of each day comes from Strava or Garmin by itself; «I am here» and your own recording add to it. Photos stay on this device.')}</p>

    {#if spur.missingLines && strava.key}
      <p class="card note">{tn(noLine.length, '{n} ride has no line yet.', '{n} rides have no line yet.')} <button type="button" class="btn sm" disabled={fetching} onclick={fetchLines}>{fetching ? t('Loading …') : t('Fetch lines from Strava')}</button>{#if fetchMsg}<span role="status"> {fetchMsg}</span>{/if}</p>
    {:else if spur.missingLines}
      <p class="card note tp-small">{t('Some rides have no line. Connect Strava under Bikes › Care, then fetch them here.')}</p>
    {/if}

    <section aria-labelledby="map-h">
      <h2 id="map-h" class="sh">{t('Map')}</h2>
      {#if spur.days.length > 1}
        <div class="tp-chips days" role="group" aria-label={t('Days')}>
          <button type="button" class="tp-chip" aria-pressed={dayPick == null} onclick={() => (dayPick = null)}>{t('All days')}</button>
          {#each spur.days as d (d.day)}<button type="button" class="tp-chip" aria-pressed={dayPick === d.day} onclick={() => (dayPick = d.day)}>{t('Day {n}', { n: d.n })}</button>{/each}
        </div>
      {/if}
      {#if lines.length || points.length}
        <TourMap lines={mapLines} points={mapPts} {focus} cells={neu?.fresh ?? null} height={440} onpick={(p) => (picked = p)} />
        <label class="neu"><input type="checkbox" bind:checked={showNeu} /> {t('Show Neuland: land none of your earlier rides passed')}{#if neu}<b class="num"> · {tn(neu.n, '{n} new square', '{n} new squares')}</b>{/if}</label>
      {:else}
        <div class="card empty-map"><MapIcon size={28} aria-hidden="true" /><p>{t('No line yet. After the ride it comes from Strava or Garmin; on the way, «I am here» or «Record» add to it.')}</p></div>
      {/if}
      {#if picked}
        <div class="card pick" role="region" aria-label={t('Chosen on the map')}>
          {#if picked.photo}<img src={picked.photo} alt={picked.text || t('Photo')} />{/if}
          <div>
            <p class="tp-small tp-muted">{t('Day {n}', { n: picked.n })} · {picked.at ? zurichTime(Date.parse(picked.at)) : ''}{picked.guessed ? ` · ${t('place estimated from the time')}` : ''}</p>
            <p>{picked.text || (picked.kind === 'place' ? t('I am here') : '')}</p>
            <button type="button" class="tp-link" onclick={() => (picked = null)}>{t('Close')}</button>
          </div>
        </div>
      {/if}
    </section>

    {#if trip.startDate && today >= trip.startDate && !trip.finished}
      <div class="onway">
        <button type="button" class="btn" onclick={() => (addPlace = true)}><MapPin size={18} aria-hidden="true" />{t('I am here')}</button>
        <RecordButton {trip} />
      </div>
    {/if}

    <section aria-labelledby="days-h">
      <h2 id="days-h" class="sh">{t('Day by day')}</h2>
      <ol class="daylist">
        {#each spur.days as d (d.day)}
          <li class="card">
            <h3><button type="button" class="tp-link dayb" onclick={() => ((dayPick = d.day), document.getElementById('map-h')?.scrollIntoView({ behavior: 'smooth', block: 'start' }))}>{t('Day {n}', { n: d.n })} · {dayName(d.day)}</button></h3>
            <p class="tp-small tp-muted num">{d.km ? `${num(d.km)} km` : t('No ride')}{d.sources.length ? ` · ${d.sources.map((s) => t(SRC[s])).join(', ')}` : ''}</p>
            <!-- Paket U3 «Live-Karte» (Noah «2a»): the evening line of the day from your own recordings -->
            {#each [daySum($tracksQ ?? [], d.day)].filter(Boolean) as ds (d.day)}<p class="tp-small eve num" data-day-sum>{t('Evening: {km} km, {ride} riding', { km: num(ds.km), ride: durText(ds.movingS) })} · {ds.n ? tn(ds.n, '{n} pause ({time})', '{n} pauses ({time})', { time: durText(ds.stoppedS) }) : t('no pause')}</p>{/each}
            {#if d.places.length || d.notes.length || d.gaps.length || d.lines.some((l) => l.src === 'rec')}
              <ul class="steps">
                {#each [...d.places.map((p) => ({ ...p, k: 'place' })), ...d.notes.map((x) => ({ ...x, k: 'note' })), ...d.gaps.map((g, i) => ({ id: `gap-${d.day}-${i}`, at: new Date(g.from).toISOString(), k: 'gap', g }))].sort((a, b) => String(a.at).localeCompare(String(b.at))) as s (s.id)}
                  <li class={s.k}>
                    <span class="tm num">{zurichTime(Date.parse(s.at))}</span>
                    <div class="tx">
                      {#if s.k === 'gap'}
                        <span class="tp-muted">{t('Gap {from}–{to}', { from: zurichTime(s.g.from), to: zurichTime(s.g.to) })}{s.g.filled ? ` · ${t('filled from Strava')}` : ''}</span>
                      {:else}
                        <span>{#if s.k === 'place'}<MapPin size={14} aria-hidden="true" /> {/if}{s.text || (s.k === 'place' ? t('I am here') : '')}</span>
                        {#if s.photo}<img src={s.photo} alt={s.text || t('Photo')} />{/if}
                      {/if}
                    </div>
                    {#if s.k === 'place'}
                      <span class="act">
                        <button type="button" class="tp-icon-btn" aria-label={t('Change text')} onclick={() => (renaming = s)}><Pencil size={16} aria-hidden="true" /></button>
                        <button type="button" class="tp-icon-btn" aria-label={t('Delete place')} onclick={() => dropTrack(s, s.text || t('I am here'))}><Trash2 size={16} aria-hidden="true" /></button>
                      </span>
                    {/if}
                  </li>
                {/each}
              </ul>
              {#each d.lines.filter((l) => l.src === 'rec') as l (l.id)}
                {@const r = recOf(l.id)}
                {#if r && l.id.endsWith('-0')}
                  <p class="tp-small rec">{t('Own recording {from}–{to}', { from: zurichTime(r.startAt), to: zurichTime(r.endAt) })}{l.hidden ? ` · ${t('the Strava line counts')}` : ''} <button type="button" class="tp-link" onclick={() => dropTrack(r, t('Recording'))}>{t('Delete')}</button></p>
                {/if}
              {/each}
            {:else}
              <p class="tp-small tp-muted">{t('No places or notes on this day.')}</p>
            {/if}
          </li>
        {/each}
      </ol>
    </section>

    <section aria-labelledby="share-h">
      <h2 id="share-h" class="sh"><Share2 size={18} aria-hidden="true" /> {t('Link for your family')}</h2>
      <p class="ssub">{t('Read only, no account needed. Sealed on this device; only who has the link can read it.')}</p>
      <div class="card">
        <fieldset class="opts">
          <legend class="tp-small tp-muted">{t('What goes in')}</legend>
          <label><input type="checkbox" checked disabled /> {t('The line and the km of each day')}</label>
          <label><input type="checkbox" bind:checked={optPlaces} /> {t('Places «I am here» with their text')}</label>
          <label><input type="checkbox" bind:checked={optNotes} /> {t('The texts of your notes')}</label>
          <label><input type="checkbox" bind:checked={optCut} /> {t('Leave out the first and last 500 m (so home is not on the map)')}</label>
          <p class="tp-small tp-muted">{t('Photos never go in: they stay on this device.')}</p>
        </fieldset>
        {#if link}
          <p class="url"><input class="inp" readonly value={linkUrl} aria-label={t('The link')} onfocus={(e) => e.currentTarget.select()} /></p>
          <div class="btns">
            <button type="button" class="btn" onclick={copy}><Copy size={18} aria-hidden="true" />{t('Copy')}</button>
            {#if typeof navigator !== 'undefined' && navigator.share}<button type="button" class="btn" onclick={send}><Share2 size={18} aria-hidden="true" />{t('Send')}</button>{/if}
            <button type="button" class="btn" disabled={linkBusy} onclick={share}><RefreshCw size={18} aria-hidden="true" />{t('Update')}</button>
            <button type="button" class="btn danger" disabled={linkBusy} onclick={unshare}><Trash2 size={18} aria-hidden="true" />{t('Delete link')}</button>
          </div>
          <p class="tp-small tp-muted">{t('Last updated {when}.', { when: new Date(link.at).toLocaleString(locale(), { dateStyle: 'medium', timeStyle: 'short' }) })} {t('The family sees the state of the last update.')}</p>
        {:else}
          <button type="button" class="btn hi" disabled={linkBusy || !spur.hasLine && !spur.days.some((d) => d.places.length)} onclick={share}><Share2 size={18} aria-hidden="true" />{linkBusy ? t('Making the link …') : t('Make a link')}</button>
          {#if !spur.hasLine && !spur.days.some((d) => d.places.length)}<p class="tp-small tp-muted">{t('A link needs a line or a place first.')}</p>{/if}
        {/if}
        {#if linkErr}<p class="warn" role="alert">{linkErr}</p>{/if}
      </div>
    </section>

    <section aria-labelledby="book-h">
      <h2 id="book-h" class="sh"><FileDown size={18} aria-hidden="true" /> {t('Travel book')}</h2>
      <p class="ssub">{t('A PDF with the whole line, then one page per day with its line, places, notes and photos.')}</p>
      <div class="card"><button type="button" class="btn" disabled={bookBusy} onclick={book}><FileDown size={18} aria-hidden="true" />{bookBusy ? t('Making the book …') : t('Travel book as PDF')}</button></div>
    </section>
  </div>
{/if}

{#if addPlace && trip}<PlaceSheet {trip} onclose={() => (addPlace = false)} />{/if}
{#if renaming}<RenameSheet kicker={t('Place')} title={t('Change text')} value={renaming.text ?? ''} empty={t('Empty: shows as «I am here».')} max={1000} onsave={(v) => renamePlace(renaming, v)} onclose={() => (renaming = null)} />{/if}

<style>
  .spur-page {
    display: grid;
    /* Gesamttest 20.10.2026 C4: the column never grows wider than the screen (a long trip name wraps) */
    grid-template-columns: minmax(0, 1fr);
    min-width: 0;
    gap: 18px;
    max-width: 960px;
  }
  .intro {
    margin: -8px 0 0;
  }
  .note {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;
  }
  .days {
    margin-bottom: 8px;
    flex-wrap: wrap;
  }
  .neu {
    display: flex;
    gap: 8px;
    align-items: center;
    margin-top: 8px;
    font-size: var(--fs-small);
  }
  .empty-map {
    display: flex;
    gap: 12px;
    align-items: center;
    color: var(--ink-2);
  }
  .pick {
    display: flex;
    gap: 12px;
    margin-top: 10px;
    align-items: flex-start;
  }
  .pick img {
    width: min(40%, 240px);
    border-radius: 8px;
  }
  .pick p {
    margin: 0 0 4px;
  }
  .onway {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
  }
  .onway :global(.btn) {
    gap: 6px;
  }
  .daylist {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    gap: 10px;
  }
  .daylist h3 {
    margin: 0;
    font-size: var(--fs-section);
  }
  .dayb {
    font-weight: 700;
    color: var(--ink);
  }
  .steps {
    list-style: none;
    margin: 8px 0 0;
    padding: 0;
    display: grid;
    gap: 8px;
  }
  .steps li {
    display: grid;
    grid-template-columns: 48px 1fr auto;
    gap: 8px;
    align-items: start;
  }
  .steps .tm {
    color: var(--ink-2);
    font-weight: 600;
  }
  .steps img {
    display: block;
    margin-top: 6px;
    max-width: min(100%, 320px);
    border-radius: 8px;
  }
  .act {
    display: flex;
    gap: 2px;
  }
  .rec {
    margin: 8px 0 0;
  }
  .eve {
    margin: 4px 0 0;
    color: var(--ink-2);
  }
  .opts {
    border: 0;
    margin: 0 0 10px;
    padding: 0;
    display: grid;
    gap: 6px;
  }
  .opts label {
    display: flex;
    gap: 8px;
    align-items: flex-start;
  }
  .url input {
    width: 100%;
  }
  .btns {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin: 8px 0;
  }
  .btns :global(.btn),
  section :global(.btn) {
    gap: 6px;
  }
  .sh {
    display: flex;
    align-items: center;
    gap: 6px;
  }
</style>
