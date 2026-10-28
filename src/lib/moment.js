/**
 * «Heute als Begleiter» PR 1 (Noah 28.10.2026 «1a 2a 3a» and «ok freigabe», thread «Liste aller
 * Funktionen»): the moment you are in. Today will show it as one card with one next step (PR 4), a
 * function to discover that fits it (PR 5), and «Was die App kann» sorts every function by it (PR 6).
 *
 * Eight moments: the trip loop (Lust › Planen › Packen › Unterwegs › Zurück) and three that are always
 * there (Velo und Material, Körper und Training, Alltag und Woche). Functions that belong to no moment
 * (data, help, language) sit in the base 'app'.
 *
 * momentOf() checks the rules from top to bottom; the first that fits wins. Pure functions (no
 * database, no screen), tested in tests/moment.test.js. Dates are YYYY-MM-DD (localday.js).
 */
import { tripPhase, packingDay, daysFrom, PACK_DAYS } from './phase.js';
import { tripEnd } from './tripstate.js';
import { DAY_CLOCK } from './dayclock.js';

/** The eight moments, in the order of the trip loop, then the three that are always there. */
export const MOMENTS = ['lust', 'planen', 'packen', 'unterwegs', 'zurueck', 'velo', 'koerper', 'alltag'];
/** The trip loop (the strip «Lust › Planen › Packen › Unterwegs › Zurück»). */
export const LOOP = ['lust', 'planen', 'packen', 'unterwegs', 'zurueck'];
/** Functions of no moment: data, help, look, language. */
export const BASE = 'app';

/** A trip with a date this many days ahead counts as «Tour planen». */
export const PLAN_DAYS = 14;
/** A debrief stays the moment this many days after the end. */
export const BACK_DAYS = 14;
/** «Alltag und Woche» on Sunday from this hour (plan the week). */
export const WEEK_HOUR = 17;

/**
 * The moment now. state:
 * - today: YYYY-MM-DD; hour: 0–23; weekday: 0 (Sunday) … 6
 * - trips: the trips Today works with (heute.js homeTrips: no archived, no test trips)
 * - debriefDone(trip): true when its debrief is saved (optional)
 * - careDue: bike care points due now; inbox: things waiting in the inbox
 * - packDays: «Eigene Werte» packDays (optional, else PACK_DAYS)
 * Returns { key, trip, rule } with rule = the number of the rule that fitted (1–8).
 */
export function momentOf({ today, hour = 12, weekday = 3, trips = [], debriefDone = () => false, careDue = 0, inbox = 0, packDays = PACK_DAYS } = {}) {
  const live = (trips ?? []).filter((x) => x && !x.skipped);
  const phase = (x) => tripPhase(x, today, { debriefDone: !!debriefDone(x) });
  const soonest = (list) => [...list].sort((a, b) => String(a.startDate).localeCompare(String(b.startDate)))[0] ?? null;

  // 1 Unterwegs: a trip runs today (its start day while still packing counts as Packen)
  const during = soonest(live.filter((x) => phase(x) === 'during' && !packingDay(x, today)));
  if (during) return { key: 'unterwegs', trip: during, rule: 1 };

  // 2 Zurück: a trip is over and its debrief is open, at most BACK_DAYS after the end
  const back = live
    .filter((x) => phase(x) === 'after' && daysFrom(tripEnd(x), today) <= BACK_DAYS)
    .sort((a, b) => String(tripEnd(b)).localeCompare(String(tripEnd(a))))[0];
  if (back) return { key: 'zurueck', trip: back, rule: 2 };

  // 3 Packen: a trip starts in packDays days or less, or packing has begun
  const ahead = live.filter((x) => x.startDate && (phase(x) === 'before' || packingDay(x, today)));
  const packing = soonest(ahead.filter((x) => daysFrom(today, x.startDate) <= packDays || (x.entries ?? []).some((e) => e.packed)));
  if (packing) return { key: 'packen', trip: packing, rule: 3 };

  // 4 Tour planen: a trip with a date in the next PLAN_DAYS days
  const planned = soonest(ahead.filter((x) => daysFrom(today, x.startDate) <= PLAN_DAYS));
  if (planned) return { key: 'planen', trip: planned, rule: 4 };

  // 5 Velo und Material: bike care is due (no trip within packDays, else rule 3 had fitted)
  if (careDue > 0) return { key: 'velo', trip: null, rule: 5 };

  // 6 Alltag und Woche: Sunday from WEEK_HOUR, or something waits in the inbox
  if ((weekday === 0 && hour >= WEEK_HOUR) || inbox > 0) return { key: 'alltag', trip: null, rule: 6 };

  // 7 Körper und Training: the morning (06–11) with no trip in sight
  if (hour >= DAY_CLOCK.morning && hour < DAY_CLOCK.day) return { key: 'koerper', trip: null, rule: 7 };

  // 8 Lust und Ideen: no trip in the next PLAN_DAYS days
  return { key: 'lust', trip: null, rule: 8 };
}

