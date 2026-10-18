/**
 * «Rundgang» (Noah 15.10.2026 12:36: «1a» highlight on the real pages, «2» in the playground with the
 * example trip or with your own data, «3» short plus a small tour per place, «4a» a line in «First steps»
 * and Me › Handbook, «5a» only watch, «Next»). A tour is a list of steps; each step opens a page, lights
 * up one part of it (the first selector of `target` that is on the page) and marks the place in the
 * navigation. A step whose part is missing (own data without a trip, say) still shows its card, in the
 * middle. Nothing is ever required: «End tour» stops at once and the tour does not come back by itself.
 *
 * TOURS.app is the tour through the whole app (six places and an end card); TOURS.aktiv, .touren,
 * .material and .velos are the small tours of one place (the «Einstieg» on top of the place offers them).
 * The running tour lives in localStorage (RUN_KEY), so it carries over the reload that starts the
 * playground; a closed private tab simply has no tour. Texts are English keys for t() (German in
 * i18n/de/rundgang.js). Pure apart from the small storage helpers at the end; tested in tests/tour.test.js.
 */

export const RUN_KEY = 'tour.run';

/**
 * A step: { href, target, place, title, text, prep? }. target: CSS selectors, the first one found is lit.
 * place: the key in the navigation that is marked ('today', 'trips', 'gear', 'bikes', 'active', 'me').
 * prep: 'playTrip' makes the example trip the open trip first (only in the playground).
 */
export const TOURS = {
  app: [
    { href: '#/', place: 'today', target: ['[data-tile="trip"]', '.first', 'main h1'], title: 'Today|place', text: 'What is on now: your next trip, the weather and what is still open. New every day.' },
    { href: '#/trips', place: 'trips', target: ['section.band', '.trips header.ph'], title: 'Trips|place', text: 'All trips in one place: planned, completed, rated. Tap a trip to open it.' },
    { href: '#/pack', place: 'trips', prep: 'playTrip', target: ['.bag-groups', '.calm-pack', 'main h1'], title: 'Packing|tour', text: 'A tap means packed. What you do not need, you leave out: everything is only a suggestion.' },
    { href: '#/gear', place: 'gear', target: ['section.vhead', '.gear header'], title: 'Gear|place', text: 'Enter what you own once. After that the app suggests it for every trip that fits.' },
    { href: '#/bikes?tab=care', place: 'bikes', target: ['section[aria-labelledby="due-h"]', 'main h1'], title: 'Bikes|place', text: 'Km and care for every bike. The app tells you when the chain, brakes or tyres are due.' },
    { href: '#/flow', place: 'active', target: ['section[aria-labelledby="tick-h"]', '.flow header.ph'], title: 'Active|place', text: 'For everyday life: meditation, training, recovery. One tap ticks off, a long press enters the duration.' },
    { href: '#/', place: 'me', end: true, target: [], title: 'Done. Well done!', text: 'You always find help under Me › Handbook. You can start the tour again there.' },
  ],
  aktiv: [
    { href: '#/flow', place: 'active', target: ['section[aria-labelledby="tick-h"]'], title: 'Tick off today', text: 'One tile per sport. A tap ticks it off, a long press enters the duration, place or stopwatch.' },
    { href: '#/flow', place: 'active', target: ['section[aria-labelledby="rings-h"]', '.lay .side', '.lay'], title: 'Your week', text: 'The rings count the last 7 days: move, mindful and recovery. A rest day does not cost everything at once.' },
    { href: '#/flow/goals', place: 'active', target: ['.flow .tools', '.flow header.ph'], title: 'Goals|flow', text: 'A goal like «cycling 2× a week». You see what is on track, with its own window and season.' },
    { href: '#/flow', place: 'active', target: ['[data-pagemore]', 'details.pm', '.lay'], title: 'More in Active', text: 'Meditation, timer, stopwatch and milestones are one tap away, under the tabs on top.' },
  ],
  touren: [
    { href: '#/trips', place: 'trips', target: ['section.band', '.trips header.ph'], title: 'Your trips', text: 'Planned trips on top, then the completed and rated ones. Tap a trip to plan or pack it.' },
    { href: '#/trips', place: 'trips', target: ['.trips header.ph a', '.trips header.ph'], title: 'Upload a ride', text: 'A ride from Strava or a GPX file goes here. The km count on the bike you rode.' },
    { href: '#/pack/templates', place: 'trips', target: ['main h1'], title: 'Templates', text: 'A good trip becomes a template. The next weekend then starts with the right list.' },
    { href: '#/debrief', place: 'trips', target: ['main h1'], title: 'Look back|page', text: 'After the trip: what was too much, what was missing. The next list gets better by itself.' },
  ],
  material: [
    { href: '#/gear', place: 'gear', target: ['section.vhead', '.gear header'], title: 'Your gear', text: 'Number of items and the known weight. Items without weight are counted, so you can weigh them later.' },
    { href: '#/gear', place: 'gear', target: ['.gear .tools', '.gear .toolbar', '.gear header'], title: 'Add and find', text: 'Search by name, brand or bag. «+ Item» enters something new.' },
    { href: '#/wardrobe', place: 'gear', target: ['main h1'], title: 'Clothes|tab', text: 'Clothes by temperature. The app suggests layers for the weather of the trip.' },
    { href: '#/blocks', place: 'gear', target: ['main h1'], title: 'Building blocks', text: 'A block is a ready package for a situation, like «Rain». One tap adds the whole package to a trip.' },
  ],
  velos: [
    { href: '#/bikes', place: 'bikes', target: ['section.draw', '.setup', 'main h1'], title: 'Your bike|intro', text: 'The drawing shows where each bag sits on the bike. Tap a place to change it.' },
    { href: '#/bikes', place: 'bikes', target: ['section.std', '.setup'], title: 'Bags|tour', text: 'These bags come along on every new trip with this bike, with their weight.' },
    { href: '#/bikes?tab=care', place: 'bikes', target: ['section[aria-labelledby="due-h"]', '.care', 'main h1'], title: 'Care|tab', text: 'What is due: chain, brakes, tyres. A tap enters what you did, the km start again.' },
    { href: '#/bikes?tab=compare', place: 'bikes', target: ['main h1'], title: 'Equipment|intro', text: 'Every part of the bike in groups, with weight and date. «Compare» shows two bikes side by side.' },
  ],
};

