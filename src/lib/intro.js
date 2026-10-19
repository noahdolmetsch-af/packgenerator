/**
 * «Einstieg» on top of a place (Noah 15.10.2026 08:20 «content seite für jeden bereich»; answers 12:32
 * «1a 2a 3a 4a»): what you do here (three things), what to expect, one tip of the day that fits the month
 * and your data (the tips of pageinfo.js, «Passt zu heute» first), one «Good to know» with its source, and
 * the small tour of the place. 1a: on the phone it is open on the first 3 visits, then one line that opens
 * on a tap; on the computer it stays open until you fold it. × takes it away (Me › Handbook brings it
 * back). On the very first visit it offers the small tour of the place (Noah «3»: a small tour per place
 * on the first visit), as a suggestion, never by itself.
 *
 * INTROS: the words of each place, English keys for t() (German in i18n/de/rundgang.js). The state is one
 * setting (INTRO_KEY, on the device and in the backup): { visits, hidden, fold, offered } per place.
 * Pure; tested in tests/intro.test.js. The component: lib/intro/AreaIntro.svelte.
 */
export const INTRO_KEY = 'intro';
/** The key in pageinfo PAGES that holds the tips of an Einstieg (most use their own key). */
export const tipsOf = (place) => INTROS[place]?.tips ?? place;
/** 1a: the phone shows it open on this many visits, then as one line. */
export const OPEN_VISITS = 3;

/**
 * things: three rows { icon, title, text, href? }; tour: the key in TOURS (tour.js), only on a place; page:
 * true on a page below a place. The key is also the page key in pageinfo PAGES (the tips).
 */
