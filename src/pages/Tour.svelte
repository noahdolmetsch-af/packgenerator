<script>
  /**
   * «Tour» (Noah 19.10.2026 21:05 «1a 2 beides 3b 4 beides 5a»): the page of one finished tour, #/tour/<key>,
   * the same for a Strava activity, several activities joined into one tour and a trip of the Packmodus
   * (touren/tour.js keys). Before, a finished tour in «Abgeschlossene Touren» only had its name to tap and
   * opened the training page; a trip opened its long Rückblick.
   *
   *   - head: the path back, the name, dates, sport, bike, the state pill, «changed», and ••• with rename,
   *     correct values (3b), hide, take apart (5a) and delete (with Undo);
   *   - 2 «beides»: the parts Übersicht · Werte · Gepäck · Tagebuch · Rückblick stand one below the other with
   *     a jump bar, or one at a time as tabs («Alles auf einer Seite» / «Einzeln», kept for every tour);
   *   - Übersicht: the chosen key figures as tiles, the map with the line and the elevation profile linked
   *     with it (the finger on the profile shows the spot on the map);
   *   - Rückblick (1a): of a trip its state and the way into the full Rückblick; of activities an own rating;
   *   - «Daraus machen»: ride it again, save as a template, the same route, share.
   * Observation only for health values.
   */
  import { liveQuery } from 'dexie';
  import { db } from '../lib/db.js';
  import { t, tn, num, nameOf, locale } from '../lib/i18n.svelte.js';
  import { localDay } from '../lib/localday.js';
  import { phone } from '../lib/media.svelte.js';
  import { zones } from '../lib/strava/zones.svelte.js';
  import PathHead from '../lib/ui/PathHead.svelte';
  import Skeleton from '../lib/ui/Skeleton.svelte';
  import Empty from '../lib/ui/Empty.svelte';
  import Seg from '../lib/ui/Seg.svelte';
  import TripState from '../lib/ui/TripState.svelte';
  import MoreActions from '../lib/ui/MoreActions.svelte';
  import RenameSheet from '../lib/ui/RenameSheet.svelte';
  import Help from '../lib/ui/Help.svelte';
  import TourMap from '../lib/spur/TourMap.svelte';
  import ZoneBar from '../lib/strava/ZoneBar.svelte';
  import KindIcon from '../lib/strava/KindIcon.svelte';
  import TourProfile from '../lib/touren/TourProfile.svelte';
  import CorrectSheet from '../lib/touren/tour/CorrectSheet.svelte';
  import KpiSheet from '../lib/touren/tour/KpiSheet.svelte';
  import TourAnalysis from '../lib/touren/tour/TourAnalysis.svelte';
  import TourCourse from '../lib/touren/tour/TourCourse.svelte';
  import StravaAnalysis from '../lib/touren/strava/StravaAnalysis.svelte';
  import { weight } from '../lib/weight.svelte.js';
  import { kgOn } from '../lib/weight.js';
  import { courseOf } from '../lib/touren/tourcourse.js';
  import TourGear from '../lib/touren/tour/TourGear.svelte';
  import TourLandscape from '../lib/touren/tour/TourLandscape.svelte';
  import RouteChart from '../lib/touren/tour/RouteChart.svelte';
  import { routeSeries, personalLine } from '../lib/touren/tourextra.js';
  import { startPlace, fetchTourWeather, wxSummary } from '../lib/touren/tourwx.js';
  import { ridesWx, ensureRidesWx } from '../lib/touren/ridewx.js';
  import '../lib/trip/trip.css';
  import TripBand from '../lib/trip/TripBand.svelte';
  import TourAsk from '../lib/touren/tour/TourAsk.svelte';
  import { countdownOf, sayOf, kpisShown, hasSteps } from '../lib/touren/tourstep.js';
  import { tripEnd } from '../lib/tripstate.js';
  import { loadTour } from '../lib/touren/tourdata.js';
  import { renameTour, saveOwn, setHidden, saveNotes, deleteTour, undoDelete, leaveTour, restoreGroups } from '../lib/touren/touredit.js';
  import { PARTS, KPIS, pageOpts, linesOf, joinedLine, profileOf, kpiOf, tourHref, shareText, TOUR_PAGE_KEY } from '../lib/touren/tour.js';
  import { fieldsOf, zoneParts } from '../lib/touren/aktivitaeten.js';
  import { pointAlong } from '../lib/spur/polyline.js';
  import { KIND_NAMES, typeKey, sameRoute, ftpEstimate } from '../lib/training.js';
  import { tripPhotos, addTripPhotos, removeTripPhoto, FOTO_MAX, FOTOS_PER_TRIP, coverPhoto, tripCover, setTripCover } from '../lib/lernen/fotos.js';
  import { shrinkImage } from '../lib/photo.js';
  import { saveTripAsTemplate } from '../lib/templates.js';
  import { newTrip, openNew, RIDES_HREF } from '../lib/nav.js';
  import { askDelete, deleteWithUndo } from '../lib/ui/ask.js';
  import { offerDone, offerRename } from '../lib/ui/rename.svelte.js';
  import { FIELD_HELP } from '../lib/daumen.js';
  import { rideTimeS, elapsedS, n0, n1, dates, DASH } from '../lib/review/fmt.js';
  import { tidyAllTitles, fileOf, needsTitle } from '../lib/touren/titel.js';
  import { ask, showNow } from '../lib/remind/ask.svelte.js';
  import { Route, Pencil, SlidersHorizontal, EyeOff, Eye, Unlink, Trash2, ExternalLink, Activity, Star, Share2, Copy, Map as MapIcon, ImagePlus, X, ChevronRight, Repeat, BookmarkPlus, Plus, LayoutGrid, CloudSun, RefreshCw, Heart, FileText, Bell } from '@lucide/svelte';

  let { key = '' } = $props();
  const today = localDay();

  const dataQ = $derived(liveQuery(() => loadTour(db, key, { today, bounds: zones.bounds })));
  const d = $derived($dataQ);
  const optsQ = liveQuery(() => db.settings.get(TOUR_PAGE_KEY));
  const opts = $derived(pageOpts($optsQ?.value));
  const saveOpts = (patch) => db.settings.put({ key: TOUR_PAGE_KEY, value: { ...opts, ...patch } });

  const row = $derived(d?.row ?? null);
  const name = $derived(row?.name || (row?.type ? t(typeKey(row.type)) : t('Tour')));
  const bikeName = $derived(Object.fromEntries((d?.bikes ?? []).map((b) => [b.id, b.name])));
  const lines = $derived(d && !d.missing ? linesOf(d.acts, d.trip) : []);
  const prof = $derived(d && !d.missing ? profileOf(d.acts, d.trip) : []);
  let frac = $state(null);
  const hasCourse = $derived(d && !d.missing ? !!courseOf(d.acts, d.trip) : false);
  const marker = $derived(frac == null ? null : pointAlong(joinedLine(lines), frac));
  const own = $derived(d?.kind === 'a' ? (d.acts[0]?.own ?? {}) : d?.kind === 'g' ? (d.group?.own ?? {}) : (d?.trip?.own ?? {}));
  /* ---- «Eine Tour, eine Seite» (UI-Ziele #5, 0.174): a trip with a packing list has the same head and step
     tabs as Planen, Packen, Unterwegs and Rückblick; this page is its tab «Auswertung» ---- */
  const steps = $derived(d?.kind === 't' && hasSteps(d.trip));
  const over = $derived(d?.kind !== 't' || !d.trip?.startDate || !!d.trip.finished || (tripEnd(d.trip) ?? '') < today);
  // #8: without a ride (Strava or uploaded) after the tour: a card «Fahrt verbinden» instead of empty values
  const noRide = $derived(d?.kind === 't' && !d.acts.length && !(d.rides ?? []).length);
  // #10: the warm countdown chip on the drawn head and one sentence with a number
  const cd = $derived(d?.kind === 't' ? countdownOf(d.trip, today) : null);
  const tripSay = $derived.by(() => {
    if (d?.kind !== 't') return null;
    const es = d.trip?.entries ?? [];
    return sayOf(d.trip, today, { km: row?.km ?? d.trip?.route?.km ?? null, items: es.length, open: es.filter((e) => !e.packed).length });
  });
  const notes = $derived(d?.kind === 'a' ? { diary: d.acts[0]?.note ?? '', ...(d.acts[0]?.own ?? {}) } : d?.kind === 'g' ? (d.group ?? {}) : { ...(d?.trip?.own ?? {}), diary: d?.debrief?.diary?.text ?? '' });

  /* ---- 2 «beides»: tabs or one page with a jump bar ---- */
  let part = $state('overview');
  const shows = (k) => opts.mode === 'all' || part === k;
  function go(k) {
    if (opts.mode === 'tabs') part = k;
    else document.getElementById(`tour-${k}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
  const MODE_OPTS = $derived([
    { key: 'all', name: t('All on one page') },
    { key: 'tabs', name: t('One at a time') },
  ]);

  /* ---- values ---- */
  const secs = rideTimeS;
  const FIELD = {
    dauer: (r) => [t('Duration|act'), secs(r.dauer), ''],
    verstr: (r) => [t('Elapsed|col'), elapsedS(r.verstr), ''],
    tss: (r) => [t('TSS'), n0(r.tss), ''],
    hf: (r) => [t('Ø HR'), n0(r.hf), t('bpm')],
    hfmax: (r) => [t('Max. HR'), n0(r.hfmax), t('bpm')],
    tf: (r) => [t('Ø cadence'), n0(r.tf), r.kind === 'run' ? t('steps/min') : t('rpm')],
    kmh: (r) => [t('Ø speed'), n1(r.kmh), 'km/h'],
    kmhmax: (r) => [t('Max. speed'), n1(r.kmhmax), 'km/h'],
    w: (r) => [t('Ø power'), n0(r.w), 'W'],
    wmax: (r) => [t('Max. power'), n0(r.wmax), 'W'],
    w20: (r) => [t('Max. 20 min'), n0(r.w20), 'W'],
  };
  const KPI_FMT = { km: n1, hm: n0, dauer: (v) => secs(v), verstr: (v) => elapsedS(v), kmh: n1, hf: n0, hfmax: n0, w: n0, tss: n0, n: n0 };
  const CHANGED_OF = { km: 'km', hm: 'hm', dauer: 'movingS' };
  const isChanged = (k) => (row?.changed ?? []).includes(CHANGED_OF[k]);
  const stravaWas = (k) => {
    const f = CHANGED_OF[k];
    const v = row?.strava?.[f];
    return f === 'movingS' ? secs(v) : f === 'km' ? `${n1(v)} km` : `${n0(v)} Hm`;
  };
  const parts = $derived(row ? zoneParts(row.zones) : null);
  const easyPct = $derived(parts ? parts[0].pct + parts[1].pct : null);
  // in «Alles auf einer Seite» the key figures stand large in the Übersicht; Werte shows the rest
  const onTop = (f) => opts.mode === 'all' && opts.kpis.includes(f);
  const zmin = (m) => (m >= 60 ? `${Math.floor(m / 60)}:${String(m % 60).padStart(2, '0')} h` : t('{n} min', { n: m }));
  const kindName = $derived(row ? t(KIND_NAMES[row.kind] ?? 'Other|kind') : '');
  const sub = $derived(row ? [dates(row.day, row.endDay ?? row.day), kindName, row.bikeId && bikeName[row.bikeId] ? bikeName[row.bikeId] : '', row.n > 1 ? tn(row.n, '{n} activity', '{n} activities') : ''].filter(Boolean).join(' · ') : '');

  /* ---- Wetter der Fahrt (Noah 20.10.2026 «4a»): fetched once afterwards, stored with the tour ---- */
  const wx = $derived(d && !d.missing ? (d.kind === 't' ? (d.trip?.wxReal ?? null) : (d.acts.map((a) => a.weather).find((w) => w?.days?.length) ?? null)) : null);
  const wxS = $derived(wxSummary(wx, d?.acts?.length === 1 ? d.acts[0] : null));
  const deg = (a, b) => (a == null ? '' : a === b || b == null ? `${num(a)} °C` : `${num(a)}–${num(b)} °C`);
  // Strava check #8 (21.10.2026): the measured weather at each ride's start comes first, the same as in the
  // Rückblick (ridewx.js ridesWx); the day's rain stays from the weather of the days
  const rwx = $derived(d && !d.missing ? ridesWx(d.acts ?? []) : null);
  $effect(() => {
    if (d && !d.missing && d.acts?.length) ensureRidesWx(db, d.acts, today);
  });
  const wxText = $derived(
    rwx
      ? [`${deg(rwx.tmin, rwx.tmax)} ${t('at the start|weather')}`, wxS?.mm != null ? (wxS.mm >= 0.5 ? t('{mm} mm rain', { mm: num(wxS.mm) }) : t('dry')) : rwx.wet ? t('rain') : '', rwx.wmax != null ? t('wind {kmh} km/h', { kmh: rwx.wmin === rwx.wmax ? num(rwx.wmax) : `${num(rwx.wmin)}–${num(rwx.wmax)}` }) : ''].filter(Boolean).join(' · ')
      : wxS
      ? [wxS.ride ? t('while riding {t}', { t: deg(wxS.ride.tmin, wxS.ride.tmax) }) : deg(wxS.tmin, wxS.tmax), wxS.mm != null ? (wxS.mm >= 0.5 ? t('{mm} mm rain', { mm: num(wxS.mm) }) : t('dry')) : '', wxS.wind != null ? t('wind up to {kmh} km/h', { kmh: num(Math.max(wxS.wind, wxS.gust ?? 0)) }) : ''].filter(Boolean).join(' · ')
      : '',
  );
  let wxState = $state(''); // '' | 'loading' | 'failed'
  const tried = new Set();
  async function loadWeather(force = false) {
    if (!d || d.missing || d.kind === 'g' && !d.acts.length) return;
    const k = d.key;
    if (!force && tried.has(k)) return;
    tried.add(k);
    const place = startPlace(d.acts, d.trip);
    const from = row?.day;
    const to = row?.endDay ?? from;
    if (!place || !from || from > today) return;
    wxState = 'loading';
    try {
      const w = await fetchTourWeather(place, from, to, today);
      if (d.kind === 't') await db.trips.update(d.id, { wxReal: w });
      else await db.activities.update(d.acts[0].id, { weather: w });
      wxState = '';
    } catch {
      wxState = 'failed';
    }
  }
  $effect(() => {
    // once per tour, when it has none yet and the device is online
    if (d && !d.missing && !wx && typeof navigator !== 'undefined' && navigator.onLine !== false) loadWeather();
  });

  /* ---- Tagebuch: text and photos (photos stay on this device, Paket M fotos.js) ---- */
  const photoKey = $derived(d?.kind === 't' ? d.id : key);
  let photos = $state([]);
  let photoMsg = $state('');
  let cover = $state(null); // «Bilder in der App» 5a: the photo pale on top of the page
  $effect(() => {
    const k = photoKey;
    if (k) tripPhotos(k).then((p) => (photos = p));
    if (k) tripCover(k).then((c) => (cover = c));
  });
  const chooseCover = async (id) => {
    cover = id;
    await setTripCover(photoKey, id);
  };
  async function addPhotos(e) {
    const files = [...(e.currentTarget.files ?? [])];
    e.currentTarget.value = '';
    if (!files.length) return;
    photoMsg = '';
    try {
      const room = Math.max(0, FOTOS_PER_TRIP - photos.length);
      const out = [];
      for (const f of files.slice(0, room)) out.push({ day: row?.day, data: await shrinkImage(f, FOTO_MAX, 0.8) });
      if (out.length) photos = await addTripPhotos(photoKey, out);
      photoMsg = [out.length ? tn(out.length, '{n} photo added.', '{n} photos added.') : '', files.length > room ? t('At most {n} photos per trip.', { n: FOTOS_PER_TRIP }) : ''].filter(Boolean).join(' ');
    } catch (err) {
      photoMsg = err?.message || t('Could not save. Please try again.');
    }
  }
  const dropPhoto = async (id) => (photos = await removeTripPhoto(photoKey, id));
  let diaryTimer;
  function diaryInput(e) {
    const v = e.currentTarget.value;
    clearTimeout(diaryTimer);
    diaryTimer = setTimeout(() => saveNotes(db, d, { diary: v }), 400);
  }
  const setNote = (k, v) => saveNotes(db, d, { [k]: v });

  /* ---- the same route (one activity): a chart (3a) and the personal sentence (2a) ---- */
  const allActsQ = liveQuery(() => db.activities.toArray());
  const series = $derived(d?.kind === 'a' && d.acts[0] && $allActsQ ? routeSeries(sameRoute($allActsQ, d.acts[0]).list.slice(0, 12), d.acts[0].id) : []);
  const sayRaw = $derived(personalLine(series, d?.kind === 'a' ? d.acts[0]?.id : null));
  // a date that ends with a dot («9. Sept.») ends the sentence too
  const say = $derived(sayRaw ? t(sayRaw.key, { ...sayRaw.vars, ...(sayRaw.vars.day ? { day: dates(sayRaw.vars.day) } : {}) }).replace(/\.\.$/, '.') : tripSay ? t(tripSay.key, { ...tripSay.vars, km: tripSay.vars.km != null ? num(tripSay.vars.km) : undefined }) : '');
  // #8: only the key figures and values there are; an empty one is left out instead of «–»
  const kpis = $derived(row ? kpisShown(opts.kpis, (k) => kpiOf(row, k)) : []);
  const hasValue = (f) => FIELD[f](row)[1] !== DASH;

  /* ---- the jump bar marks the part on screen (Noah 20.10.2026 «klare aktive Markierung») ---- */
  /* ---- Analyse wie Strava (Noah 20.10.2026 «baue es 1:1 nach»): one activity at a time, the longest first ---- */
  let anaId = $state(null);
  const anaActs = $derived(d && !d.missing ? [...d.acts].sort((x, y) => (y.movingS ?? 0) - (x.movingS ?? 0)) : []);
  const anaAct = $derived(anaActs.find((a) => a.id === anaId) ?? anaActs[0] ?? null);
  const anaFtp = $derived(anaAct && $allActsQ ? ftpEstimate($allActsQ, anaAct.day) : null);
  const anaKg = $derived(anaAct ? kgOn(weight.entries, anaAct.day) : null);
  let seen = $state('overview');
  $effect(() => {
    if (!d || d.missing || opts.mode !== 'all' || typeof IntersectionObserver === 'undefined') return;
    const io = new IntersectionObserver((ents) => {
      const vis = ents.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
      if (vis) seen = vis.target.dataset.tourPart;
    }, { rootMargin: '-20% 0px -60% 0px' });
    for (const el of document.querySelectorAll('[data-tour-part]')) io.observe(el);
    return () => io.disconnect();
  });

  /* ---- the menu ---- */
  let renaming = $state(false);
  let correcting = $state(false);
  let kpiOpen = $state(false);
  const actions = $derived.by(() => {
    if (!d || d.missing) return [];
    const list = [
      { name: t('Rename'), explain: t('Your own name; Strava keeps its own.'), icon: Pencil, run: () => (renaming = true) },
      { name: t('Correct values'), explain: t('km, Hm and time; Strava’s value stays visible.'), icon: SlidersHorizontal, run: () => (correcting = true) },
    ];
    if (d.kind === 'a' || d.kind === 'g') {
      const hid = d.kind === 'a' ? !!d.acts[0]?.hidden : !!d.group?.hidden;
      list.push(hid ? { name: t('Show again'), explain: t('It is in the list again.'), icon: Eye, run: () => setHidden(db, d, false) } : { name: t('Hide'), explain: t('It leaves the list; the filter «Hidden» shows it.'), icon: EyeOff, run: () => hide() });
    }
    // tour critique 3b (Noah 21.10.2026): the template and reminder questions live here, not on top of the page
    if (d.kind === 't' && (d.trip?.entries ?? []).length) list.push({ name: t('Save as a template'), explain: t('Your next day ride then starts with New → Plan a trip → From template.'), icon: BookmarkPlus, run: () => asTemplate(false) });
    if (ask.pending) list.push({ name: t('Remind me|menu'), explain: t('Shall I remind you in future?'), icon: Bell, run: () => showNow() });
    // tour critique 2b: the file the trip came from, once its name was made readable
    const file = d.kind === 't' ? fileOf(d.trip) : null;
    if (file) list.push({ name: t('File|menu'), explain: file, icon: FileText, run: () => copyFile(file) });
    if (d.kind === 'a' && d.partOf && !d.partOf.href.includes('t%3A')) list.push({ name: t('Take out of the tour'), explain: t('It is a tour of its own again.'), icon: Unlink, run: () => takeOut() });
    if (d.kind === 'g') list.push({ name: t('Take apart'), explain: t('The activities stay, each as its own tour.'), icon: Unlink, run: () => remove() });
    if (d.kind === 'a') list.push({ name: t('Open in Strava'), explain: t('The activity on strava.com'), icon: ExternalLink, run: () => window.open(`https://www.strava.com/activities/${encodeURIComponent(d.id)}`, '_blank', 'noopener') });
    if (d.kind !== 'g') list.push({ name: t('Delete'), explain: d.kind === 'a' ? t('Gone from the app; Strava keeps it.') : t('The trip and its packing list go.'), icon: Trash2, run: () => remove() });
    return list;
  });

  async function copyFile(file) {
    try {
      await navigator.clipboard.writeText(file);
      offerDone(t('File name copied'));
    } catch {
      offerDone(file);
    }
  }
  // tour critique 2b: a trip still called like its file gets a readable name once (renamable)
  $effect(() => {
    if (d?.kind === 't' && needsTitle(d.trip)) tidyAllTitles(db, { t, loc: locale() });
  });

  async function rename(v) {
    const before = name;
    if (d.kind !== 'a' && !String(v ?? '').trim()) return t('Please give it a name.');
    await renameTour(db, d, v);
    offerRename(String(v).trim() || t('the Strava name'), () => renameTour(db, d, before));
  }
  async function correct(patch) {
    const before = { km: own.km ?? null, hm: own.hm ?? null, movingS: own.movingS ?? null, ...(d.kind === 'a' ? { kind: own.kind ?? null } : {}) };
    await saveOwn(db, d, patch);
    offerDone(t('Values saved.'), () => saveOwn(db, d, before));
  }
  async function hide() {
    await setHidden(db, d, true);
    offerDone(t('"{name}" is hidden.', { name }), () => setHidden(db, d, false));
  }
  async function takeOut() {
    const g = (d.groups ?? []).find((x) => x.acts.includes(String(d.id)));
    if (!g) return;
    const before = await leaveTour(db, g.id, d.id);
    offerDone(t('Taken out of "{name}".', { name: g.name }), () => restoreGroups(db, before));
  }
  async function remove() {
    const ask =
      d.kind === 'g'
        ? { title: t('Take apart "{name}"?', { name }), text: t('The {n} activities stay, each as its own tour again. Your notes of the joined tour go.', { n: d.acts.length }), label: t('Take apart') }
        : d.kind === 'a'
          ? { title: t('Delete "{name}"?', { name }), text: t('It is gone from the app and is not fetched again. Strava keeps it. The km on the bike stay counted.') }
          : { title: t('Delete the trip "{name}"?', { name }), text: t('Its packing list goes with it. You can bring it back for 4 seconds afterwards.') };
    if ((await askDelete(ask)) !== 'delete') return;
    const target = { kind: d.kind, id: d.id };
    const ok = await deleteWithUndo({ run: () => deleteTour(db, target), undo: (s) => undoDelete(db, s), text: d.kind === 'g' ? t('"{name}" taken apart.', { name }) : t('"{name}" deleted.', { name }), name });
    if (ok) location.hash = d.kind === 't' ? '#/trips' : RIDES_HREF; // Gesamttest 20.10.2026 B3: back to the list it came from
  }

  /* ---- «Daraus machen» ---- */
  async function asTemplate(start = false) {
    const res = await saveTripAsTemplate(db, d.trip, d.trip.title);
    if (res.error === 'taken') {
      const again = await saveTripAsTemplate(db, d.trip, `${d.trip.title} (${row.day})`);
      if (again.error) return offerDone(t('A template with this name exists already.'));
      return start ? newTrip(again.id) : offerDone(t('Saved as the template "{name}".', { name: again.name }));
    }
    if (res.error) return;
    if (start) newTrip(res.id);
    else offerDone(t('Saved as the template "{name}".', { name: res.name }));
  }
  const canShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function';
  const shareLine = $derived(row ? shareText(row, { date: dates(row.day, row.endDay ?? row.day), values: [row.km > 0 ? `${n1(row.km)} km` : '', row.hm ? `${n0(row.hm)} Hm` : '', row.dauer ? secs(row.dauer) : ''] }) : '');
  async function share() {
    try {
      if (canShare) await navigator.share({ title: name, text: shareLine });
      else {
        await navigator.clipboard.writeText(shareLine);
        offerDone(t('Copied.'));
      }
    } catch {
      /* closed or not allowed: nothing to do */
    }
  }

  /* ---- Rückblick of activities: an own rating ---- */
  const STARS = [1, 2, 3, 4, 5];
