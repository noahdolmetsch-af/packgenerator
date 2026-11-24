<script>
  /**
   * «Tourenvorschläge» (Noah 05.11.2026 «a b, Mockup ja», «1a 2a 3a»), Touren › Träume › Tourenvorschläge (#/trips/vorschlaege).
   * 100 mountain bike tours from the official network «Mountainbikeland Schweiz» (swisstopo, SchweizMobil), nearest first,
   * with the filters canton, kind, start, fitness (hard at the start), skill and time, «Why this suggestion?», a height profile with the ground, and the
   * real map. The rules are in lib/vorschlaege/regeln.js (pure, tests/vorschlaege.test.js). The data (data/netz.js) loads only
   * with this page. Tours that do not fit this month (snow) stand grey in their own group, with the reason.
   * Your own data: pace (Dein Tempo), home place and your rides (for «new for you») are only read; «Not for me» and the
   * filters stay on this device. «Keep as a dream» adds the tour to Touren › Träume.
   */
  import { onMount } from 'svelte';
  import { liveQuery } from 'dexie';
  import { db } from '../lib/db.js';
  import { PACE_KEY, paceOf } from '../lib/pace.js';
  import { HOME_PLACE } from '../lib/know.js';
  import { heatLines } from '../lib/heat/heat.js';
  import { DREAMS_KEY, storeOf, newDream } from '../lib/dreams.js';
  import { saveGpx } from '../lib/gpxout.js';
  import { localDay } from '../lib/localday.js';
  import { deleteWithUndo } from '../lib/ui/ask.js';
  import Empty from '../lib/ui/Empty.svelte';
  import MoreActions from '../lib/ui/MoreActions.svelte';
  import ShowMore from '../lib/ui/ShowMore.svelte';
  import MainBar from '../lib/ui/MainBar.svelte';
  import { backClose } from '../lib/ui/backclose.js';
  import { phone } from '../lib/media.svelte.js';
  import VeloHead from '../lib/bikes/VeloHead.svelte';
  import { RASTER_GROUNDS } from '../lib/map/sources.js';
  import { mapGround, chooseGround } from '../lib/map/groundpref.svelte.js';
  import ProfileStrip from '../lib/map/ProfileStrip.svelte';
  import Untergrund from '../lib/vorschlaege/Untergrund.svelte';
  import { fineOfTour, coarseOfTour, steepest, stretchOf, STEEP_PCT } from '../lib/vorschlaege/steil.js';
  import { lineKm, pointAtKm, nearestOnLine } from '../lib/spur/kmmarks.js';
  import { REGIONS, LEVELS, COND_STD, TECH_STD, HOURS, ARTS, AWAYS, TRAVELS, MODES, WHY_KEYS, artsOf, filterTours, splitNow, hoursOf, splitHours, snowOf, gridOf, newShare, whyOf, warnsOf, levelsOf, gpxOf, dreamTextOf } from '../lib/vorschlaege/regeln.js';
  import { anreiseOf, dayHours } from '../lib/vorschlaege/anreise.js';
  import { freeToday, doableToday, bikeFit } from '../lib/vorschlaege/passt.js';
  import { formQuery } from '../lib/form-data.js';
  import { dayAnswer } from '../lib/flow/form/tagesantwort.js';
  import { answerLine } from '../lib/flow/form/words.js';
  import { loadCore, bestWindows, hoursBetween, warningsOf, packHints, PACK_TEXT, WARN_TEXT, costWord, COST_WORD } from '../lib/wetter/kern.js';
  import { CHOICES, loadWetter, verdictFor, bestDay, weekOf, sortByWeather, addDays } from '../lib/vorschlaege/wetter.js';
  import { NEU_MODES, spotList, reachedOf, spotIndex, freshSpots, cantonNew, runsOf, neuOk, neuSort, GOAL_KEY, GOAL_NS, GOAL_PCTS, goalOf, monthOf, doneIn, tickTour } from '../lib/vorschlaege/neuland.js';
  import { prefsOf, AGENDA_KEY } from '../lib/agenda.js';
  import { ITEMS_KEY } from '../lib/woche.js';
  import { t, num, locale } from '../lib/i18n.svelte.js';
  import { Mountain, Download, Sparkles, SlidersHorizontal, EyeOff, Snowflake, TriangleAlert, Clock, MapPin, Check, Info, ChevronRight, TrainFront, Car, User, CloudRain, Droplets, Shirt } from '@lucide/svelte';
  import '../lib/ich/ich.css';

  const today = localDay();
  const month = Number(today.slice(5, 7));
  const FILTER_KEY = 'vorschlaege.filter';
  const HIDE_KEY = 'tourvorschlaege';

  let tours = $state(null); // the data loads with the page
  onMount(async () => {
    tours = (await import('../lib/vorschlaege/data/netz.js')).default;
  });

  // ---- hash: the list or one tour (#/trips/vorschlaege/<id>)
  let hash = $state(location.hash);
  onMount(() => {
    const on = () => (hash = location.hash);
    addEventListener('hashchange', on);
    return () => removeEventListener('hashchange', on);
  });
  const openId = $derived(hash.match(/^#\/trips\/vorschlaege\/([\w-]+)/)?.[1] ?? null);

  // ---- filters (kept on this device)
  const read = () => {
    try {
      const f = JSON.parse(localStorage.getItem(FILTER_KEY) || 'null');
      return {
        regions: Array.isArray(f?.regions) ? f.regions.filter((k) => REGIONS.some((r) => r.key === k)) : [],
        conds: Array.isArray(f?.conds) ? f.conds.filter((l) => LEVELS.includes(l)) : [...COND_STD],
        techs: Array.isArray(f?.techs) ? f.techs.filter((l) => LEVELS.includes(l)) : [...TECH_STD],
        maxHours: HOURS.includes(f?.maxHours) ? f.maxHours : null,
        arts: Array.isArray(f?.arts) ? f.arts.filter((k) => ARTS.includes(k)) : [],
        maxAway: AWAYS.includes(f?.maxAway) ? f.maxAway : null,
        maxTravel: TRAVELS.includes(f?.maxTravel) ? f.maxTravel : null,
        mode: MODES.includes(f?.mode) ? f.mode : 'pt',
        wday: CHOICES.includes(f?.wday) ? f.wday : null,
        neu: NEU_MODES.includes(f?.neu) ? f.neu : null,
      };
    } catch {
      return { regions: [], conds: [...COND_STD], techs: [...TECH_STD], maxHours: null, arts: [], maxAway: null, maxTravel: null, mode: 'pt', wday: null, neu: null };
    }
  };
  let flt = $state(read());
  $effect(() => {
    const v = $state.snapshot(flt);
    try {
      localStorage.setItem(FILTER_KEY, JSON.stringify(v));
    } catch {
      /* private window: the filters are just not kept */
    }
  });
  const toggle = (key, val) => {
    const list = flt[key];
    flt[key] = list.includes(val) ? list.filter((x) => x !== val) : [...list, val];
  };
  const resetFilters = () => (flt = { regions: [], conds: [...COND_STD], techs: [...TECH_STD], maxHours: null, arts: [], maxAway: null, maxTravel: null, mode: 'pt', wday: null, neu: null });

  // ---- list or map (kept on this device; the first time: the map on a wide screen, the list on a phone)
  const VIEW_KEY = 'vorschlaege.view';
  const readView = () => {
    try {
      const v = localStorage.getItem(VIEW_KEY);
      if (v === 'map' || v === 'list') return v;
    } catch {
      /* private window */
    }
    return 'list'; // Noah 24.11.2026 «1-5a» (impeccable): phone and computer both open with the list
  };
  let view = $state(readView());
  const setView = (v) => {
    view = v;
    try {
      localStorage.setItem(VIEW_KEY, v);
    } catch {
      /* not kept */
    }
  };

  // ---- the lines of «Why this suggestion?» you do not want (kept on this device)
  const WHY_OFF_KEY = 'vorschlaege.whyoff';
  const readOff = () => {
    try {
      const l = JSON.parse(localStorage.getItem(WHY_OFF_KEY) || '[]');
      return Array.isArray(l) ? l.filter((k) => WHY_KEYS.includes(k)) : [];
    } catch {
      return [];
    }
  };
  let whyOff = $state(readOff());
  $effect(() => {
    const v = $state.snapshot(whyOff);
    try {
      localStorage.setItem(WHY_OFF_KEY, JSON.stringify(v));
    } catch {
      /* not kept */
    }
  });
  const toggleWhy = (k) => (whyOff = whyOff.includes(k) ? whyOff.filter((x) => x !== k) : [...whyOff, k]);
  const WHY_NAME = { time: 'Time|why', trip: 'Journey|why', free: 'Free time|why', form: 'Form today|why', bike: 'Bike|why', weather: 'Weather|why', snow: 'Snow|why', level: 'Difficulty|why', new: 'New for you|why', away: 'Distance from home|why' };

  // ---- your data (only read)
  const paceQ = liveQuery(async () => (await db.settings.get(PACE_KEY))?.value ?? null);
  const homeQ = liveQuery(async () => (await db.settings.get(HOME_PLACE))?.value ?? null);
  const hideQ = liveQuery(async () => (await db.settings.get(HIDE_KEY))?.value ?? null);
  const dreamsQ = liveQuery(() => db.settings.get(DREAMS_KEY));
  const ridesQ = liveQuery(async () => {
    const [activities, rides, tracks] = await Promise.all([db.activities ? db.activities.toArray() : [], db.rides.toArray(), db.tracks ? db.tracks.where('kind').equals('rec').toArray() : []]);
    return { activities, rides, tracks };
  });
  // «Passt zu dir» (Noah 23.11.2026): form today, free time today (Mein Tag and your calendar), your bikes. All only read.
  const formQ = formQuery(today);
  const setQ = liveQuery(() => db.settings.bulkGet([AGENDA_KEY, ITEMS_KEY]));
  const evQ = liveQuery(() => db.gEvents.where('day').aboveOrEqual(today).limit(300).toArray().catch(() => []));
  const bikesQ = liveQuery(() => db.bikes.toArray().catch(() => []));
  let core = $state(null);
  let coreKey = '';
  $effect(() => {
    const k = home ? `${home.lat},${home.lon}` : '';
    if (k === coreKey) return;
    coreKey = k;
    core = null;
    if (k) loadCore(db, home).then((c) => k === coreKey && (core = c)).catch(() => {});
  });
  const level = $derived(dayAnswer($formQ?.ready)?.level ?? null);
  const calOn = $derived(prefsOf($setQ?.[0]?.value).calendar);
  const ownItems = $derived(Array.isArray($setQ?.[1]?.value) ? $setQ[1].value : []);
  const win = $derived(core ? freeToday(core, calOn ? ($evQ ?? []) : [], ownItems) : null);
  const bikes = $derived($bikesQ ?? []);
  const bikeNow = $derived(bikeFit(bikes));
  const hm = (ms) => new Date(ms).toLocaleTimeString(locale(), { hour: '2-digit', minute: '2-digit' });
  /** The line «for you today»: the form, the free time, the bike (what is known). */
  const youLine = $derived(
    [
      level ? answerLine(level) : null,
      win ? (win.hours > 0 ? t('Free from {from} to {to} ({h}).', { from: hm(win.start), to: hm(win.end), h: hoursText(win.hours) }) : t('No free time left today.')) : null,
      bikeNow ? (bikeNow.key === 'mtb' ? t('You have a mountain bike.') : t('You have no mountain bike yet: the tours are made for one.')) : null,
    ].filter(Boolean),
  );
  // «Wetter» (Noah 24.11.2026 «a»): one forecast for the starts of all tours (wetter.js); without it the lines and the filter are simply not there
  let wx = $state(null);
  $effect(() => {
    if (!tours) return;
    let gone = false;
    loadWetter(db, tours).then((d) => !gone && (wx = d)).catch(() => {});
    return () => (gone = true);
  });
  // «Neuland» (Noah 24.11.2026 «1 bis 5»): what is new for you on a tour. Neuland's own count (cantons, passes, peaks, with the summit book) is only read;
  // the goal of the month is the one thing this page keeps (settings «vorschlaege.neuziel»)
  const nlQ = liveQuery(() => db.settings.bulkGet(['neuland', 'gipfelbuch']));
  let nl = $state(null);
  $effect(() => {
    if (!tours) return;
    $ridesQ;
    $nlQ;
    let gone = false;
    import('../lib/neuland/store.js').then((m) => m.computeNeuland(db, { only: ['cantons', 'passes', 'peaks'] })).then((r) => !gone && (nl = r.collections)).catch(() => {});
    return () => (gone = true);
  });
  const spotMap = $derived(nl && tours ? spotIndex(tours, spotList(nl)) : null);
  const reached = $derived(nl ? reachedOf(nl) : new Set());
  const freshOf = (tour) => (spotMap ? freshSpots(spotMap.get(tour.id) ?? [], reached) : []);
  const shareMap = $derived(grid && tours ? new Map(tours.map((x) => [x.id, newShare(x, grid)])) : null);
  const neuFn = $derived(flt.neu && flt.neu !== 'sort' && (flt.neu === 'half' || nl) ? (x) => neuOk(flt.neu, { share: shareMap?.get(x.id) ?? null, fresh: freshOf(x), canton: nl ? cantonNew(x, nl) : null }) : null);
  const goalQ = liveQuery(async () => (await db.settings.get(GOAL_KEY))?.value ?? null);
  const goal = $derived(goalOf($goalQ));
  const thisMonth = monthOf(today);
  const saveGoal = (g) => db.settings.put({ key: GOAL_KEY, value: JSON.parse(JSON.stringify(g)) });
  const monthName = new Date(`${today}T12:00:00`).toLocaleDateString(locale(), { month: 'long' });
  let onlyToday = $state(false); // «Doable today»: starts switched off and is not kept
  const todayOkFn = $derived(onlyToday ? (x) => doableToday(x, { level, win, pace, home, mode: flt.mode }) : null);
  const wxFn = $derived(flt.wday && wx ? (x) => (!todayOkFn || todayOkFn(x)) && verdictFor(x, wx, flt.wday, today)?.level !== 'bad' : todayOkFn);
  const okFn = $derived(neuFn ? (x) => (!wxFn || wxFn(x)) && neuFn(x) : wxFn);
  const pace = $derived(paceOf($paceQ));
  const home = $derived($homeQ?.lat != null ? $homeQ : null);
  const hidden = $derived(Array.isArray($hideQ?.hidden) ? $hideQ.hidden : []);
  const grid = $derived($ridesQ ? gridOf(heatLines({ ...$ridesQ, today }).filter((l) => l.kind === 'bike').map((l) => l.pts)) : null);

  async function setHidden(list) {
    await db.settings.put({ key: HIDE_KEY, value: { hidden: list } });
  }
  const hideTour = (tour) =>
    deleteWithUndo({
      name: tour.title,
      text: t('«{name}» is hidden. It will not come back as a suggestion.', { name: tour.title }),
      run: async () => {
        await setHidden([...new Set([...hidden, tour.id])]);
        if (openId) location.hash = '#/trips/vorschlaege';
        return tour.id;
      },
      undo: async (id) => setHidden(hidden.filter((x) => x !== id)),
    });

  // ---- the lists
  const shownRaw = $derived(tours ? filterTours(tours, { regions: flt.regions, conds: flt.conds, techs: flt.techs, maxHours: flt.maxHours, arts: flt.arts, maxAway: flt.maxAway, maxTravel: flt.maxTravel, mode: flt.mode, home, hidden, pace, ok: okFn }) : []);
  const byWeather = $derived(flt.wday && wx ? sortByWeather(shownRaw, wx, flt.wday, today) : shownRaw);
  const shown = $derived(flt.neu === 'sort' && shareMap ? neuSort(byWeather, (x) => shareMap.get(x.id) ?? null) : byWeather);
  const split = $derived(splitNow(shown, month));
  // the ring around each dot of the map: the traffic light of the chosen day (today when none is chosen)
  const lightVerdicts = $derived(wx && tours ? Object.fromEntries(shown.map((x) => [x.id, verdictFor(x, wx, flt.wday ?? 'today', today)]).filter((e) => e[1])) : {});
  const lightMap = $derived(Object.fromEntries(Object.entries(lightVerdicts).map(([id, v]) => [id, v.level])));
  const lightTexts = $derived(Object.fromEntries(Object.entries(lightVerdicts).map(([id, v]) => [id, `${t(WX_DAY[flt.wday ?? 'today'])}: ${wxWord(v)}`])));
  const open = $derived(tours && openId ? tours.find((x) => x.id === openId) ?? null : null);

  // ---- texts
  const regionName = (key) => t(REGIONS.find((r) => r.key === key)?.name ?? '');
  const LEVEL_NAME = { easy: 'Easy|level', medium: 'Medium|level', difficult: 'Difficult|level' };
  const levelName = (l) => t(LEVEL_NAME[l]);
  function hoursText(h) {
    const { h: hh, min } = splitHours(h);
    return min ? t('{h} h {min}', { h: hh, min }) : t('{h} h|tour', { h: hh });
  }
  const minText = (m) => (m >= 60 ? (m % 60 ? t('{h} h {min}', { h: Math.floor(m / 60), min: m % 60 }) : t('{h} h|tour', { h: Math.floor(m / 60) })) : t('{min} min', { min: m }));
  function whyText(r) {
    if (r.k === 'time') {
      const when = hoursText(r.hours);
      if (r.tone === 'warn') return t('About {time}: longer than your {n} h.', { time: when, n: r.window });
      return r.mine ? t('About {time} at your own pace.', { time: when }) : t('About {time} at the standard pace.', { time: when });
    }
    if (r.k === 'trip') {
      const way = r.mode === 'car' ? t('By car') : t('Public transport with the bike');
      const from = r.fromHome ? t('from home') : t('from Zurich main station');
      const back = r.back === r.out ? t('and the same back') : t('and {back} back', { back: minText(r.back) });
      return `${t('Journey about {out} there', { out: minText(r.out) })} ${back} (${way}, ${from}, ${t('a rough guess')}). ${r.half ? t('The whole day is about {h}: it fits into half a day.', { h: hoursText(r.day) }) : t('The whole day is about {h}.', { h: hoursText(r.day) })}`;
    }
    if (r.k === 'free') {
      const until = r.why === 'sunset' ? t('until sunset') : r.why === 'date' ? t('until your next appointment') : t('until the evening');
      const p = { free: hoursText(r.free), until, h: hoursText(r.day) };
      return r.tone === 'ok' ? t('Free today for {free} {until}. The ride and the journey take about {h}.', p) : t('Free today only for {free} {until}. The ride and the journey take about {h}.', p);
    }
    if (r.k === 'form') return t(FORM_TEXT[r.key]);
    if (r.k === 'bike') return r.key === 'mtb' ? t('You have a mountain bike.') : t('You have no mountain bike yet: the tours are made for one.');
    if (r.k === 'weather') {
      const better = r.level !== 'good' && r.best ? ` ${t('Better: {day}.', { day: dateText(r.best.date) })}` : '';
      return r.level === 'good' ? t('The forecast for today fits this tour.') : `${t('Today: {what}.', { what: r.reasons.map((x) => t(WX_REASON[x])).join(', ') })}${better}`;
    }
    if (r.k === 'snow') {
      if (r.state === 'likely') return t('Snow is likely at {m} m in this month.', { m: num(r.max) });
      if (r.state === 'possible') return t('Snow is possible at {m} m in this month.', { m: num(r.max) });
      return t('No snow expected up to {m} m in this month.', { m: num(r.max) });
    }
    if (r.k === 'level') {
      if (r.best) return t('The strongest tour of this canton: only medium for fitness (no hard one in the official network).');
      if (r.cond === 'difficult' && r.tech === 'difficult') return t('Hard for fitness and for skill.');
      return r.cond === 'difficult' ? t('Hard for fitness: long or steep.') : t('Hard for skill: technical trail.');
    }
    if (r.k === 'new') return t('About {n} % of the line is new for you.', { n: r.share });
    return r.zurich ? t('About {km} km from Zurich main station to the start.', { km: r.km }) : t('About {km} km from home to the start.', { km: r.km });
  }
  const FORM_TEXT = {
    rest: 'Your form says rest today: better a short, easy ride or none.',
    easy: 'Your form says an easy day: this tour is long or steep for it.',
    long: 'A very long tour for a normal day: plan it for a rested day.',
    fit: 'Your form today is fine for this tour.',
  };
  // «Wetter»: the words of the traffic light (a forecast, never a rule)
  const WX_LEVEL = { good: 'Fits|wx', fair: 'With care|wx', bad: 'Better not|wx' };
  const WX_REASON = { thunder: 'Thunderstorm|wx', rain: 'Rain|wx', wind: 'Wind|wx', cold: 'Cold|wx', hot: 'Hot|wx' };
  const WX_DAY = { today: 'Today|tour', tomorrow: 'Tomorrow|tour', dayafter: 'Day after tomorrow|wx', weekend: 'Weekend|wx' };
  const wxWord = (v) => (v.level === 'good' || !v.reasons.length ? t(WX_LEVEL[v.level]) : v.reasons.map((r) => t(WX_REASON[r])).join(', '));
  const dateText = (d) => new Date(`${d}T12:00:00`).toLocaleDateString(locale(), { weekday: 'short', day: 'numeric', month: 'numeric' });
  // «Startzeit» and «Anziehen» (Noah 24.11.2026 «a»): the hourly forecast of the start of the open tour (the weather core, kept for the place)
  let tcore = $state(null);
  let tkey = '';
  $effect(() => {
    const p = open?.line?.[0];
    const k = p ? `${p[0]},${p[1]}` : '';
    if (k === tkey) return;
    tkey = k;
    tcore = null;
    if (p) loadCore(db, { lat: p[0], lon: p[1], name: '' }).then((c) => k === tkey && (tcore = c)).catch(() => {});
  });
  const rideH = $derived(open ? Math.max(1, Math.min(10, Math.round(hoursOf(open, pace)))) : 4);
  const starts = $derived(tcore && open ? bestWindows(tcore, { durH: rideH, days: 3 }) : null);
  const startRows = $derived((starts?.days ?? []).map((d) => ({ ...d, warns: warningsOf(hoursBetween(tcore, d.start, d.end)), best: starts.best?.date === d.date })));
  const wear = $derived(starts?.best ? packHints(hoursBetween(tcore, starts.best.start, starts.best.end)) : []);
  const dayName = (d) => (d === today ? t('Today|tour') : dateText(d));
  const trailText = (tr) => (tr.state === 'slippery' ? t('After {mm} mm of rain in two days: roots and stones are slippery.', { mm: num(tr.mm) }) : t('After {mm} mm of rain in two days: this tour stays easy to ride.', { mm: num(tr.mm) }));
  function weatherOf(tour) {
    if (!wx || !tour) return null;
    const v = verdictFor(tour, wx, 'today', today);
    return v ? { today: v, best: bestDay(tour, wx, today) } : null;
  }
  const NEU_NAME = { sort: 'Newest first|nl', half: 'Mostly new|nl', places: 'With a new pass or peak|nl', canton: 'New canton|nl' };
  const KIND_NAME = { pass: 'Pass|nl', peak: 'Peak|nl' };
  const spotsText = (list) => list.slice(0, 2).map((s) => s.name).join(', ') + (list.length > 2 ? ` +${list.length - 2}` : '');
  const ART_NAME = { trail: 'Single trail|tour', downhill: 'Downhill|tour', gravel: 'Gravel and paths|tour', loop: 'Round trip|tour' };
  const regionCount = $derived(tours ? tours.reduce((a, x) => ({ ...a, [x.region]: (a[x.region] ?? 0) + 1 }), {}) : {});
  const artCount = $derived(tours ? Object.fromEntries(ARTS.map((k) => [k, tours.filter((x) => artsOf(x).includes(k)).length])) : {});
  const toneIcon = (r) => (r.tone === 'warn' ? TriangleAlert : Check);

  // ---- the open tour
  const why = $derived(open ? whyOf(open, { month, maxHours: flt.maxHours, pace, grid, home, mode: flt.mode, win, form: level, bikes, weather: weatherOf(open) }).filter((r) => !whyOff.includes(r.k)) : []);
  const warns = $derived(open ? warnsOf(open, month) : []);
  // «Neuland» of the open tour: the pieces you have ridden (grey on the map), the passes and peaks on the way, the canton, the goal
  const runs = $derived(open && grid ? runsOf(open.line, grid) : null);
  const oldRuns = $derived(runs ? runs.filter((r) => !r.fresh) : null);
  const along = $derived(open && spotMap ? spotMap.get(open.id) ?? [] : []);
  const mapSpots = $derived(along.map((x) => ({ ...x, fresh: !reached.has(x.id) })));
  const openShare = $derived(open && shareMap ? shareMap.get(open.id) ?? null : null);
  const openCanton = $derived(open && nl ? cantonNew(open, nl) : null);
  const ticked = $derived(open ? (goal.done[thisMonth] ?? []).includes(open.id) : false);
  // the profile and the map show the same place in both directions (Noah 23.11.2026 «1-5a», idea B): the cursor of the profile
  // is the dot on the map, and a tap on the map moves the cursor
  let cursorKm = $state(null);
  let pview = $state(null);
  let picked = $state(null); // the steep piece in the list that is lit on the map and in the profile
  $effect(() => {
    open; // a new tour starts without the dot and with the whole profile
    cursorKm = null;
    pview = null;
    picked = null;
  });
  const lineScale = $derived(open ? lineKm(open.line) / (open.km || 1) : 1);
  const mark = $derived(open && cursorKm != null ? pointAtKm(open.line, cursorKm * lineScale) : null);
  const fine = $derived(open ? fineOfTour(open) : null);
  const coarse = $derived(open ? coarseOfTour(open) : []);
  const steep = $derived(open ? steepest(open) : []);
  const lit = $derived(open && picked != null && steep[picked] ? { pts: stretchOf(open.line, steep[picked].fromKm, steep[picked].toKm, pointAtKm, lineScale) } : null);
  // a picked piece fills the map; without one the whole tour is in view
  const focus = $derived(open ? { lines: [lit ? lit.pts : open.line] } : null);
  const ZOOM_PAD_KM = 0.4;
  function pickSteep(i) {
    if (picked === i) {
      picked = null;
      pview = null;
      return;
    }
    const s = steep[i];
    picked = i;
    pview = { from: Math.max(0, s.fromKm - ZOOM_PAD_KM), to: Math.min(open.km, s.toKm + ZOOM_PAD_KM) };
    cursorKm = Math.round(((s.fromKm + s.toKm) / 2) * 100) / 100;
  }
  const MAP_TAP_KM = 2; // a tap farther than this from the line does nothing
  function onMapTap(pos) {
    const n = open && nearestOnLine(open.line, pos);
    if (n && n.away <= MAP_TAP_KM) cursorKm = Math.round((n.km / lineScale) * 100) / 100;
  }
  let note = $state('');
  async function keepDream(tour) {
    const st = storeOf($dreamsQ?.value);
    if (st.dreams.some((d) => d.url === sourceOf(tour))) {
      note = t('«{name}» is already one of your dreams.', { name: tour.title });
      return;
    }
    const kind = st.kinds.some((k) => k.key === 'other') ? 'other' : null;
    const d = newDream({ title: tour.title, kind, days: 1, note: dreamTextOf(tour), url: sourceOf(tour) }, { id: `dream-${Date.now().toString(36)}`, kinds: st.kinds });
    await db.settings.put({ key: DREAMS_KEY, value: $state.snapshot({ dreams: [d, ...st.dreams], kinds: st.kinds }) });
    note = t('«{name}» is kept under Dreams.', { name: tour.title });
  }
  $effect(() => {
    openId; // a new page starts without the line «kept as a dream»
    note = '';
  });
  const dreamUrls = $derived(new Set(storeOf($dreamsQ?.value).dreams.map((d) => d.url)));
  const isDream = (tour) => dreamUrls.has(sourceOf(tour));
  // ---- the list in pages of ten (phone) or twelve (computer); «Show {n} more» adds the next page (Noah 24.11.2026 «1-5a»)
  const PAGE = $derived(phone.matches ? 10 : 12);
  let more = $state(0); // pages added by «Show more»; every change of the filters starts again with the first
  $effect(() => {
    JSON.stringify($state.snapshot(flt));
    onlyToday;
    more = 0;
  });
  const limit = $derived(PAGE * (more + 1));
  const fitsShown = $derived(split.fits.slice(0, limit));
  const notNowShown = $derived(split.notNow.slice(0, Math.max(0, limit - split.fits.length)));
  const hiddenN = $derived(split.fits.length + split.notNow.length - fitsShown.length - notNowShown.length);
  // ---- phone: the filters are one line, «Change ›» opens the whole list in a sheet
  let fdialog = $state(null);
  let fopen = $state(false);
  const openFilters = () => {
    fopen = true;
  };
  $effect(() => {
    if (fopen && fdialog && !fdialog.open) fdialog.showModal();
  });
  const closeFilters = () => {
    fopen = false;
    if (fdialog?.open) fdialog.close();
  };
  $effect(() => {
    if (!phone.matches && fopen) closeFilters();
  });
  const filterLine = $derived.by(() => {
    const parts = [flt.regions.length ? flt.regions.map((k) => k.toUpperCase()).join(', ') : t('All cantons|vs')];
    if (flt.conds.length && flt.conds.length < LEVELS.length) parts.push(flt.conds.map(levelName).join(', '));
    if (flt.techs.length) parts.push(`${t('Skill|tour')}: ${flt.techs.map(levelName).join(', ')}`);
    if (flt.arts.length) parts.push(flt.arts.map((k) => t(ART_NAME[k])).join(', '));
    if (flt.maxAway !== null) parts.push(t('Up to {km} km from home', { km: flt.maxAway }));
    if (flt.maxTravel !== null) parts.push(t('Up to {h} h', { h: flt.maxTravel / 60 }));
    if (flt.maxHours !== null) parts.push(t('Up to {h} h', { h: flt.maxHours }));
    if (onlyToday) parts.push(t('Doable today'));
    if (flt.wday) parts.push(t(WX_DAY[flt.wday]));
    if (flt.neu) parts.push(t(NEU_NAME[flt.neu]));
    return parts.join(' · ');
  });
  const sourceOf = (tour) => `https://map.schweizmobil.ch/?trackId=${tour.route}`;
  async function gpx(tour) {
    await saveGpx(gpxOf(tour), tour.title);
  }
  const tourClass = (tour) => (tour.kind === 'descent' ? 'Downhill|tour' : tour.kind === 'oneway' ? 'One way|tour' : 'Round trip|tour');
</script>

{#snippet levels(tour)}
  <span class="lv">
    {#if tour.cond}<span class="lvp" data-lv={tour.cond}>{t('Fitness|tour')}: {levelName(tour.cond)}</span>{/if}
    {#if tour.tech}<span class="lvp" data-lv={tour.tech}>{t('Skill|tour')}: {levelName(tour.tech)}</span>{/if}
  </span>
{/snippet}

<div class="ich-page vs" class:wide={!open && view === 'map'} data-page="vorschlaege">
  {#if open}
    <VeloHead crumbs={[{ label: t('Trips|place'), href: '#/trips' }, { label: t('Tour suggestions'), href: '#/trips/vorschlaege' }]} title={open.title} here={open.title} sub={`${regionName(open.region)} · ${t(tourClass(open))}`} />
    {#if note && phone.matches}<p class="ok" role="status" data-vs-note><Check size={16} aria-hidden="true" />{note} <a href="#/trips/dreams">{t('Open Dreams')}</a></p>{/if}
    <div class="map" data-vs-map>
      {#await import('../lib/spur/TourMap.svelte') then m}<m.default lines={[{ id: open.id, pts: open.line, n: 1, src: 'gpx' }]} marker={mark} height={420} strong onmap={onMapTap} light={lit} {focus} old={oldRuns} spots={mapSpots} label={t('Map of «{name}»: drag to move, pinch or wheel to zoom', { name: open.title })} />{:catch}{/await}
    </div>
    <div class="grounds" role="group" aria-label={t('Map ground')} data-vs-grounds>
      <span class="gl">{t('Map ground')}</span>
      {#each RASTER_GROUNDS as g (g.key)}
        <button type="button" class="chip" aria-pressed={mapGround.key === g.key} data-vs-ground={g.key} onclick={() => chooseGround(g.key)}>{t(g.name)}</button>
      {/each}
    </div>
    {#if oldRuns?.length || mapSpots.length}<p class="src legend" data-vs-legend>{[oldRuns?.length ? t('Grey: you have ridden it before. In colour: new for you.') : null, mapSpots.length ? t('Diamond: pass. Triangle: peak. In colour: new for you.') : null].filter(Boolean).join(' ')}</p>{/if}
    <p class="src">{t('Map and tour: © swisstopo, SchweizMobil. Check closures and snow on the spot.')} {t('Applies to all maps in the app.')}</p>

    <ul class="facts card" data-vs-facts>
      <li><b class="num">{num(open.km)} km</b><small>{t('Length|tour')}</small></li>
      <li><b class="num">+{num(open.up)} m</b><small>{t('Climb|tour')}</small></li>
      <li><b class="num">{hoursText(hoursOf(open, pace))}</b><small>{pace.mine ? t('At your pace') : t('Time|tour')}</small></li>
      <li><b class="num">{num(open.single)} %</b><small>{t('Single trail|tour')}</small></li>
    </ul>
    {@render levels(open)}

    {#if warns.length}
      <section class="warn" role="note" data-vs-warn>
        <TriangleAlert size={20} aria-hidden="true" />
        <div>
          <b>{t('Please check before you ride')}</b>
          {#each warns as w (w.k)}
            <p>{w.k === 'level' ? t('This tour is hard for fitness or skill.') : w.state === 'likely' ? t('Snow is likely up high in this month.') : t('Snow is possible up high in this month.')}</p>
          {/each}
        </div>
      </section>
    {/if}

    <section class="ich-sec" aria-labelledby="vs-prof">
      <div class="ich-h"><div><h2 id="vs-prof">{t('Height and ground')}</h2><p class="ich-hs">{t('Tap the profile or the map: the dot shows the same place on both.')}</p></div></div>
      <div class="card pad prof">
          <ProfileStrip profile={coarse} {fine} bind:cursorKm bind:view={pview} />
          <Untergrund cls={open.cls} />
        </div>
      <div class="steep" data-vs-steep>
        <h3>{t('The steepest pieces')}</h3>
        {#if steep.length}
          <p class="ich-hs">{t('From {pct} % over about 250 m. Tap one: it is lit on the map and the profile zooms in.', { pct: STEEP_PCT })}</p>
          <ul>
            {#each steep as p, i (p.fromKm)}
              <li>
                <button type="button" class="sp" class:on={picked === i} aria-pressed={picked === i} onclick={() => pickSteep(i)} data-vs-steep-item>
                  <b class="num">{t('km {a}–{b}', { a: num(p.fromKm), b: num(p.toKm) })}</b>
                  <span class="num">{t('on average {pct} %, up to {max} %', { pct: num(p.avg), max: num(p.max) })}</span>
                  <span class="num">{t('+{m} m in {l} m', { m: num(p.up), l: num(p.lenM) })}</span>
                </button>
              </li>
            {/each}
          </ul>
        {:else}
          <p class="ich-hs" data-vs-steep-none>{t('No piece is steeper than {pct} %. You can ride it all.', { pct: STEEP_PCT })}</p>
        {/if}
      </div>
    </section>

    {#if wx && weekOf(open, wx, today).length}
      {@const wk = weekOf(open, wx, today)}
      {@const best = bestDay(open, wx, today)}
      <section class="ich-sec" aria-labelledby="vs-wx" data-vs-wx-week>
        <div class="ich-h"><div><h2 id="vs-wx">{t('Weather for this tour')}</h2><p class="ich-hs">{t('The forecast for the start of the tour, the temperature counted up to its highest point. Only a forecast: look at the sky before you go.')}</p></div></div>
        <div class="card pad">
          {#if best}<p class="wxbest" data-vs-wx-best>{best.date === today ? t('Best day: today') : t('Best day: {day}', { day: dateText(best.date) })} ({wxWord(best)})</p>{:else}<p class="wxbest" data-vs-wx-best>{t('No good day in the next ten days.')}</p>{/if}
          <ul class="wxweek">
            {#each wk as d (d.date)}
              <li data-wx-level={d.level}><b>{dateText(d.date)}</b><span class="wxp" data-wx-level={d.level}>{wxWord(d)}</span><span class="num wxn">{d.tmin !== null ? `${num(Math.round(d.tmin))}–${num(Math.round(d.tmax))} °C` : ''} · {t('{mm} mm rain', { mm: num(Math.round((d.rain ?? 0) * 10) / 10) })} · {t('gusts {kmh} km/h', { kmh: num(Math.round(d.gust ?? 0)) })}</span></li>
            {/each}
          </ul>
          {#if startRows.length}
            <h3 class="wxh">{t('Start time')}</h3>
            <ul class="wxstarts" data-vs-wx-starts>
              {#each startRows as r (r.date)}
                <li class:best={r.best} data-vs-wx-start={r.best ? 'best' : undefined}><b>{dayName(r.date)}</b> {t('Start {from}, back about {to}', { from: hm(r.start), to: hm(r.end) })} · <span class="wxp" data-wx-level={costWord(r.cost) === 'good' ? 'good' : costWord(r.cost) === 'ok' ? 'fair' : 'bad'}>{t(COST_WORD[costWord(r.cost)])}</span>{#each r.warns as w (w.kind)}{' · '}<span class="wxp" data-wx-level="bad">{t(WARN_TEXT[w.kind], { at: hm(w.at), v: w.value ?? '' })}</span>{/each}{#if r.best}{' · '}<i>{t('best start|wx')}</i>{/if}</li>
              {/each}
            </ul>
          {/if}
          {#if wear.length}<p class="why" data-vs-wx-wear><Shirt size={14} aria-hidden="true" />{t('What to wear on {day}: {list}', { day: dayName(starts.best.date), list: wear.map((w) => t(PACK_TEXT[w.key])).join(', ') })} <a href="#/wardrobe">{t('Wardrobe|open')}<ChevronRight size={14} aria-hidden="true" /></a></p>{/if}
          {#if wk[0]?.trail}<p class="why" class:bad={wk[0].trail.state === 'slippery'} data-vs-wx-trail><Droplets size={14} aria-hidden="true" />{trailText(wk[0].trail)}</p>{/if}
        </div>
      </section>
    {/if}

    <section class="ich-sec" aria-labelledby="vs-neu" data-vs-neu-sec>
      <div class="ich-h"><div><h2 id="vs-neu">{t('New ground on this tour')}</h2><p class="ich-hs">{t('What you have not ridden or reached yet. Your rides and Neuland are only read.')}</p></div></div>
      <div class="card pad neu">
        {#if openShare !== null}<p data-vs-neu-share><MapPin size={14} aria-hidden="true" />{t('About {n} % of the line is new for you.', { n: Math.round(openShare * 100) })}</p>{:else}<p class="hint"><Info size={14} aria-hidden="true" />{t('With your own rides (Strava, GPX or recordings) the app can say what is new for you.')}</p>{/if}
        {#if openCanton !== null}<p data-vs-neu-canton={openCanton ? 'new' : 'known'}><MapPin size={14} aria-hidden="true" />{openCanton ? t('A new canton for you: {name}.', { name: regionName(open.region) }) : t('You have ridden in {name} before.', { name: regionName(open.region) })}</p>{/if}
        <h3 class="neuh">{t('Passes and peaks on the way')}</h3>
        {#if along.length}
          <ul class="spots" data-vs-spots>
            {#each along as sp (sp.id)}
              <li data-vs-spot={sp.id} data-fresh={reached.has(sp.id) ? 'no' : 'yes'}>
                <Mountain size={14} aria-hidden="true" />
                <span><b>{sp.name}</b>{sp.alt ? ` ${num(sp.alt)} m` : ''} <small>({t(KIND_NAME[sp.kind])}, {t('km {a}', { a: num(sp.km) })})</small></span>
                <span class="sp-state" class:fresh={!reached.has(sp.id)}>{reached.has(sp.id) ? t('Already reached') : t('New for you')}</span>
              </li>
            {/each}
          </ul>
          <p class="ich-hs">{t('Neuland counts a pass or a peak by itself once you have been there.')} <a href="#/neuland">{t('New ground')}</a> · <a href="#/flow/gipfelbuch">{t('Summit book')}</a></p>
        {:else if nl}
          <p class="ich-hs" data-vs-spots-none>{t('No pass and no peak of Neuland lies on this tour.')}</p>
        {:else}
          <p class="ich-hs">{t('Loading…')}</p>
        {/if}
        {#if goal.on}
          <div class="tick">
            <button type="button" class="btn" aria-pressed={ticked} data-vs-goal-tick onclick={() => saveGoal(tickTour(goal, thisMonth, open.id, !ticked))}><Check size={16} aria-hidden="true" />{ticked ? t('Ticked for the goal') : t('Tick for the goal')}</button>
            <span class="hint num" data-vs-goal-line>{t('Goal for {month}: {done} of {n} tours with over {pct} % new', { month: monthName, done: doneIn(goal, thisMonth), n: goal.n, pct: goal.pct })}</span>
          </div>
        {/if}
      </div>
    </section>

    <section class="ich-sec" aria-labelledby="vs-why" data-vs-why>
      <details class="card pad whybox" open>
        <summary id="vs-why">{t('Why this suggestion?')}</summary>
        <ul>
          {#each why as r (r.k)}
            {@const Icon = toneIcon(r)}
            <li class:bad={r.tone === 'warn'}><Icon size={16} aria-hidden="true" /><span>{whyText(r)}</span></li>
          {/each}
        </ul>
        <details class="lines" data-vs-lines>
          <summary>{t('Choose the lines')}</summary>
          <div class="vslrow">
            {#each WHY_KEYS as k (k)}
              <label class="lchk"><input type="checkbox" checked={!whyOff.includes(k)} onchange={() => toggleWhy(k)} data-vs-line={k} />{t(WHY_NAME[k])}</label>
            {/each}
          </div>
        </details>
        {#if !grid}<p class="hint"><Info size={14} aria-hidden="true" />{t('With your own rides (Strava, GPX or recordings) the app also says how much of the tour is new for you.')}</p>{/if}
        {#if !home}<p class="hint"><Info size={14} aria-hidden="true" />{t('Set your home place and the app says how far the start is.')}</p>{/if}
      </details>
    </section>

    <div class="acts">
      {#if !phone.matches}<button type="button" class="btn hi" onclick={() => keepDream(open)} data-vs-dream><Sparkles size={16} aria-hidden="true" />{t('Keep as a dream')}</button>{/if}
      <button type="button" class="btn" onclick={() => gpx(open)} data-vs-gpx><Download size={16} aria-hidden="true" />{t('Save GPX')}</button>
      <button type="button" class="btn" onclick={() => hideTour(open)} data-vs-hide><EyeOff size={16} aria-hidden="true" />{t('Not for me')}</button>
    </div>
    {#if note && !phone.matches}<p class="ok" role="status"><Check size={16} aria-hidden="true" />{note} <a href="#/trips/dreams">{t('Open Dreams')}</a></p>{/if}
    <p class="next"><ChevronRight size={14} aria-hidden="true" />{t('Next: keep it as a dream, then plan it on its day from Dreams.')}</p>
    {#if phone.matches}
      <MainBar>
        {#snippet children()}
          {#if isDream(open)}<a class="btn go" href="#/trips/dreams" data-vs-dreamed><Check size={20} aria-hidden="true" />{t('In your dreams|vs')}</a>
          {:else}<button type="button" class="btn hi go" onclick={() => keepDream(open)} data-vs-dream><Sparkles size={20} aria-hidden="true" />{t('Keep as a dream')}</button>{/if}
        {/snippet}
      </MainBar>
    {/if}
  {:else}
    <VeloHead crumbs={[{ label: t('Trips|place'), href: '#/trips' }]} title={t('Tour suggestions')} sub={t('Mountain bike tours from the official network of SchweizMobil')} />
    <p class="intro">{t('The app suggests tours you can ride. Everything is a suggestion: change the filters, hide what is not for you.')}</p>

    {#snippet filtersBox()}
    <section class="card pad filters" aria-label={t('Filters|tour')} data-vs-filters>
      <div class="grp" role="group" aria-label={t('Region|tour')}>
        <span class="gl">{t('Region|tour')}</span>
        {#each REGIONS.filter((r) => regionCount[r.key]) as r (r.key)}
          <button type="button" class="chip" aria-pressed={flt.regions.includes(r.key)} aria-label={regionName(r.key)} title={regionName(r.key)} data-vs-region={r.key} onclick={() => toggle('regions', r.key)}>{r.key.toUpperCase()}</button>
        {/each}
      </div>
      <div class="grp" role="group" aria-label={t('Kind of tour')} data-vs-arts>
        <span class="gl">{t('Kind of tour')}</span>
        {#each ARTS.filter((k) => artCount[k]) as k (k)}
          <button type="button" class="chip" aria-pressed={flt.arts.includes(k)} data-vs-art={k} onclick={() => toggle('arts', k)}>{t(ART_NAME[k])}</button>
        {/each}
      </div>
      <div class="grp" role="group" aria-label={t('Start|tour')} data-vs-start>
        <span class="gl">{t('Start|tour')}</span>
        {#if home}
          <button type="button" class="chip" aria-pressed={flt.maxAway === null} data-vs-away="any" onclick={() => (flt.maxAway = null)}>{t('Any|tour')}</button>
          {#each AWAYS as km (km)}
            <button type="button" class="chip" aria-pressed={flt.maxAway === km} data-vs-away={km} onclick={() => (flt.maxAway = km)}>{t('Up to {km} km from home', { km })}</button>
          {/each}
        {:else}
          <span class="hint">{t('Set your home place and you can choose how far the start may be.')}</span>
        {/if}
      </div>
      <div class="grp" role="group" aria-label={t('For you|tour')} data-vs-you>
        <span class="gl">{t('For you|tour')}</span>
        <button type="button" class="chip" aria-pressed={onlyToday} data-vs-today onclick={() => (onlyToday = !onlyToday)}><User size={16} aria-hidden="true" />{t('Doable today')}</button>
        {#if youLine.length}
          <span class="hint" data-vs-you-line>{youLine.join(' ')}</span>
        {:else}
          <span class="hint" data-vs-you-line>{t('Set your home place and fill in your form and the app says what fits you today.')}</span>
        {/if}
      </div>
      <div class="grp" role="group" aria-label={t('Weather|wx')} data-vs-wx-group>
        <span class="gl">{t('Weather|wx')}</span>
        <button type="button" class="chip" aria-pressed={flt.wday === null} data-vs-wday="any" onclick={() => (flt.wday = null)}>{t('Any|tour')}</button>
        {#each CHOICES as c (c)}
          <button type="button" class="chip" aria-pressed={flt.wday === c} data-vs-wday={c} onclick={() => (flt.wday = c)}>{t(WX_DAY[c])}</button>
        {/each}
        <span class="hint" data-vs-wx-hint>{wx ? t('Only a forecast. A day that fits shows first; a day with thunderstorms, a lot of rain, strong wind or frost up high is left out.') : t('The forecast for the tours is loading. Without a connection the tours stay as they are.')}</span>
      </div>
      <div class="grp" role="group" aria-label={t('New ground')} data-vs-neu-group>
        <span class="gl">{t('New ground')}</span>
        <button type="button" class="chip" aria-pressed={flt.neu === null} data-vs-neu="any" onclick={() => (flt.neu = null)}>{t('Any|tour')}</button>
        {#each NEU_MODES as m (m)}
          <button type="button" class="chip" aria-pressed={flt.neu === m} data-vs-neu={m} onclick={() => (flt.neu = m)}>{t(NEU_NAME[m])}</button>
        {/each}
        <span class="hint" data-vs-neu-hint>{grid ? t('New for you means: you have not ridden there or been there yet. Your rides and Neuland are only read.') : t('With your own rides (Strava, GPX or recordings) the app can say what is new for you.')}</span>
        <span class="hint num" data-vs-goal>{goal.on ? t('Goal for {month}: {done} of {n} tours with over {pct} % new', { month: monthName, done: doneIn(goal, thisMonth), n: goal.n, pct: goal.pct }) : t('The goal of the month is off.')}</span>
        <details class="goalbox" data-vs-goal-edit>
          <summary>{t('Change goal')}</summary>
          <div class="grp" role="group" aria-label={t('Tours per month')}>
            <span class="gl">{t('Tours per month')}</span>
            {#each GOAL_NS as n (n)}<button type="button" class="chip" aria-pressed={goal.n === n} data-vs-goal-n={n} onclick={() => saveGoal({ ...goal, n })}>{n}</button>{/each}
          </div>
          <div class="grp" role="group" aria-label={t('Share of new line')}>
            <span class="gl">{t('Share of new line')}</span>
            {#each GOAL_PCTS as pc (pc)}<button type="button" class="chip" aria-pressed={goal.pct === pc} data-vs-goal-pct={pc} onclick={() => saveGoal({ ...goal, pct: pc })}>{t('Over {pct} %', { pct: pc })}</button>{/each}
          </div>
          <button type="button" class="btn" data-vs-goal-on onclick={() => saveGoal({ ...goal, on: !goal.on })}>{goal.on ? t('Switch the goal off') : t('Switch the goal on')}</button>
          <p class="hint"><Info size={14} aria-hidden="true" />{t('A quiet goal, ticked by hand on the tour. Nothing happens if you do not reach it.')}</p>
        </details>
      </div>
      <div class="grp" role="group" aria-label={t('Journey|tour')} data-vs-travel>
        <span class="gl">{t('Journey|tour')}</span>
        <button type="button" class="chip" aria-pressed={flt.mode === 'pt'} data-vs-mode="pt" onclick={() => (flt.mode = 'pt')}><TrainFront size={16} aria-hidden="true" />{t('Public transport with the bike')}</button>
        <button type="button" class="chip" aria-pressed={flt.mode === 'car'} data-vs-mode="car" onclick={() => (flt.mode = 'car')}><Car size={16} aria-hidden="true" />{t('By car')}</button>
        <button type="button" class="chip" aria-pressed={flt.maxTravel === null} data-vs-travel-max="any" onclick={() => (flt.maxTravel = null)}>{t('Any|tour')}</button>
        {#each TRAVELS as m (m)}
          <button type="button" class="chip" aria-pressed={flt.maxTravel === m} data-vs-travel-max={m} onclick={() => (flt.maxTravel = m)}>{t('Up to {h} h', { h: m / 60 })}</button>
        {/each}
      </div>
      <div class="grp" role="group" aria-label={t('Fitness|tour')} data-vs-cond-group>
        <span class="gl">{t('Fitness|tour')}</span>
        {#each LEVELS as l (l)}
          <button type="button" class="chip" aria-pressed={flt.conds.includes(l)} data-vs-cond={l} onclick={() => toggle('conds', l)}>{levelName(l)}</button>
        {/each}
      </div>
      <div class="grp" role="group" aria-label={t('Skill|tour')} data-vs-tech-group>
        <span class="gl">{t('Skill|tour')}</span>
        <button type="button" class="chip" aria-pressed={flt.techs.length === 0} data-vs-tech="any" onclick={() => (flt.techs = [])}>{t('Any|tour')}</button>
        {#each LEVELS as l (l)}
          <button type="button" class="chip" aria-pressed={flt.techs.includes(l)} data-vs-tech={l} onclick={() => toggle('techs', l)}>{levelName(l)}</button>
        {/each}
      </div>
      <div class="grp" role="group" aria-label={t('Time|tour')}>
        <span class="gl">{t('Time|tour')}</span>
        <button type="button" class="chip" aria-pressed={flt.maxHours === null} data-vs-hours="any" onclick={() => (flt.maxHours = null)}>{t('Any|tour')}</button>
        {#each HOURS as h (h)}
          <button type="button" class="chip" aria-pressed={flt.maxHours === h} data-vs-hours={h} onclick={() => (flt.maxHours = h)}>{t('Up to {h} h', { h })}</button>
        {/each}
      </div>
      <p class="hint"><Info size={14} aria-hidden="true" />{t('Only tours that are hard for fitness are on at the start. Switch «Medium» or «Easy» on to see more. A tour is never left out because of its skill level: the filter only narrows it down.')}</p>
    </section>
    {/snippet}

    {#snippet results()}
    {#if !tours}
      <p class="hint" role="status">{t('Loading the tours…')}</p>
    {:else if !shown.length}
      <Empty icon={Mountain} text={hidden.length && !filterTours(tours, { hidden: [], regions: flt.regions, conds: flt.conds, techs: flt.techs, maxHours: flt.maxHours, arts: flt.arts, maxAway: flt.maxAway, maxTravel: flt.maxTravel, mode: flt.mode, home, pace, ok: okFn }).length ? t('Nothing left: you hid all of them.') : t('No tour fits these filters.')} action={{ label: t('Reset filters'), onclick: resetFilters }} />
    {:else}
      {#if note && !open}<p class="ok" role="status" data-vs-note><Check size={16} aria-hidden="true" />{note} <a href="#/trips/dreams">{t('Open Dreams')}</a></p>{/if}
      <div class="seg" role="group" aria-label={t('View|tour')}>
        <button type="button" class="chip" aria-pressed={view === 'list'} data-vs-view="list" onclick={() => setView('list')}>{t('List|tour')}</button>
        <button type="button" class="chip" aria-pressed={view === 'map'} data-vs-view="map" onclick={() => setView('map')}>{t('Map|tour')}</button>
        <span class="hint num" data-vs-count>{t('{n} tours', { n: shown.length })}</span>
      </div>
      {#if view === 'map'}
        {#await import('../lib/vorschlaege/Karte.svelte') then m}<m.default tours={shown} grey={split.notNow.map((x) => x.id)} regions={flt.regions} onregion={(k) => toggle('regions', k)} region={regionName} {pace} light={lightMap} lightText={lightTexts} lightDay={t(WX_DAY[flt.wday ?? 'today'])} />{:catch}{/await}
      {:else}
      <section class="ich-sec" aria-labelledby="vs-fit" data-vs-fits>
        <div class="ich-h"><div><h2 id="vs-fit">{t('Fits now')} <small class="n num">{split.fits.length}</small></h2><p class="ich-hs">{t('Tours that suit this month.')}</p></div></div>
        {#if split.fits.length}
          <ul class="cards">
            {#each fitsShown as tour (tour.id)}
              {@render card(tour, false)}
            {/each}
          </ul>
        {:else}
          <p class="hint">{t('Nothing fits this month. See the grey group below.')}</p>
        {/if}
      </section>

      {#if notNowShown.length}
        <section class="ich-sec" aria-labelledby="vs-not" data-vs-notnow>
          <div class="ich-h"><div><h2 id="vs-not">{t('Not for today')} <small class="n num">{split.notNow.length}</small></h2><p class="ich-hs">{t('Snow is likely up high in this month. They come back when it melts.')}</p></div></div>
          <ul class="cards">
            {#each notNowShown as tour (tour.id)}
              {@render card(tour, true)}
            {/each}
          </ul>
        </section>
      {/if}
      {#if hiddenN > 0}<ShowMore n={hiddenN} data-vs-more onclick={() => more++} />{/if}
      {/if}
    {/if}
    {/snippet}

    <!-- Noah 24.11.2026 «1-5a» (impeccable): on a phone the filters are one line, «Change ›» opens all groups in a sheet; a computer keeps the chips -->
    {#snippet filtersArea()}
      {#if phone.matches}
        <section class="card pad fsum" aria-label={t('Filters|tour')} data-vs-filters-sum>
          <p class="fl"><b>{t('Filter|vs')}</b> · <span data-vs-filters-text>{filterLine}</span></p>
          <button type="button" class="btn sm" data-vs-filters-open onclick={openFilters}><SlidersHorizontal size={16} aria-hidden="true" />{t('Change|vs')} ›</button>
        </section>
        {#if fopen}
          <dialog class="fsheet" bind:this={fdialog} aria-label={t('Filters|tour')} data-backdrop="own" data-vs-filters-sheet use:backClose onclose={() => (fopen = false)}>
            <span class="fgrip" aria-hidden="true"></span>
            {@render filtersBox()}
            <div class="fdone"><button type="button" class="btn hi" data-vs-filters-done onclick={closeFilters}>{t('Show {n} tours|vs', { n: shown.length })}</button></div>
          </dialog>
        {/if}
      {:else}
        {@render filtersBox()}
      {/if}
    {/snippet}

    <!-- «Karte oben» (Noah 23.11.2026, gross und gut sichtbar): in the map view the map comes first, the filters below it -->
    {#if view === 'map'}
      {@render results()}
      {@render filtersArea()}
    {:else}
      {@render filtersArea()}
      {@render results()}
    {/if}

    {#if hidden.length}
      <p class="hint"><EyeOff size={14} aria-hidden="true" />{t('{n} hidden.', { n: hidden.length })} <button type="button" class="btn btn-link" data-vs-unhide onclick={() => setHidden([])}>{t('Show all again')}</button></p>
    {/if}
    <p class="src">{t('Tours: © swisstopo, SchweizMobil («Mountainbikeland Schweiz»). 200 tours in the cantons with official routes, nearest first. Check closures and snow on the spot.')}</p>
  {/if}
</div>

{#snippet card(tour, grey)}
  {@const share = shareMap ? shareMap.get(tour.id) ?? null : null}
  {@const fresh = freshOf(tour)}
  {@const newCanton = nl ? cantonNew(tour, nl) : false}
  {@const trip = anreiseOf(tour, home, flt.mode)}
  {@const todayOk = level || win ? doableToday(tour, { level, win, pace, home, mode: flt.mode }) : null}
  <li class="tc card" class:grey data-vs-tour={tour.id}>
    <a class="tl" href={`#/trips/vorschlaege/${tour.id}`}>
      <span class="th"><b>{tour.title}</b><small>{regionName(tour.region)} · {t(tourClass(tour))}</small></span>
      <span class="nums num"><span><Clock size={14} aria-hidden="true" />{hoursText(hoursOf(tour, pace))}</span><span>{num(tour.km)} km</span><span>+{num(tour.up)} m</span></span>
      {@render levels(tour)}
      {#if artsOf(tour).length}<span class="lv">{#each artsOf(tour) as k (k)}<span class="lvp">{t(ART_NAME[k])}</span>{/each}</span>{/if}
      {#if grey}
        <span class="why"><Snowflake size={14} aria-hidden="true" />{t('Snow is likely at {m} m in this month.', { m: num(tour.max) })}</span>
      {:else if snowOf(tour, month) === 'possible'}
        <span class="why"><Snowflake size={14} aria-hidden="true" />{t('Snow is possible at {m} m in this month.', { m: num(tour.max) })}</span>
      {/if}
      {#if trip}<span class="why" data-vs-trip>{#if flt.mode === 'car'}<Car size={14} aria-hidden="true" />{:else}<TrainFront size={14} aria-hidden="true" />{/if}{t('Journey about {out} there', { out: minText(trip.out) })} {trip.back === trip.out ? t('and the same back') : t('and {back} back', { back: minText(trip.back) })} · {t('whole day about {h}', { h: hoursText(dayHours(hoursOf(tour, pace), trip)) })}</span>{/if}
      {#if wx}{@const w3 = ['today', 'tomorrow', 'dayafter'].map((c) => [c, verdictFor(tour, wx, c, today)])}
        {#if w3.some((x) => x[1])}
          <span class="why wxl" data-vs-wx><CloudRain size={14} aria-hidden="true" /><span class="wxs">{#each w3.filter((x) => x[1]) as [c, v] (c)}<span class="wxp" data-wx-level={v.level}>{t(WX_DAY[c])} {wxWord(v)}</span>{/each}</span></span>
          {@const best = bestDay(tour, wx, today)}
          {#if best && best.date !== today && w3[0][1]?.level !== 'good'}<span class="why" data-vs-wx-best>{t('Best day: {day}', { day: dateText(best.date) })} ({wxWord(best)})</span>{/if}
          {@const tr = w3[0][1]?.trail}
          {#if tr}<span class="why" class:bad={tr.state === 'slippery'} data-vs-wx-trail><Droplets size={14} aria-hidden="true" />{trailText(tr)}</span>{/if}
        {/if}
      {/if}
      {#if todayOk !== null}<span class="why" class:bad={!todayOk} data-vs-doable={todayOk ? 'yes' : 'no'}>{#if todayOk}<Check size={14} aria-hidden="true" />{t('Doable today')}{:else}<TriangleAlert size={14} aria-hidden="true" />{t('Not doable today')}{/if}</span>{/if}
      {#if share !== null}<span class="why"><MapPin size={14} aria-hidden="true" />{t('About {n} % new for you', { n: Math.round(share * 100) })}</span>{/if}
      {#if fresh.length}<span class="why" data-vs-card-fresh><Mountain size={14} aria-hidden="true" />{t('New for you: {list}', { list: spotsText(fresh) })}</span>{/if}
      {#if newCanton}<span class="why" data-vs-card-canton><MapPin size={14} aria-hidden="true" />{t('A new canton for you: {name}.', { name: regionName(tour.region) })}</span>{/if}
    </a>
    <div class="cacts">
      {#if isDream(tour)}
        <a class="btn grow" href="#/trips/dreams" data-vs-dreamed><Check size={16} aria-hidden="true" />{t('In your dreams|vs')}</a>
      {:else}
        <button type="button" class="btn hi grow" onclick={() => keepDream(tour)} data-vs-dream-card><Sparkles size={16} aria-hidden="true" />{t('Keep as a dream')}</button>
      {/if}
      <MoreActions title={tour.title} label={t('More for {what}', { what: tour.title })} actions={[{ name: t('Not for me'), icon: EyeOff, run: () => hideTour(tour) }, { name: t('Save GPX'), icon: Download, run: () => gpx(tour) }]} />
    </div>
  </li>
{/snippet}

<style>
  .vs { max-width: 900px; }
  .vs.wide { max-width: 1440px; }
  .seg { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; margin-bottom: var(--sp-3); }
  .intro { max-width: 65ch; margin: 0 0 var(--sp-4); color: var(--ink-2); }
  .pad { padding: var(--sp-3); }
  .filters { display: grid; gap: var(--sp-3); margin-bottom: var(--sp-4); }
  .vs.wide .filters { margin-top: var(--sp-4); }
  .grp { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; min-width: 0; }
  .gl { font-weight: 700; min-width: 6.5em; color: var(--ink-2); }
  .chip { min-height: 44px; padding: 0 var(--sp-3); border: 1px solid var(--line); border-radius: 99px; background: var(--card); color: var(--ink); font: inherit; font-weight: 600; cursor: pointer; }
  .chip[aria-pressed='true'] { background: var(--accent-soft); color: var(--accent-ink); border-color: var(--accent); }
  .hint { display: flex; gap: 6px; align-items: flex-start; margin: 0; color: var(--ink-3); font-size: var(--fs-small); }
  .hint :global(svg) { flex: none; margin-top: 3px; }
  .cards { display: grid; gap: var(--sp-3); list-style: none; margin: 0; padding: 0; grid-template-columns: repeat(auto-fill, minmax(min(100%, 300px), 1fr)); }
  .tc { display: grid; gap: var(--sp-2); padding: var(--sp-3); min-width: 0; align-content: start; }
  .tc.grey { opacity: 0.78; background: var(--paper); }
  .tl { display: grid; gap: 6px; color: inherit; text-decoration: none; min-width: 0; }
  .th { display: grid; }
  .th b { overflow-wrap: break-word; }
  .th small { color: var(--ink-3); }
  .nums { display: flex; flex-wrap: wrap; gap: 4px 14px; color: var(--ink-2); }
  .nums span { display: inline-flex; gap: 4px; align-items: center; }
  .lv { display: flex; flex-wrap: wrap; gap: 6px; }
  .lvp { font-size: var(--fs-small); font-weight: 600; border-radius: 99px; padding: 1px var(--sp-2); background: var(--paper); border: 1px solid var(--line); color: var(--ink-2); }
  .lvp[data-lv='difficult'] { border-color: var(--bad); color: var(--bad); }
  .why.bad { color: var(--bad); }
  .wxs { display: flex; flex-wrap: wrap; gap: 2px 14px; min-width: 0; }
  .wxp { font-weight: 600; overflow-wrap: break-word; }
  .wxp[data-wx-level='fair'] { color: var(--warn); }
  .wxp[data-wx-level='bad'] { color: var(--bad); }
  .wxweek { list-style: none; margin: 0; padding: 0; display: grid; gap: 2px; }
  .wxweek li { display: grid; grid-template-columns: 6.5em 1fr; gap: 2px 12px; padding: 8px 0; border-bottom: 1px solid var(--line); overflow-wrap: break-word; }
  .wxweek li > .wxn { grid-column: 2; color: var(--ink-2); font-size: var(--fs-small); }
  .wxh { margin: var(--sp-3) 0 var(--sp-1); font-size: var(--fs-sub); }
  .wxstarts { list-style: none; margin: 0 0 var(--sp-2); padding: 0; display: grid; gap: 4px; overflow-wrap: break-word; }
  .wxstarts li.best { font-weight: 600; }
  .wxbest { margin: 0 0 var(--sp-2); font-weight: 600; }
  @media (min-width: 700px) { .wxweek li { grid-template-columns: 7em 9em 1fr; } .wxweek li > .wxn { grid-column: auto; } }
  .fsum { display: flex; align-items: center; justify-content: space-between; gap: var(--sp-3); margin-bottom: var(--sp-3); }
  .fsum .fl { margin: 0; min-width: 0; overflow-wrap: break-word; }
  .fsum .btn { flex: none; }
  .fsheet { position: fixed; inset: auto 0 0 0; width: 100%; max-width: 100%; max-height: 90vh; margin: 0; padding: 12px 10px calc(16px + env(safe-area-inset-bottom)); box-sizing: border-box; border: 0; border-radius: 22px 22px 0 0; background: var(--paper); color: var(--ink); box-shadow: 0 -10px 40px var(--shadow); overflow-y: auto; }
  .fsheet::backdrop { background: var(--scrim); }
  .fgrip { display: block; width: 40px; height: 5px; margin: 0 auto 8px; border-radius: 9px; background: var(--line); }
  .fsheet .filters { margin-bottom: var(--sp-3); border: 0; box-shadow: none; padding: var(--sp-2); }
  .fdone { position: sticky; bottom: 0; padding-top: var(--sp-2); background: var(--paper); }
  .fdone .btn { width: 100%; justify-content: center; min-height: 52px; }
  .cacts { display: flex; gap: var(--sp-2); align-items: center; }
  .cacts .grow { flex: 1; justify-content: center; min-height: 48px; }
  .goalbox { flex-basis: 100%; }
  .goalbox summary { cursor: pointer; color: var(--ink-2); min-height: 44px; display: flex; align-items: center; }
  .goalbox .grp { margin-bottom: var(--sp-2); }
  .neu { display: grid; gap: var(--sp-2); }
  .neu p { display: flex; gap: 6px; align-items: flex-start; margin: 0; }
  .neu p :global(svg) { flex: none; margin-top: 4px; }
  .neuh { margin: var(--sp-2) 0 0; font-size: var(--fs-sub); }
  .spots { list-style: none; margin: 0; padding: 0; display: grid; gap: 6px; }
  .spots li { display: flex; flex-wrap: wrap; gap: 4px 8px; align-items: baseline; overflow-wrap: break-word; }
  .spots li :global(svg) { flex: none; align-self: center; color: var(--ink-3); }
  .sp-state { margin-left: auto; font-size: var(--fs-small); font-weight: 600; color: var(--ink-3); }
  .sp-state.fresh { color: var(--accent-ink); }
  .tick { display: flex; flex-wrap: wrap; gap: 8px var(--sp-3); align-items: center; margin-top: var(--sp-2); }
  .tick .btn[aria-pressed='true'] { background: var(--accent-soft); color: var(--accent-ink); border-color: var(--accent); }
  .why { display: flex; gap: 6px; align-items: center; font-size: var(--fs-small); color: var(--ink-2); }
  .map { border: 1px solid var(--line); border-radius: var(--r-card); overflow: hidden; margin-bottom: var(--sp-2); }
  .prof { display: grid; gap: var(--sp-3); }
  .steep { margin-top: var(--sp-3); }
  .steep h3 { margin: 0 0 var(--sp-1); font-size: var(--fs-sub); }
  .steep ul { list-style: none; margin: var(--sp-2) 0 0; padding: 0; display: grid; gap: var(--sp-2); }
  .sp { display: flex; flex-wrap: wrap; gap: 4px var(--sp-3); align-items: baseline; width: 100%; text-align: left; padding: var(--sp-3); min-height: 44px; border: 1px solid var(--line); border-radius: var(--r-card); background: var(--card); color: var(--ink); font: inherit; cursor: pointer; overflow-wrap: break-word; }
  .sp span { color: var(--ink-2); font-size: var(--fs-small); }
  .sp.on { border-color: var(--bad); background: var(--bad-soft); }
  .grounds { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; margin: 0 0 var(--sp-2); }
  .src { margin: 0 0 var(--sp-3); color: var(--ink-3); font-size: var(--fs-small); }
  .facts { display: grid; grid-template-columns: repeat(auto-fit, minmax(7em, 1fr)); gap: var(--sp-2); list-style: none; margin: 0 0 var(--sp-3); padding: var(--sp-3); }
  .facts li { display: grid; }
  .facts b { font-size: var(--fs-body); }
  .facts small { color: var(--ink-3); }
  .warn { display: flex; gap: var(--sp-2); border: 1px solid var(--bad); border-radius: var(--r-card); padding: var(--sp-3); margin: var(--sp-3) 0; color: var(--ink); }
  .warn :global(svg) { flex: none; color: var(--bad); margin-top: 2px; }
  .warn p { margin: 2px 0 0; }
  .whybox ul { list-style: none; margin: var(--sp-2) 0 0; padding: 0; display: grid; gap: 6px; }
  .whybox summary { font-weight: 700; cursor: pointer; min-height: 44px; display: flex; align-items: center; }
  .whybox li { display: flex; gap: 8px; align-items: flex-start; }
  .whybox li :global(svg) { flex: none; margin-top: 3px; color: var(--ok, var(--accent)); }
  .whybox li.bad :global(svg) { color: var(--bad); }
  .lines { margin-top: var(--sp-2); }
  .lines summary { cursor: pointer; color: var(--ink-2); min-height: 44px; display: flex; align-items: center; }
  .vslrow { display: flex; flex-wrap: wrap; gap: 4px 16px; }
  .lchk { display: inline-flex; align-items: center; gap: 6px; min-height: 44px; }
  .acts { display: flex; flex-wrap: wrap; gap: 8px; margin: var(--sp-3) 0; }
  .next { display: flex; gap: 4px; align-items: center; color: var(--ink-3); font-size: var(--fs-small); }
</style>