export const INTROS = {
  aktiv: {
    name: 'Active|place',
    title: 'Movement, rest and recovery in everyday life',
    things: [
      { icon: 'check', title: 'Tick off', text: 'One tile per sport. A long press enters the duration, place or stopwatch.' },
      { icon: 'goal', title: 'Set goals', text: 'For example «cycling 2× a week». You see what is on track.', href: '#/flow/goals' },
      { icon: 'moon', title: 'Rest and recovery', text: 'Meditation, timer and «Wi gaht’s?» for sleep and energy.', href: '#/flow/rest' },
    ],
    expect: 'After a few days you see your week as dots, series and milestones. After two weeks the app shows patterns, for example your most active day.',
    tour: 'aktiv',
  },
  touren: {
    tips: 'trips', // Noah 19.10 «2a»: the tips (pageinfo PAGES) of the page, shared with its card «Was hier steht»
    name: 'Trips|place',
    title: 'Plan, pack, ride and look back',
    things: [
      { icon: 'map', title: 'Plan', text: 'Date, bike and weather. The list comes from your own gear.' },
      { icon: 'pack', title: 'Pack', text: 'Tick off what goes into the bag. Leave out what you do not need.' },
      { icon: 'back', title: 'Look back|intro', text: 'What was too much, what was missing: the next list gets better.', href: '#/debrief' },
    ],
    expect: 'After two or three trips the lists get better by themselves, because what you never use gets quieter.',
    tour: 'touren',
    // «Neue Tour» stays in reach (FE1 Daumen-Zone): here too the Einstieg starts as one line
    folded: true,
  },
  material: {
    tips: 'gear', // Noah 19.10 «2a»: the tips (pageinfo PAGES) of the page, shared with its card «Was hier steht»
    name: 'Gear|place',
    title: 'Everything you own, entered once',
    things: [
      { icon: 'scale', title: 'Enter and weigh', text: 'Name, weight and bag. Weigh later: the app counts what is still missing.' },
      { icon: 'blocks', title: 'Building blocks', text: 'Packages like «Rain» or «Repair». One tap adds them to a trip.', href: '#/blocks' },
      { icon: 'cart', title: 'Shopping', text: 'A wish list with prices, for the next purchase.', href: '#/gear?view=wish' },
    ],
    expect: 'You see the weight per bag, what never came along and what is with you most often.',
    tour: 'material',
    // Material keeps «list first» (Noah 11.10.2026, mockup E): here the Einstieg starts as one line
    folded: true,
  },
  velos: {
    name: 'Bikes|place',
    title: 'Every bike with its bags, km and care',
    things: [
      { icon: 'bike', title: 'Your bike|intro', text: 'The drawing shows where each bag sits. These bags come along on every new trip with this bike.' },
      { icon: 'wrench', title: 'Care|tab', text: 'Chain, brakes, tyres: the app counts the km and tells you what is due.', href: '#/bikes?tab=care' },
      { icon: 'list', title: 'Equipment|intro', text: 'Every part in groups, with weight and date. Two bikes side by side with «Compare».', href: '#/bikes?tab=compare' },
    ],
    expect: 'With the km from Strava or your trips the app gets to know each bike. After a few weeks you see what is due next and how far a part has come.',
    tour: 'velos',
  },
  // Noah «4a»: the pages below a place get the same Einstieg, without a tour of their own («3»: a small
  // tour per place). page: true says «This is …» instead of «Your area …».
  meditation: {
    page: true,
    name: 'Meditation',
    title: 'Sit, breathe, come back',
    things: [
      { icon: 'timer', title: 'Timer', text: 'Length, gongs and sound. A template starts it with one tap.', href: '#/flow/act/meditation/timer' },
      { icon: 'list', title: 'Log|intro', text: 'Every session in a list, a calendar and a curve.', href: '#/flow/act/meditation/log' },
      { icon: 'chart', title: 'Patterns|intro', text: 'When it goes deepest: by time of day, length and place.', href: '#/flow/act/meditation/muster' },
    ],
    expect: 'After a week you see your streak. After a few weeks the patterns show when meditation does you the most good.',
    // «Meditation einfach»: the phone page stays about two screens, so the Einstieg starts as one line
    folded: true,
  },
  training: {
    page: true,
    name: 'Training|tab',
    title: 'Your training by heart rate zones',
    things: [
      { icon: 'calendar', title: 'Week|training', text: 'The time in each zone this week, at a glance.' },
      { icon: 'list', title: 'Activities|intro', text: 'Every activity from Strava with its zones and heart rate.' },
      { icon: 'heart', title: 'Zones|intro', text: 'They come from your maximum heart rate. You can change the limits.' },
    ],
    expect: 'With Strava connected each ride comes in by itself. After two or three weeks you see whether you train mostly easy or mostly hard.',
  },
  goals: {
    page: true,
    name: 'Goals|flow',
    title: 'Goals that fit your week',
    things: [
      { icon: 'goal', title: 'One goal per activity', text: 'For example «cycling 2× a week» or «meditate 10 minutes a day».', href: '#/flow/new' },
      { icon: 'check', title: 'Rolling window', text: 'It always counts the last days, whatever the weekday. A missed Monday is not a lost week.' },
      { icon: 'moon', title: 'Pause and season', text: 'Pause a goal on holiday, or let it count only in summer or winter.' },
    ],
    expect: 'You see at once which goal is on track. After a month you know which goals fit your life and which you can let go.',
  },
  activity: {
    page: true,
    name: 'Activity|tab',
    title: 'All activities at a glance',
    things: [
      { icon: 'star', title: 'Milestones', text: 'What you have reached and what is soon within reach.', href: '#/flow/milestones' },
      { icon: 'chart', title: 'Three rings', text: 'Move, mindful and recovery over the last 7 days.' },
      { icon: 'heart', title: 'Recovery and fun', text: 'A sauna or a walk counts too.' },
    ],
    expect: 'Each tile shows one line: how often, how long, since when. Over time the page becomes your own sports diary.',
  },
  rest: {
    page: true,
    name: 'Recovery|page',
    title: 'The pause has its place too',
    things: [
      { icon: 'moon', title: 'Recovery this week', text: 'The ring fills with sauna, stretching, a walk or a rest day.' },
      { icon: 'check', title: 'Tick off recovery', text: 'One tap is enough. Add your own kind of recovery below.' },
      { icon: 'calendar', title: 'The last 14 days', text: 'Recovery and active days side by side, so you see the balance.' },
    ],
    expect: 'After two weeks you see whether hard days and rest days are in balance.',
  },
  bags: {
    page: true,
    name: 'Sport bag',
    title: 'A short list per sport, so nothing is missing',
    things: [
      { icon: 'bag', title: 'One bag per sport', text: 'For tennis, the gym or swimming: only the few things you need.' },
      { icon: 'check', title: 'All in the bag', text: 'Tick it off before you leave. Tomorrow it starts empty again.' },
      { icon: 'calendar', title: 'Reminder the evening before', text: 'With a fixed date under «Week» Today reminds you the evening before.', href: '#/flow/week' },
    ],
    expect: 'After a few times the list is short and right. What you often forget is marked.',
  },
  week: {
    page: true,
    name: 'Week',
    title: 'Plan your week, gently',
    things: [
      { icon: 'goal', title: 'Goals this week', text: 'What is still open from your goals, spread over the days.' },
      { icon: 'calendar', title: 'Fixed dates', text: 'Yoga on Thursday 07:00? Enter it once, it comes back every week.' },
      { icon: 'sun', title: 'Weather|intro', text: 'Dry days get the outdoor suggestions. Everything can be changed.' },
    ],
    expect: 'Every week starts with suggestions from your goals and dates. You plan what fits and leave out the rest.',
  },
  templates: {
    page: true,
    name: 'Templates',
    title: 'The next trip starts packed',
    things: [
      { icon: 'copy', title: 'From a good trip', text: 'Save a trip that worked as a template, with its blocks and items.' },
      { icon: 'blocks', title: 'Building blocks inside', text: 'A template is made of blocks plus single items. Change a block, every template gets it.', href: '#/blocks' },
      { icon: 'map', title: 'Start a trip', text: 'A new trip from a template has its list ready. Leave out what you do not need.' },
    ],
    expect: 'With two or three templates most trips start with the right list in one tap.',
  },
  debrief: {
    page: true,
    name: 'Look back|page',
    title: 'What the last trips taught you',
    things: [
      { icon: 'back', title: 'Rate a trip', text: 'What was too much, what was missing, how it felt. Two minutes are enough.' },
      { icon: 'chart', title: 'Your pace', text: 'Km per hour and per day over all trips, for better planning.', href: '#/debrief/pace' },
      { icon: 'list', title: 'Learned|review', text: 'Every lesson in one place, by topic.', href: '#/debrief/learnings' },
    ],
    expect: 'After each rated trip the next packing list gets a little better by itself.',
  },
  wardrobe: {
    page: true,
    name: 'Wardrobe',
    title: 'Clothes by temperature, layer by layer',
    things: [
      { icon: 'shirt', title: 'Layers|intro', text: 'From the inside out: base layer, warm layer, rain jacket.' },
      { icon: 'thermo', title: 'What do I wear today?', text: 'The app suggests layers for the weather of the day or the trip.' },
      { icon: 'back', title: 'It learns|intro', text: 'If you were often cold or too warm, the debrief moves the suggestion a little.' },
    ],
    expect: 'Once your clothes have a temperature range, every trip gets a clothing list that fits the forecast.',
  },
  blocks: {
    page: true,
    name: 'Building blocks',
    title: 'Packages for every situation',
    things: [
      { icon: 'blocks', title: 'A ready package', text: 'For example «Rain» or «Repair»: the things that always come along together.' },
      { icon: 'sun', title: 'Depending on the situation', text: 'Some blocks come by themselves when the weather or the trip fits.' },
      { icon: 'check', title: 'Check|blocks', text: 'One block after the other: keep, leave out or move each item. «Check» is on top of the page.' },
    ],
    expect: 'With a handful of blocks a new list is ready in a few taps, and changes reach every trip.',
  },
  pflege: {
    tips: 'care', // Noah 19.10 «2a»: the tips (pageinfo PAGES) of the page, shared with its card «Was hier steht»
    page: true,
    name: 'Care|tab',
    title: 'Keep every bike ready to ride',
    things: [
      { icon: 'wrench', title: 'What is due', text: 'Chain, brakes, tyres: what needs care soon is on top. Due means: before the next ride.' },
      { icon: 'check', title: 'Log a service', text: 'Open a bike, tap a part and enter what you did. Its km start again.' },
      { icon: 'list', title: 'Import rides', text: 'Rides from Strava or a GPX file add the km to the right bike.', href: '#/bikes?tab=care&view=import' },
    ],
    expect: 'After a few weeks the app knows how many km each part has done and tells you before something wears out.',
    // what is due comes first (a to-do list, like Material «list first»): one line until you open it
    folded: true,
  },
  workshop: {
    page: true,
    name: 'Workshop & receipts',
    title: 'What waits for the bike shop, and every visit',
    things: [
      { icon: 'wrench', title: 'For the workshop', text: 'Note what the bike shop should look at, so nothing is forgotten at the counter.' },
      { icon: 'copy', title: 'Visits and receipts', text: 'Every visit with its date, price and receipt.' },
      { icon: 'chart', title: 'Costs per year', text: 'What each bike cost in care this year, at a glance.' },
    ],
    expect: 'Over time you see what each bike costs to keep, and the receipts are at hand for the warranty.',
  },
  ausstattung: {
    page: true,
    name: 'Equipment|tab',
    title: 'Every part of your bike',
    things: [
      { icon: 'list', title: 'Parts in groups', text: 'Frame, wheels, drivetrain, brakes: each part with weight, price and date.' },
      { icon: 'check', title: 'Enter values', text: 'One value after the other: «Next» goes to the next field.' },
      { icon: 'chart', title: 'Compare bikes', text: 'Two or more bikes side by side: weight, parts and measurements.' },
    ],
    expect: 'Once the parts are entered you know what each bike weighs and what a part cost.',
  },
  einkauf: {
    tips: 'gear', // Noah 19.10 «2a»: the tips (pageinfo PAGES) of the page, shared with its card «Was hier steht»
    page: true,
    name: 'Shopping|tab',
    title: 'Your wish list, with prices',
    things: [
      { icon: 'cart', title: 'Note a wish', text: 'What you would like to buy, with its price.' },
      { icon: 'star', title: 'Why this one', text: 'The app shows why a wish makes sense: missing on a trip, broken, or lighter than the old one.' },
      { icon: 'scale', title: 'In no total', text: 'A wish counts in no weight and no list until you own it.' },
    ],
    expect: 'The wishes with the best reason come first, so the next purchase is an easy choice.',
    // a list page too («list first»): one line until you open it
    folded: true,
  },
  past: {
    page: true,
    name: 'Past trips',
    title: 'Every trip you have done',
    things: [
      { icon: 'map', title: 'Your year', text: 'Trips, km and metres climbed, by year or over 12 months.' },
      { icon: 'back', title: 'Rate|intro', text: 'A trip without a debrief shows «Rate». The next list learns from it.' },
      { icon: 'star', title: 'Upload ride', text: 'A ride from Strava or a GPX file joins the list.', href: '#/debrief/ride' },
    ],
    expect: 'Over the years this becomes your logbook: how far, how high, with which bike.',
  },
  // the place «Woche» (#/week, Woche planen WP1–WP4); 'week' is Aktiv › Woche (#/flow/week). One line
  // first, like Material and Touren: the week itself stays on the first screen.
  weekplan: {
    page: true,
    folded: true,
    name: 'Week|place',
    title: 'Your week at a glance',
    things: [
      { icon: 'calendar', title: 'Everything in one week', text: 'Sport, dates, to-dos, holidays and bike service, each in its colour. Hide a kind with its chip.' },
      { icon: 'check', title: 'Plan on Sunday', text: 'Four short steps: the app suggests, you take, move or leave out.', href: '#/week/plan' },
      { icon: 'sun', title: 'Holidays|intro', text: 'Enter them once: the app suggests pausing the plan and servicing the bike before.', href: '#/week/away' },
    ],
    expect: 'After the first Sunday you see the whole week at a glance, and Today shows what the plan says for today.',
  },
};

