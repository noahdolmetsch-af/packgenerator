<script>
  /**
   * «Orte auf der Karte» (Noah 19.10.2026): switch kinds of places on with chips (water, shopping,
   * food, petrol, bike, repair, hotel, camping, shelter, WC, pharmacy, hospital, ATM, station, laundry,
   * viewpoint) and see them on the map and in a «Places» list, nearest first.
   *
   * Where: «Around me» (2 / 5 / 10 / 20 km or an own radius of 1–50 km), «Here» (the visible map,
   * «Search here» like Google Maps) or «Along the route» (when there is a line; what was kept with the
   * offline strip works offline). One query per tap (debounced), answers kept on this device
   * (poisearch.js loadPlaces). The chips, the mode and the radius are remembered (settings 'poi-search').
   *
   * «Weitere Quellen» (Noah 20.10.2026 «1a+b 2a+b»): «Change the kinds» sorts (arrows and drag), renames
   * and removes chips, switches more kinds in (poisearch.js MORE) and makes own kinds from typed
   * OpenStreetMap tags (checked, poisearch.js checkSelector). «My own places»: set a place at the map
   * centre, where you are or (canTap) with a tap on the map, or load a GPX / KML / KMZ / CSV file
   * (placefiles.js); kept as your own points (ownpoints.js), shown on every map as «My points».
   *
   * Props: center ({ lat, lon } | null: where you are), bounds ({ s, w, n, e } | null: the visible
   * map), line ([[lat, lon]] | null: the route), profile ([[km, m]] | null: for the detour climb),
   * onpoints (places → void: the places of the switched-on kinds, each with d = distanceOf, for the
   * map symbols; a place of an own kind has the kind of its icon and catName), tripId (the route's
   * cache), canTap (the host sends map taps to tapMap()), ontapmode (bool → void: waiting for a tap on
   * the map, e.g. to show the map), fetcher (tests only).
   */
  import { untrack } from 'svelte';
  import { liveQuery } from 'dexie';
  import { RefreshCw, Search, Navigation, Share2, StarOff, ChevronDown, SlidersHorizontal, Plus, X, Pencil, Crosshair, LocateFixed, MapPin, Upload } from '@lucide/svelte';
  import { t, tn, num, locale } from '../i18n.svelte.js';
  import Seg from '../ui/Seg.svelte';
  import SortArrows from '../ui/SortArrows.svelte';
  import SortGrip from '../ui/SortGrip.svelte';
  import { sortable } from '../ui/sortable.js';
  import { askDelete, deleteWithUndo } from '../ui/ask.js';
  import { navLinks } from '../live/live-lib.js';
  import { db } from '../db.js';
  import { pointKindName } from './ownkinds.js';
  import { OWN_KEY, listOf, ownLabel, saveOwn, putOwn, newPoint, updatePoint, removePoint, movePoint, sourcesOf, removeSource, renameSource, srcOf } from './ownpoints.js';
  import { ALL, CATEGORY, RADII, RADIUS_MIN, RADIUS_MAX, MAX_PLACES, MAX_VIEW_KM, MAX_SELECTORS, OWN_ICONS, loadPlaces, withDistance, viewMoved, debounce, boundsKm, shareText, shareOrCopy, toggleStar, distanceOf, ptsOf, prefsOf, radiusOf, moveChip, renameChip, hideChip, showChip, putOwnCat, removeOwnCat, newOwnCat } from './poisearch.js';
  import { prefsQuery, savePrefs, placeStore } from './poiprefs.js';
  import { placesFromFile, importPoints, kmzText, fileKind, MAX_FILE_MB } from './placefiles.js';
  import { iconOf } from './poiicons.js';
  import { titleOf, kindText, distText, openText } from './poitext.js';
  import PoiDetail from './PoiDetail.svelte';
  import PoiFilter from './PoiFilter.svelte';
  import { applyFilter, NO_FILTER, normFilter } from './poifilter.js';
  import { SITUATIONS, SITUATION, situationOf } from './situations.js';
  import { sunTimes } from '../blockplan.js';
  import { localDay } from '../localday.js';
  import OwnPointSheet from './OwnPointSheet.svelte';

  let { center = null, bounds = null, line = null, profile = null, onpoints = undefined, tripId = null, canTap = false, ontapmode = undefined, fetcher = undefined } = $props();

  const hasLine = $derived(Array.isArray(line) && line.length >= 2);
  const prefsQ = prefsQuery();
  const ownQ = liveQuery(async () => listOf((await db.settings.get(OWN_KEY))?.value));

  let on = $state([]);
  let mode = $state('around');
  let radiusKm = $state(10);
  let radiusText = $state('');
  let radiusBad = $state(false);
  let ready = $state(false);
  // read the remembered choice once
  $effect(() => {
    const p = $prefsQ;
    if (!p || untrack(() => ready)) return;
    on = p.on;
    mode = p.mode;
    radiusKm = p.radiusKm;
    radiusText = RADII.includes(p.radiusKm) ? '' : num(p.radiusKm);
    ready = true;
  });
  const modeNow = $derived(mode === 'route' && !hasLine ? 'around' : mode);

  /* ---------- the kinds: your row, your names, your own kinds ---------- */
  const prefs = $derived($prefsQ ?? prefsOf(null));
  const ownCats = $derived(prefs.own);
  const ownCat = $derived(Object.fromEntries(ownCats.map((c) => [c.key, c])));
  const defName = (key) => t(CATEGORY[key]?.name ?? 'Place|poi');
  // names you typed never go through t()
  const labelOf = (key) => ownCat[key]?.name ?? prefs.names[key] ?? defName(key);
  const chips = $derived(prefs.row.map((k) => ({ key: k, label: labelOf(k), icon: ownCat[k]?.icon ?? k, own: !!ownCat[k] })));
  const more = $derived([...ALL.filter((c) => !prefs.row.includes(c.key)).map((c) => ({ key: c.key, label: labelOf(c.key), icon: c.key })), ...ownCats.filter((c) => !prefs.row.includes(c.key)).map((c) => ({ key: c.key, label: c.name, icon: c.icon }))]);
  // a search again when you change the tags of an own kind that is on
  const ownSig = $derived(JSON.stringify(ownCats.filter((c) => on.includes(c.key)).map((c) => [c.key, c.tags])));

  let res = $state(null); // loadPlaces answer
  let busy = $state(false);
  let lastBounds = $state(null);
  let lastCenter = null;
  let seq = 0;
  let listOpen = $state(true);
  let savedOpen = $state(false);
  let ownOpen = $state(false);
  let showAll = $state(false);
  let ownAll = $state(false);
  let picked = $state(null);
  let said = $state('');
  const FIRST = 30;
  const hid = `pp-${Math.random().toString(36).slice(2, 8)}`;

  const remember = () => savePrefs((v) => ({ ...v, on: $state.snapshot(on), mode, radiusKm })).catch(() => {});

  async function search({ force = false } = {}) {
    if (!on.length) {
      res = null;
      return;
    }
    const keys = $state.snapshot(on);
    const own = $state.snapshot(ownCats).filter((c) => keys.includes(c.key));
    const q = { mode: modeNow, keys, own, center: center ? { lat: center.lat, lon: center.lon } : null, radiusKm, bounds: bounds ? { ...bounds } : null, line: hasLine ? $state.snapshot(line) : null, tripId };
    if (q.mode === 'around' && !q.center) {
      res = { list: [], at: null, error: 'nohere' };
      return;
    }
    if (q.mode === 'here' && !q.bounds) {
      res = { list: [], at: null, error: 'nomap' };
      return;
    }
    const my = ++seq;
    busy = true;
    try {
      const r = await loadPlaces(q, { store: placeStore, force, online: typeof navigator === 'undefined' || navigator.onLine !== false, ...(fetcher ? { fetcher } : {}) });
      if (my !== seq) return;
      res = r;
      if (q.mode === 'here' && !r.error) lastBounds = q.bounds;
      if (q.mode === 'around') lastCenter = q.center;
    } finally {
      if (my === seq) busy = false;
    }
  }
  const later = debounce(() => search(), 600);

  // chips, mode, radius: one (debounced) search; «Here» waits for «Search here»
  $effect(() => {
    if (!ready) return;
    void [on.length, on.join(), modeNow, radiusKm, ownSig];
    untrack(() => {
      if (modeNow === 'here' && !lastBounds) {
        res = null;
        return;
      }
      later();
    });
  });
  // around: search again only when you moved more than a quarter of the radius
  $effect(() => {
    const c = center;
    if (!ready || !c) return;
    untrack(() => {
      if (modeNow !== 'around' || !on.length) return;
      if (!lastCenter || distanceOf(c, lastCenter).km >= radiusKm / 4) later();
    });
  });

  function toggle(key) {
    on = on.includes(key) ? on.filter((k) => k !== key) : [...on, key];
    remember();
  }
  function setMode(m) {
    mode = m;
    if (m === 'here') lastBounds = null;
    remember();
  }
  function setRadius(k) {
    radiusKm = Number(k);
    radiusText = '';
    radiusBad = false;
    remember();
  }
  // the servers were too busy for this radius: half of it, as your own radius (one tap)
  function smallerRadius(km) {
    radiusKm = km;
    radiusText = RADII.includes(km) ? '' : num(km);
    radiusBad = false;
    remember();
  }
  function setOwnRadius() {
    if (!String(radiusText).trim()) {
      radiusBad = false;
      return;
    }
    const r = radiusOf(radiusText);
    radiusBad = r == null;
    if (r == null) return;
    radiusKm = r;
    radiusText = RADII.includes(r) ? '' : num(r);
    remember();
  }

  const from = $derived(center ? { lat: center.lat, lon: center.lon } : null);
  // a place of an own kind shows with the icon you chose; your names go along as catName
  function deco(p) {
    const c = ownCat[p.kind];
    if (c) return { ...p, cat: p.kind, kind: c.icon, catName: c.name };
    const nm = prefs.names[p.kind];
    return nm ? { ...p, cat: p.kind, catName: nm } : { ...p, cat: p.kind };
  }
  const found = $derived(res?.list?.length ? withDistance(res.list, from, modeNow === 'route' ? line : null).map(deco) : []);
  // Live Navigation PR 3: the filters (poifilter.js); the clock moves on every minute for «open now»
  let nowMs = $state(Date.now());
  $effect(() => {
    const id = setInterval(() => (nowMs = Date.now()), 60e3);
    return () => clearInterval(id);
  });
  const onRoute = $derived(modeNow === 'route' && hasLine);
  const fctx = $derived.by(() => {
    const now = new Date(nowMs);
    const routePts = onRoute ? ptsOf(line) : [];
    return {
      now,
      starred: prefs.starred.map((p) => p.id),
      visited: prefs.visited,
      profile: onRoute ? profile : null,
      myKm: routePts.length && from ? distanceOf(from, from, routePts).atKm : null,
      endKm: routePts.at(-1)?.km ?? null,
      sun: from ? sunTimes(localDay(now), from.lat, from.lon) : null,
      onRoute,
    };
  });
  const places = $derived(applyFilter(found, prefs.filter, fctx));
  $effect(() => {
    const list = places;
    untrack(() => onpoints?.(on.length ? list : []));
  });
  const shown = $derived(showAll ? places : places.slice(0, FIRST));
  const etaText = (ms) => (ms ? new Date(ms).toLocaleTimeString(locale(), { hour: '2-digit', minute: '2-digit' }) : '');
  // Suchvorschläge (Noah 27.10.2026 «1a»): the situation buttons. One tap switches its kinds on (put into
  // the row when needed), the others off, and its filter (e.g. «open now»); what the situation before
  // switched on goes back. A second tap switches them off again.
  const sitNow = $derived(situationOf(on));
  const ALL_RADIUS_KM = 2;
  let allOn = $state(false);
  function situation(s) {
    const prev = SITUATION[sitNow];
    const back = prev ? Object.fromEntries(Object.keys(prev.filter).map((k) => [k, NO_FILTER[k]])) : {};
    allOn = false;
    if (sitNow === s.key) {
      on = [];
      savePrefs((v) => ({ ...v, on: [], mode, radiusKm, filter: normFilter({ ...v.filter, ...back }) })).catch(() => {});
      return;
    }
    on = [...s.kinds];
    const snap = [...s.kinds];
    savePrefs((v) => ({ ...s.kinds.reduce((acc, k) => showChip(acc, k), v), on: snap, mode, radiusKm, filter: normFilter({ ...v.filter, ...back, ...s.filter }) })).catch(() => {});
  }
  // «Alles» (Noah 27.10.2026): every kind of your row at once, around you within 2 km so it stays quick
  function everything() {
    if (allOn) {
      allOn = false;
      on = [];
      remember();
      return;
    }
    allOn = true;
    on = [...prefs.row];
    if (modeNow === 'around' && radiusKm > ALL_RADIUS_KM) {
      radiusKm = ALL_RADIUS_KM;
      radiusText = RADII.includes(ALL_RADIUS_KM) ? '' : num(ALL_RADIUS_KM);
    }
    remember();
  }
  const moved = $derived(modeNow === 'here' && viewMoved(lastBounds, bounds));
  const tooBig = $derived(modeNow === 'here' && !!bounds && boundsKm(bounds) > MAX_VIEW_KM);
  const when = (ms) => (ms ? new Date(ms).toLocaleString(locale(), { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '');

  const status = $derived.by(() => {
    if (!on.length) return { kind: 'quiet', text: t('Tap a kind above to see those places on the map.|poi') };
    if (busy) return { kind: 'busy', text: t('Loading places from OpenStreetMap …|poi') };
    if (modeNow === 'here' && !res) return { kind: 'quiet', text: tooBig ? t('Zoom in a little, then tap «Search here».|poi') : t('Move the map, then tap «Search here».|poi') };
    if (!res) return null;
    const e = res.error;
    if (e === 'nohere') return { kind: 'warn', text: t('Where you are is not known yet. Allow the location, or use «Here» on the map.|poi') };
    if (e === 'nomap') return { kind: 'warn', text: t('The map is not ready yet.|poi') };
    if (e === 'zoom') return { kind: 'warn', text: t('The map area is too big. Zoom in a little, then tap «Search here».|poi') };
    const count = res.list.length ? tn(res.list.length, '{n} place found', '{n} places found', {}) : t('Nothing found here.|poi');
    const asOf = res.at ? t('as of {when}|poi', { when: when(res.at) }) : '';
    if (e === 'offline') return { kind: res.stale ? 'warn' : 'bad', text: res.stale ? `${t('Offline: the kept places, as of {when}.|poi', { when: when(res.at) })} ${count}` : t('Offline and nothing kept for here. Search once with internet.|poi') };
    // Live Navigation PR 2: the true reason; with kept places, they stay with their date
    const kept = res.stale ? ` ${t('Showing the kept places, as of {when}.|poi', { when: when(res.at) })}` : '';
    const smaller = modeNow === 'around' && radiusKm > 2 ? Math.max(2, Math.round(radiusKm / 2)) : null;
    if (e === 'busy') return { kind: 'bad', retry: true, smaller, text: `${t('All OpenStreetMap servers are full or too slow right now.|poi')}${kept || ` ${smaller ? t('A smaller radius often works.|poi') : t('Try again in a minute.|poi')}`}` };
    if (e === 'net') return { kind: 'bad', retry: true, text: `${t('No OpenStreetMap server could be reached. Check the internet connection.|poi')}${kept}` };
    if (e === 'failed') return { kind: 'bad', retry: true, text: `${t('The search did not work (an error at OpenStreetMap).|poi')}${kept}` };
    return { kind: 'ok', text: [count, res.cut ? t('the nearest {n}|poi', { n: num(MAX_PLACES) }) : '', asOf].filter(Boolean).join(' · ') };
  });

  const modes = $derived([{ key: 'around', name: t('Around me|poi') }, { key: 'here', name: t('Here|poi') }, ...(hasLine ? [{ key: 'route', name: t('Along the route|poi') }] : [])]);
  const radii = RADII.map((r) => ({ key: String(r), name: t('{km} km', { km: r }) }));

  /* ---------- «Change the kinds» ---------- */
  let editOpen = $state(false);
  let form = $state(null); // { key (null: new), name, icon, text }
  let formErrors = $state([]);
  const moveRow = (from, to) => savePrefs((v) => moveChip(v, from, to));
  const rename = (c, name) => savePrefs((v) => renameChip(v, c.key, name, defName(c.key)));
  const addChip = (key) => savePrefs((v) => showChip(v, key));
  async function removeChip(c) {
    if (c.own) {
      const answer = await askDelete({ title: t('Delete «{name}»?', { name: c.label }), text: t('The kind goes from the row and from the map. Your own places stay.|poi') });
      if (answer !== 'delete') return;
    }
    const wasOn = on.includes(c.key);
    await deleteWithUndo({
      run: async () => {
        on = on.filter((k) => k !== c.key);
        const snap = $state.snapshot(on);
        return savePrefs((v) => (c.own ? removeOwnCat({ ...v, on: snap }, c.key) : hideChip({ ...v, on: snap }, c.key)));
      },
      undo: async (before) => {
        await savePrefs(() => before);
        if (wasOn && !on.includes(c.key)) on = [...on, c.key];
      },
      text: c.own ? t('«{name}» deleted.', { name: c.label }) : t('«{name}» is out of the row. It waits under «More kinds».|poi', { name: c.label }),
      name: c.label,
    });
  }
  function newForm() {
    form = { key: null, name: '', icon: OWN_ICONS[0], text: '' };
    formErrors = [];
  }
  function editForm(c) {
    const o = ownCat[c.key];
    if (!o) return;
    form = { key: o.key, name: o.name, icon: o.icon, text: o.tags.join('\n') };
    formErrors = [];
  }
  const selError = (e) => {
    const n = e.line;
    if (e.error === 'name') return t('Give the kind a name.|poi');
    if (e.error === 'none') return t('Type at least one OpenStreetMap tag.|poi');
    if (e.error === 'many') return t('At most {n} lines.|poi', { n: MAX_SELECTORS });
    if (e.error === 'key') return t('Line {n}: the key may only have letters, digits and _ : . -|poi', { n });
    if (e.error === 'value') return t('Line {n}: the value is missing or has a sign that is not allowed.|poi', { n });
    if (e.error === 'regex') return t('Line {n}: the pattern after ~ is not valid.|poi', { n });
    if (e.error === 'positive') return t('Line {n}: add a tag with = or ~ too; with != alone almost everything fits.|poi', { n });
    if (e.error === 'long') return t('Line {n}: too long, at most 4 tags in one line.|poi', { n });
    return t('Line {n}: write it like ["amenity"="bench"].|poi', { n });
  };
  async function saveForm() {
    const r = newOwnCat({ name: form.name, icon: form.icon, text: form.text });
    if (r.errors) {
      formErrors = r.errors.map(selError);
      return;
    }
    const cat = form.key ? { ...r.cat, key: form.key } : r.cat;
    const fresh = !form.key;
    if (fresh) on = [...on, cat.key];
    const snap = $state.snapshot(on);
    await savePrefs((v) => putOwnCat({ ...v, on: snap }, cat));
    form = null;
    formErrors = [];
  }

  /* ---------- saved places (starred) ---------- */
  const starred = $derived($prefsQ?.starred ?? []);
  const own = $derived($ownQ ?? []);
  async function unstar(p) {
    await savePrefs((v) => toggleStar(v, p));
  }
  async function shareAll() {
    const list = [...own.map((p) => ({ ...p, name: ownLabel(p, t), kind: '' })), ...starred];
    const text = shareText(list, (p) => (p.kind ? kindText(p) : ''), t('My places|poi'));
    const r = await shareOrCopy({ title: t('My places|poi'), text });
    said = r === 'copied' ? t('Copied. Paste it into a message.|poi') : r === 'failed' ? t('Could not share. Copy the place from the map app instead.|poi') : '';
  }
  const pts = $derived(ptsOf(line));

  /* ---------- my own places (own points) ---------- */
  const sources = $derived(sourcesOf(own));
  const ownShown = $derived(ownAll ? own : own.slice(0, FIRST));
  const mapMid = $derived(bounds && [bounds.s, bounds.n, bounds.w, bounds.e].every(Number.isFinite) ? { lat: (bounds.s + bounds.n) / 2, lon: (bounds.w + bounds.e) / 2 } : null);
  const kindName = (p) => pointKindName(p.kind, t);
  let sheet = $state(null); // { point, fresh }
  let tapping = $state(false);
  let movingP = $state(null);
  let fileMsg = $state(null); // { kind: 'ok' | 'bad', text }
  let fileBusy = $state(false);

  const addAt = (pos) => (sheet = { point: { lat: pos.lat, lon: pos.lon, name: '', note: '', kind: 'note' }, fresh: true });
  function startTap() {
    movingP = null;
    tapping = !tapping;
    ontapmode?.(tapping);
  }
  /** A tap on the map (the host calls it when canTap): → true when the panel used it. */
  export function tapMap(e) {
    if (!Number.isFinite(e?.lat) || !Number.isFinite(e?.lon)) return false;
    if (movingP) {
      const p = movingP;
      movingP = null;
      ontapmode?.(false);
      saveOwn((list) => updatePoint(list, p.id, { lat: Math.round(e.lat * 1e5) / 1e5, lon: Math.round(e.lon * 1e5) / 1e5 }));
      return true;
    }
    if (!tapping) return false;
    tapping = false;
    ontapmode?.(false);
    addAt(e);
    return true;
  }
  async function saveSheet(p) {
    if (sheet?.fresh) await saveOwn((list) => [...list, newPoint(p)]);
    else await saveOwn((list) => updatePoint(list, p.id, { name: p.name, note: p.note, kind: p.kind }));
  }
  async function removeOwn(p) {
    const name = ownLabel(p, t);
    const answer = await askDelete({ title: t('Delete «{name}»?', { name }), text: t('The point goes from every map. The trips stay as they are.') });
    if (answer !== 'delete') return false;
    let before = [];
    await deleteWithUndo({
      run: async () => (before = await saveOwn((list) => removePoint(list, p.id))),
      undo: () => putOwn(before),
      text: t('«{name}» deleted.', { name }),
      name,
    });
  }
  const moveOwn = (from, to) => saveOwn((list) => movePoint(list, from, to));
  const renameSrc = (src, to) => saveOwn((list) => renameSource(list, src, to));
  async function removeSrc(s) {
    const answer = await askDelete({ title: t('Remove the {n} places of «{name}»?|poi', { n: num(s.n), name: s.src }), text: t('They go from every map. You can load the file again any time.|poi'), label: t('Remove') });
    if (answer !== 'delete') return;
    let before = [];
    await deleteWithUndo({
      run: async () => (before = await saveOwn((list) => removeSource(list, s.src))),
      undo: () => putOwn(before),
      text: t('«{name}» removed.|poi', { name: s.src }),
      name: s.src,
    });
  }
  async function loadFile(e) {
    const input = e.currentTarget;
    const f = input.files?.[0];
    if (!f) return;
    fileMsg = null;
    fileBusy = true;
    try {
      if (f.size > MAX_FILE_MB * 1024 * 1024) {
        fileMsg = { kind: 'bad', text: t('The file is too big (at most {mb} MB).|poi', { mb: MAX_FILE_MB }) };
        return;
      }
      let name = f.name;
      let text;
      if (fileKind(f.name) === 'kmz') {
        text = await kmzText(await f.arrayBuffer());
        if (!text) {
          fileMsg = { kind: 'bad', text: t('No KML file found inside the KMZ.|poi') };
          return;
        }
        name = f.name.replace(/\.kmz$/i, '.kml');
      } else text = await f.text();
      const r = placesFromFile(name, text);
      if (r.error) {
        fileMsg = {
          kind: 'bad',
          text:
            r.error === 'unknown'
              ? t('This kind of file is not known. Use GPX, KML, KMZ or CSV.|poi')
              : r.error === 'no-position'
                ? t('No columns lat and lon found. The first line must name them, e.g. name;lat;lon.|poi')
                : r.error === 'empty'
                  ? t('No places with a position found in the file.|poi')
                  : t('The file could not be read.|poi'),
        };
        return;
      }
      // the file name is the source; loading the same file again replaces its places
      const src = srcOf(f.name.replace(/\.(gpx|kml|kmz|csv|txt|tsv)$/i, '')) || srcOf(f.name);
      let old = 0;
      await saveOwn((list) => {
        old = list.filter((p) => p.src === src).length;
        return [...list.filter((p) => p.src !== src), ...importPoints(r.places, src)];
      });
      fileMsg = {
        kind: 'ok',
        text: [
          t('Loaded from «{name}»: {n} places.|poi', { name: src, n: num(r.places.length) }),
          old ? t('The {n} from before are replaced.|poi', { n: num(old) }) : '',
          r.skipped ? t('{n} without a usable position were left out.|poi', { n: num(r.skipped) }) : '',
          r.cut ? t('Only the first {n} were taken.|poi', { n: num(r.places.length) }) : '',
        ]
          .filter(Boolean)
          .join(' '),
      };
      ownOpen = true;
    } catch (err) {
      console.error(err);
      fileMsg = { kind: 'bad', text: t('The file could not be read.|poi') };
    } finally {
      fileBusy = false;
      input.value = '';
    }
  }
</script>

<section class="pp" aria-labelledby={hid} data-poi-panel>
  <h3 id={hid} class="pp-title">{t('Places on the map|poi')}</h3>

  <div class="pp-sits" role="group" aria-labelledby="{hid}-q" data-poi-quick>
    <span class="pp-qlab" id="{hid}-q">{t('What do you need?|poi')}</span>
    <div class="pp-sitgrid">
      {#each SITUATIONS as s (s.key)}
        <button type="button" class="pp-sit" aria-pressed={sitNow === s.key && !allOn} onclick={() => situation(s)} data-poi-quick-btn={s.key}><span class="pp-emo" aria-hidden="true">{s.emoji}</span>{t(s.name)}</button>
      {/each}
      <button type="button" class="pp-sit" aria-pressed={allOn} onclick={everything} data-poi-all><span class="pp-emo" aria-hidden="true">✳️</span>{t('Everything|poi')}</button>
    </div>
    {#if allOn}<p class="pp-sithint" data-poi-sithint>{t('Every kind of your row at once, within {km} km.|poi', { km: num(ALL_RADIUS_KM) })}</p>
    {:else if sitNow}<p class="pp-sithint" data-poi-sithint>{t('«{name}» looks for: {kinds}.|poi', { name: t(SITUATION[sitNow].name), kinds: SITUATION[sitNow].kinds.map(labelOf).join(', ') })}{#if SITUATION[sitNow].filter.open === 'now'}{' '}{t('Only what is open now.|poi')}{/if}</p>{/if}
  </div>
  <div class="pp-chips" role="group" aria-label={t('Kinds of places|poi')} data-poi-chips>
    {#each chips as c (c.key)}
      {@const Icon = iconOf(c.icon)}
      <button type="button" class="pp-chip" aria-pressed={on.includes(c.key)} onclick={() => toggle(c.key)} data-poi-chip={c.key}>
        <Icon size={16} aria-hidden="true" /><span>{c.label}</span>
      </button>
    {/each}
  </div>
  <button type="button" class="pp-re pp-left" aria-expanded={editOpen} onclick={() => (editOpen = !editOpen)} data-poi-kinds-edit>
    <SlidersHorizontal size={14} aria-hidden="true" />{editOpen ? t('Close the kinds|poi') : t('Change the kinds|poi')}
  </button>

  {#if editOpen}
    <div class="pp-box" data-poi-kinds>
      <p class="pp-hint">{t('Sort with the arrows or drag the handle. Type a new name, or take a kind out of the row: it waits below under «More kinds».|poi')}</p>
      {#if chips.length}
        <ul class="pp-list" use:sortable={{ onmove: (a, b) => moveRow(a, b) }} data-poi-kind-list>
          {#each chips as c, i (c.key)}
            {@const Icon = iconOf(c.icon)}
            <li class="pp-erow" data-sort-id={c.key} data-poi-kind-row={c.key}>
              <SortGrip name={c.label} onstep={(d) => moveRow(i, i + d)} />
              <span class="pp-ic" aria-hidden="true"><Icon size={16} /></span>
              <input class="inp pp-inp" value={c.label} maxlength="40" aria-label={t('Name of the kind «{name}»|poi', { name: c.label })} onchange={(e) => rename(c, e.currentTarget.value)} data-poi-kind-name={c.key} />
              <SortArrows name={c.label} {i} n={chips.length} onstep={(d) => moveRow(i, i + d)} />
              {#if c.own}
                <button type="button" class="pp-nav" aria-label={t('Change the tags of «{name}»|poi', { name: c.label })} onclick={() => editForm(c)} data-poi-kind-change={c.key}><Pencil size={16} aria-hidden="true" /></button>
              {/if}
              <button type="button" class="pp-nav" aria-label={c.own ? t('Delete «{name}»?', { name: c.label }) : t('Take «{name}» out of the row|poi', { name: c.label })} onclick={() => removeChip(c)} data-poi-kind-remove={c.key}><X size={16} aria-hidden="true" /></button>
            </li>
          {/each}
        </ul>
      {:else}
        <p class="pp-hint">{t('No kind in the row. Add one below.|poi')}</p>
      {/if}

      {#if more.length}
        <h4 class="pp-sub">{t('More kinds|poi')}</h4>
        <p class="pp-hint">{t('Tap a kind to put it into the row.|poi')}</p>
        <div class="pp-wrap">
          {#each more as c (c.key)}
            {@const Icon = iconOf(c.icon)}
            <button type="button" class="pp-chip pp-add" onclick={() => addChip(c.key)} data-poi-kind-add={c.key}><Plus size={14} aria-hidden="true" /><Icon size={16} aria-hidden="true" /><span>{c.label}</span></button>
          {/each}
        </div>
      {/if}

      <h4 class="pp-sub">{t('Own kind|poi')}</h4>
      {#if !form}
        <p class="pp-hint">{t('Your own kind finds what OpenStreetMap marks with the tags you type, e.g. benches or fountains with a tap.|poi')}</p>
        <button type="button" class="pp-more" onclick={newForm} data-poi-cat-new><Plus size={16} aria-hidden="true" />{t('New own kind|poi')}</button>
      {:else}
        <div class="pp-form" data-poi-cat-form>
          <label class="pp-lab">{t('Name')}<input class="inp" bind:value={form.name} maxlength="40" placeholder={t('e.g. Benches|poi')} data-poi-cat-name /></label>
          <div class="pp-lab">
            <span id="{hid}-ic">{t('Icon|poi')}</span>
            <div class="pp-wrap" role="group" aria-labelledby="{hid}-ic">
              {#each OWN_ICONS as k (k)}
                {@const Icon = iconOf(k)}
                <button type="button" class="pp-iconbtn" aria-pressed={form.icon === k} aria-label={defName(k)} onclick={() => (form.icon = k)} data-poi-cat-icon={k}><Icon size={18} aria-hidden="true" /></button>
              {/each}
            </div>
          </div>
          <label class="pp-lab">{t('OpenStreetMap tags, one per line|poi')}<textarea class="inp" rows="3" bind:value={form.text} spellcheck="false" autocapitalize="off" placeholder={'["amenity"="bench"]'} data-poi-cat-tags></textarea></label>
          <p class="pp-hint">{t('An OpenStreetMap tag says what a place is, as key and value. Example: ["amenity"="bench"] finds benches, ["shop"="bicycle"] bike shops. A place that fits any line shows. Also possible: ["cuisine"~"pizza|pasta"] (one of several), ["fee"!="yes"] (not this), ["wheelchair"] (has the key). The tags are listed on wiki.openstreetmap.org.|poi')}</p>
          {#if formErrors.length}
            <ul class="pp-errs" role="alert" data-poi-cat-errors>
              {#each formErrors as e, i (i)}<li>{e}</li>{/each}
            </ul>
          {/if}
          <div class="pp-acts">
            <button type="button" class="pp-here" onclick={saveForm} data-poi-cat-save>{t('Save')}</button>
            <button type="button" class="pp-more" onclick={() => ((form = null), (formErrors = []))}>{t('Cancel')}</button>
          </div>
        </div>
      {/if}
    </div>
  {/if}

  <div class="pp-where">
    <Seg options={modes} value={modeNow} onchange={setMode} label={t('Where to search|poi')} full={false} small />
    {#if modeNow === 'around'}
      <Seg options={radii} value={String(radiusKm)} onchange={setRadius} label={t('Radius|poi')} full={false} small />
      <label class="pp-own-r">
        <span>{t('Own|radius')}</span>
        <input class="inp pp-r" type="text" inputmode="decimal" bind:value={radiusText} onchange={setOwnRadius} placeholder="15" aria-label={t('Own radius in km, {min} to {max}|poi', { min: RADIUS_MIN, max: RADIUS_MAX })} aria-invalid={radiusBad} data-poi-radius-own />
        <span>km</span>
      </label>
    {/if}
  </div>
  {#if modeNow === 'around' && radiusBad}
    <p class="pp-status pp-bad" role="alert" data-poi-radius-bad>{t('Type a radius from {min} to {max} km, e.g. 15 or 7.5.|poi', { min: RADIUS_MIN, max: RADIUS_MAX })}</p>
  {/if}
  {#if modeNow === 'here' && on.length}
    <button type="button" class="pp-here" onclick={() => search({ force: true })} disabled={busy || tooBig || !bounds || (!moved && !!res && !res.error)} data-poi-search-here>
      <Search size={16} aria-hidden="true" />{t('Search here|poi')}
    </button>
  {/if}

  {#if status}
    <p class="pp-status pp-{status.kind}" role="status" aria-live="polite" data-poi-status={status.kind}>
      <span>{status.text}</span>
      {#if status.retry || (status.kind === 'ok' && res?.at)}
        <button type="button" class="pp-re" onclick={() => search({ force: true })} disabled={busy} data-poi-retry>
          <RefreshCw size={14} aria-hidden="true" />{status.retry ? t('Try again') : t('Load again')}
        </button>
      {/if}
      {#if status.smaller}
        <button type="button" class="pp-re" onclick={() => smallerRadius(status.smaller)} disabled={busy} data-poi-smaller>{t('Search {km} km around me|poi', { km: num(status.smaller) })}</button>
      {/if}
    </p>
  {/if}

  {#if found.length}
    <PoiFilter filter={prefs.filter} presets={prefs.presets} hasRoute={onRoute} hasProfile={onRoute && Array.isArray(profile) && profile.length > 1} shown={places.length} total={found.length} />
    {#if !places.length}
      <p class="pp-status pp-warn" role="status" data-poi-filter-empty>{t('No place fits the filters. Switch a filter off.|poi')}</p>
    {/if}
  {/if}
  {#if places.length}
    <div class="pp-fold">
      <button type="button" class="pp-fh" aria-expanded={listOpen} onclick={() => (listOpen = !listOpen)} data-poi-list-toggle>
        <span>{t('Places|poi')} <span class="num">{num(places.length)}</span></span><ChevronDown size={18} aria-hidden="true" class={listOpen ? 'pp-up' : ''} />
      </button>
      {#if listOpen}
        <ul class="pp-list" data-poi-list>
          {#each shown as p (p.id)}
            {@const Icon = iconOf(p.kind)}
            {@const o = openText(p.hours)}
            {@const nav = navLinks(p)}
            <li class="pp-row" data-poi-row={p.cat ?? p.kind}>
              <button type="button" class="pp-open" onclick={() => (picked = picked?.id === p.id ? null : p)} aria-expanded={picked?.id === p.id}>
                <span class="pp-ic" aria-hidden="true"><Icon size={16} /></span>
                <span class="pp-txt">
                  <span class="pp-name">{titleOf(p)}</span>
                  <span class="pp-meta"><span class="num">{distText(p.d)}</span>{#if p.eta && (prefs.filter.open === 'arrive' || prefs.filter.sort === 'arrive' || prefs.filter.dark)}{' · '}<span class="num" data-poi-eta>{t('there about {time}|poi', { time: etaText(p.eta) })}</span>{/if}{#if o.text}{' · '}<span class="pp-o-{o.state}">{o.text}</span>{/if}{#if p.last && onRoute}{' · '}<span class="pp-last" data-poi-last>{t('Last chance|poi')}</span>{/if}</span>
                </span>
              </button>
              <a class="pp-nav" href={nav.google} target="_blank" rel="noopener noreferrer" aria-label={t('Navigate with Google Maps to {name}|poi', { name: titleOf(p) })}><Navigation size={16} aria-hidden="true" /><span>G</span></a>
              <a class="pp-nav" href={nav.osmand} target="_blank" rel="noopener noreferrer" aria-label={t('Navigate with OsmAnd to {name}|poi', { name: titleOf(p) })}><Navigation size={16} aria-hidden="true" /><span>O</span></a>
              {#if picked?.id === p.id}
                <div class="pp-detail"><PoiDetail place={p} {from} line={modeNow === 'route' || pts.length ? line : null} {profile} onclose={() => (picked = null)} /></div>
              {/if}
            </li>
          {/each}
        </ul>
        {#if places.length > FIRST}
          <button type="button" class="pp-more" onclick={() => (showAll = !showAll)} aria-expanded={showAll}>{showAll ? t('Show fewer') : t('Show all {n}', { n: num(places.length) })}</button>
        {/if}
      {/if}
    </div>
  {/if}

  <div class="pp-fold">
    <button type="button" class="pp-fh" aria-expanded={savedOpen} onclick={() => (savedOpen = !savedOpen)} data-poi-saved-toggle>
      <span>{t('Saved places|poi')} {#if starred.length}<span class="num">{num(starred.length)}</span>{/if}</span><ChevronDown size={18} aria-hidden="true" class={savedOpen ? 'pp-up' : ''} />
    </button>
    {#if savedOpen}
      {#if !starred.length && !own.length}
        <p class="pp-hint">{t('Tap a place, then «Save». Your own places are under «My own places».|poi')}</p>
      {:else}
        {#if !starred.length}<p class="pp-hint">{t('Tap a place, then «Save». Your own places are under «My own places».|poi')}</p>{/if}
        <ul class="pp-list" data-poi-saved>
          {#each starred as p (p.id)}
            {@const Icon = iconOf(p.kind)}
            <li class="pp-row pp-plain" data-poi-saved-row>
              <span class="pp-ic" aria-hidden="true"><Icon size={16} /></span>
              <span class="pp-txt"><span class="pp-name">{titleOf(p)}</span><span class="pp-meta">{kindText(p)}{#if from}{' · '}<span class="num">{distText(distanceOf(p, from))}</span>{/if}</span></span>
              <button type="button" class="pp-nav" onclick={() => unstar(p)} aria-label={t('Remove «{name}» from the saved places|poi', { name: titleOf(p) })} data-poi-unstar><StarOff size={16} aria-hidden="true" /></button>
            </li>
          {/each}
        </ul>
        <button type="button" class="pp-here" onclick={shareAll} data-poi-share-all><Share2 size={16} aria-hidden="true" />{t('Share the list|poi')}</button>
        {#if said}<p class="pp-hint" role="status">{said}</p>{/if}
      {/if}
    {/if}
  </div>


  <div class="pp-fold">
    <button type="button" class="pp-fh" aria-expanded={ownOpen} onclick={() => (ownOpen = !ownOpen)} data-poi-own-toggle>
      <span>{t('My own places|poi')} {#if own.length}<span class="num">{num(own.length)}</span>{/if}</span><ChevronDown size={18} aria-hidden="true" class={ownOpen ? 'pp-up' : ''} />
    </button>
    {#if ownOpen}
      <div class="pp-box" data-poi-own>
        <p class="pp-hint">{t('Places you set yourself or load from a file. They show on every map as «My points», for every trip.|poi')}</p>
        <div class="pp-acts">
          {#if canTap}
            <button type="button" class="pp-more" aria-pressed={tapping} onclick={startTap} data-poi-own-add-tap><MapPin size={16} aria-hidden="true" />{tapping ? t('Cancel adding') : t('Add: tap the map|poi')}</button>
          {/if}
          <button type="button" class="pp-more" onclick={() => mapMid && addAt(mapMid)} disabled={!mapMid} data-poi-own-add-center><Crosshair size={16} aria-hidden="true" />{t('Add at the map centre|poi')}</button>
          <button type="button" class="pp-more" onclick={() => from && addAt(from)} disabled={!from} data-poi-own-add-here><LocateFixed size={16} aria-hidden="true" />{t('Add where I am|poi')}</button>
          <label class="pp-more pp-file" aria-disabled={fileBusy}>
            <Upload size={16} aria-hidden="true" />{fileBusy ? t('Reading…') : t('Load from a file|poi')}
            <input type="file" accept=".gpx,.kml,.kmz,.csv,.txt,.tsv" onchange={loadFile} disabled={fileBusy} data-poi-own-file />
          </label>
        </div>
        {#if tapping}<p class="pp-status pp-warn" role="status">{t('Now tap the spot on the map.|poi')}</p>{/if}
        {#if movingP}<p class="pp-status pp-warn" role="status">{t('Tap the new spot of «{name}» on the map.', { name: ownLabel(movingP, t) })} <button type="button" class="pp-re" onclick={() => ((movingP = null), ontapmode?.(false))}>{t('Cancel')}</button></p>{/if}
        <p class="pp-hint">{t('«At the map centre»: first move the map so the spot is in the middle.|poi')}</p>
        <p class="pp-hint">{t('Files: GPX (waypoints), KML or KMZ (e.g. Google My Maps › Export to KML/KMZ) or CSV with the columns lat and lon, and name and category if you like. Each file is kept as one source: rename it, or remove all its places at once.|poi')}</p>
        {#if fileMsg}<p class="pp-status pp-{fileMsg.kind === 'ok' ? 'ok' : 'bad'}" role="status" data-poi-own-msg={fileMsg.kind}>{fileMsg.text}</p>{/if}

        {#if sources.length}
          <h4 class="pp-sub">{t('Loaded files|poi')}</h4>
          <ul class="pp-list" data-poi-srcs>
            {#each sources as s (s.src)}
              <li class="pp-erow pp-src" data-poi-src={s.src}>
                <input class="inp pp-inp" value={s.src} maxlength="80" aria-label={t('Name of the file «{name}»|poi', { name: s.src })} onchange={(e) => renameSrc(s.src, e.currentTarget.value)} data-poi-src-name />
                <span class="pp-meta num">{t('{n} places|poi', { n: num(s.n) })}</span>
                <button type="button" class="pp-nav" aria-label={t('Remove the {n} places of «{name}»?|poi', { n: num(s.n), name: s.src })} onclick={() => removeSrc(s)} data-poi-src-remove><X size={16} aria-hidden="true" /></button>
              </li>
            {/each}
          </ul>
        {/if}

        {#if own.length}
          <ul class="pp-list" use:sortable={{ onmove: (a, b) => moveOwn(a, b) }} data-poi-own-list>
            {#each ownShown as p, i (p.id)}
              <li class="pp-erow" data-sort-id={p.id} data-poi-own-row={p.id}>
                <SortGrip name={ownLabel(p, t)} onstep={(d) => moveOwn(i, i + d)} />
                <button type="button" class="pp-open" onclick={() => (sheet = { point: p, fresh: false })} aria-label={t('Change {name}', { name: ownLabel(p, t) })}>
                  <span class="pp-txt">
                    <span class="pp-name">{ownLabel(p, t)}</span>
                    <span class="pp-meta">{kindName(p)}{#if p.src}{' · '}{p.src}{/if}{#if from}{' · '}<span class="num">{distText(distanceOf(p, from))}</span>{/if}</span>
                  </span>
                </button>
                <SortArrows name={ownLabel(p, t)} {i} n={own.length} onstep={(d) => moveOwn(i, i + d)} />
                <button type="button" class="pp-nav" aria-label={t('Change {name}', { name: ownLabel(p, t) })} onclick={() => (sheet = { point: p, fresh: false })} data-poi-own-edit={p.id}><Pencil size={16} aria-hidden="true" /></button>
              </li>
            {/each}
          </ul>
          {#if own.length > FIRST}
            <button type="button" class="pp-more" onclick={() => (ownAll = !ownAll)} aria-expanded={ownAll}>{ownAll ? t('Show fewer') : t('Show all {n}', { n: num(own.length) })}</button>
          {/if}
        {:else}
          <p class="pp-hint" data-poi-own-empty>{t('No own places yet.|poi')}</p>
        {/if}
      </div>
    {/if}
  </div>

  <p class="pp-hint">{t('Data from OpenStreetMap, free. What was loaded along the route works offline.|poi')}</p>
</section>

{#if sheet}
  {#key sheet}
    <OwnPointSheet point={sheet.point} fresh={sheet.fresh} onsave={saveSheet} ondelete={removeOwn} onmove={canTap ? (p) => ((movingP = p), ontapmode?.(true)) : null} onclose={() => (sheet = null)} />
  {/key}
{/if}

<style>
  .pp {
    display: grid;
    gap: var(--sp-2);
    min-width: 0;
  }
  .pp-title {
    margin: 0;
    font: 600 var(--fs-small) / 1.3 var(--font-body);
  }
  .pp-chips {
    display: flex;
    gap: var(--sp-2);
    min-width: 0;
    max-width: 100%;
    overflow-x: auto;
    overscroll-behavior-x: contain;
    scrollbar-width: none;
    padding-bottom: 2px;
    scroll-snap-type: x proximity;
  }
  .pp-chips::-webkit-scrollbar {
    display: none;
  }
  .pp-chip {
    display: inline-flex;
    align-items: center;
    gap: var(--sp-1);
    flex: none;
    min-height: 44px;
    padding: 0 var(--sp-3);
    border: 1px solid var(--line-strong);
    border-radius: 999px;
    background: var(--paper);
    color: var(--ink);
    font: 500 var(--fs-small) / 1.2 var(--font-body);
    white-space: nowrap;
    scroll-snap-align: start;
  }
  .pp-chip[aria-pressed='true'] {
    background: var(--ink);
    border-color: var(--ink);
    color: var(--paper);
  }
  .pp-where {
    display: flex;
    flex-wrap: wrap;
    gap: var(--sp-2);
    min-width: 0;
  }
  .pp-here,
  .pp-more {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: var(--sp-1);
    min-height: 44px;
    padding: 0 var(--sp-4);
    border: 1px solid var(--brand);
    border-radius: var(--r-ctl);
    background: var(--brand);
    color: var(--brand-ink);
    font: 600 var(--fs-small) / 1.2 var(--font-body);
  }
  .pp-more {
    background: var(--paper);
    color: var(--ink);
    border-color: var(--line-strong);
  }
  .pp-here:disabled {
    opacity: 0.5;
  }
  .pp-status {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--sp-1) var(--sp-2);
    margin: 0;
    font-size: var(--fs-small);
    color: var(--ink-2);
  }
  .pp-status.pp-warn {
    color: var(--warn);
  }
  .pp-status.pp-bad {
    color: var(--bad);
  }
  .pp-re {
    display: inline-flex;
    align-items: center;
    gap: var(--sp-1);
    min-height: 44px;
    padding: 0 var(--sp-2);
    border: 0;
    background: transparent;
    color: var(--ink);
    font: 600 var(--fs-small) / 1.2 var(--font-body);
    text-decoration: underline;
  }
  .pp-fold {
    border-top: 1px solid var(--line);
  }
  .pp-fh {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    min-height: 44px;
    padding: 0;
    border: 0;
    background: transparent;
    color: var(--ink);
    font: 600 var(--fs-small) / 1.2 var(--font-body);
    text-align: left;
  }
  :global(.pp-up) {
    transform: rotate(180deg);
  }
  .pp-list {
    display: grid;
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .pp-row {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 44px 44px;
    align-items: center;
    gap: var(--sp-1);
    border-top: 1px solid var(--line);
  }
  .pp-plain {
    grid-template-columns: auto minmax(0, 1fr) 44px;
    min-height: 44px;
  }
  .pp-plain:not(:has(.pp-ic)) {
    grid-template-columns: minmax(0, 1fr);
  }
  .pp-open {
    display: flex;
    align-items: center;
    gap: var(--sp-2);
    min-width: 0;
    min-height: 44px;
    padding: var(--sp-1) 0;
    border: 0;
    background: transparent;
    color: var(--ink);
    text-align: left;
    font: inherit;
  }
  .pp-ic {
    display: grid;
    place-items: center;
    flex: none;
    width: 28px;
    height: 28px;
    border-radius: 50%;
    background: var(--paper-2);
    color: var(--ink);
  }
  .pp-txt {
    display: grid;
    min-width: 0;
  }
  .pp-name {
    font: 600 var(--fs-small) / 1.3 var(--font-body);
    overflow-wrap: break-word;
  }
  .pp-meta {
    font-size: var(--fs-tiny);
    color: var(--ink-3);
    overflow-wrap: break-word;
  }
  .pp-sits {
    display: grid;
    gap: var(--sp-2);
  }
  .pp-sitgrid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(92px, 1fr));
    gap: var(--sp-2);
  }
  .pp-sit {
    display: grid;
    justify-items: center;
    align-content: center;
    gap: 2px;
    min-height: 64px;
    padding: 8px 4px;
    border: 1px solid var(--line-strong);
    border-radius: 14px;
    background: var(--paper);
    color: var(--ink);
    font: 600 var(--fs-small) var(--font-body);
    text-align: center;
    overflow-wrap: break-word;
    cursor: pointer;
  }
  .pp-sit[aria-pressed='true'] {
    background: var(--brand);
    border-color: var(--brand);
    color: var(--brand-ink);
  }
  .pp-emo {
    font-size: var(--fs-section);
    line-height: 1;
  }
  .pp-sithint {
    margin: 0;
    font-size: var(--fs-small);
    color: var(--ink-2);
  }
  .pp-qlab {
    font-size: var(--fs-small);
    color: var(--ink-2);
  }
  .pp-last {
    color: var(--warn);
    font-weight: 600;
  }
  .pp-o-open {
    color: var(--ok);
  }
  .pp-o-closed {
    color: var(--bad);
  }
  .pp-nav {
    display: grid;
    grid-auto-flow: column;
    place-items: center;
    place-content: center;
    gap: 2px;
    width: 44px;
    height: 44px;
    border: 0;
    border-radius: var(--r-ctl);
    background: transparent;
    color: var(--ink);
    font: 600 var(--fs-tiny) / 1 var(--font-body);
    text-decoration: none;
  }
  .pp-detail {
    grid-column: 1 / -1;
    padding-bottom: var(--sp-2);
  }
  .pp-hint {
    margin: 0;
    font-size: var(--fs-tiny);
    color: var(--ink-3);
  }
  .pp-left {
    justify-self: start;
  }
  .pp-box {
    display: grid;
    gap: var(--sp-2);
    min-width: 0;
    padding-bottom: var(--sp-2);
  }
  .pp-sub {
    margin: var(--sp-2) 0 0;
    font: 600 var(--fs-small) / 1.3 var(--font-body);
  }
  .pp-erow {
    display: flex;
    align-items: center;
    gap: var(--sp-1);
    min-width: 0;
    min-height: 44px;
    border-top: 1px solid var(--line);
  }
  .pp-erow .pp-open {
    flex: 1 1 auto;
  }
  .pp-inp {
    flex: 1 1 auto;
    min-width: 0;
    width: 100%;
  }
  .pp-src .pp-meta {
    flex: none;
  }
  .pp-wrap {
    display: flex;
    flex-wrap: wrap;
    gap: var(--sp-2);
    min-width: 0;
  }
  .pp-add {
    white-space: normal;
  }
  .pp-iconbtn {
    display: grid;
    place-items: center;
    width: 44px;
    height: 44px;
    border: 1px solid var(--line-strong);
    border-radius: var(--r-ctl);
    background: var(--paper);
    color: var(--ink);
  }
  .pp-iconbtn[aria-pressed='true'] {
    background: var(--ink);
    border-color: var(--ink);
    color: var(--paper);
  }
  .pp-form,
  .pp-lab {
    display: grid;
    gap: var(--sp-1);
    min-width: 0;
  }
  .pp-lab {
    font: 600 var(--fs-small) / 1.3 var(--font-body);
  }
  .pp-errs {
    margin: 0;
    padding-left: var(--sp-4);
    color: var(--bad);
    font-size: var(--fs-small);
  }
  .pp-acts {
    display: flex;
    flex-wrap: wrap;
    gap: var(--sp-2);
  }
  .pp-own-r {
    display: inline-flex;
    align-items: center;
    gap: var(--sp-1);
    font-size: var(--fs-small);
    color: var(--ink-2);
  }
  .pp-r {
    width: 4.5em;
    min-height: 44px;
  }
  .pp-file {
    position: relative;
    cursor: pointer;
  }
  .pp-file input {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    opacity: 0;
    cursor: pointer;
  }
  .pp-more:disabled {
    opacity: 0.5;
  }
  .pp-status.pp-ok {
    color: var(--ok);
  }
</style>