/** The tour's name for buttons and the Handbook. */
export const TOUR_NAMES = { app: 'Tour of the app', aktiv: 'Tour of Active', touren: 'Tour of Trips', material: 'Tour of Gear', velos: 'Tour of Bikes' };

/** How many steps a tour shows with «Step n of m» (the end card does not count). */
export const stepCount = (id) => (TOURS[id] ?? []).filter((s) => !s.end).length;

/** The step `i` of tour `id`, or null past the end or for an unknown tour. */
export const stepAt = (id, i) => (Number.isInteger(i) && i >= 0 ? (TOURS[id]?.[i] ?? null) : null);

/** A stored run made whole: { id, step, play } or null when there is none or it does not fit any tour. */
export function runOf(v) {
  if (!v || typeof v !== 'object' || !TOURS[v.id]) return null;
  const step = Number.isInteger(v.step) && v.step >= 0 && v.step < TOURS[v.id].length ? v.step : 0;
  return { id: v.id, step, play: !!v.play };
}

/** The next run after «Next» (null after the last step) and after «Back» (never before the first). */
export const nextRun = (run) => (run && run.step + 1 < TOURS[run.id].length ? { ...run, step: run.step + 1 } : null);
export const backRun = (run) => (run ? { ...run, step: Math.max(0, run.step - 1) } : null);

/** The navigation link of a place, on the phone (bottom bar) and on the computer (side bar), and Me. */
export const navSelector = (place) => (place === 'me' ? 'a.me' : `nav.bottom a[data-place="${place}"], nav.places li[data-place="${place}"] > a`);

/**
 * Where the card goes: on the phone always at the bottom above the bar; on the computer under the lit part
 * when it fits, else above it; without a part (or the end card) in the middle. Numbers in CSS pixels.
 */
export function cardSpot(rect, { width, height, phone, card = 240 }) {
  if (!rect) return { mode: 'middle' };
  if (phone) return { mode: 'bottom' };
  const below = rect.y + rect.height + 18;
  if (below + card < height) return { mode: 'below', top: below, left: Math.min(Math.max(rect.x, 16), width - 396) };
  return { mode: 'above', top: Math.max(16, rect.y - 18 - card), left: Math.min(Math.max(rect.x, 16), width - 396) };
}

/* ---------- storage (localStorage: carries the reload of the playground start) ---------- */
export function readRun() {
  try {
    return runOf(JSON.parse(localStorage.getItem(RUN_KEY) ?? 'null'));
  } catch {
    return null;
  }
}
export function writeRun(run) {
  try {
    if (run) localStorage.setItem(RUN_KEY, JSON.stringify(run));
    else localStorage.removeItem(RUN_KEY);
  } catch {
    /* private mode: the tour still runs until the next reload */
  }
}