/** Where a moment stands in the trip loop: { done: keys before it, now, next } (null outside the loop). */
export function loopOf(key) {
  const i = LOOP.indexOf(key);
  if (i < 0) return null;
  return { done: LOOP.slice(0, i), now: key, next: LOOP[i + 1] ?? null };
}

/**
 * The moment of every function of the catalogue (features.js), from the map of 28.10.2026
 * (/mnt/project-files/notes/landkarte/moments.json, checked by hand). A new function goes in the
 * list of its moment; tests/moment.test.js fails when one is missing or listed twice.
 */
export const FEATURE_MOMENTS = {
  // Lust und Ideen
  lust: [
    'dayride', 'f.quickstart', 'f.inspiration', 'f.skiseason', 'f.dreams', 'f.whitespots', 'f.races',
    'f.ownbingo', 'f.impulse', 'f.compass', 'f.freeslot',
  ],
  // Tour planen
  planen: [
    'f.racecheck', 'homeweather', 'f.plan', 'f.tripstate', 'f.assistent', 'f.ask', 'f.sports', 'f.travel',
    'f.komoot', 'f.tripcompare', 'f.snow', 'f.skiplan', 'f.swissmap', 'f.sosqr', 'f.scales', 'f.race',
    'f.racesample', 'f.racemap', 'f.climbs', 'f.mapoffline', 'f.sleeplists', 'f.nightswx', 'f.abroad',
    'f.mapmeasure', 'f.wxwatch', 'f.fuel', 'f.sleeporigin', 'f.devil', 'f.nogos', 'f.energy', 'f.gpxstops',
    'f.weather', 'f.webcams', 'f.air',
  ],
  // Packen
  packen: [
    'f.remindtime', 'blocks', 'templates', 'gpx', 'wxsuggest', 'f.packblocks', 'f.onion', 'f.shop',
    'f.ballast', 'f.tripbike', 'f.switch', 'f.blockcheck', 'f.packcleanup', 'f.planb', 'f.daysports',
    'f.unclear', 'f.border', 'f.ruleuntil', 'f.itemstories', 'f.intent', 'f.checkin', 'f.packtwo',
    'f.laundry', 'f.morninglist', 'f.packtime', 'f.rwgps', 'f.starters', 'f.packside', 'f.ownrules',
    'f.forgotten', 'f.newpack', 'f.power', 'f.packphoto', 'f.tourhints', 'f.routepois', 'f.tripalert',
    'f.quiz', 'f.probe', 'f.blockeffect', 'f.needs', 'f.weightsure', 'f.sharepreview', 'bags', 'share',
    'f.tripcheck', 'f.readytomorrow', 'f.readaloud', 'f.offlinesave', 'f.labels',
  ],
  // Unterwegs
  unterwegs: [
    'ride', 'f.basecheck', 'f.dayblocks', 'f.evening', 'f.ridenote', 'f.finish', 'f.trainhome', 'f.handlebar',
    'f.glove', 'f.eatremind', 'f.checklater', 'f.placenote', 'f.departsheet', 'f.komoottour',
    'f.routeconvert', 'f.waterfood', 'f.ready', 'f.listentip', 'f.skyplaces', 'f.housecheck', 'f.flatsitter',
    'f.arrived', 'f.goodnight', 'f.parked', 'f.sos', 'f.webcammap', 'f.reroute', 'f.live', 'f.livepause',
    'f.sensors', 'f.datapages', 'f.turns', 'f.laps', 'f.moreplaces', 'f.ovnear', 'f.groupmap', 'f.stopsnear',
    'f.sleeptonight', 'f.callhotels', 'f.powernap', 'f.here', 'f.record', 'f.money', 'f.light', 'f.rainsoon',
    'f.arrival',
  ],
  // Zurück und lernen
  zurueck: [
    'debrief', 'learn', 'pace', 'trend', 'f.breakdown', 'f.daylisten', 'f.usedbook', 'f.sleepspots',
    'f.postcard', 'f.unneeded', 'f.missing', 'f.upload', 'f.past', 'f.logbook', 'f.learnings', 'f.best',
    'f.spurmap', 'f.spurlink', 'f.travelbook', 'f.tripcosts', 'f.tourpage', 'f.diary', 'f.extraq',
    'f.notetodo', 'f.future', 'f.chronik', 'f.gelernt', 'f.jahr', 'f.neuland', 'f.heatmap', 'f.eveningtour',
    'f.homecoming', 'f.letters', 'f.letterreply', 'f.meaning', 'f.gooddecisions', 'f.knowhow', 'f.skillmap',
  ],
  // Velo und Material
  velo: [
    'weigh', 'fav', 'wish', 'unused', 'f.wardrobe', 'f.kit', 'f.lighter', 'f.select', 'f.ownviews', 'f.merge',
    'f.gearimport', 'f.powervalues', 'f.barcode', 'event', 'f.supplies', 'setup', 'care', 'order', 'receipt',
    'km', 'f.kmimport', 'f.strava', 'f.velosetup', 'f.standardbike', 'f.bagplan', 'f.bagsetups', 'f.setuplog',
    'f.garmin', 'f.problem', 'f.workshop', 'f.equipment', 'f.bikecompare', 'f.folder', 'f.breakin',
    'f.repairkit', 'f.warranty', 'f.theft', 'f.partstart', 'f.prep', 'f.skiequipment', 'f.bikeservice',
    'f.parttemplate', 'f.spick', 'f.partwear', 'f.wetchain', 'f.chainmeasure', 'f.bikeyear', 'f.bikeseason',
    'f.noises', 'f.carestreak', 'f.wearcal', 'f.wearphotos', 'f.sellbike', 'f.bikebox', 'f.sparestock',
    'f.brandkm', 'f.springservice', 'f.chainrotation', 'f.velofaq', 'f.setupphotos', 'f.inspect', 'f.measure',
    'f.gears', 'f.level', 'f.sitpos', 'f.pros', 'f.table', 'f.lend',
  ],
  // Körper und Training
  koerper: [
    'f.tick', 'f.check', 'f.stopwatch', 'f.sportpage', 'f.progress', 'f.mosaic', 'f.sportextras', 'f.goals',
    'f.yeargoals', 'f.abfragen', 'f.stravaticks', 'f.lake', 'f.datastars', 'f.training', 'f.form',
    'f.overview', 'f.trainplans', 'f.feel', 'f.analyses', 'f.weekreview', 'f.milestones', 'f.meditation',
    'f.medlog', 'f.medreview', 'f.gipfelbuch', 'f.routine', 'f.insights', 'f.timer', 'f.medmore',
    'f.parkdays', 'f.tennistop', 'f.yogaclasses', 'f.ownbody', 'f.observations', 'f.ridepage', 'f.tickreview',
    'f.experiment', 'f.specialdays', 'f.counterdays', 'f.laterview', 'f.freerewards', 'f.tworoles',
    'f.scalemeaning', 'f.bodytalk', 'f.weight', 'f.wohl', 'f.weighin', 'f.goodday', 'f.fitbit',
  ],
  // Alltag und Woche
  alltag: [
    'f.wear', 'f.morningpush', 'note', 'f.icepush', 'f.weekplan', 'f.frei', 'f.journal', 'f.voiceletters',
    'f.remember', 'f.reminders', 'f.birthdays', 'f.shopping', 'f.cook', 'f.contracts', 'f.people', 'f.inbox',
    'f.notelinks', 'f.drawphoto', 'f.richtext', 'f.noteattach', 'f.noteocr', 'f.noteremind', 'f.notetrash',
    'f.plantpass', 'f.doubleinbox', 'f.mailcase', 'f.memorycard', 'f.noteformats', 'f.next', 'f.notes',
    'f.dictate', 'f.aiprojects', 'f.photoalbum', 'f.sortround', 'f.docs', 'f.tools', 'f.pdftools',
    'f.phototools', 'f.ablage', 'f.weblinks', 'f.chains', 'f.convert', 'f.video', 'f.qr', 'f.docscan',
    'f.mailin', 'f.mail', 'f.agenda', 'f.trello', 'f.friendask', 'f.friendshelf', 'f.friendtemplate',
    'f.inputbar', 'f.inputtemplates', 'f.picturecard',
  ],
  // App, Daten und Hilfe
  app: [
    'f.lists', 'f.editall', 'f.decides', 'f.pagetips', 'backup', 'install', 'lang', 'demo', 'f.namesde',
    'f.search', 'f.localai', 'f.askfurther', 'f.searchvoice', 'f.startfresh', 'f.sync', 'f.autosync',
    'f.account', 'f.verstehen', 'f.privacy', 'f.camera', 'f.autobackup', 'f.tidy', 'f.tour', 'f.firststart',
    'f.playground', 'f.helper', 'f.shortcuts', 'f.ownvalues', 'f.ownreminders', 'f.listsmore', 'f.push',
    'f.theme', 'f.uisize', 'f.custompage', 'f.explain', 'f.connections', 'f.owncal', 'f.notestasks',
    'f.fitbitold', 'f.alerts', 'f.backuplock', 'f.yearcheck', 'f.suggestoff', 'f.tipweek', 'f.comeback',
    'f.helpsearch', 'f.news', 'f.workspace', 'f.calmview', 'f.pushbudget', 'f.notforme', 'f.sources',
    'f.aicheck', 'f.hiddenall',
  ],
};

const OF = Object.fromEntries(Object.entries(FEATURE_MOMENTS).flatMap(([k, ids]) => ids.map((id) => [id, k])));
/** The moment of a function id ('app' for the base, null for an unknown id). */
export const momentOfFeature = (id) => OF[id] ?? null;
/** The function ids of a moment. */
export const featuresOf = (key) => FEATURE_MOMENTS[key] ?? [];