const obj = (x) => (x && typeof x === 'object' && !Array.isArray(x) ? x : {});
/** The stored state made whole. */
export function introOf(v) {
  const o = obj(v);
  const nums = Object.fromEntries(Object.entries(obj(o.visits)).filter(([, n]) => Number.isFinite(n) && n >= 0));
  const bools = (x) => Object.fromEntries(Object.entries(obj(x)).filter(([, b]) => typeof b === 'boolean'));
  return { visits: nums, hidden: bools(o.hidden), fold: bools(o.fold), offered: bools(o.offered) };
}

/** One more visit of the place. */
export function visit(v, place) {
  const s = introOf(v);
  return { ...s, visits: { ...s.visits, [place]: (s.visits[place] ?? 0) + 1 } };
}

/**
 * Is the Einstieg open now? A fold or unfold you chose wins; else open on the computer, on the phone the
 * first 3 visits. folded: the place starts as one line everywhere (Material: «list first»).
 */
export function isOpen(v, place, phone = false, folded = false) {
  const s = introOf(v);
  if (typeof s.fold[place] === 'boolean') return !s.fold[place];
  if (folded) return false;
  return phone ? (s.visits[place] ?? 0) <= OPEN_VISITS : true;
}

export const setFold = (v, place, folded) => {
  const s = introOf(v);
  return { ...s, fold: { ...s.fold, [place]: !!folded } };
};
export const hide = (v, place) => {
  const s = introOf(v);
  return { ...s, hidden: { ...s.hidden, [place]: true } };
};
/** Bring every Einstieg back (Me › Handbook). */
export const showAll = (v) => ({ ...introOf(v), hidden: {} });
export const hiddenCount = (v) => Object.values(introOf(v).hidden).filter(Boolean).length;
export const isHidden = (v, place) => !!introOf(v).hidden[place];

/** Offer the small tour of the place: on the first visit, once (Noah «3»). */
export function offerTour(v, place) {
  const s = introOf(v);
  return !!INTROS[place]?.tour && (s.visits[place] ?? 0) <= 1 && !s.offered[place];
}
export const setOffered = (v, place) => {
  const s = introOf(v);
  return { ...s, offered: { ...s.offered, [place]: true } };
};
