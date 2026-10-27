<script>
  import { tripStats } from '../trips.js';
  import { UNDO_MS } from '../ui/undo.js';
  /**
   * v0.49.0 R1 (drei «A» Tour-Rückblick): a trip's saved Rückblick tells what the trip was, instead of
   * four grey tiles: km, Hm, time and pace with the weather (and per day on a trip of several days),
   * plan against real, what was not used (with the grams to save), what broke or was missing, the
   * learnings of the trip and what it means for the next trip. «Antworten ändern» stays, quiet.
   * Every number may be unknown: then a calm «–».
   *
   * SN2x «SN2 extra» (Noah 13.10.2026 19:48 «SN2j–SN2k freigegeben»; mockups SN2j-a oben/Mitte/unten, SN2k
   * oben/unten): the whole Rückblick of one trip in five groups that fold open (answer 1a), only «Die Tour»
   * open at the start; each closed group shows one line with the most important, and the page remembers
   * which groups were open (on this device). A trip of several days has one day switch on top for the whole
   * page (answer 5a). New: map and profile with the same numbers as the timeline, «Notizen» (U4), the whole
   * «Puls und Leistung» with Relative Effort and load (answer 2), W/kg (answer 3a), «Stimmung und Energie»,
   * «Erholung danach» (U3, with Fitbit), the weather planned and as it was, «Packliste, wie gepackt» (U5),
   * «Abnutzung» (U2), «Für nächstes Mal» (U6, answer 7) and «Vergleich» inside one of five groups (answer 4).
   * A part without data shows nothing or one quiet line, never an empty table. The end of the page stays
   * free for the tile row of the SK round.
   */
  import { t, tn, num, nameOf, locale } from '../i18n.svelte.js';
  import { stravaName } from '../stravanames.js';
  import { formatWeight } from '../gear.js';
  import { tripFacts, planVsReal, nextTripAfter, nextHints, withActs } from './rueckblick.js';
  import { rideTime, elapsed, n0, n1, temps, kg, dates, dayLong, rainText, signedNum, signedHours, DASH } from './fmt.js';
  import { clock as mmss } from '../touren/strava/fmt.js';
  import { openTrip, newTrip } from '../nav.js';
  import Btn from '../ui/Btn.svelte';
  import { localDay } from '../localday.js';
  import { tripEnd } from '../debrief.js';
  import { WEATHER, AMOUNT } from '../debrief.js';
  import { CLOTHING } from '../wardrobe.js';
  import TemplateOffer from '../debrief/TemplateOffer.svelte';
  import MoreActions from '../ui/MoreActions.svelte';
  // SN2+ SN2e/SN2f: «Puls und Leistung» and «Aus Vorlage» in «Nicht gebraucht»
  import { liveQuery } from 'dexie';
  import { tick } from 'svelte';
  import { db } from '../db.js';
  import { ridesWx, ensureRidesWx } from '../touren/ridewx.js';
  import { updateTemplate } from '../templates.js';
  import { loadGanz } from './actdata.js';
  import { tripValues, tripEntries, tripActs } from './werte.js';
  import { tripTemplate, inTemplate, dropItem, putBack, unusedBefore } from './fromtemplate.js';
  import HeartPower from './HeartPower.svelte';
  import RideOverviews from '../touren/strava/RideOverviews.svelte';
  import { ftpEstimate, pauseSecs } from '../training.js';
  import { fitbitTrip, sleepText } from './fitbittrip.js';
  import { addDays as addDaysIso } from '../health.js';
  import { dailyValues } from '../abauswertung.js';
  import { QUESTION, answerRow } from '../abfragen.js';
  import { saveAnswers, deleteAnswer } from '../abdb.js';
  import { offerDone } from '../ui/rename.svelte.js';
  import UndoToast from './UndoToast.svelte';
  // SN2x: the whole Rückblick
  import Group from './Group.svelte';
  import TourMap from './TourMap.svelte';
  import NextTime from './NextTime.svelte';
  import Profile from '../ui/Profile.svelte';
  import { stageCuts } from '../stages.js';
  import { distKm } from '../route.js';
  import { situationHits } from '../situation.js';
  import { tripPower, effortOf, loadOf } from './power.js';
  import FeelScale from '../tourenc/FeelScale.svelte'; // Touren c 70
  import { GROUPS, openOf, dayTabs, dayFacts, actsOn, timeline, stravaRides, tripNoteList, wearRows, chainLeft, packedList, packedTotals, pointsOf, compareGroup, similarRows, tripNumbers, compareRows, lastSeries } from './ganz.js';
  import { Undo2, Route as RouteIc, HeartPulse, Map as MapIc, Briefcase as BagIc, ArrowRight, Flag, Coffee, NotebookPen, Image as ImageIc, Trophy, Mountain, Copy, MoonStar, Smile, Utensils, CloudSun, Gauge, ArrowLeftRight, Info, Calendar, ChevronDown } from '@lucide/svelte';
  import { Check, Lightbulb, Sparkles, Sun, CloudRain, Cloud, Thermometer, Bike, Briefcase, Wrench, X, Minus, Plus, ChevronRight, Package, BookmarkPlus, Wind } from '@lucide/svelte';

  import Woanders from '../sk/Woanders.svelte'; // SK X2 + X14 (SKX2)
  import { slotOf, stravaRideUrl, komootUrl } from '../sk/links.js';
  import { actHref } from '../strava/acthref.js';
  let { trip, d, bike = null, trips = [], debriefs = [], rides = [], learnings = [], items = [], containers = [], bikes = [], counts, sugg = [], openSugg = [], ontake = null, onno = null, onreopen = null, offer = null, notes = [], onpatch = null } = $props();
  // tour critique 3b: the template question opens from «…» only
  let tplOpen = $state(false);
  // SK X2: a ride of the trip that came from Strava (its id in the ride ledger) opens there
  const stravaQ = liveQuery(() => (trip?.startDate ? db.kmBook.where('date').between(trip.startDate, tripEnd(trip) ?? trip.startDate, true, true).toArray() : []));
  const stravaId = $derived(($stravaQ ?? []).find((e) => e.stravaId && e.state !== 'removed')?.stravaId ?? null);

  const today = localDay();
  const byId = $derived(Object.fromEntries(items.map((i) => [i.id, i])));
  // The trip as a row of tripFacts (the same numbers as the Rückblick page and Past trips).
  // SN2x: all trips at once, for «Vergleich» and the bars of the last trips.
  const allRows = $derived(tripFacts({ trips: trips.some((x) => x.id === trip.id) ? trips.map((x) => (x.id === trip.id ? { ...trip, status: 'done' } : x)) : [...trips, { ...trip, status: 'done' }], debriefs: debriefs.some((x) => x.tripId === trip.id) ? debriefs.map((x) => (x.tripId === trip.id ? { ...d, status: 'done' } : x)) : [...debriefs, { ...d, status: 'done' }], rides, learnings, items, containers, bikes, today: tripEnd(trip) > today ? tripEnd(trip) : today }));
  // Noah 21.10.2026 «2 leere Kacheln»: without an uploaded ride the numbers come from the trip's Strava rides
  const row = $derived(withActs(allRows.find((r) => r.id === trip.id) ?? null, acts));
  const pvr = $derived(row ? planVsReal(row) : []);
  const next = $derived(nextTripAfter(trip, trips, today));
  const hints = $derived(nextHints({ debrief: d, next, learnings: row?.learnings ?? [], byId }));
  const unused = $derived(trip.entries.filter((e) => d.items?.[e.itemId] === 'unused' && byId[e.itemId]));
  const broken = $derived(trip.entries.filter((e) => d.items?.[e.itemId] === 'broken' && byId[e.itemId]));
  const usedN = $derived(trip.entries.filter((e) => byId[e.itemId] && !d.items?.[e.itemId]).length);
  const totalN = $derived(trip.entries.filter((e) => byId[e.itemId]).length);
  const wOf = (e) => (byId[e.itemId]?.weightG == null ? null : byId[e.itemId].weightG * (e.qty || 1));
  const savedOn = $derived(d.doneAt ? dayLong(d.doneAt.slice(0, 10)) : null);
  const savedLine = $derived([savedOn ? t('Saved on {date}', { date: savedOn }) : t('Debrief saved'), d.applied?.length ? tn(d.applied.length, '{n} change taken over', '{n} changes taken over') : ''].filter(Boolean).join(' · '));

  /* plan against real: two thin bars per row, drawn to the larger of both */
  const LABEL = { km: 'Distance', gainM: 'Climbing|hm', movingH: 'Moving', kmh: 'Pace|speed' };
  const fmtV = (key, v) => (key === 'movingH' ? rideTime(v) : key === 'kmh' ? `${n1(v)} km/h` : key === 'gainM' ? `${n0(v)} Hm` : `${n0(v)} km`);
  const fmtD = (key, v) => (key === 'movingH' ? signedHours(v) : key === 'kmh' ? signedNum(v, n1) : signedNum(v));
  // better: more km/Hm is neutral; less time or more speed is better
  const good = (x) => (x.key === 'movingH' ? x.diff < 0 : x.key === 'kmh' ? x.diff > 0 : null);
  const timeRow = $derived(pvr.find((x) => x.key === 'movingH') ?? null);
  /* SN2+ SN2e / SN2x: heart rate from the ledger (kmBook), zones, power and Relative Effort from the activities when they are there */
  const wQ = liveQuery(() => loadGanz(db));
  const w = $derived($wQ ?? null);
  const end = $derived(tripEnd(trip));

  /* ---------- SN2x: the groups and the day switch ---------- */
  const OPEN_KEY = 'rueckblick.groups';
  let open = $state(openOf((() => { try { return localStorage.getItem(OPEN_KEY); } catch { return null; } })()));
  function toggle(key, v) {
    open = { ...open, [key]: v };
    try {
      localStorage.setItem(OPEN_KEY, JSON.stringify(open));
    } catch {
      /* private mode: the groups open as at the start next time */
    }
  }
  const tabs = $derived(dayTabs(trip));
  let day = $state(null);
  const dayF = $derived.by(() => {
    const f = day != null && row ? dayFacts(row, day) : null;
    return f && row.fromActs ? withActs(f, actsOn(acts, f.date)) : f;
  });
  const dateOf = (i) => {
    const x = new Date(`${trip.startDate}T00:00:00Z`);
    x.setUTCDate(x.getUTCDate() + i);
    return x.toISOString().slice(0, 10);
  };
  const shortDay = (iso) => new Date(`${iso}T12:00:00`).toLocaleDateString(locale(), { weekday: 'short' });
  const longDay = (iso) => new Date(`${iso}T12:00:00`).toLocaleDateString(locale(), { weekday: 'short', day: 'numeric', month: 'short' });
  const clock = (iso) => (iso ? new Date(iso).toLocaleTimeString(locale(), { hour: '2-digit', minute: '2-digit' }) : '');

  // the activities and ledger rides of the trip (or of the chosen day)
  const acts = $derived(w ? tripActs(w.acts, trip, end) : []);
  // Strava check #8: the measured weather at each ride's start, the same as on the tour page (ridewx.js ridesWx)
  const rwx = $derived(ridesWx(acts));
  const wxT = $derived(rwx ? { tmin: rwx.tmin, tmax: rwx.tmax } : { tmin: row?.tmin ?? null, tmax: row?.tmax ?? null });
  $effect(() => {
    if (acts.length) ensureRidesWx(db, acts, today);
  });
  const entries = $derived(w ? tripEntries(w.entries, trip, end) : []);
  const dActs = $derived(dayF ? actsOn(acts, dayF.date) : acts);
  // the Strava rides of the trip or of the chosen day, for «Übersicht wie Strava»
  const rideActs = $derived(dActs.filter((a) => a.kind === 'bike' || /ride/i.test(a.type ?? '')));
  /** The bike name of one Strava ride from the km book, or ''. */
  const bikeOf = (a) => {
    const e = ($stravaQ ?? []).find((x) => String(x.stravaId) === String(a.id));
    return (e?.bikeId ? bikes.find((x) => x.id === e.bikeId)?.name : '') ?? '';
  };
  // the bike of each ride with a power meter (Strava check 21.10.2026: the gravel ride was named on the other bike)
  const meterBike = $derived.by(() => {
    const names = new Set();
    for (const a of dActs.filter((x) => x.wDevice === true)) if (bikeOf(a)) names.add(bikeOf(a));
    return [...names].join(', ');
  });
  const ftp = $derived(w ? ftpEstimate(w.acts, end ?? today) : null);
  const dEntries = $derived(dayF ? entries.filter((e) => e.date === dayF.date) : entries);
  const values = $derived(w ? tripValues({ acts: dActs, entries: dEntries, bounds: w.zones?.bounds ?? null }) : null);
  const power = $derived(w ? tripPower({ acts: dActs, history: w.acts, kg: w.kg, end }) : null);
  const effort = $derived(effortOf(dActs));
  const load = $derived(w ? loadOf(dActs, w.acts, end) : null);
  const actsOf = (r) => (w ? tripActs(w.acts, r.trip, r.end) : []);
  const efforts = $derived(row && effort != null ? lastSeries(allRows, row, (r) => effortOf(actsOf(r))) : []);
  const loads = $derived(row && load != null ? lastSeries(allRows.filter((r) => r.id === row.id || actsOf(r).some((a) => a.wDevice === true)), row, (r) => loadOf(actsOf(r), w.acts, r.end)) : []);
  // the mean weighted by the moving time of each ride (Strava check 21.10.2026: cadence 67 here, 69 on Fahrten)
  const avgOf = (list, f) => {
    const xs = list.filter((a) => typeof f(a) === 'number' && f(a) > 0);
    const wt = (a) => Number(a.own?.movingS ?? a.movingS) || 1;
    const n = xs.reduce((s, a) => s + wt(a), 0);
    return xs.length ? Math.round(xs.reduce((s, a) => s + f(a) * wt(a), 0) / n) : null;
  };
  const tempo = $derived.by(() => {
    const kmh = dayF ? dayF.kmh : row?.kmh ?? null;
    const sp = dActs.map((a) => Number(a.spdMax) || 0).filter((v) => v > 0);
    const ps = dActs.filter((a) => a.pauses?.n != null);
    const tAvg = avgOf(dActs, (a) => a.tempAvg);
    const kcal = dActs.reduce((s, a) => s + (Number(a.kcal) || 0), 0);
    return {
      kmh: kmh ?? avgOf(dActs, (a) => a.spdAvg),
      maxKmh: sp.length ? Math.max(...sp) : null,
      pauses: ps.length ? { n: ps.reduce((s, a) => s + a.pauses.n, 0), min: Math.round(ps.reduce((s, a) => s + (pauseSecs(a) ?? 0), 0) / 60), secs: ps.reduce((s, a) => s + (pauseSecs(a) ?? 0), 0) } : dayF ? dayF.pauses : row?.pauses ?? null,
      cad: avgOf(dActs, (a) => a.cad),
      temp: tAvg != null ? { avg: tAvg, min: null, max: null } : null,
      kcal: kcal > 0 ? Math.round(kcal) : null,
      strava: dActs.length > 0,
    };
  });
  // SN2x: wire to training.js when the Training PR lands (the segments after loadDetail: only your own times)
  const best = $derived(
    dActs
      .flatMap((a) => (Array.isArray(a.best) ? a.best : []))
      .map((x) => ({ name: x.name ?? '', km: x.km ?? (x.distance ? x.distance / 1000 : null), grade: x.grade ?? x.avgGrade ?? null, s: x.s ?? x.elapsedS ?? null, rank: Number(x.rank ?? x.prRank) || null }))
      .filter((x) => x.name && x.rank >= 1 && x.rank <= 3),
  );

  /* ---------- SN2x: route, timeline and notes ---------- */
  const line = $derived(trip.route?.line?.length > 1 ? trip.route.line : row?.rides?.length === 1 && row.rides[0].line?.length > 1 ? row.rides[0].line : []);
  const routeKm = $derived(trip.route?.km ?? row?.km ?? null);
  const profile = $derived(trip.route?.profile?.length > 1 ? trip.route.profile : row?.profile ?? null);
  const loop = $derived(!!(trip.route?.start && trip.route?.end && distKm(trip.route.start, trip.route.end) < 0.5));
  const cuts = $derived(trip.days > 1 ? stageCuts(trip).slice(0, -1).filter((v) => v != null) : []);
  const wayNotes = $derived([...(d.rideNotes ?? []).map((n) => ({ ...n, day: n.day ?? 0 })), ...notes.filter((n) => n.tripId === trip.id && n.day != null)]);
  // a trip without an uploaded ride: the Strava rides (pauses, best times, climbs, photos at their place)
  const tlRides = $derived(row?.rides?.length ? row.rides : stravaRides(acts));
  const tlAll = $derived(timeline({ trip, rides: tlRides, notes: wayNotes, loop }));
  const tl = $derived(day == null ? tlAll : timeline({ trip, rides: tlRides, notes: wayNotes, day, loop }));
  const tlShown = $derived(tl.filter((e) => !e.short));
  const shortN = $derived(tl.filter((e) => e.short).length);
  const marks = $derived.by(() => {
    const seen = new Set();
    return tlAll.filter((e) => e.n && e.tkm != null && !seen.has(e.n) && seen.add(e.n)).map((e) => ({ km: e.tkm, n: e.n }));
  });
  const dayMarks = $derived.by(() => {
    if (day == null) return marks;
    const seen = new Set();
    return tl.filter((e) => e.n && e.tkm != null && !seen.has(e.n) && seen.add(e.n)).map((e) => ({ km: e.tkm, n: e.n }));
  });
  const noteList = $derived(tripNoteList({ trip, debrief: d, notes, line: tlAll }));
  const dayNotes = $derived(day == null ? noteList : noteList.filter((n) => n.day === day));
  let copied = $state(false);
  async function copyNotes() {
    const text = noteList.map((n) => `«${n.text}» ${[n.at ? clock(n.at) : '', n.km != null ? `km ${num(n.km)}` : '', n.after ? t('after the trip') : ''].filter(Boolean).join(' · ')}`).join('\n');
    try {
      await navigator.clipboard.writeText(text);
      copied = true;
      setTimeout(() => (copied = false), 2500);
    } catch {
      copied = false;
    }
  }

  /* ---------- SN2x: Stimmung und Energie (the daily check of the trip days) ---------- */
  // Noah 21.10.2026 «fehlen werte für stimmung und energie»: also the answers of «Deine Abfragen» (energy,
  // mood) of the trip days, and the Fitbit values around the trip instead of the placeholders
  const moreQ = liveQuery(async () => {
    const last = tripEnd(trip) ?? trip.startDate;
    const [ans, health] = await Promise.all([
      db.abAnswers.where('day').between(trip.startDate, last, true, true).toArray().catch(() => []),
      db.healthDays ? db.healthDays.where('date').between(addDaysIso(trip.startDate, -31), addDaysIso(last, 2), true, true).toArray().catch(() => []) : [],
    ]);
    return { ans, health };
  });
  const askedMood = $derived(dailyValues($moreQ?.ans ?? [], 'spass.stimmung'));
  const askedEnergy = $derived(dailyValues($moreQ?.ans ?? [], 'erholung.akku'));
  const moods = $derived(
    w
      ? Array.from({ length: Math.max(1, trip.days || 1) }, (_, i) => {
          const date = dateOf(i);
          const c = w.checks.find((x) => x.day === date) ?? null;
          const r1 = (v) => (v == null ? null : Math.round(v));
          return { i, date, c: { mood: c?.mood ?? r1(askedMood[date]), energy: c?.energy ?? r1(askedEnergy[date]) } };
        }).filter((x) => x.c.mood != null || x.c.energy != null)
      : [],
  );
  const fit = $derived(fitbitTrip($moreQ?.health ?? [], trip.startDate, tripEnd(trip) ?? trip.startDate));
  // «Nachtragen»: mood and energy of the trip days afterwards, as answers of «Deine Abfragen» (with Undo)
  let addMood = $state(false);
  let draft = $state({});
  async function saveMoods() {
    const rows = [];
    for (const [date, v] of Object.entries(draft)) {
      if (v.mood) rows.push(answerRow(QUESTION['spass.stimmung'], Number(v.mood), { day: date }));
      if (v.energy) rows.push(answerRow(QUESTION['erholung.akku'], Number(v.energy), { day: date }));
    }
    const list = rows.filter(Boolean);
    if (!list.length) return;
    const before = await Promise.all([...new Set(list.map((r) => r.day))].map(async (day) => [day, await db.flowChecks.get(day)]));
    await saveAnswers(list);
    addMood = false;
    draft = {};
    offerDone(t('Mood and energy saved.'), async () => {
      for (const r of list) await deleteAnswer(r.id);
      for (const [day, c] of before) await (c ? db.flowChecks.put(JSON.parse(JSON.stringify(c))) : db.flowChecks.delete(day));
    });
  }
  const dayMoods = $derived(day == null ? moods : moods.filter((m) => m.i === day));

  /* ---------- SN2x: Gepäck und Velo ---------- */
  const packed = $derived(packedList(trip, items, containers, d.packed ?? null));
  const ptot = $derived(packedTotals(packed));
  // Klick-Rundgang 22.10.2026 H12: the trip head shows the one trip weight (packed and worn); this line names
  // it too and says how much of it is in the bags, so the two numbers no longer seem to disagree
  const allG = $derived(tripStats(trip, items, containers, bike, 0)?.packG ?? null);
  const wear = $derived(wearRows(bike, { km: row?.km ?? null, gainM: row?.gainM ?? null }));
  const left = $derived(chainLeft(bike));

  /* ---------- SN2x: Weiter ---------- */
  const points = $derived(pointsOf(d));
  const hits = $derived(situationHits(trip, w?.sets ?? null));
  async function savePoints(list) {
    if (onpatch) await onpatch({ nextTime: list });
    else await db.debriefs.update(trip.id, { nextTime: list });
  }
  const group = $derived(compareGroup(trip, bikes));
  const similar = $derived(row ? similarRows(allRows, row, bikes) : []);
  let otherId = $state(null);
  const other = $derived(similar.find((r) => r.id === otherId) ?? similar[0] ?? null);
  const numbersOf = (r) => tripNumbers(r, { acts: actsOf(r), entries: w ? tripEntries(w.entries, r.trip, r.end) : [], history: w?.acts ?? [] });
  const cmp = $derived(row && other ? compareRows(numbersOf(row), numbersOf(other)) : []);
  const CMP_LABEL = { kmh: 'average while moving', movingH: 'Moving|time', pauseMin: 'Pauses', hrAvg: 'Ø heart rate', wAvg: 'Ø power', effort: 'Relative Effort', load: 'Load|power' };
  const cmpV = (k, v) => (k === 'kmh' ? `${n1(v)} km/h` : k === 'movingH' ? rideTime(v) : k === 'pauseMin' ? `${num(v)} min` : k === 'wAvg' ? `${num(v)} W` : num(v));
  const cmpD = (k, v) => (k === 'kmh' ? signedNum(v, n1) : k === 'movingH' ? signedHours(v) : k === 'pauseMin' ? `${signedNum(v)} min` : k === 'wAvg' ? `${signedNum(v)} W` : signedNum(v));

  /* ---------- SN2x: the one line of each group ---------- */
  const firstDot = (list) => list.filter(Boolean).join(' · ');
  const lineOf = $derived({
    tour: dayF
      ? firstDot([dayF.date ? longDay(dayF.date) : '', [dayF.from, dayF.to].filter(Boolean).join(' – '), dayF.km != null ? `${n0(dayF.km)} km` : '', dayF.gainM != null ? `${n0(dayF.gainM)} Hm` : ''])
      : firstDot([row?.km != null ? `${n0(row.km)} km` : '', row?.gainM != null ? `${n0(row.gainM)} Hm` : '', row?.movingH ? rideTime(row.movingH) : '', trip.days > 1 ? tn(trip.days, '{n} day', '{n} days') : '', [line.length ? t('map') : '', tl.length ? t('timeline') : '', noteList.length ? tn(noteList.length, '{n} note', '{n} notes') : ''].filter(Boolean).join(', ')]),
    body: firstDot([values?.hrAvg != null ? t('Ø heart rate {n}', { n: num(values.hrAvg) }) : '', power ? (power.measured && power.np ? `NP ${num(power.np)} W` : t('Ø {w} W estimated', { w: num(power.avg) })) : '', effort != null ? `${t('Relative Effort')} ${num(effort)}` : '', load != null ? `${t('Load|power')} ${num(load)}` : '', dayMoods[0]?.c?.mood != null ? t('Mood {n} of 10', { n: dayMoods[0].c.mood }) : '']) || t('Heart rate and power · with Strava'),
    way: firstDot([d.weather ? t(WEATHER.find((x) => x.key === d.weather)?.name ?? '') : '', rainText(row?.rain, trip.days) !== DASH ? rainText(row?.rain, trip.days) : '', d.amount ? `${t('Food and drink')}: ${t(AMOUNT.find((x) => x.key === d.amount)?.name ?? '')}` : '']),
    pack: day != null ? t('for the whole trip · «Whole trip» on top shows it') : firstDot([ptot.g ? (allG && Math.round(allG / 100) !== Math.round(ptot.g / 100) ? t('{w} in all, {b} of it in {n} bags', { w: kg(allG), b: kg(ptot.g), n: ptot.bags }) : t('{w} in {n} bags', { w: kg(ptot.g), n: ptot.bags })) : '', unused.length ? tn(unused.length, '{n} item not used', '{n} items not used') : '', d.missing?.length ? tn(d.missing.length, '{n} was missing', '{n} were missing') : '', left != null ? (left > 0 ? t('Chain: {km} km to waxing', { km: num(left) }) : t('Chain: waxing due')) : '']),
    next: day != null ? t('for the whole trip') : firstDot([points.length ? tn(points.length, 'For next time {n} point', 'For next time {n} points') : '', row?.learnings.length ? tn(row.learnings.length, '{n} learning', '{n} learnings') : '', group ? (other ? t('Comparison in {group}: {trip}', { group: groupName(group), trip: other.title }) : t('Comparison in {group}', { group: groupName(group) })) : '']),
  });
  function groupName(g) {
    return g?.key === 'bikepacking' ? t('Bikepacking') : g?.name ?? '';
  }
  const ICON = { tour: RouteIc, body: HeartPulse, way: MapIc, pack: BagIc, next: ArrowRight };
  const titleOf = (g) => (day != null && (g.key === 'tour' || g.key === 'body' || g.key === 'way') ? `${t(g.name)} · ${t('Day {n}', { n: day + 1 })}` : t(g.name));

  /* SN2+ SN2f: «Aus Vorlage» per item, one at a time, with Undo; the item stays in Material and on this trip */
  const tpl = $derived(w ? tripTemplate(trip, w.templates) : null);
  const before = $derived(unusedBefore(debriefs, trips, trip));
  let taken = $state({});
  let note = $state(null);
  let noteTimer;
  async function fromTemplate(e) {
    if (!tpl) return;
    const id = tpl.id;
    const out = dropItem($state.snapshot(tpl), e.itemId, items, w.sets);
    if (!out) return;
    await updateTemplate(db, id, () => out.tpl);
    taken = { ...taken, [e.itemId]: { tplId: id, undo: out.undo } };
    clearTimeout(noteTimer);
    note = { itemId: e.itemId, text: t('{item} taken out of «{tpl}»', { item: nameOf(byId[e.itemId]), tpl: tpl.name }) };
    noteTimer = setTimeout(() => (note = null), UNDO_MS);
  }
  async function undoTaken(itemId) {
    const x = $state.snapshot(taken[itemId]);
    if (!x) return;
    // a plain copy: IndexedDB cannot store a reactive proxy
    await updateTemplate(db, x.tplId, (cur) => putBack(cur, x.undo));
    const { [itemId]: _gone, ...rest } = taken;
    taken = rest;
    if (note?.itemId === itemId) (clearTimeout(noteTimer), (note = null));
  }
  const DAYKIND = { unused: 'Packed again for {trip}, not used this time', missing: 'Was missing', broken: 'Broke: check it before the next trip', note: 'Your sentence for next time' };
  const WEAR = { chain: 'Chain', tyres: 'Tyres', pads: 'Brake pads' };

  // Impeccable: «N Vorschläge ansehen ↓» (the page's button) opens «Die Tour» and scrolls to the suggestions
  async function showSugg() {
    if (day != null) day = null;
    if (!open.tour) toggle('tour', true);
    await tick();
    const el = document.getElementById('rv-suggestions');
    el?.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
    el?.focus({ preventScroll: true });
  }
  $effect(() => {
    window.addEventListener('rv-suggestions', showSugg);
    return () => window.removeEventListener('rv-suggestions', showSugg);
  });