</script>

{#if d === undefined}
  <Skeleton rows={5} />
{:else if d.missing}
  <Empty icon={Route} title={t('Tour not found')} text={t('It may have been deleted or taken apart.')} action={{ label: t('To the trips'), onclick: () => (location.hash = '#/trips') }} />
{:else}
  <div class="tour" data-tour-page={d.kind}>
    {#snippet headExtra()}
      <p class="pills">
        {#if !steps}<TripState state={d.state} />{/if}
        {#if row.changed?.length}<span class="chg" data-changed>{t('changed')}</span>{/if}
        {#if (d.kind === 'a' && d.acts[0]?.hidden) || (d.kind === 'g' && d.group?.hidden)}<span class="chg" data-hidden><EyeOff size={13} aria-hidden="true" />{t('hidden')}</span>{/if}
        {#if d.partOf}<a class="part" href={d.partOf.href} data-part-of>{t('Part of «{name}»', { name: d.partOf.name })}<ChevronRight size={14} aria-hidden="true" /></a>{/if}
      </p>
    {/snippet}
    {#if steps}
      <!-- «Eine Tour, eine Seite» (UI-Ziele #5): the same head and step tabs on every step of the trip; here «Auswertung» -->
      <div class="tband" data-tour-steps>
        <TripBand trip={d.trip} tab="analysis" note>
          {#snippet extra()}{@render headExtra()}<span class="tmore"><MoreActions title={name} label={t('More for {what}', { what: name })} {actions} /></span>{/snippet}
        </TripBand>
      </div>
    {:else}
    <!-- Gesamttest 20.10.2026 B3: a Strava tour sits under Touren › Fahrten, a trip with a packing list under Touren -->
    <PathHead crumbs={d.kind === 't' ? [{ label: t('Trips|place'), href: '#/trips' }] : [{ label: t('Trips|place'), href: '#/trips' }, { label: t('Rides|tab'), href: RIDES_HREF }]} here={name} title={name} {sub}>
      {#snippet extra()}{@render headExtra()}{/snippet}
      <MoreActions title={name} label={t('More for {what}', { what: name })} {actions} />
    </PathHead>
    {/if}
    <!-- Noah 20.10.2026 «1a 2a»: a drawn landscape with the route, and one personal sentence when there is one;
         0.174 (#10): on a trip a warm chip first: «In 5 Tagen», «Tag 2 von 3», «Zurück seit 2 Tagen» -->
    <TourLandscape points={prof} photo={coverPhoto(photos, cover)?.data ?? null} warm={cd ? t(cd.key, cd.vars) : ''} chips={[dates(row.day, row.endDay ?? row.day), wxS ? deg(wxS.tmin, wxS.tmax) : ''].filter(Boolean)} />
    {#if say}<p class="say" data-tour-say>{say}</p>{/if}
    <!-- 0.174 (#18 Lernschleife): one question after the tour, at most one card a day -->
    {#if d.kind === 't' && steps}<TourAsk {d} {key} {over} />{/if}
    {#if d.kind === 't' && !steps}
      <!-- Gesamttest 20.10.2026 (journey): a trip's two pages lead to each other; the Rückblick has «Tour-Seite ansehen ›» -->
      <ul class="rowlist" aria-label={t('Look back|tour')}>
        <li><a class="lrow" href="#/debrief/{encodeURIComponent(d.id)}" data-to-review><span class="ic" aria-hidden="true"><Star size={18} /></span><span class="m"><span class="t">{t('Look back|tour')}</span><span class="s">{d.state === 'rated' ? t('The Rückblick is written.') : t('The Rückblick is still open.')}</span></span><ChevronRight class="chev" size={18} aria-hidden="true" /></a></li>
      </ul>
    {/if}

    <!-- 2 «beides»: the parts as a jump bar (one page) or as tabs (one at a time) -->
    <nav class="bar" aria-label={t('Parts of the tour')} data-tour-bar={opts.mode}>
      <div class="chips" role={opts.mode === 'tabs' ? 'tablist' : null}>
        {#each PARTS as p (p.key)}
          <button type="button" class="tp-chip" class:on={opts.mode === 'all' && seen === p.key} role={opts.mode === 'tabs' ? 'tab' : null} aria-selected={opts.mode === 'tabs' ? part === p.key : null} aria-pressed={opts.mode === 'tabs' ? null : false} onclick={() => go(p.key)} data-part={p.key}>{t(p.name)}</button>
        {/each}
      </div>
      <div class="vm"><Seg full={false} label={t('Show')} value={opts.mode} options={MODE_OPTS} onchange={(v) => saveOpts({ mode: v })} /></div>
    </nav>

    <!-- Noah 20.10.2026 «die seitlichen Leerflächen nutzen»: on a computer the values on the left, memories, photos and gear on the right; on a phone one below the other -->
    <div class="cols" class:two={opts.mode === 'all'}>
    <div class="cm">
    {#if shows('overview')}
      <section id="tour-overview" class="part-s" aria-labelledby="th-overview" data-tour-part="overview">
        <div class="sh"><h2 id="th-overview">{t('Overview|tour')}</h2><button type="button" class="btn btn-link" onclick={() => (kpiOpen = true)} data-kpi-open><LayoutGrid size={16} aria-hidden="true" />{t('Choose key figures')}</button></div>
        {#if noRide}
          <!-- 0.174 (#8): no ride yet: one card instead of empty values -->
          <div class="connect" data-ride-connect>
            <Activity size={20} aria-hidden="true" />
            <div>
              <p class="ct">{over ? t('Connect a ride') : t('The analysis comes after the tour')}</p>
              <p class="cs">{over ? t('Strava rides of these days join on their own once Strava is connected; a GPX file works too. Then values, map and analysis appear here.') : t('Once you have ridden, the values, the map and the analysis of your ride appear here.')}</p>
              {#if over}<div class="ca"><a class="btn" href={RIDES_HREF} data-connect-strava>{t('To the rides')}<ChevronRight size={16} aria-hidden="true" /></a><a class="btn btn-link" href="#/debrief/ride" data-connect-gpx>{t('Upload ride')}</a></div>{/if}
            </div>
          </div>
        {/if}
        {#if kpis.length}
        <ul class="kpis" data-kpis>
          {#each kpis as k (k)}
            {@const def = KPIS.find((x) => x.key === k)}
            {@const v = kpiOf(row, k)}
            <li class="kpi" data-kpi={k}>
              <b class="num">{#if k === 'hf' || k === 'hfmax'}<Heart class="hico" size={18} aria-hidden="true" />{/if}{KPI_FMT[k](v)}{#if def.unit && v != null}{' '}<small>{def.unit === 'bpm' ? t('bpm') : def.unit}</small>{/if}</b>
              <span>{t(def.name)}</span>
              {#if isChanged(k)}<small class="was" data-was={k}>{t('changed · Strava: {v}', { v: stravaWas(k) })}</small>{/if}
            </li>
          {/each}
        </ul>
        {/if}
        {#if over}
        <p class="wx" data-tour-weather>
          <CloudSun size={18} aria-hidden="true" />
          {#if wxText}<span><b>{t('Weather')}</b> {wxText}</span>
          {:else if wxState === 'loading'}<span class="tp-muted">{t('Getting the weather of that day …')}</span>
          {:else if wxState === 'failed'}<span class="tp-muted">{t('The weather could not be fetched.')}</span><button type="button" class="btn btn-link" onclick={() => loadWeather(true)} data-weather-retry><RefreshCw size={14} aria-hidden="true" />{t('Try again')}</button>
          {:else}<span class="tp-muted">{t('No weather yet: it comes when you are online.')}</span>{/if}
        </p>
        {/if}
        {#if lines.length}
          <div class="mapw"><TourMap {lines} {marker} height={phone.matches ? 300 : 400} label={t('Map of «{name}»: drag to move, pinch or wheel to zoom', { name })} /></div>
        {:else}
          <p class="card nomap" data-no-line><MapIcon size={20} aria-hidden="true" /><span>{t('No line yet. Strava sends it with the next fetch; an uploaded GPX ride brings its own.')}</span></p>
        {/if}
        <!-- Noah 20.10.2026 «1:1 die details aus komoot»: the fine profile by gradient and the speed profile, when Strava sent the course -->
        {#if hasCourse}<TourCourse acts={d.acts} trip={d.trip} moving={row.dauer} elapsed={row.verstr} onkm={(f) => (frac = f)} />{:else if prof.length > 1}<TourProfile points={prof} onpoint={(f) => (frac = f)} />{/if}
      </section>
    {/if}

    {#if shows('values')}
      <section id="tour-values" class="part-s" aria-labelledby="th-values" data-tour-part="values">
        <div class="sh"><h2 id="th-values">{t('Values|tour')}</h2><button type="button" class="btn btn-link" onclick={() => (correcting = true)} data-correct-open><SlidersHorizontal size={16} aria-hidden="true" />{t('Correct values')}</button></div>
        <div class="card pad vcard">
          <dl class="vals" data-tour-values>
            <!-- Noah 20.10.2026: the main values stand large above (Übersicht); here the details, quieter -->
            {#if !onTop('km') && row.km != null}<div class="vc"><dt>{t('Distance')}</dt><dd class="num">{n1(row.km)} <small>km</small>{#if isChanged('km')}<small class="was">{t('Strava: {v}', { v: stravaWas('km') })}</small>{/if}</dd></div>{/if}
            {#if !onTop('hm') && row.hm != null}<div class="vc"><dt>{t('Climbing')}</dt><dd class="num">{n0(row.hm)} <small>Hm</small>{#if isChanged('hm')}<small class="was">{t('Strava: {v}', { v: stravaWas('hm') })}</small>{/if}</dd></div>{/if}
            <!-- Tour-Auswertung (20.10.2026): the best 20 minutes stand in the table «Best minutes» below -->
            {#each fieldsOf(row).filter((f) => !onTop(f) && f !== 'w20' && hasValue(f)) as f (f)}
              {@const [label, value, unit] = FIELD[f](row)}
              <div class="vc" data-field={f}><dt>{label}{#if f === 'dauer' || f === 'verstr'}<Help {label} text={t(FIELD_HELP[f === 'dauer' ? 'moving' : 'elapsed'])} />{/if}</dt><dd class="num">{value}{#if unit && value !== DASH}{' '}<small>{unit}</small>{/if}{#if f === 'dauer' && isChanged('dauer')}<small class="was">{t('Strava: {v}', { v: stravaWas('dauer') })}</small>{/if}</dd></div>
            {/each}
          </dl>
          {#if parts || row.hf != null}
          <div class="zones">
            <p class="zl">{t('Time in HR zones')}{#if easyPct != null}<span class="zsum" data-zone-sum>{t('{p} % of your time in zone 1–2', { p: easyPct })}</span>{/if}</p>
            {#if parts}
              <ZoneBar secs={row.zones} h={12} />
              <ul class="zv">{#each parts as p, i (i)}<li><b class="z{i + 1}">Z{i + 1}</b><span class="num">{zmin(p.min)}</span><small class="num">{p.pct} %</small></li>{/each}</ul>
            {:else}
              <p class="tp-muted tp-small">{t('Comes when the activity is opened once.')}</p>
            {/if}
          </div>
          {/if}
          <TourAnalysis {d} />
        </div>
        {#if d.acts.length > 1 || d.kind === 't'}
          <h3 class="h3">{d.acts.length ? tn(d.acts.length, '{n} activity of this tour', '{n} activities of this tour') : t('No Strava activity on these days.')}</h3>
          {#if d.acts.length}
            <ul class="card acts" data-tour-acts>
              {#each d.acts as a (a.id)}
                <li><a href={tourHref(`a:${a.id}`)}><KindIcon kind={a.own?.kind ?? a.kind} size={16} /><span class="an">{a.own?.name || a.name || t(typeKey(a.type))}</span><span class="tp-muted tp-small num">{dates(a.day)} · {n1(a.own?.km ?? a.km)} km · {n0(a.own?.hm ?? a.hm)} Hm</span><ChevronRight size={16} aria-hidden="true" /></a></li>
              {/each}
            </ul>
          {/if}
        {/if}
        {#if d.kind === 'a'}<p class="more"><a class="btn btn-link" href="#/flow/training/a/{encodeURIComponent(d.id)}" data-training-link><Activity size={16} aria-hidden="true" />{t('All values, laps and segments in Training')}<ChevronRight size={16} aria-hidden="true" /></a></p>{/if}
        {#if series.length > 1}
          <h3 class="h3">{t('Same route, other days')}</h3>
          <RouteChart {series} hrefOf={(id) => tourHref(`a:${id}`)} fmt={secs} />
        {/if}
      </section>
    {/if}

    </div>
    <div class="cs">
    {#if shows('pack')}
      <section id="tour-pack" class="part-s" aria-labelledby="th-pack" data-tour-part="pack">
        <div class="sh"><h2 id="th-pack">{t('Gear|tour')}</h2></div>
        <TourGear {d} {name} wxLine={wxText ? `${t('Weather')}: ${wxText}` : ''} />
      </section>
    {/if}

    {#if shows('diary')}
      <section id="tour-diary" class="part-s" aria-labelledby="th-diary" data-tour-part="diary">
        <!-- Noah 20.10.2026 «Das Tagebuch persönlicher gestalten» -->
        <div class="sh"><h2 id="th-diary">{t('What stays of this tour')}</h2></div>
        <p class="impulse">{t('A special moment, a meeting or something you learned.')}</p>
        <div class="diaryw">
          {#if d.kind === 't' && !d.debrief}
            <p class="tp-muted">{t('The diary of a trip is written with its Rückblick: the app drafts it from your rides, weather and notes.')}</p>
            <!-- Impeccable 20.10.2026: the way into the Rückblick stands once on top and in its own part; here only when that part is not shown -->
            {#if !shows('review')}<a class="btn" href="#/debrief/{encodeURIComponent(d.id)}">{t('Open the Rückblick')}<ChevronRight size={16} aria-hidden="true" /></a>{/if}
          {:else}
            <textarea class="inp diary" rows="6" value={notes.diary ?? ''} oninput={diaryInput} placeholder={t('Write freely …')} aria-label={t('Diary|tour')} data-tour-diary></textarea>
            {#if d.kind === 'a'}<p class="tp-muted tp-small">{t('The same text as the note in Training.')}</p>{/if}
          {/if}
          {#if photos.length}
            <ul class="photos" aria-label={t('Photos of the trip')}>
              {#each photos as p (p.id)}<li><img src={p.data} alt={t('Photo from {day}', { day: p.day })} loading="lazy" /><button type="button" class="px" aria-label={t('Remove photo')} onclick={() => dropPhoto(p.id)}><X size={14} aria-hidden="true" /></button><button type="button" class="pc" class:on={coverPhoto(photos, cover)?.id === p.id} aria-pressed={coverPhoto(photos, cover)?.id === p.id} aria-label={t('Show on top of the tour page')} title={t('Show on top of the tour page')} onclick={() => chooseCover(p.id)} data-tour-cover><Star size={14} aria-hidden="true" /></button></li>{/each}
            </ul>
          {/if}
          <label class="btn addp"><ImagePlus size={16} aria-hidden="true" />{t('Add photos')}<input type="file" accept="image/*" multiple onchange={addPhotos} data-tour-photos /></label>
          <p class="tp-muted tp-small">{t('Photos stay on this device.')}{#if photoMsg}{' '}<span role="status">{photoMsg}</span>{/if}</p>
        </div>
      </section>
    {/if}

    {#if shows('review')}
      <section id="tour-review" class="part-s" aria-labelledby="th-review" data-tour-part="review">
        <div class="sh"><h2 id="th-review">{t('Look back|tour')}</h2></div>
        <div class="card pad">
          {#if d.kind === 't' && !d.trip?.fromActs?.length}
            <p><TripState state={d.state} /> {d.state === 'rated' ? t('The Rückblick is written.') : t('The Rückblick is still open.')}</p>
            {#if d.debrief?.note}<p class="quote">{d.debrief.note}</p>{/if}
            <a class="btn hi" href="#/debrief/{encodeURIComponent(d.id)}" data-open-review>{d.state === 'rated' ? t('Open the Rückblick') : t('Write the Rückblick')}<ChevronRight size={16} aria-hidden="true" /></a>
          {:else}
            <p class="tp-muted tp-small">{t('Your own rating, only for you. It makes the tour «Rated».')}</p>
            <div class="stars" role="group" aria-label={t('Rating')} data-tour-rating>
              {#each STARS as s (s)}<button type="button" class="tstar" aria-pressed={(notes.rating ?? 0) >= s} aria-label={tn(s, '{n} star', '{n} stars')} onclick={() => setNote('rating', notes.rating === s ? null : s)}><Star size={22} fill={(notes.rating ?? 0) >= s ? 'currentColor' : 'none'} aria-hidden="true" /></button>{/each}
            </div>
            <label class="lf"><span>{t('What was good?')}</span><textarea class="inp" rows="2" value={notes.good ?? ''} onchange={(e) => setNote('good', e.currentTarget.value.trim())} data-tour-good></textarea></label>
            <label class="lf"><span>{t('Next time')}</span><textarea class="inp" rows="2" value={notes.next ?? ''} onchange={(e) => setNote('next', e.currentTarget.value.trim())} data-tour-next></textarea></label>
            {#if d.kind === 't'}<a class="btn" href="#/debrief/{encodeURIComponent(d.id)}" data-open-review>{t('Open the Rückblick')}<ChevronRight size={16} aria-hidden="true" /></a>{/if}
          {/if}
        </div>
      </section>
    {/if}

    </div>
    </div>

    {#if shows('analysis') && anaAct}
      <section id="tour-analysis" class="part-s" aria-labelledby="th-analysis" data-tour-part="analysis">
        <div class="sh"><h2 id="th-analysis">{t('Analysis|ana')}</h2></div>
        {#if anaActs.length > 1}
          <div class="chips" role="group" aria-label={t('Activity of the analysis')} data-ana-acts>
            {#each anaActs as a (a.id)}<button type="button" class="tp-chip" aria-pressed={anaAct.id === a.id} onclick={() => (anaId = a.id)}>{a.own?.name || a.name || t(typeKey(a.type))} · {dates(a.day)}</button>{/each}
          </div>
        {/if}
        <StravaAnalysis a={anaAct} acts={$allActsQ ?? []} bounds={zones.bounds} ftp={anaFtp} kg={anaKg} bike={row.bikeId ? (bikeName[row.bikeId] ?? '') : ''} onkm={anaActs.length === 1 ? (f) => (frac = f) : null} map={anaActs.length > 1} />
        <!-- «Fahrt-Analyse als Vorbild» part 3: the ride analyses of Training for the chosen activity (one picker: the chips above) -->
        {#await import('../lib/training/act/ActAnalysesPick.svelte') then m}<m.default ids={[anaAct.id]} />{:catch}{/await}
      </section>
    {/if}

    <section class="part-s" aria-labelledby="th-make" data-tour-make>
      <div class="sh"><h2 id="th-make">{t('Make something of it')}</h2></div>
      <div class="make">
        {#if d.kind === 't' && (d.trip?.entries ?? []).length}
          <button type="button" class="btn" onclick={() => asTemplate(true)} data-again><Repeat size={16} aria-hidden="true" />{t('Ride it again')}</button>
          <button type="button" class="btn" onclick={() => asTemplate(false)} data-as-template><BookmarkPlus size={16} aria-hidden="true" />{t('Save as a template')}</button>
        {:else}
          <button type="button" class="btn" onclick={() => openNew('list')}><Plus size={16} aria-hidden="true" />{t('Plan a new trip')}</button>
        {/if}
        {#if d.kind === 't'}<a class="btn" href="#/spur/{encodeURIComponent(d.id)}"><MapIcon size={16} aria-hidden="true" />{t('Travel track')}</a>{/if}
        <button type="button" class="btn" onclick={share} data-share>{#if canShare}<Share2 size={16} aria-hidden="true" />{t('Share')}{:else}<Copy size={16} aria-hidden="true" />{t('Copy as text')}{/if}</button>
      </div>
    </section>
  </div>

  {#if renaming}
    <RenameSheet kicker={t('Tour')} title={t('Rename tour')} value={name} hint={d.kind === 'a' ? t('Only in the app; Strava keeps its name.') : ''} empty={d.kind === 'a' ? t('Empty: the name from Strava again.') : ''} onsave={rename} onclose={() => (renaming = false)} />
  {/if}
  {#if correcting}
    <CorrectSheet base={{ km: row.strava?.km ?? row.km, hm: row.strava?.hm ?? row.hm, movingS: row.strava?.movingS ?? row.dauer, kind: d.kind === 'a' ? d.acts[0]?.kind : row.kind }} {own} kinds={d.kind === 'a'} onsave={correct} onclose={() => (correcting = false)} />
  {/if}
  {#if kpiOpen}
    <KpiSheet value={opts.kpis} onsave={(k) => saveOpts({ kpis: k })} onclose={() => (kpiOpen = false)} />
  {/if}
{/if}

<style>
  .tour {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    gap: 22px;
    max-width: 1240px;
    margin: 0 auto;
  }
  /* Noah 20.10.2026: fewer white cards that all look the same: a fine line instead of a shadow */
  .tour :global(.card) {
    box-shadow: none;
  }
  /* 0.174 (#5): the trip's band as the head; its own margin is the page's gap */
  .tband :global(.trip-band) {
    margin: 0;
  }
  .tmore {
    margin-left: auto;
  }
  /* 0.174 (#8): no ride yet */
  .connect {
    display: flex;
    gap: 12px;
    margin: 0 0 14px;
    padding: 14px 16px;
    border-radius: var(--radius-card);
    background: var(--paper-2);
  }
  .connect > :global(svg) {
    flex: none;
    margin-top: 2px;
    color: var(--ink-3);
  }
  .ct {
    margin: 0;
    font-weight: 600;
  }
  .cs {
    margin: 2px 0 0;
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .ca {
    display: flex;
    flex-wrap: wrap;
    gap: 8px 14px;
    margin-top: 10px;
  }
  .say {
    margin: -6px 0 0;
    font: 700 var(--fs-sub) / 1.35 var(--font-body);
  }
  .cols,
  .cm,
  .cs {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    align-content: start;
    gap: 28px;
  }
  @media (min-width: 1100px) {
    .cols.two {
      grid-template-columns: minmax(0, 1.65fr) minmax(0, 1fr);
      gap: 32px;
    }
  }
  .pills {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 6px 10px;
    margin: 6px 0 0;
  }
  .chg {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 2px 10px;
    border: 1px solid var(--line-strong);
    border-radius: 999px;
    color: var(--ink-2);
    font-size: var(--fs-tiny);
  }
  .part {
    display: inline-flex;
    align-items: center;
    gap: 2px;
    min-height: 44px;
    color: var(--ink);
    font-size: var(--fs-small);
  }
  .bar {
    position: static;
    z-index: 3;
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 8px 16px;
    padding: 8px 0;
    background: var(--ground);
  }
  .chips {
    display: flex;
    flex: 1 1 auto;
    gap: 8px;
    min-width: 0;
    max-width: 100%;
    overflow-x: auto;
    scrollbar-width: none;
  }
  /* Noah 20.10.2026 «Navigation eindeutiger»: no outlines, a clear mark in dark green where you are */
  .chips .tp-chip {
    flex: none;
    border-color: transparent;
    background: transparent;
    color: var(--ink-2);
  }
  .chips .tp-chip:hover {
    background: var(--paper-2);
  }
  .chips [aria-selected='true'],
  .chips .tp-chip.on {
    border-color: var(--accent);
    background: var(--accent);
    color: var(--paper);
  }
  .vm :global(button) {
    min-height: 36px;
    font-size: var(--fs-small);
  }
  .part-s {
    scroll-margin-top: 72px;
  }
  /* on a computer the parts stay in reach while scrolling; on a phone the app's own header is on top */
  @media (min-width: 720px) {
    .bar {
      position: sticky;
      top: 0;
    }
  }
  .sh {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 4px 16px;
    margin: 0 0 var(--sp-2);
  }
  .sh h2 {
    margin: 0;
    font: 600 var(--fs-section) / 1.25 var(--font-body);
  }
  .sh .btn-link {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    min-height: 44px;
  }
  .pad {
    padding: 16px;
  }
  /* Noah 20.10.2026 «Den Zahlen eine klare Hierarchie geben»: the key figures large, without boxes */
  .kpis {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
    gap: 14px 0;
    margin: 0 0 14px;
    padding: 0;
    list-style: none;
  }
  .kpi {
    display: grid;
    align-content: start;
    gap: 2px;
    padding: 2px 16px;
    border-left: 1px solid var(--card-line);
  }
  .kpi:first-child {
    padding-left: 0;
    border-left: 0;
  }
  .kpi b {
    display: inline-flex;
    align-items: baseline;
    gap: 2px;
    font: 700 var(--fs-page) / 1.1 var(--font-body);
    font-variant-numeric: tabular-nums;
    letter-spacing: -0.01em;
  }
  .kpi b small {
    color: var(--ink-3);
    font-size: var(--fs-body);
    font-weight: 500;
  }
  .kpi :global(.hico) {
    align-self: center;
    margin-right: 4px;
    color: var(--bad);
  }
  .kpi span {
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .was {
    display: block;
    color: var(--ink-3);
    font-size: var(--fs-tiny);
  }
  .mapw {
    margin: 0 0 10px;
  }
  .nomap {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 14px 16px;
    color: var(--ink-2);
  }
  .vals {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
    gap: 12px 16px;
    margin: 0;
  }
  .vc dt {
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .vc dd {
    margin: 2px 0 0;
    color: var(--ink-2);
    font: 500 var(--fs-body) / 1.3 var(--font-body);
  }
  .vc dd small {
    color: var(--ink-2);
    font-weight: 400;
  }
  .zones {
    margin-top: 16px;
  }
  .zl {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    gap: 4px 12px;
    margin: 0 0 8px;
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .zsum {
    color: var(--ink);
    font-weight: 600;
  }
  .zv {
    display: flex;
    flex-wrap: wrap;
    gap: 10px 22px;
    margin: 12px 0 0;
    padding: 0;
    list-style: none;
    font-size: var(--fs-small);
  }
  .zv li {
    display: inline-flex;
    gap: 6px;
  }
  .z1 {
    color: var(--z1);
  }
  .z2 {
    color: var(--z2);
  }
  .z3 {
    color: var(--z3);
  }
  .z4 {
    color: var(--z4);
  }
  .z5 {
    color: var(--z5);
  }
  .h3 {
    margin: 16px 0 8px;
    font: 600 var(--fs-body) / 1.3 var(--font-body);
  }
  .acts {
    margin: 0;
    padding: 4px 0;
    list-style: none;
  }
  .acts a {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr) auto auto;
    align-items: center;
    gap: 4px 10px;
    min-height: 48px;
    padding: 6px 14px;
    color: var(--ink);
    text-decoration: none;
  }
  .acts li + li a {
    border-top: 1px solid var(--card-line);
  }
  .acts a:hover {
    background: var(--paper-2);
  }
  .an {
    font-weight: 600;
    overflow-wrap: break-word;
  }
  .more a {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    min-height: 44px;
  }
  .wx {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 6px 10px;
    margin: 12px 0;
    color: var(--ink-2);
  }
  .wx :global(svg) {
    color: var(--ink-3);
  }
  .impulse {
    margin: -4px 0 10px;
    color: var(--ink-2);
  }
  /* Noah 20.10.2026 «Das Tagebuch persönlicher»: a soft writing surface, no form box */
  .diaryw {
    padding: 4px 0 0;
  }
  .diary {
    width: 100%;
    min-height: 180px;
    padding: 16px 18px;
    border: 1px solid transparent;
    border-radius: 18px;
    background: color-mix(in srgb, var(--accent-soft) 35%, var(--paper));
    font: 400 var(--fs-sub) / 1.55 var(--font-body);
  }
  .diary:focus {
    border-color: var(--accent);
  }
  /* the photos as a row of pictures (scrolls sideways when there are many) */
  .photos {
    display: grid;
    grid-auto-columns: 150px;
    grid-auto-flow: column;
    gap: 10px;
    margin: 12px 0;
    overflow-x: auto;
    padding: 0;
    list-style: none;
  }
  .photos li {
    position: relative;
  }
  .photos img {
    display: block;
    width: 100%;
    aspect-ratio: 1;
    object-fit: cover;
    border-radius: 14px;
  }
  .px {
    position: absolute;
    top: 4px;
    right: 4px;
    display: grid;
    place-items: center;
    width: 32px;
    height: 32px;
    border: 0;
    border-radius: 50%;
    background: var(--paper);
    color: var(--ink);
    cursor: pointer;
  }
  /* 5a: the star chooses the photo on top of the page */
  .pc {
    position: absolute;
    top: 4px;
    left: 4px;
    display: grid;
    place-items: center;
    width: 32px;
    height: 32px;
    border: 0;
    border-radius: 50%;
    background: var(--paper);
    color: var(--ink-3);
    cursor: pointer;
  }
  .pc.on {
    color: var(--ink);
  }
  .pc.on :global(svg) {
    fill: currentColor;
  }
  .addp {
    position: relative;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    margin-top: 10px;
    cursor: pointer;
  }
  .addp input {
    position: absolute;
    width: 1px;
    height: 1px;
    opacity: 0;
  }
  .stars {
    display: flex;
    gap: 4px;
    margin: 8px 0 12px;
  }
  .tstar {
    display: grid;
    place-items: center;
    width: 44px;
    height: 44px;
    border: 0;
    border-radius: 50%;
    background: none;
    color: var(--st-rated, var(--accent));
    cursor: pointer;
  }
  .lf {
    display: grid;
    gap: 4px;
    margin: 0 0 10px;
    font: 500 var(--fs-small) / 1.3 var(--font-body);
  }
  .quote {
    margin: 10px 0;
    padding-left: 12px;
    border-left: 3px solid var(--card-line);
    color: var(--ink-2);
  }
  .make {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
  }
  .make .btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }
  @media (max-width: 700px) {
    .kpis {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
    .kpi b {
      font-size: var(--fs-sub);
    }
    .acts a {
      grid-template-columns: auto minmax(0, 1fr) auto;
    }
    .acts a .tp-small {
      grid-column: 2 / 3;
    }
  }
</style>