</script>


{#snippet rainIcon(rain)}
  {#if rain?.wet === true}<CloudRain size={16} aria-hidden="true" />{:else if rain?.wet === false}<Sun size={16} aria-hidden="true" />{:else}<Cloud size={16} aria-hidden="true" />{/if}
{/snippet}
{#snippet dots(v, label)}<span class="dots" role="img" aria-label={t('{what} {n} of 10', { what: label, n: v })}>{#each Array(10) as _, i (i)}<i class:on={i < v}></i>{/each}</span>{/snippet}
<!-- SK X2 + X14 (SKX2): «Woanders» right under the number tiles, inside «Die Tour» (whole trip and each day) -->
{#snippet woanders()}
  <Woanders context={trip.title ?? ''} links={[
    { kind: 'x2s', href: stravaRideUrl(stravaId), icon: 'flow', sub: stravaId ? t('the ride with its comments') : t('your training log') },
    { kind: 'x2k', href: komootUrl(trip.place ?? trip.route?.start), icon: 'map', sub: t('plan or find the route') },
    { kind: 'x14', slot: slotOf('x14', trip.id), icon: 'image', sub: t('the photos stay there') },
  ]} />
{/snippet}

<!-- v0.109.0 Design-Refresh P6 (T16 «Gespeicherter Rückblick», approved 12.10.2026); SN2x: five groups -->
<div class="saved">
  <!-- tour critique 3b (Noah 21.10.2026): the template question is no longer on top; it waits under «…» next to «Done. Good trip!» -->

  {#if tabs.length}
    <!-- SN2x (answer 5a): one day switch for the whole page -->
    <div class="dayswitch" role="group" aria-label={t('Days of the trip')} data-days>
      {#each tabs as x (x ?? 'all')}
        <button type="button" class="dsb" aria-pressed={day === x} onclick={() => (day = x)}>{x == null ? t('Whole trip') : `${t('Day {n}', { n: x + 1 })} · ${shortDay(dateOf(x))}`}</button>
      {/each}
      <span class="dsn">{t('for the whole page')}</span>
    </div>
  {/if}

  <div class="groups">
    <!-- 1 Die Tour -->
    <Group key="tour" title={titleOf(GROUPS[0])} line={lineOf.tour} icon={ICON.tour} open={!!open.tour} ontoggle={(v) => toggle('tour', v)}>
      <div class="rv-lay">
        <div class="rv-col">
          <!-- the trip in numbers -->
          <section class="rv-box pad ride" aria-labelledby="sv-h">
            {#if dayF}
              <p class="kick top"><Calendar size={16} aria-hidden="true" />{[t('Day {n} of {all}', { n: dayF.n, all: trip.days }), longDay(dayF.date), [dayF.from, dayF.to].filter(Boolean).join(' – ')].filter(Boolean).join(' · ')}</p>
              <h2 id="sv-h" class="sr">{t('Day {n}', { n: dayF.n })}</h2>
              <dl class="rv-tiles big">
                <div class="rv-tile"><dd><b>{n0(dayF.km)} km</b></dd><dt><small>{t('Distance')}</small></dt></div>
                <div class="rv-tile"><dd><b>{n0(dayF.gainM)} Hm</b></dd><dt><small>{t('Climbing|hm')}</small></dt></div>
                <div class="rv-tile"><dd><b>{rideTime(dayF.movingH)}</b></dd><dt><small>{dayF.totalH && dayF.movingH && dayF.totalH > dayF.movingH ? t('moving · {h} total', { h: elapsed(dayF.totalH) }) : t('moving')}</small></dt></div>
                <div class="rv-tile"><dd><b>{n1(dayF.kmh)} km/h</b></dd><dt><small>{t('average while moving')}</small></dt></div>
              </dl>
              {@render woanders()}
              <ul class="facts">
                <li>{#if dayF.wet}<CloudRain size={16} aria-hidden="true" />{t('rain')}{:else if dayF.wet === false}<Sun size={16} aria-hidden="true" />{t('dry|weather')}{:else}<Cloud size={16} aria-hidden="true" />{DASH}{/if}</li>
                <li><Thermometer size={16} aria-hidden="true" />{temps(dayF.tmin, dayF.tmax)}</li>
                {#if dayF.n < trip.days && dayF.to}<li><MoonStar size={16} aria-hidden="true" />{t('Night in {place}', { place: dayF.to })}</li>{/if}
              </ul>
            {:else}
              <div class="hero"><span class="tp-okdot" aria-hidden="true"><Check size={16} /></span><h2 id="sv-h">{t('Done. Good trip!')}</h2>{#if offer}<span class="hmore"><MoreActions title={trip.title ?? ''} label={t('More for {what}', { what: trip.title ?? '' })} actions={[{ name: t('Save as a template'), explain: t('Your next day ride then starts with New → Plan a trip → From template.'), icon: BookmarkPlus, run: () => (tplOpen = true) }]} /></span>{/if}</div>
              {#if offer && tplOpen}<TemplateOffer {trip} name={offer} />{/if}
              <!-- Impeccable Runde 2 (Rückblick einer Tour 2): the card «Gespeichert» is gone; its line lives here -->
              <p class="savedline" role="status" data-saved>{savedLine}</p>
              <p class="kick">{[trip.title, dates(trip.startDate, tripEnd(trip)), trip.days > 1 ? tn(trip.days, '{n} day', '{n} days') : t('Day ride|art')].join(' · ')}</p>
              {#if trip.memory}<p class="rv-note memline" data-memory-line>{[t('From memory, without GPS: no numbers made up'), trip.memory.place, d.note ? `«${d.note}»` : ''].filter(Boolean).join(' · ')}</p>{/if}
              <dl class="rv-tiles big">
                <div class="rv-tile"><dd><b>{n0(row?.km)} km</b></dd><dt><small>{t('Distance')}</small></dt></div>
                <div class="rv-tile"><dd><b>{n0(row?.gainM)} Hm</b></dd><dt><small>{t('Climbing|hm')}</small></dt></div>
                <div class="rv-tile"><dd><b>{rideTime(row?.movingH)}</b></dd><dt><small>{row?.totalH && row?.movingH && row.totalH > row.movingH ? t('moving · {h} total', { h: elapsed(row.totalH) }) : t('moving')}</small></dt></div>
                <div class="rv-tile"><dd><b>{n1(row?.kmh)} km/h</b></dd><dt><small>{t('average while moving')}</small></dt></div>
              </dl>
              {@render woanders()}
              <ul class="facts">
                <li>{@render rainIcon(row?.rain)}{rainText(row?.rain, trip.days)}</li>
                <li><Thermometer size={16} aria-hidden="true" />{temps(wxT.tmin, wxT.tmax)}{#if rwx}{` · ${t('at the start|weather')}`}{/if}</li>
                {#if rwx?.wmax != null}<li data-ride-wind><Wind size={16} aria-hidden="true" />{t('wind {kmh} km/h', { kmh: rwx.wmin === rwx.wmax ? num(rwx.wmax) : `${num(rwx.wmin)}–${num(rwx.wmax)}` })}</li>{/if}
                <li><Bike size={16} aria-hidden="true" />{trip.bike ?? bike?.name ?? DASH}</li>
                {#if row?.baseG}<li><Briefcase size={16} aria-hidden="true" />{t('Base {w}', { w: kg(row.baseG) })}</li>{/if}
              </ul>
              {#if row?.special}<p class="special"><Sparkles size={18} aria-hidden="true" /><span>{row.special}</span></p>{/if}
            {/if}
          </section>

          <!-- Impeccable (Noah 18.10.2026, Rückblick einer Tour 1): the open suggestions in sight, right under
               «Fertig. Gute Tour!», each with «Übernehmen» and «Nein, danke» (4 s «Rückgängig», Debrief.svelte) -->
          {#if openSugg.length}
            <section class="rv-sec sugs" id="rv-suggestions" aria-labelledby="sg-h" data-suggestions tabindex="-1">
              <div class="rv-h"><div><h2 id="sg-h">{tn(openSugg.length, '{n} suggestion from this trip', '{n} suggestions from this trip')}</h2><p class="rv-sub">{t('Take over what helps next time; the rest stays as it is.')}</p></div></div>
              <ul class="rv-box">
                {#each openSugg as x (x.id)}
                  <li class="rv-row sg">
                    <span class="rv-ic" aria-hidden="true"><Lightbulb size={18} /></span>
                    <span class="rv-m"><span class="rv-t">{x.label}</span>{#if x.detail}<span class="rv-s">{x.detail}</span>{/if}</span>
                    <span class="yn">
                      <button type="button" class="btn sm" onclick={() => ontake?.(x)}>{t('Take over')}</button>
                      <button type="button" class="btn sm btn-link" onclick={() => onno?.(x)}>{t('No, thanks')}</button>
                    </span>
                  </li>
                {/each}
              </ul>
              {#if onreopen}<p class="rv-note sgmore"><button type="button" class="tp-link" onclick={onreopen}>{t('Change answers')}</button></p>{/if}
            </section>
          {/if}

          <!-- SN2x: Strecke, map and profile with the numbers of the timeline -->
          {#if line.length || profile}
            <section class="rv-sec" aria-labelledby="rt-h" data-route>
              <div class="rv-h"><div><h2 id="rt-h">{t('Route|review')}</h2><p class="rv-sub">{day != null ? t('Day {n} dark, the other days pale', { n: day + 1 }) : [trip.route?.name ?? '', routeKm ? `${n0(routeKm)} km` : '', trip.route?.gainM ? `${n0(trip.route.gainM)} Hm` : '', cuts.length ? t('one stroke per day') : ''].filter(Boolean).join(' · ')}</p></div></div>
              <div class="rv-box pad">
                {#if line.length}<TourMap {line} km={routeKm} marks={dayMarks} {cuts} {day} />{/if}
                {#if profile}<div class="prof"><!-- v0.151.0 HP2 (F13): the ridden GPX profile, the planned route dashed over it --><Profile points={row?.rideProfile ?? profile} plan={row?.rideProfile ? row.planProfile : null} label={row?.rideProfile ? 'Elevation of the ride' : 'Elevation profile'} marks={dayMarks} cuts={cuts.map((k, i) => ({ km: k, label: t('Day {n}', { n: i + 2 }) }))} from={day != null ? (day === 0 ? 0 : cuts[day - 1] ?? null) : null} to={day != null ? (cuts[day] ?? profile.at(-1)[0]) : null} /></div>{/if}
                <p class="rv-note pm"><MapIc size={16} aria-hidden="true" /><span>{t('Background only hinted · numbers as in the timeline')}</span></p>
              </div>
            </section>
          {/if}

          {#if trip.days > 1 && day == null && row}
            <!-- SN2k: the days one by one; a tap opens the day as above -->
            <section class="rv-sec" aria-labelledby="dd-h" data-day-table>
              <div class="rv-h"><div><h2 id="dd-h">{tn(trip.days, 'The day', 'The {n} days')}</h2><p class="rv-sub">{t('a tap opens the day, as with the switch above')}</p></div></div>
              <div class="rv-box ddw">
                <table class="dd">
                  <thead><tr><th scope="col">{t('Day|column')}</th><th scope="col" class="r">km</th><th scope="col" class="r">Hm</th><th scope="col" class="r">{t('Moving|time')}</th><th scope="col">{t('Weather')}</th>{#if entries.length || acts.length}<th scope="col" class="r">{t('Ø heart rate')}</th>{/if}{#if acts.some((a) => a.effort)}<th scope="col" class="r">{t('Relative Effort')}</th>{/if}</tr></thead>
                  <tbody>
                    {#each tabs.filter((x) => x != null) as i (i)}
                      {@const f = dayFacts(row, i)}
                      {@const h = tripValues({ acts: actsOn(acts, f.date), entries: entries.filter((e) => e.date === f.date) })}
                      <tr>
                        <th scope="row"><button type="button" class="dlink" onclick={() => (day = i)}>{t('Day {n}', { n: i + 1 })} · {longDay(f.date)}</button>{#if f.from || f.to}<small>{[f.from, f.to].filter(Boolean).join(' – ')}</small>{/if}</th>
                        <td class="r num">{n0(f.km)}</td><td class="r num">{n0(f.gainM)}</td><td class="r num">{rideTime(f.movingH)}</td>
                        <td>{f.wet ? t('rain') : f.wet === false ? t('dry|weather') : DASH} · {temps(f.tmin, f.tmax)}</td>
                        {#if entries.length || acts.length}<td class="r num">{h?.hrAvg != null ? num(h.hrAvg) : DASH}</td>{/if}
                        {#if acts.some((a) => a.effort)}<td class="r num">{effortOf(actsOn(acts, f.date)) ?? DASH}</td>{/if}
                      </tr>
                    {/each}
                  </tbody>
                </table>
              </div>
            </section>
          {/if}

          <!-- 19.10.2026 «Strava-Fahrt vollständig» (answer 1a): each Strava activity of the trip opens its own page with all values -->
          {#if acts.length && day == null}
            <section class="rv-sec" aria-labelledby="ta-h" data-trip-acts>
              <div class="rv-h"><div><h2 id="ta-h">{t('Your activities from Strava')}</h2><p class="rv-sub">{t('a tap shows all values of the ride')}</p></div></div>
              <ul class="rv-box tacts">
                {#each acts as a (a.id)}
                  <li><a class="rv-row" href={actHref(a.id)} data-act-link={a.id}><span class="rv-m"><span class="rv-t">{stravaName(a.name) || t('1 activity')}</span><span class="rv-s num">{[a.day ? longDay(a.day) : '', a.km ? `${num(a.km)} km` : ''].filter(Boolean).join(' · ')}</span></span><ChevronRight class="rv-chev" size={18} aria-hidden="true" /></a></li>
                {/each}
              </ul>
            </section>
          {/if}

          <!-- plan against real -->
          {#if pvr.length && day == null}
            <section class="rv-sec" aria-labelledby="pvr-h">
              <div class="rv-h"><div><h2 id="pvr-h">{t('Plan and reality')}</h2>
                {#if timeRow}
                  {@const mins = Math.round(timeRow.diff * 60)}
                  <p class="rv-sub">{mins < 0 ? t('Your plan was {n} min off, in your favour.', { n: -mins }) : mins > 0 ? t('You needed {n} min more than planned.', { n: mins }) : t('Right on time, as planned.')}</p>
                {/if}</div></div>
              <div class="rv-box pad">
                <p class="legend"><i class="k pl"></i>{t('planned')} <i class="k re"></i>{t('ridden')}</p>
                <ul class="pvr">
                  {#each pvr as x (x.key)}
                    {@const top = Math.max(x.plan, x.real) || 1}
                    <li>
                      <span class="pl-l">{t(LABEL[x.key])}</span>
                      <span class="pl-b"><i class="pl" style:width="{(x.plan / top) * 100}%"></i><i class="re" style:width="{(x.real / top) * 100}%"></i></span>
                      <span class="pl-v num">{fmtV(x.key, x.plan)}<br />{fmtV(x.key, x.real)}</span>
                      <span class="pl-d num" class:good={good(x) === true} class:bad={good(x) === false}>{fmtD(x.key, x.diff)}</span>
                    </li>
                  {/each}
                </ul>
              </div>
            </section>
          {/if}
        </div>

        <div class="rv-col">
          <!-- SN2x: Zeitleiste (folded on a trip of several days until a day is chosen) -->
          {#snippet tlBody()}
            {#if tlShown.length}
              <ol class="tl">
                {#each tlShown as e, i (i)}
                  <li class="tle {e.kind}">
                    <span class="tw num">{clock(e.at)}{#if e.km != null}<small>km {num(Math.round(e.km))}</small>{/if}</span>
                    <span class="tnum" class:solid={e.kind === 'start' || e.kind === 'end'}>{e.n ?? ''}</span>
                    <span class="tbx">
                      {#if e.kind === 'start'}<b><Flag size={15} aria-hidden="true" />{t('Start')}</b>
                      {:else if e.kind === 'end'}<b><Flag size={15} aria-hidden="true" />{t('Arrival')}</b>
                      {:else if e.kind === 'pause'}<b><Coffee size={15} aria-hidden="true" />{t('Pause · {n} min', { n: num(e.min ?? 0) })}</b>
                      {:else if e.kind === 'best'}<b data-tl-best><Trophy size={15} aria-hidden="true" />{t(e.pr === 1 ? 'Best time|timeline' : e.pr === 2 ? '2nd best time|timeline' : '3rd best time|timeline')}</b><span>{e.name} · {mmss(e.s)}</span>
                      {:else if e.kind === 'climb'}<b data-tl-climb><Mountain size={15} aria-hidden="true" />{t('Climb|timeline')}</b><span>{[e.name, e.len ? `${num(e.len)} km` : '', e.grade ? `${num(e.grade)} %` : '', e.hm ? `${n0(e.hm)} Hm` : '', mmss(e.s)].filter(Boolean).join(' · ')}</span>
                      {:else if e.kind === 'photo'}<b><ImageIc size={15} aria-hidden="true" />{t('Photo')}</b><a class="tlph" href={e.url} target="_blank" rel="noopener noreferrer" data-tl-photo><img src={e.url} alt={e.caption || t('Photo from Strava')} loading="lazy" referrerpolicy="no-referrer" /></a>{#if e.caption}<span>{e.caption}</span>{/if}
                      {:else}<b><NotebookPen size={15} aria-hidden="true" />{t('Note')}</b><span>«{e.text}»</span>{#if e.photo}<span class="ph" aria-label={t('Photo')}><ImageIc size={18} aria-hidden="true" /></span>{/if}{/if}
                    </span>
                  </li>
                {/each}
              </ol>
              {#if shortN}<p class="rv-note pm">{tn(shortN, '{n} short pause under 5 min left out', '{n} short pauses under 5 min left out')}</p>{/if}
            {:else}
              <p class="quiet" data-quiet="timeline">{t('No timeline yet: it comes with a recorded ride or notes on the way.')}</p>
            {/if}
          {/snippet}
          {#snippet notesBody()}
            {#if dayNotes.length}
              <ul class="nl">
                {#each dayNotes as n, i (i)}
                  <li class="rv-row"><span class="rv-ic" aria-hidden="true"><NotebookPen size={18} /></span><span class="rv-m"><span class="rv-t">«{n.text}»</span><span class="rv-s num">{[n.at ? clock(n.at) : '', trip.days > 1 && n.day != null ? t('Day {n}', { n: n.day + 1 }) : '', n.km != null ? `km ${num(Math.round(n.km))}` : '', n.after ? t('after the trip') : ''].filter(Boolean).join(' · ')}</span></span></li>
                {/each}
              </ul>
            {:else}
              <p class="quiet" data-quiet="notes">{t('No notes on this trip.')}</p>
            {/if}
          {/snippet}
          {#if trip.days > 1 && day == null}
            <details class="fold" data-fold="timeline"><summary><span><b>{t('Timeline')}</b><small>{tlAll.length ? tn(tlAll.length, '{n} entry over the days · choose a day on top for its entries', '{n} entries over the days · choose a day on top for its entries') : t('nothing recorded')}</small></span><ChevronDown size={18} aria-hidden="true" /></summary><div class="fb">{@render tlBody()}</div></details>
            <details class="fold" data-fold="notes"><summary><span><b>{t('Notes')}</b><small>{tn(noteList.length, '{n} note with time and place', '{n} notes with time and place')}</small></span><ChevronDown size={18} aria-hidden="true" /></summary><div class="fb">{@render notesBody()}</div></details>
          {:else}
            <section class="rv-sec" aria-labelledby="tl-h" data-timeline>
              <div class="rv-h"><div><h2 id="tl-h">{t('Timeline')}</h2><p class="rv-sub">{day != null ? tn(tl.length, 'Day {day} · {n} entry', 'Day {day} · {n} entries', { day: day + 1 }) : t('Notes and pauses where they happened')}</p></div></div>
              <div class="rv-box pad">{@render tlBody()}</div>
            </section>
            <section class="rv-sec" aria-labelledby="nl-h" data-notes>
              <div class="rv-h"><div><h2 id="nl-h">{t('Notes')}</h2><p class="rv-sub">{tn(dayNotes.length, '{n} note with time and place', '{n} notes with time and place')}</p></div>{#if noteList.length}<button type="button" class="rv-more cp" onclick={copyNotes}><Copy size={16} aria-hidden="true" />{copied ? t('Copied') : t('Copy')}</button>{/if}</div>
              <div class="rv-box">{@render notesBody()}</div>
            </section>
          {/if}
        </div>
      </div>
      <!-- Noah 21.10.2026: Strava's «Übersicht», «Peak Power» and the map with the line, 1:1 per ride -->
      {#if rideActs.length}<RideOverviews acts={rideActs} {ftp} kg={w?.kg ?? null} bike={trip.bike ?? bike?.name ?? ''} {bikeOf} />{/if}
    </Group>

    <!-- 2 Körper und Leistung -->
    <Group key="body" title={titleOf(GROUPS[1])} line={lineOf.body} icon={ICON.body} open={!!open.body} ontoggle={(v) => toggle('body', v)}>
      <div class="rv-lay">
        <div class="rv-col">
          <!-- Touren c 70 «Gefühl vor den Zahlen»: how hard it felt, asked before the numbers; kept on the debrief -->
          <section class="rv-sec" aria-labelledby="feel-h" data-trip-feel>
            <div class="rv-h"><div><h2 id="feel-h">{t('How hard was it?')}</h2><p class="rv-sub">{t('your feeling, before the numbers')}</p></div></div>
            <div class="rv-box pad"><FeelScale value={d.feel ?? null} onpick={(n) => onpatch?.({ feel: n })} /></div>
          </section>
          {#if w}<HeartPower {values} zones={w.zones?.source ?? null} bike={meterBike || trip.bike || bike?.name || ''} {tempo} {power} {effort} {load} {efforts} {loads} mark={trip.id} {best} strava={acts.length > 0} sub={day != null ? t('Day {n} · from Strava · to look at, without rating', { n: day + 1 }) : ''} />{/if}
        </div>
        <div class="rv-col">
          <section class="rv-sec" aria-labelledby="mo-h" data-mood>
            <div class="rv-h"><div><h2 id="mo-h">{t('Mood and energy')}</h2><p class="rv-sub">{t('from your daily check · only to look at')}</p></div></div>
            {#if dayMoods.length}
              <ul class="rv-box">
                {#each dayMoods as m (m.date)}
                  <li class="rv-row mood"><span class="rv-m"><span class="rv-t">{trip.days > 1 ? `${t('Day {n}', { n: m.i + 1 })} · ${shortDay(m.date)}` : longDay(m.date)}</span></span>
                    {#if m.c.mood != null}<span class="mv"><small>{t('Mood')}</small>{@render dots(m.c.mood, t('Mood'))}</span>{/if}
                    {#if m.c.energy != null}<span class="mv"><small>{t('Energy')}</small>{@render dots(m.c.energy, t('Energy'))}</span>{/if}</li>
                {/each}
              </ul>
            {:else}
              <p class="quiet" data-quiet="mood"><Smile size={16} aria-hidden="true" />{t('No daily check on the days of this trip.')}</p>
            {/if}
            <!-- Noah 21.10.2026: mood and energy can be added afterwards (as answers of «Deine Abfragen») -->
            {#if !addMood}
              <button type="button" class="btn sm addm" onclick={() => (addMood = true)} data-mood-add>{dayMoods.length ? t('Change mood and energy') : t('Add mood and energy')}</button>
            {:else}
              <div class="rv-box pad moodform" data-mood-form>
                {#each Array.from({ length: Math.max(1, trip.days || 1) }, (_, i) => i).filter((i) => day == null || i === day) as i (i)}
                  {@const date = dateOf(i)}
                  <fieldset>
                    <legend>{trip.days > 1 ? `${t('Day {n}', { n: i + 1 })} · ${shortDay(date)}` : longDay(date)}</legend>
                    <label>{t('Mood')} <select value={draft[date]?.mood ?? ''} onchange={(e) => (draft = { ...draft, [date]: { ...draft[date], mood: e.currentTarget.value } })} data-mood-sel={date}><option value="">–</option>{#each Array.from({ length: 10 }, (_, n) => n + 1) as n (n)}<option value={String(n)}>{n}</option>{/each}</select></label>
                    <label>{t('Energy')} <select value={draft[date]?.energy ?? ''} onchange={(e) => (draft = { ...draft, [date]: { ...draft[date], energy: e.currentTarget.value } })} data-energy-sel={date}><option value="">–</option>{#each Array.from({ length: 10 }, (_, n) => n + 1) as n (n)}<option value={String(n)}>{n}</option>{/each}</select></label>
                  </fieldset>
                {/each}
                <p class="rv-note pm">{t('1 = very low, 10 = very high. Saved like an answer in «Deine Abfragen».')}</p>
                <div class="yn"><button type="button" class="btn sm" onclick={saveMoods} data-mood-save>{t('Save')}</button><button type="button" class="btn sm btn-link" onclick={() => ((addMood = false), (draft = {}))}>{t('Cancel')}</button></div>
              </div>
            {/if}
          </section>
          <!-- Noah 21.10.2026: the Fitbit values around the trip (sleep and resting heart rate the night before, the recovery after) -->
          {#if fit}
            <div class="fitbit has" data-fitbit-trip>
              {#if fit.before}<p data-fitbit-before><MoonStar size={16} aria-hidden="true" /><span>{t('Night before')}: {[fit.before.sleepMin != null ? t('{t} sleep', { t: sleepText(fit.before.sleepMin) }) : '', fit.before.restingHr != null ? t('resting heart rate {n}', { n: fit.before.restingHr }) : ''].filter(Boolean).join(' · ')}{#if fit.normal.restingHr != null}<small class="nrm">({t('your normal {n}', { n: Math.round(fit.normal.restingHr) })})</small>{/if}</span></p>{/if}
              {#each fit.after as x, i (x.date)}<p data-fitbit-after><HeartPulse size={16} aria-hidden="true" /><span>{t('Day {n} after', { n: i + 1 })}: {[x.restingHr != null ? t('resting heart rate {n}', { n: x.restingHr }) : '', x.sleepMin != null ? t('{t} sleep', { t: sleepText(x.sleepMin) }) : ''].filter(Boolean).join(' · ')}</span></p>{/each}
              <p class="src">{t('from Fitbit · only to look at')}</p>
            </div>
          {:else}
            <div class="fitbit" data-quiet="fitbit">
              <p><MoonStar size={16} aria-hidden="true" /><span>{t('No Fitbit values for the night before and the 2 days after.')} <a href="#/me/fitbit">{t('Fitbit')}</a></span></p>
            </div>
          {/if}
        </div>
      </div>
      <!-- «Auswertung wie Training» (Noah 20.10.2026): the analyses of the ride page for the trip's Strava rides, full width -->
      {#if dActs.some((a) => a.id != null)}{#await import('../training/act/ActAnalysesPick.svelte') then m}<m.default ids={dActs.map((a) => a.id)} />{:catch}{/await}{/if}
    </Group>

    <!-- 3 Unterwegs -->
    <Group key="way" title={titleOf(GROUPS[2])} line={lineOf.way} icon={ICON.way} open={!!open.way} ontoggle={(v) => toggle('way', v)}>
      <div class="rv-lay">
        <div class="rv-col">
          <section class="rv-sec" aria-labelledby="wx-h" data-weather>
            <div class="rv-h"><div><h2 id="wx-h">{t('Weather')}</h2><p class="rv-sub">{t('forecast and how it was')}</p></div></div>
            {#if (dayF ? dayF.tmin != null || dayF.wet != null : wxT.tmin != null || row?.rain?.wet != null) || d.weather || d.clothing || tempo.temp}
              <div class="rv-box wxw">
                <table class="wx">
                  <thead><tr><th scope="col"></th><th scope="col">{t('forecast')}</th><th scope="col">{t('how it was')}</th></tr></thead>
                  <tbody>
                    <tr><th scope="row"><Thermometer size={16} aria-hidden="true" />{t('Temperature')}</th><td>{dayF ? temps(dayF.tmin, dayF.tmax) : temps(wxT.tmin, wxT.tmax)}</td><td>{[d.weather ? t(WEATHER.find((x) => x.key === d.weather)?.name ?? '') : '', tempo.temp ? `Ø ${num(tempo.temp.avg)}°` : ''].filter(Boolean).join(' · ') || DASH}</td></tr>
                    <tr><th scope="row"><CloudSun size={16} aria-hidden="true" />{t('Rain|weather')}</th><td>{dayF ? (dayF.wet ? t('rain') : dayF.wet === false ? t('dry|weather') : DASH) : rainText(row?.rain, trip.days)}</td><td>{DASH}</td></tr>
                    {#if d.clothing}<tr><th scope="row"><Gauge size={16} aria-hidden="true" />{t('Clothing')}</th><td>{DASH}</td><td>{t(CLOTHING.find((x) => x.key === d.clothing)?.name ?? '')}</td></tr>{/if}
                  </tbody>
                </table>
                <p class="rv-note pm"><Info size={16} aria-hidden="true" /><span>{t('Forecast saved with the trip · how it was: your answer in the debrief')}</span></p>
              </div>
            {:else}
              <p class="quiet" data-quiet="weather">{t('No weather saved with this trip.')}</p>
            {/if}
          </section>
        </div>
        <div class="rv-col">
          <section class="rv-sec" aria-labelledby="fd-h" data-food>
            <div class="rv-h"><div><h2 id="fd-h">{t('Food and drink')}</h2><p class="rv-sub">{t('your answer in the debrief')}</p></div></div>
            {#if d.amount}
              <p class="rv-box rv-row one"><span class="rv-ic" aria-hidden="true"><Utensils size={18} /></span><span class="rv-m"><span class="rv-t">{t('Amount of food and drink')}</span></span><span class="rv-v">{t(AMOUNT.find((x) => x.key === d.amount)?.name ?? '')}</span></p>
            {:else}
              <p class="quiet">{t('No answer on food and drink.')}</p>
            {/if}
          </section>
        </div>
      </div>
    </Group>

    <!-- 4 Gepäck und Velo -->
    <Group key="pack" title={t(GROUPS[3].name)} line={lineOf.pack} icon={ICON.pack} open={!!open.pack} ontoggle={(v) => toggle('pack', v)}>
      <div class="rv-lay">
        <div class="rv-col">
          <!-- used and not used -->
          <section class="rv-sec" aria-labelledby="un-h">
            <div class="rv-h"><div><h2 id="un-h">{t('Not used')}</h2><p class="rv-sub num">{t('{used} of {total} items used', { used: usedN, total: totalN })}</p></div></div>
            <div class="rv-box">
              {#if unused.length}
                {#if counts.unusedG}<p class="save"><b class="num">−{formatWeight(counts.unusedG)}</b><span>{t('you can save')}{#if counts.unusedUnweighed}{' · '}{t('{n} not weighed', { n: counts.unusedUnweighed })}{/if}</span></p>{/if}
                <ul class="il">
                  {#each unused as e (e.itemId)}
                    {@const out = taken[e.itemId]}
                    {@const inTpl = !!tpl && inTemplate(tpl, e.itemId, items, w?.sets ?? [])}
                    {@const n = before[e.itemId] ?? 0}
                    <!-- SN2+ SN2f: «Aus Vorlage» per item; how often it was not used before -->
                    <li class="rv-row" class:out={!!out} data-unused={e.itemId}>
                      <span class="rv-ic" class:done={!!out} aria-hidden="true">{#if out}<Check size={18} />{:else}<Minus size={18} />{/if}</span>
                      <span class="rv-m"><span class="rv-t">{nameOf(byId[e.itemId])}</span>
                        {#if out}<span class="rv-s">{t('Taken out of «{tpl}» · stays in Material and on this trip', { tpl: tpl?.name ?? '' })}</span>
                        {:else if n}<span class="rv-s">{tn(n, 'also not used on {n} trip before', 'also not used on {n} trips before')}</span>
                        {:else if tpl && !inTpl}<span class="rv-s">{t('only on this trip, not in the template')}</span>
                        {:else if tpl}<span class="rv-s">{t('not used for the first time')}</span>{/if}
                      </span>
                      <span class="rv-v">{wOf(e) == null ? DASH : formatWeight(wOf(e))}</span>
                      {#if out}<button type="button" class="tq" onclick={() => undoTaken(e.itemId)}><Undo2 size={16} aria-hidden="true" />{t('Undo')}</button>
                      {:else if inTpl}<button type="button" class="btn tb" onclick={() => fromTemplate(e)} aria-label={t('Out of template: {item}', { item: nameOf(byId[e.itemId]) })}><Minus size={16} aria-hidden="true" />{t('Out of template')}</button>{/if}
                    </li>
                  {/each}
                </ul>
                {#if tpl}<p class="rv-note tn"><Lightbulb size={16} aria-hidden="true" /><span>{t('Each item on its own, nothing happens by itself. Only the template «{tpl}» changes; the next trip from it starts without the item.', { tpl: tpl.name })}</span></p>{/if}
                <!-- v0.47.2: the same idea across all trips is the Gear view «Nie gebraucht» -->
                <a class="rv-row" href="#/gear?view=never"><span class="rv-ic" aria-hidden="true"><Package size={18} /></span><span class="rv-m"><span class="rv-t">{t('All never used items in Gear')}</span></span><ChevronRight class="rv-chev" size={18} aria-hidden="true" /></a>
              {:else}
                <p class="rv-row empty">{t('Everything on the list was used.')}</p>
              {/if}
            </div>
          </section>
          {#if broken.length}
            <section class="rv-sec" aria-labelledby="br-h">
              <div class="rv-h"><div><h2 id="br-h">{t('Broken|debrief')}</h2><p class="rv-sub num">{num(broken.length)}</p></div></div>
              <ul class="rv-box">{#each broken as e (e.itemId)}<li class="rv-row"><span class="rv-ic" aria-hidden="true"><X size={18} /></span><span class="rv-m"><span class="rv-t">{nameOf(byId[e.itemId])}</span></span></li>{/each}</ul>
            </section>
          {/if}
          {#if d.missing?.length}
            <section class="rv-sec" aria-labelledby="ms-h">
              <div class="rv-h"><div><h2 id="ms-h">{t('Was missing')}</h2><p class="rv-sub num">{num(d.missing.length)}</p></div></div>
              <ul class="rv-box">{#each d.missing as m (m.id)}<li class="rv-row"><span class="rv-ic" aria-hidden="true"><Plus size={18} /></span><span class="rv-m"><span class="rv-t">{m.name}</span><span class="rv-s">{m.itemId ? t('in your gear') : t('on the wishlist')}</span></span></li>{/each}</ul>
            </section>
          {/if}
          <!-- SN2x U5: the list as it was packed -->
          {#if packed.length}
            <section class="rv-sec" aria-labelledby="pk-h" data-packed>
              <div class="rv-h"><div><h2 id="pk-h">{t('Packing list, as packed')}</h2><p class="rv-sub">{[tn(ptot.bags, '{n} bag', '{n} bags'), tn(ptot.n, '{n} item', '{n} items'), ptot.g ? kg(ptot.g) : ''].filter(Boolean).join(' · ')}</p></div></div>
              <ul class="rv-box">
                {#each packed as b (b.slot)}
                  <li><details class="pkb"><summary class="rv-row"><span class="rv-ic" aria-hidden="true"><Briefcase size={18} /></span><span class="rv-m"><span class="rv-t">{t(b.name)}</span><span class="rv-s">{b.items.map((x) => nameOf(x) + (x.qty > 1 ? ` × ${x.qty}` : '')).join(', ')}</span></span><span class="rv-v">{b.g != null ? kg(b.g) : DASH}</span><ChevronRight class="rv-chev" size={18} aria-hidden="true" /></summary>
                    <ul class="pki">{#each b.items as x (x.id)}<li><span>{nameOf(x)}{x.qty > 1 ? ` × ${x.qty}` : ''}</span><span class="num">{x.g != null ? formatWeight(x.g) : DASH}</span></li>{/each}</ul></details></li>
                {/each}
              </ul>
              <p class="rv-note"><Lightbulb size={16} aria-hidden="true" /><span>{d.packed ? t('As it was packed. The list stays fixed, also when you change gear or the template later.') : t('From the trip and your gear today.')}</span></p>
            </section>
          {/if}
        </div>
        <div class="rv-col">
          <!-- SN2x: the bike after the trip (the same words as the bike care tile) -->
          {#if d.kmApplied || left != null}
            <section class="rv-sec" aria-labelledby="bk-h" data-bike-after>
              <div class="rv-h"><div><h2 id="bk-h">{t('Bike after the trip')}</h2></div></div>
              <div class="rv-box">
                {#if left != null}<a class="rv-row" href="#/bikes?tab=care"><span class="rv-ic" aria-hidden="true"><Wrench size={18} /></span><span class="rv-m"><span class="rv-t">{left > 0 ? t('Chain: {km} km to waxing', { km: num(left) }) : t('Chain: waxing due')}</span><span class="rv-s">{[bike?.name ?? '', d.kmApplied ? t('{km} km added', { km: num(d.kmApplied) }) : '', bike?.km != null ? t('now {km} km', { km: num(bike.km) }) : '', t('Bike care')].filter(Boolean).join(' · ')}</span></span><ChevronRight class="rv-chev" size={18} aria-hidden="true" /></a>
                {:else}<p class="rv-row"><span class="rv-ic" aria-hidden="true"><Bike size={18} /></span><span class="rv-m"><span class="rv-t">{bike?.name ? t('{km} km added to {bike}', { km: num(d.kmApplied), bike: bike.name }) : t('{km} km added to the bike', { km: num(d.kmApplied) })}</span>{#if bike?.km != null}<span class="rv-s">{t('now {km} km', { km: num(bike.km) })}</span>{/if}</span></p>{/if}
              </div>
            </section>
          {/if}
          <!-- SN2x U2: what the trip added to the parts -->
          {#if wear.length}
            <section class="rv-sec" aria-labelledby="wr-h" data-wear>
              <div class="rv-h"><div><h2 id="wr-h">{t('Wear|parts')}</h2><p class="rv-sub">{t('{bike} · added with this trip', { bike: bike?.name ?? '' })}</p></div><a class="rv-more" href="#/bikes?tab=care">{t('Bike care')}<ChevronRight size={16} aria-hidden="true" /></a></div>
              <ul class="rv-box">
                {#each wear as x (x.key)}
                  <li class="rv-row" data-wear-part={x.key}><span class="rv-ic" aria-hidden="true"><Gauge size={18} /></span><span class="rv-m"><span class="rv-t">{t(WEAR[x.key])}</span>{#if x.nowKm != null}<span class="rv-s">{t('now {km} km', { km: num(x.nowKm) })}</span>{/if}</span><span class="rv-v num">{x.addKm != null ? `+${num(x.addKm)} km` : `+${num(x.addHm)} Hm`}</span></li>
                {/each}
              </ul>
              <p class="rv-note"><Info size={16} aria-hidden="true" /><span>{t('Counts the km and climbing of this trip to the parts of the bike. You record a change in bike care.')}</span></p>
            </section>
          {/if}
        </div>
      </div>
    </Group>

    <!-- 5 Weiter -->
    <Group key="next" title={t(GROUPS[4].name)} line={lineOf.next} icon={ICON.next} open={!!open.next} ontoggle={(v) => toggle('next', v)}>
      <div class="rv-lay">
        <div class="rv-col">
          <NextTime {points} debrief={d} {hits} onchange={savePoints} />
          <section class="rv-sec" aria-labelledby="ln-h">
            <div class="rv-h"><div><h2 id="ln-h">{t('Learned|review')}</h2><p class="rv-sub num">{tn(row?.learnings.length ?? 0, '{n} learning', '{n} learnings')}</p></div><a class="rv-more" href="#/debrief/learnings">{t('All learnings')}<ChevronRight size={16} aria-hidden="true" /></a></div>
            <ul class="rv-box">
              {#each row?.learnings ?? [] as l (l.id)}<li class="rv-row"><span class="rv-ic" aria-hidden="true"><Lightbulb size={18} /></span><span class="rv-m"><span class="rv-t">{l.rule}</span>{#if l.topic}<span class="rv-s">{t(l.topic)}</span>{/if}</span></li>
              {:else}<li class="rv-row empty">{t('No learning from this trip.')}</li>{/each}
            </ul>
          </section>
          <!-- what it means for the next trip -->
          <section class="rv-sec nextc" aria-labelledby="nx-h">
            <div class="rv-h"><div><h2 id="nx-h">{next ? t('Works on the next trip') : t('What it means for the next trip')}</h2>{#if next}<p class="rv-sub">{[next.title, dates(next.startDate, tripEnd(next)), next.bike].filter(Boolean).join(' · ')}</p>{/if}</div></div>
            <ul class="rv-box">
              {#each hints as h, i (i)}
                <li class="rv-row">
                  <span class="rv-ic {h.kind}" aria-hidden="true">{#if h.kind === 'unused'}<Minus size={18} />{:else if h.kind === 'broken'}<Wrench size={18} />{:else if h.kind === 'missing'}<Plus size={18} />{:else}<Lightbulb size={18} />{/if}</span>
                  <span class="rv-m"><span class="rv-t">{h.item ? nameOf(h.item) : h.text}</span><span class="rv-s">{h.kind === 'unused' ? t('Packed again for {trip}, not used this time', { trip: next.title }) : h.kind === 'missing' ? (h.packed ? t('Was missing; it is on the next list') : t('Was missing')) : t(DAYKIND[h.kind])}</span></span>
                </li>
              {:else}
                <li class="rv-row empty">{t('Nothing to change: the trip went as planned.')}</li>
              {/each}
            </ul>
          </section>
          <!-- Impeccable Runde 2 (Rückblick einer Tour 3): «Weiter» ends with one clear button (was the row «Packliste {Tour}») -->
          <p class="goon" data-go-next>
            {#if next}<Btn label={t('To the next trip: {name}', { name: next.title })} href="#/pack" onclick={() => openTrip(next.id)} />
            {:else}<Btn label={t('Plan the next trip')} onclick={() => newTrip('last')} />{/if}
          </p>
        </div>
        <div class="rv-col">
          <!-- SN2x (answer 4): the comparison only inside one of five groups, km and Hm each ±20 % -->
          {#if group}
            <section class="rv-sec" aria-labelledby="cp-h" data-compare>
              <div class="rv-h"><div><h2 id="cp-h">{t('Comparison')}</h2>{#if other}<p class="rv-sub">{[other.title, dates(other.start, other.end), other.bike, `${n0(other.km)} km`, `${n0(other.gainM)} Hm`].filter(Boolean).join(' · ')}</p>{/if}</div>
                {#if similar.length > 1}<label class="pick"><span class="sr">{t('Choose another trip')}</span><select class="sel" value={other?.id} onchange={(e) => (otherId = e.currentTarget.value)}>{#each similar as r (r.id)}<option value={r.id}>{r.title} · {dates(r.start, r.end)}</option>{/each}</select></label>{/if}</div>
              <div class="rv-box pad">
                <p class="grp-in" data-compare-group><ArrowLeftRight size={16} aria-hidden="true" /><span>{t('compared in:')} <b>{groupName(group)}</b></span></p>
                {#if other && cmp.length}
                  <table class="cmp">
                    <thead><tr><th scope="col"></th><th scope="col" class="r">{t('this trip')}</th><th scope="col" class="r">{other.title}</th><th scope="col" class="r">{t('Difference')}</th></tr></thead>
                    <tbody>{#each cmp as c (c.key)}<tr><th scope="row">{t(CMP_LABEL[c.key])}</th><td class="r num"><b>{cmpV(c.key, c.a)}</b></td><td class="r num">{cmpV(c.key, c.b)}</td><td class="r num"><span class="df">{cmpD(c.key, c.diff)}</span></td></tr>{/each}</tbody>
                  </table>
                {:else if other}
                  <p class="quiet">{t('Not enough numbers on both trips to compare.')}</p>
                {:else}
                  <p class="quiet" data-quiet="compare">{t('No similar trip in {group} yet (km and climbing each within 20 %).', { group: groupName(group) })}</p>
                {/if}
                <p class="rv-note pm"><Info size={16} aria-hidden="true" /><span>{t('Compared only within the same group, with distance and climbing each at most 20 % apart. 5 groups: Bikepacking (with any bike) and each of your bikes.')}</span></p>
              </div>
            </section>
          {/if}
        </div>
      </div>
    </Group>
  </div>
</div>
{#if note}<UndoToast text={note.text} onundo={() => undoTaken(note.itemId)} />{/if}

<style>
  .saved {
    margin-top: 6px;
  }
  /* SN2x: the day switch and the groups */
  .dayswitch {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 4px;
    margin: 0 0 16px;
    padding: 4px;
    border-radius: var(--r-ctl);
    background: var(--paper-2);
    width: fit-content;
    max-width: 100%;
  }
  .dsb {
    min-height: 44px;
    padding: 0 14px;
    border: 0;
    border-radius: calc(var(--r-ctl) - 2px);
    background: none;
    color: var(--ink-2);
    font: 500 var(--fs-small) var(--font-body);
    cursor: pointer;
  }
  .dsb[aria-pressed='true'] {
    background: var(--paper);
    color: var(--ink);
    box-shadow: 0 0 0 1px var(--line);
  }
  .dsn {
    padding: 0 8px;
    color: var(--ink-3);
    font-size: var(--fs-tiny);
  }
  .groups {
    display: grid;
    gap: 14px;
  }
  .kick.top {
    display: flex;
    align-items: center;
    gap: 6px;
    margin: 0 0 4px;
  }
  .prof {
    margin-top: 12px;
  }
  .pm {
    margin-top: 10px;
    padding: 0;
  }
  .quiet {
    display: flex;
    align-items: center;
    gap: 8px;
    margin: 0;
    padding: 0 4px;
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .ddw,
  .wxw {
    padding: 4px 16px 12px;
    overflow-x: auto;
  }
  table.dd,
  table.wx,
  table.cmp {
    width: 100%;
    border-collapse: collapse;
    font-size: var(--fs-small);
  }
  .dd th,
  .dd td,
  .wx th,
  .wx td,
  .cmp th,
  .cmp td {
    padding: 8px 6px;
    border-top: 1px solid var(--line);
    text-align: left;
    vertical-align: middle;
  }
  .dd thead th,
  .wx thead th,
  .cmp thead th {
    border-top: 0;
    color: var(--ink-3);
    font-weight: 500;
  }
  .dd .r,
  .cmp .r {
    text-align: right;
  }
  .dd tbody th {
    min-width: 9.5em;
  }
  .dd tbody th small {
    display: block;
    color: var(--ink-3);
    font-weight: 400;
  }
  .dlink {
    min-height: 44px;
    padding: 0;
    border: 0;
    background: none;
    color: var(--ink);
    font: 600 var(--fs-small) var(--font-body);
    text-align: left;
    text-decoration: underline;
    text-underline-offset: 3px;
    cursor: pointer;
  }
  .wx tbody th {
    display: flex;
    align-items: center;
    gap: 6px;
    font-weight: 500;
  }
  .wx :global(svg) {
    color: var(--ink-3);
  }
  .df {
    display: inline-block;
    padding: 1px 8px;
    border-radius: 999px;
    background: var(--paper-2);
  }
  .grp-in {
    display: flex;
    align-items: center;
    gap: 8px;
    margin: 0 0 6px;
    font-size: var(--fs-small);
  }
  .pick .sel {
    min-height: 44px;
    max-width: 16em;
  }
  .tl {
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .tle {
    display: grid;
    grid-template-columns: 3.6em 26px minmax(0, 1fr);
    gap: 10px;
    padding: 8px 0;
  }
  .tw {
    text-align: right;
    font-weight: 600;
  }
  .tw small {
    display: block;
    color: var(--ink-3);
    font-size: var(--fs-tiny);
    font-weight: 400;
  }
  .tnum {
    display: grid;
    place-items: center;
    width: 24px;
    height: 24px;
    border: 1.5px solid var(--ink);
    border-radius: 50%;
    font-size: var(--fs-tiny);
    font-weight: 600;
  }
  .tnum:empty {
    border-color: var(--line);
  }
  .tnum.solid {
    background: var(--ink);
    color: var(--paper);
  }
  .tbx {
    display: grid;
    gap: 2px;
    min-width: 0;
    overflow-wrap: break-word;
  }
  .tbx b {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-weight: 500;
  }
  .tbx > span {
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  /* a Strava photo where it was taken */
  .tlph {
    display: block;
    width: min(100%, 220px);
    margin-top: 4px;
    overflow: hidden;
    border-radius: 8px;
    background: var(--paper-2);
  }
  .tlph img {
    display: block;
    width: 100%;
    height: 140px;
    object-fit: cover;
  }
  .ph {
    display: grid;
    place-items: center;
    width: 56px;
    height: 56px;
    margin-top: 4px;
    border-radius: 8px;
    background: var(--paper-2);
    color: var(--ink-3);
  }
  .nl {
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .cp {
    min-height: 44px;
    gap: 6px;
    border: 0;
    background: none;
    cursor: pointer;
    font-family: inherit;
  }
  .fold {
    border: 1px solid var(--card-line);
    border-radius: var(--radius-card);
    background: var(--paper);
  }
  .fold summary {
    display: flex;
    align-items: center;
    gap: 10px;
    min-height: 56px;
    padding: 8px 16px;
    cursor: pointer;
    list-style: none;
  }
  .fold summary::-webkit-details-marker {
    display: none;
  }
  .fold summary > span {
    flex: 1;
    display: grid;
  }
  .fold summary small {
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .fold .fb {
    padding: 0 16px 12px;
  }
  .mood {
    flex-wrap: wrap;
  }
  .mv {
    display: grid;
    gap: 2px;
  }
  .mv small {
    color: var(--ink-3);
    font-size: var(--fs-tiny);
  }
  .dots {
    display: inline-flex;
    gap: 3px;
  }
  .dots i {
    width: 8px;
    height: 8px;
    border: 1px solid var(--ink-3);
    border-radius: 50%;
  }
  .dots i.on {
    background: var(--ink-2);
    border-color: var(--ink-2);
  }
  .fitbit {
    display: grid;
    gap: 6px;
    padding: 12px 14px;
    border: 1px dashed var(--line-strong);
    border-radius: var(--radius-card);
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .fitbit p {
    display: flex;
    align-items: flex-start;
    gap: 8px;
    margin: 0;
  }
  .fitbit :global(svg) {
    flex: none;
    margin-top: 2px;
  }
  .fitbit.has {
    border-style: solid;
    border-color: var(--card-line);
    background: var(--paper);
    color: var(--ink);
  }
  .fitbit .src,
  .fitbit small {
    color: var(--ink-2);
  }
  .nrm {
    margin-left: 0.3em;
  }
  .addm {
    justify-self: start;
    min-height: 44px;
    margin-top: 8px;
  }
  .moodform {
    display: grid;
    gap: 10px;
    margin-top: 8px;
  }
  .moodform fieldset {
    display: flex;
    flex-wrap: wrap;
    gap: 8px 16px;
    margin: 0;
    padding: 0;
    border: 0;
  }
  .moodform legend {
    padding: 0 0 4px;
    font-weight: 600;
  }
  .moodform label {
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .moodform select {
    min-height: 44px;
  }
  .moodform .yn {
    display: flex;
    gap: 8px;
  }
  .one {
    margin: 0;
  }
  .pkb summary {
    list-style: none;
    cursor: pointer;
  }
  .pkb summary::-webkit-details-marker {
    display: none;
  }
  .pkb[open] :global(.rv-chev) {
    transform: rotate(90deg);
  }
  .pki {
    margin: 0 0 8px 48px;
    padding: 0;
    list-style: none;
    font-size: var(--fs-small);
  }
  .pki li {
    display: flex;
    justify-content: space-between;
    gap: 10px;
    padding: 4px 0;
    color: var(--ink-2);
  }
  .goon {
    display: flex;
    justify-content: flex-end;
    margin: 16px 0 0;
    min-width: 0;
  }
  /* a long trip name wraps instead of widening the page */
  .goon :global(.btn) {
    max-width: 100%;
    white-space: normal;
    text-align: center;
    overflow-wrap: break-word;
  }
  @media (max-width: 719px) {
    .goon :global(.btn) {
      width: 100%;
      justify-content: center;
    }
  }
  .hero {
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .hmore {
    margin-left: auto;
  }
  .hero h2 {
    margin: 0;
    font: 600 var(--fs-sub) / 1.3 var(--font-body);
    overflow-wrap: break-word;
  }
  .savedline {
    margin: 4px 0 0;
    color: var(--ink-2);
    font-size: var(--fs-small);
    font-weight: 600;
  }
  .kick {
    margin: 6px 0 0;
    color: var(--ink-3);
    font-size: var(--fs-small);
    overflow-wrap: break-word;
  }
  .big {
    margin: 4px -16px 0;
  }
  .big div {
    display: flex;
    flex-direction: column;
  }
  .big dd,
  .big dt {
    margin: 0;
  }
  .facts {
    display: flex;
    flex-wrap: wrap;
    gap: 6px 16px;
    list-style: none;
    margin: 0;
    padding: 0;
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .facts li {
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }
  .facts :global(svg) {
    color: var(--ink-3);
  }
  .special {
    display: flex;
    gap: 10px;
    margin: 12px 0 0;
    padding: 10px 12px;
    border-radius: var(--r-ctl);
    background: var(--hi-soft);
    overflow-wrap: break-word;
  }
  .special :global(svg) {
    flex: none;
    color: var(--hi);
  }
  /* Impeccable: the open suggestions, one row each, the two answers on the right (below on the phone) */
  .sugs {
    scroll-margin-top: 80px;
  }
  .sugs:focus {
    outline: none;
  }
  .sg {
    flex-wrap: wrap;
    row-gap: 8px;
  }
  .sg .rv-m {
    flex: 1 1 14em;
  }
  .sg .rv-ic {
    align-self: flex-start;
  }
  .yn {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-left: auto;
  }
  .yn .btn {
    min-height: 44px;
  }
  .sgmore {
    justify-content: flex-end;
  }
  .legend {
    display: flex;
    align-items: center;
    gap: 6px;
    margin: 0 0 6px;
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .legend .k {
    display: inline-block;
    width: 16px;
    height: 4px;
    border-radius: 2px;
  }
  .legend .k.re {
    margin-left: 10px;
  }
  .pl {
    background: var(--line-strong);
  }
  .re {
    background: var(--hi);
  }
  .pvr {
    list-style: none;
    margin: 0;
    padding: 0;
  }
  .pvr li {
    display: grid;
    grid-template-columns: minmax(0, 7em) minmax(0, 1fr) auto 4em;
    align-items: center;
    gap: 12px;
    min-height: 56px;
    padding: 6px 0;
    border-top: 1px solid var(--line);
  }
  @media (max-width: 559px) {
    .pvr li {
      grid-template-columns: minmax(0, 1fr) auto 3.6em;
    }
    .pl-b {
      grid-column: 1 / -1;
      grid-row: 2;
    }
  }
  .pl-l {
    overflow-wrap: break-word;
    min-width: 0;
  }
  .pl-b {
    display: grid;
    gap: 4px;
  }
  .pl-b i {
    display: block;
    height: 5px;
    border-radius: 3px;
  }
  .pl-v {
    color: var(--ink-2);
    font-size: var(--fs-small);
    text-align: right;
  }
  .pl-d {
    font-weight: 600;
    text-align: right;
  }
  .pl-d.good {
    color: var(--ok);
  }
  .pl-d.bad {
    color: var(--warn);
  }
  .save {
    display: flex;
    align-items: baseline;
    flex-wrap: wrap;
    gap: 4px 10px;
    margin: 0;
    padding: 12px 0 6px;
  }
  .save b {
    font: 700 var(--fs-section) / 1.1 var(--font-body);
    color: var(--ink);
  }
  .save span {
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .il {
    list-style: none;
    margin: 0;
    padding: 0;
  }
  .il li + li,
  .il + .rv-row,
  .save + .il {
    border-top: 1px solid var(--line);
  }
  .rv-row.empty {
    margin: 0;
    color: var(--ink-3);
  }
  p.rv-row {
    margin: 0;
  }
  /* SN2+ SN2f: «Aus Vorlage» and the row after it */
  .il .rv-row {
    flex-wrap: wrap;
  }
  .il .rv-m {
    flex: 1 1 140px;
  }
  .tb {
    flex: none;
    min-height: 44px;
    gap: 6px;
  }
  .tq {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    flex: none;
    min-height: 44px;
    padding: 0 4px;
    border: 0;
    background: none;
    color: var(--ink);
    font: 500 var(--fs-small) var(--font-body);
    text-decoration: underline;
    text-underline-offset: 3px;
    cursor: pointer;
  }
  .rv-ic.done {
    background: var(--ok-soft);
    color: var(--ok);
  }
  .tn {
    padding: 10px 0 4px;
    border-top: 1px solid var(--line);
  }
  @media (max-width: 559px) {
    table.dd {
      min-width: 36em;
    }
    .il .tb,
    .il .tq {
      margin-left: 48px;
    }
    .dayswitch {
      width: auto;
    }
    .tle {
      grid-template-columns: 3.2em 26px minmax(0, 1fr);
      gap: 8px;
    }
  }
  .rv-ic.broken,
  .rv-ic.unused {
    background: var(--warn-soft);
  }
</style>
