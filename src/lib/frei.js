/**
 * Paket T «Freie Zeit» (Noah 19.10.2026: 30 content ideas from his Word file, «alle bauen», «1a und b 2a
 * 3 vorerst weglassen 4a 5a», texts «humorvoll, wie sonst auf der Seite»). The content and the pure rules
 * of the eight pages under Ich › Freie Zeit (#/me/frei):
 *   Impulse (also a tab of Aktiv), Meine Sammlungen, Worauf hab ich Lust?, Mein Abend,
 *   Was mir wesentlich ist, Reise-Wünsche, Erste Nacht, Fürs nächste Mal.
 * Everything is a suggestion: every built-in text can be edited or hidden, own ones added, every group
 * (areas, collections) renamed, sorted and deleted. Words are English keys for t() (German in
 * i18n/de/frei.js); what the person types is stored as typed and never goes through t().
 * Pure functions, tested in tests/frei.test.js. The one settings record is 'frei' (freidb.js).
 */

/** The settings key of the one record with the page settings (areas, collections, rituals …). */
export const FREI_KEY = 'frei';

/* ---------- pages ---------- */

/** The pages of «Freie Zeit»: key, address part, title, one line (English keys), icon name. */
export const PAGES = [
  { key: 'impulse', title: 'Impulses', sub: 'Ideas to tap, in ten areas', icon: 'sparkles' },
  { key: 'sammlungen', title: 'My collections', sub: 'Places, moments, photo series, recipes, songs …', icon: 'library' },
  { key: 'lust', title: 'What am I up for?', sub: 'Mood, energy and time: one idea that fits', icon: 'dice' },
  { key: 'abend', title: 'My evening', sub: 'Up to three rituals, music, a moment to arrive', icon: 'moon' },
  { key: 'wesentlich', title: 'What matters to me', sub: 'This phase of life and your big maybe', icon: 'heart' },
  { key: 'reise', title: 'Travel wishes', sub: 'Longing, hopes for a trip, a day with room to spare', icon: 'plane' },
  { key: 'nacht', title: 'First night', sub: 'A first overnighter step by step, the day packed in your head', icon: 'tent' },
  { key: 'naechstes', title: 'For next time', sub: 'Proven, unused, missing: across all trips', icon: 'repeat' },
];
export const PAGE_KEYS = PAGES.map((p) => p.key);

/** «#/me/frei/lust?x» → 'lust'; «#/flow/impulse» → 'impulse'; the hub → ''. */
export function freiPart(hash = '') {
  const h = String(hash).split('?')[0];
  if (/^#\/flow\/impulse/.test(h)) return 'impulse';
  const m = h.match(/^#\/me\/frei\/([a-z]+)/);
  if (!m) return '';
  if (m[1] === 'sammlung') return 'sammlung';
  return PAGE_KEYS.includes(m[1]) ? m[1] : '';
}
/** «#/me/frei/sammlung/<id>» → the collection id, or ''. */
export const collOfHash = (hash = '') => decodeURIComponent(String(hash).split('?')[0].match(/^#\/me\/frei\/sammlung\/([^/]+)/)?.[1] ?? '');
/** The value of one query parameter of an address. */
export function queryOf(hash = '', key = '') {
  const q = String(hash).split('?')[1] ?? '';
  for (const part of q.split('&')) {
    const [k, v = ''] = part.split('=');
    if (k === key) return decodeURIComponent(v);
  }
  return '';
}
export const pageHref = (key) => (key ? `#/me/frei/${key}` : '#/me/frei');
export const collHref = (id) => `#/me/frei/sammlung/${encodeURIComponent(id)}`;

/* ---------- days ---------- */
const MS = 864e5;
const toMs = (day) => Date.parse(`${day}T00:00:00Z`);
/** Days since 1970 of a calendar day (for a stable «of the day» choice). */
export const dayNo = (day) => Math.round(toMs(day) / MS);
/** ISO week number of a calendar day (calendar arithmetic, no time zone). */
export function isoWeek(day) {
  const d = new Date(toMs(day));
  const wd = (d.getUTCDay() + 6) % 7; // 0 = Monday
  d.setUTCDate(d.getUTCDate() - wd + 3); // the Thursday of this week
  const first = new Date(Date.UTC(d.getUTCFullYear(), 0, 4));
  return 1 + Math.round((d - first) / MS / 7 - ((first.getUTCDay() + 6) % 7 - 3) / 7);
}

/* ---------- ids ---------- */
export const uid = (p = 'fz') => `${p}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
const clean = (s, max = 400) => String(s ?? '').trim().slice(0, max);

/* ---------- the areas of «Impulse» (groups: rename, sort, delete) ---------- */

export const AREAS = [
  { id: 'sport', name: 'Sport and fitness' },
  { id: 'outside', name: 'Out and about' },
  { id: 'nature', name: 'Nature up close' },
  { id: 'health', name: 'Rest and recharge' },
  { id: 'mind', name: 'Mindfulness' },
  { id: 'joy', name: 'Fun and silliness' },
  { id: 'people', name: 'Family and friends' },
  { id: 'travel', name: 'Travel|frei' },
  { id: 'adventure', name: 'Adventure' },
  { id: 'packing', name: 'Back- and bikepacking' },
];

/**
 * The 30 impulses (Noah's Word file, rewritten with a wink). go: where «Try it» leads —
 * { page } one of PAGES, { coll } a collection type, or an inline helper ('take', 'silly', 'together', 'sunrise').
 */
export const IMPULSES = [
  { id: 'i01', area: 'sport', go: { page: 'lust' }, first: 'Open «What am I up for?» and tap one mood.', title: 'What are you up for today?', text: 'Go all out, play, practise something or just roll along? Pick what you fancy and how long you have. The app finds something that fits, even for 15 minutes.' },
  { id: 'i02', area: 'sport', go: { page: 'lust' }, first: 'Pick the one move now and say it out loud.', title: 'Technique of the week', text: 'One small thing, full attention: place the tennis ball on purpose, ride one corner on three different lines, or do a familiar move in slow motion. Spoiler: slow is harder than it looks.' },
  { id: 'i03', area: 'sport', go: { coll: 'moments' }, first: 'Write one sentence about that session.', title: 'That one was good', text: 'Think of a session you did not want to end. Was it the people, the game, the view or the feeling of finally getting it? Write it down; that is where your next good idea is hiding.' },
  { id: 'i04', area: 'outside', go: { coll: 'places' }, first: 'Name the goal and put on your shoes.', title: 'A walk with a tiny goal', text: 'A fountain, a bench, a viewpoint or that shop you have walked past a hundred times. Walk there, take your time, and maybe you find a new favourite spot on the way.' },
  { id: 'i05', area: 'outside', go: { inline: 'take' }, first: 'Put a cup by the door tonight.', title: 'Breakfast outside', text: 'Take your first cup to the balcony, the park or the lake today. Coffee tastes better with birdsong, that is science (probably).' },
  { id: 'i06', area: 'outside', go: { coll: 'places' }, first: 'Think of one spot and finish «I like coming here when …».', title: 'A spot just for this moment', text: 'Some places are about the view, some about the quiet, some about a memory. Collect them, with one sentence: «I like coming here when …»' },
  { id: 'i07', area: 'nature', go: { coll: 'places' }, first: 'Open the window and listen for one minute.', title: 'What do you hear?', text: 'Stop outside for a minute and just listen. What is close, what is far, what only shows up after a while? Give the place a sound name, like «wind in the leaves» or «the stream behind the road».' },
  { id: 'i08', area: 'nature', go: { coll: 'series' }, first: 'Pick the tree on your next way out.', title: 'One tree, four seasons', text: 'Pick a tree you pass often and photograph it from the same spot, again and again. After a few months you have a little film the tree made all by itself.' },
  { id: 'i09', area: 'nature', go: { coll: 'series' }, first: 'Look out of the window for one shadow.', title: 'Today you are hunting light', text: 'Forget the big views. Look for a shadow on a wall, a reflection in a puddle or a patch of sun between the trees. One photo, one sentence, done.' },
  { id: 'i10', area: 'health', go: { page: 'lust' }, first: 'Say in one word how full your battery is.', title: 'What fits your energy?', text: 'Battery full or running on fumes? Company or quiet? Say how you feel and pick from your own ideas that worked before.' },
  { id: 'i11', area: 'health', go: { page: 'abend' }, first: 'Pick one of the three for tonight.', title: 'Your evening may slow down', text: 'Tea, dim light, a few pages, tomorrow’s things laid out: how do you want to notice the day is over? Pick up to three; more would be stress again.' },
  { id: 'i12', area: 'health', go: { coll: 'recipes' }, first: 'Write down one meal you could cook half asleep.', title: 'Good food without much thinking', text: 'Which three meals do you cook when you have no time and even less desire? Save them with their ingredients, and next time the shopping list almost writes itself.' },
  { id: 'i13', area: 'mind', go: { page: 'abend' }, first: 'Put both feet on the floor and take three breaths.', title: 'Arrive for a moment', text: 'Sit or stand the way that feels good and notice the floor under you. Watch a few breaths, no need to improve them. Then find three things in the room that catch your eye.' },
  { id: 'i14', area: 'mind', go: { page: 'wesentlich' }, first: 'Finish the sentence in your head, once.', title: 'What matters to you right now?', text: 'A lot goes through your head; which of it is really close to your heart? Finish the sentence: «In this phase of my life what matters to me is …»' },
  { id: 'i15', area: 'mind', go: { page: 'abend' }, first: 'Write the question on a note for your pocket.', title: 'A thought for your way', text: 'Take one question on your next walk, for example «When do I feel connected with myself?». No answer needed; whatever turns up may stay.' },
  { id: 'i16', area: 'joy', go: { coll: 'songs' }, first: 'Name the song.', title: 'One song long', text: 'Which song would you like to play loud right now? Play it and sing, dance, drum on the table or just listen. Save it with the moment it fits, like «kitchen dance».' },
  { id: 'i17', area: 'joy', go: { inline: 'silly' }, first: 'Read one idea and smile at it.', title: 'A small dose of nonsense', text: 'What would you try today just because it makes you laugh? The app has a few ideas; your own are even better.' },
  { id: 'i18', area: 'joy', go: { coll: 'moments' }, first: 'Open your photos and pick one day.', title: 'Live the good bits again', text: 'Look at a photo of a really good day. What would you repeat: the place, the people, what you did or the mood? Then find a small version you could do soon.' },
  { id: 'i19', area: 'people', go: { inline: 'together' }, first: 'Write down one name.', title: 'Time together can be simple', text: 'Who would you like to see again? Shopping together, a walk or cooking is enough. Pick an idea that fits and send an invitation; the app writes the first draft.' },
  { id: 'i20', area: 'people', go: { coll: 'memories' }, first: 'Find the photo, nothing more yet.', title: 'The story behind the photo', text: 'Find an old family photo you would like to know more about. Who took it, what happened that day, what can you not see in it? A good excuse for a long conversation.' },
  { id: 'i21', area: 'people', go: { coll: 'together' }, first: 'Note your own one thing to repeat.', title: 'Our next time together', text: 'Everyone names one thing to repeat and one new idea. Then pick something you are all looking forward to, from games night to a small trip.' },
  { id: 'i22', area: 'travel', go: { page: 'reise' }, first: 'Write one word for what you long for.', title: 'Where are you drawn to?', text: 'Before you search for a destination: what are you longing for? Space, people, movement, quiet or learning something new? Collect pictures and thoughts for it.' },
  { id: 'i23', area: 'travel', go: { page: 'reise' }, first: 'Pick the one place you want to see.', title: 'A day with room for surprises', text: 'Two fixed anchors: one place you want to see and a bed for the night. In between: room for a market, a chat or a bench you did not plan.' },
  { id: 'i24', area: 'travel', go: { page: 'reise' }, first: 'Write down your one wish.', title: 'What do you want to bring home?', text: 'Speak the language, meet people, try something for the first time? Write down one wish before you leave. After the trip, put next to it what you really experienced.' },
  { id: 'i25', area: 'adventure', go: { inline: 'sunrise' }, first: 'Look up tomorrow’s sunrise time.', title: 'Sunrise with breakfast', text: 'Pick a spot you can reach easily and be there before the sun. Check the way, the weather and the time, and pack breakfast the evening before. The alarm will hate you; you will not.' },
  { id: 'i26', area: 'adventure', go: { coll: 'missions' }, first: 'Give your next outing a task in one line.', title: 'A familiar place, a new mission', text: 'Give your next outing a small task: find three special bridges, follow a themed trail or visit the viewpoint you always skip. Write down your most surprising find.' },
  { id: 'i27', area: 'adventure', go: { page: 'wesentlich' }, first: 'Write down the adventure in one sentence.', title: 'Your big maybe', text: 'Which adventure keeps popping up in your head? Describe the moment you would love to live and why it matters. Then pick exactly one first step to find out more.' },
  { id: 'i28', area: 'packing', go: { page: 'nacht' }, first: 'Pick a date for the night.', title: 'One night is enough to start', text: 'Leave in the morning with your bags, a bed booked for the evening. A route, a lunch stop and enough time to get to know your setup. What do you want to know after this first night?' },
  { id: 'i29', area: 'packing', go: { page: 'nacht' }, first: 'Think through the first hour of the day.', title: 'Pack your day in your head', text: 'Walk through the trip from getting up to falling asleep: what do you need when leaving, on the way, at a break and in the evening? What you need often gets a spot you can reach.' },
  { id: 'i30', area: 'packing', go: { page: 'naechstes' }, first: 'Open your last packing list.', title: 'What would I do differently?', text: 'Put the packing list next to your memories. What did you use all the time, what just came along for the ride, what did you miss? Add the reason, so you still know it next spring.' },
];

/** i05: what goes into the bag for breakfast outside. */
export const TAKE_ALONG = ['Something to drink', 'Something small to eat', 'Something to sit on'];
/** i25: the small plan for a sunrise. */
export const SUNRISE_LIST = ['A place you can reach easily', 'The way there', 'A warm jacket', 'Breakfast and a thermos', 'A headlamp'];
/** i17: silly ideas («Another idea»); own ones are added on the page. */
export const SILLY = [
  'Draw your bike from memory',
  'Give tonight’s dinner an absurd name',
  'Hold a paper plane contest',
  'Walk ten steps of a familiar way backwards (carefully)',
  'Write a postcard to your bike',
  'Eat breakfast for dinner',
  'Give the plants in your flat names',
  'Build a tower from the things in your bag',
];
/** i19: ideas for time together by how long you have. */
export const TOGETHER = [
  { time: '30', name: 'Coffee walk' },
  { time: '30', name: 'Shop together' },
  { time: '30', name: 'A phone call while walking' },
  { time: 'evening', name: 'Cook together' },
  { time: 'evening', name: 'Games night' },
  { time: 'evening', name: 'Watch the sunset' },
  { time: 'half', name: 'Bike café ride' },
  { time: 'half', name: 'A hike with a picnic' },
  { time: 'half', name: 'Go to the market' },
];
export const TOGETHER_TIMES = [
  { key: '30', name: '30 minutes' },
  { key: 'evening', name: 'An evening' },
  { key: 'half', name: 'Half a day' },
];

/** Merged areas: the built-in ones with their saved names and order, own ones, deleted ones left out. */
export function areasOf(cfg) {
  const saved = Array.isArray(cfg?.areas) ? cfg.areas : [];
  const out = [];
  for (const s of saved) {
    const std = AREAS.find((a) => a.id === s.id);
    if (!std && !s.own) continue;
    out.push({ id: s.id, name: s.name || null, std: std?.name ?? null, own: !std, hidden: !!s.hidden });
  }
  for (const a of AREAS) if (!out.some((x) => x.id === a.id)) out.push({ id: a.id, name: null, std: a.name, own: false, hidden: false });
  return out;
}
/** The name of an area as shown: typed names as they are, built-in ones through tr (t). */
export const areaName = (a, tr = (s) => s) => (a?.name ? a.name : a?.std ? tr(a.std) : '');

/** The impulses as shown: built-in ones with the person's edits, own ones; hidden ones flagged. */
export function impulsesOf(cfg) {
  const edits = cfg?.edits && typeof cfg.edits === 'object' ? cfg.edits : {};
  const hidden = new Set(Array.isArray(cfg?.hidden) ? cfg.hidden : []);
  const moved = cfg?.moved && typeof cfg.moved === 'object' ? cfg.moved : {};
  const std = IMPULSES.map((i) => ({ ...i, own: false, area: moved[i.id] ?? i.area, ...(edits[i.id] ?? {}), edited: !!edits[i.id], firstOwn: typeof edits[i.id]?.first === 'string', hidden: hidden.has(i.id) }));
  const own = (Array.isArray(cfg?.own) ? cfg.own : []).filter((i) => i && i.id && clean(i.title)).map((i) => ({ go: null, text: '', ...i, own: true, area: moved[i.id] ?? i.area ?? '', hidden: hidden.has(i.id) }));
  return [...std, ...own];
}
/** The impulses of one area ('' = without an area, also those of a deleted area). */
export function inArea(list, areaId, areas) {
  const live = new Set(areas.filter((a) => !a.hidden).map((a) => a.id));
  return list.filter((i) => (areaId === '' ? !live.has(i.area) : i.area === areaId));
}
/** The impulse of the day among the shown ones (stable for a day, changes the next). */
export function impulseOfDay(list, day, salt = 0) {
  const shown = list.filter((i) => !i.hidden);
  if (!shown.length) return null;
  return shown[(((dayNo(day) + salt) % shown.length) + shown.length) % shown.length];
}
/** «Another idea»: the next one after `id` (wraps), never the same when there are two or more. */
export function nextOf(list, id) {
  if (!list.length) return null;
  const i = list.findIndex((x) => (x.id ?? x) === id);
  return list[(i + 1) % list.length];
}

/** Moves the impulses of a deleted area to `to` (or none: they show under «Without an area»). */
export function moveImpulses(cfg, list, from, to) {
  const moved = { ...(cfg?.moved ?? {}) };
  for (const i of list) if (i.area === from) moved[i.id] = to || `-${from}`;
  return moved;
}

/* ---------- collections (Meine Sammlungen) ---------- */

/**
 * Field kinds: title (one line, the name), text (one line), long (several lines), lines (one per line,
 * e.g. ingredients), tags (choose several), place (GPS + name), photos (dated, the latest first), link.
 */
export const COLL_TYPES = {
  places: {
    name: 'Favourite places',
    hint: 'Places with a view, some quiet or a memory. Filter by mood.',
    fields: [
      { key: 'title', kind: 'title', label: 'Place|frei' },
      { key: 'when', kind: 'text', label: 'I like coming here when …' },
      { key: 'tags', kind: 'tags', label: 'What it has', options: ['Quiet', 'View|frei', 'Water', 'Company'] },
      { key: 'sound', kind: 'text', label: 'Sound name (optional)' },
      { key: 'place', kind: 'place', label: 'Where it is' },
      { key: 'photos', kind: 'photos', label: 'Photos' },
    ],
  },
  moments: {
    name: 'Good moments',
    hint: 'What made a moment special, and how a small version of it could come again.',
    fields: [
      { key: 'title', kind: 'title', label: 'What was it?' },
      { key: 'special', kind: 'long', label: 'What made it special' },
      { key: 'more', kind: 'text', label: 'I want more of …' },
      { key: 'again', kind: 'long', label: 'How I could live it again' },
      { key: 'photos', kind: 'photos', label: 'Photos' },
    ],
  },
  series: {
    name: 'Photo series',
    hint: 'The same spot again and again: the last photo shows faintly to line up the next one.',
    fields: [
      { key: 'title', kind: 'title', label: 'What you photograph' },
      { key: 'text', kind: 'text', label: 'One sentence' },
      { key: 'photos', kind: 'photos', label: 'Photos', series: true },
    ],
  },
  recipes: {
    name: 'Recipes',
    hint: 'Quick meals that work for you. The ingredients go to your shopping list with one tap.',
    fields: [
      { key: 'title', kind: 'title', label: 'Dish' },
      { key: 'ingredients', kind: 'lines', label: 'Ingredients (one per line)' },
      { key: 'steps', kind: 'long', label: 'How to make it' },
      { key: 'fav', kind: 'text', label: 'My favourite version' },
      { key: 'photos', kind: 'photos', label: 'Photos' },
    ],
  },
  songs: {
    name: 'Songs',
    hint: 'Songs for a moment, as links: kitchen dance, looking forward, on the way.',
    fields: [
      { key: 'title', kind: 'title', label: 'Song' },
      { key: 'tags', kind: 'tags', label: 'For which moment', options: ['Kitchen dance', 'Looking forward', 'On the way'] },
      { key: 'link', kind: 'link', label: 'Link (e.g. Spotify or YouTube)' },
    ],
  },
  memories: {
    name: 'Photo stories',
    hint: 'An old photo and three questions: the story you cannot see in it.',
    fields: [
      { key: 'title', kind: 'title', label: 'Photo' },
      { key: 'photos', kind: 'photos', label: 'Photos' },
      { key: 'who', kind: 'text', label: 'Who took it?' },
      { key: 'day', kind: 'long', label: 'What happened that day?' },
      { key: 'unseen', kind: 'long', label: 'What can you not see in it?' },
    ],
  },
  together: {
    name: 'Together',
    hint: 'Wishes for your next time together: who would be up for it and when it fits.',
    fields: [
      { key: 'title', kind: 'title', label: 'Idea' },
      { key: 'who', kind: 'text', label: 'Who would be up for it' },
      { key: 'when', kind: 'text', label: 'A good occasion' },
    ],
  },
  missions: {
    name: 'Missions',
    hint: 'A small task for a familiar place, and the most surprising find.',
    fields: [
      { key: 'title', kind: 'title', label: 'Mission' },
      { key: 'time', kind: 'text', label: 'Time it needs' },
      { key: 'found', kind: 'long', label: 'Most surprising find' },
      { key: 'photos', kind: 'photos', label: 'Photos' },
    ],
  },
  free: {
    name: 'Own collection',
    hint: 'Anything you want to keep: a name, a few words, photos and a link.',
    fields: [
      { key: 'title', kind: 'title', label: 'Name' },
      { key: 'text', kind: 'long', label: 'Text' },
      { key: 'photos', kind: 'photos', label: 'Photos' },
      { key: 'link', kind: 'link', label: 'Link' },
    ],
  },
};
/** The collections of the start (one per type but «free»). */
export const STD_COLLS = Object.keys(COLL_TYPES).filter((k) => k !== 'free');

/** Merged collections: built-in ones (id = type) with saved names and order, own ones; deleted flagged. */
export function collsOf(cfg) {
  const saved = Array.isArray(cfg?.colls) ? cfg.colls : [];
  const out = [];
  for (const s of saved) {
    const std = STD_COLLS.includes(s.id);
    if (!std && !s.own) continue;
    out.push({ id: s.id, type: std ? s.id : COLL_TYPES[s.type] ? s.type : 'free', name: s.name || null, own: !std, hidden: !!s.hidden });
  }
  for (const id of STD_COLLS) if (!out.some((x) => x.id === id)) out.push({ id, type: id, name: null, own: false, hidden: false });
  return out;
}
export const collName = (c, tr = (s) => s) => (c?.name ? c.name : c ? tr(COLL_TYPES[c.type]?.name ?? '') : '');
export const fieldsOf = (c) => COLL_TYPES[c?.type]?.fields ?? COLL_TYPES.free.fields;

/** A new entry of a collection (a record of the table «frei», kind 'entry'). */
export function newEntry(coll, fields = {}, { id = uid('fe'), now = new Date().toISOString(), day } = {}) {
  return { id, kind: 'entry', coll, day: day ?? now.slice(0, 10), at: now, title: clean(fields.title, 120), data: cleanData(fields.data ?? {}), photos: Array.isArray(fields.photos) ? fields.photos : [], place: fields.place ?? null };
}
function cleanData(data) {
  const out = {};
  for (const [k, v] of Object.entries(data)) {
    if (Array.isArray(v)) out[k] = v.map((x) => clean(x, 200)).filter(Boolean);
    else if (v != null && String(v).trim()) out[k] = clean(v, 4000);
  }
  return out;
}
/** «Ingredients (one per line)» → the lines (empty ones and bullets dropped). */
export const linesOf = (text = '') => String(text).split(/\r?\n/).map((s) => s.replace(/^\s*[-•*]\s*/, '').trim()).filter(Boolean);
/** A short line under an entry's name: the first field with text. */
export function entrySub(entry, coll) {
  for (const f of fieldsOf(coll)) {
    if (f.kind === 'title' || f.kind === 'photos' || f.kind === 'place') continue;
    const v = entry?.data?.[f.key];
    if (Array.isArray(v) && v.length) return v.join(' · ');
    if (typeof v === 'string' && v) return v;
  }
  return '';
}
/** Entries filtered by tag (places: Ruhe, Aussicht …) and a search word. */
export function filterEntries(entries, { tag = '', q = '' } = {}) {
  const w = q.trim().toLowerCase();
  return entries.filter((e) => (!tag || (e.data?.tags ?? []).includes(tag)) && (!w || JSON.stringify([e.title, e.data]).toLowerCase().includes(w)));
}
/** Sorted for a collection: by the saved order, then newest first. */
export const sortEntries = (entries) => [...entries].sort((a, b) => (a.order ?? 1e9) - (b.order ?? 1e9) || String(b.at).localeCompare(String(a.at)));

/** The photos of a series, oldest first (a photo: { src, day }). */
export const seriesOf = (photos = []) => [...photos].filter((p) => p?.src).sort((a, b) => String(a.day).localeCompare(String(b.day)));

/** The text that goes on «Share» for a «Together» wish. */
export function togetherText(entry, tr = (s, v) => s.replace(/\{(\w+)\}/g, (_, k) => v?.[k] ?? '')) {
  const lines = [tr('Our next time together: {idea}', { idea: entry.title })];
  if (entry.data?.who) lines.push(tr('Who would be up for it: {who}', { who: entry.data.who }));
  if (entry.data?.when) lines.push(tr('When: {when}', { when: entry.data.when }));
  return lines.join('\n');
}
/** The invitation draft of i19 (typed parts stay as typed). */
export const inviteText = (idea, when, tr) => tr('Hi! Do you fancy «{idea}»? I would have time on {when}. Say yes, no or «another time».', { idea, when: when || tr('a day that suits you') });

/* ---------- «Worauf hab ich Lust?» ---------- */

export const MOODS = [
  { key: 'power', name: 'Go all out' },
  { key: 'play', name: 'Play' },
  { key: 'skill', name: 'Practise' },
  { key: 'easy', name: 'Easy does it' },
];
export const ENERGY = [
  { key: 'low', name: 'Running low' },
  { key: 'mid', name: 'Okay' },
  { key: 'high', name: 'Full|energy' },
];
export const AFTER = [
  { key: 'company', name: 'Company' },
  { key: 'quiet', name: 'Quiet' },
  { key: 'move', name: 'Moving' },
];
export const TIMES = [15, 30, 60, 120];

/** The ideas of the start: mood, energy, what you feel like after, minutes (all changeable). */
export const LUST_IDEAS = [
  { id: 'intervals', name: 'Intervals on the bike', mood: ['power'], energy: ['high'], after: ['move'], min: 45 },
  { id: 'hills', name: 'Hill repeats', mood: ['power'], energy: ['high'], after: ['move'], min: 60 },
  { id: 'run', name: 'A short run', mood: ['power', 'easy'], energy: ['mid', 'high'], after: ['move'], min: 30 },
  { id: 'tennis', name: 'Hit a few balls', mood: ['play'], energy: ['mid', 'high'], after: ['company'], min: 60 },
  { id: 'games', name: 'Games night', mood: ['play'], energy: ['low', 'mid'], after: ['company'], min: 120 },
  { id: 'frisbee', name: 'Frisbee in the park', mood: ['play'], energy: ['mid'], after: ['company', 'move'], min: 30 },
  { id: 'corners', name: 'Cornering on an easy loop', mood: ['skill'], energy: ['mid', 'high'], after: ['move'], min: 45 },
  { id: 'slow', name: 'Balance and slow riding', mood: ['skill'], energy: ['low', 'mid'], after: ['quiet'], min: 15 },
  { id: 'yoga', name: 'A little yoga', mood: ['easy', 'skill'], energy: ['low', 'mid'], after: ['quiet'], min: 30 },
  { id: 'walk', name: 'A walk with a tiny goal', mood: ['easy'], energy: ['low', 'mid'], after: ['quiet'], min: 30 },
  { id: 'cafe', name: 'Bike café ride', mood: ['easy'], energy: ['mid'], after: ['company'], min: 90 },
  { id: 'swim', name: 'A swim', mood: ['easy', 'power'], energy: ['mid', 'high'], after: ['move'], min: 45 },
  { id: 'stretch', name: 'Stretching on the floor', mood: ['easy'], energy: ['low'], after: ['quiet'], min: 15 },
  { id: 'long', name: 'A long, easy ride', mood: ['easy'], energy: ['mid', 'high'], after: ['move', 'quiet'], min: 120 },
  { id: 'dance', name: 'Dance in the kitchen', mood: ['play', 'power'], energy: ['low', 'mid', 'high'], after: ['move'], min: 15 },
];

/** Built-in ideas with edits, own ones, hidden ones left out. */
export function lustIdeasOf(cfg) {
  const edits = cfg?.lustEdits ?? {};
  const hidden = new Set(cfg?.lustHidden ?? []);
  const std = LUST_IDEAS.map((i) => ({ ...i, ...(edits[i.id] ?? {}), own: false, edited: !!edits[i.id] }));
  const own = (cfg?.lustOwn ?? []).filter((i) => i?.id && clean(i.name)).map((i) => ({ mood: [], energy: [], after: [], min: 30, ...i, own: true }));
  return [...std, ...own].filter((i) => !hidden.has(i.id));
}

/**
 * The three best ideas for a choice. Mood counts 3, energy 2, after 2; an idea longer than the time
 * you have is left out (when nothing fits, the shortest ones). «Worked» ticks with the same energy
 * add 1 each (up to 3): your own good experience wins. → [{ idea, score, why: [keys] }]
 */
export function lustPick(ideas, { mood = null, energy = null, after = null, time = null } = {}, log = [], top = 3) {
  let pool = ideas.filter((i) => time == null || (Number(i.min) || 0) <= time);
  if (!pool.length) pool = [...ideas].sort((a, b) => (a.min ?? 0) - (b.min ?? 0)).slice(0, top);
  const scored = pool.map((idea) => {
    const why = [];
    let score = 0;
    if (mood && idea.mood?.includes(mood)) (score += 3), why.push('mood');
    if (energy && idea.energy?.includes(energy)) (score += 2), why.push('energy');
    if (after && idea.after?.includes(after)) (score += 2), why.push('after');
    const worked = log.filter((l) => l.what === idea.id && l.ok && (!energy || l.energy === energy)).length;
    if (worked) (score += Math.min(3, worked)), why.push('worked');
    return { idea, score, why, worked };
  });
  return scored.sort((a, b) => b.score - a.score || (a.idea.min ?? 0) - (b.idea.min ?? 0)).slice(0, top);
}

/** Technique ideas (any sport; a link can lead to a video). */
export const TECHNIQUES = [
  { id: 't1', sport: 'Bike', name: 'Three lines', text: 'Ride one easy corner three times, each time on a different line. Which one feels smoothest?' },
  { id: 't2', sport: 'Bike', name: 'Look ahead', text: 'Look where you want to go, not at the stone you want to miss. Your bike follows your eyes, faithfully.' },
  { id: 't3', sport: 'Bike', name: 'Round pedalling', text: 'Five minutes with one leg leading the circle, then the other. Smooth beats strong.' },
  { id: 't4', sport: 'Tennis', name: 'Hit the towel', text: 'Put a towel in a corner and aim for it ten times. Celebrate every hit, but modestly.' },
  { id: 't5', sport: 'Tennis', name: 'Slow-motion swing', text: 'Play your forehand in slow motion five times before you start. Notice where you lose your balance.' },
  { id: 't6', sport: 'Running', name: 'Quiet feet', text: 'Run a few minutes as quietly as you can. Quiet usually means light.' },
  { id: 't7', sport: 'Any sport', name: 'One thing only', text: 'Choose one detail of a familiar move and give it all your attention for ten minutes.' },
  { id: 't8', sport: 'Yoga', name: 'Breath first', text: 'Let your breath set the pace of each pose, not the clock.' },
];
export function techniquesOf(cfg) {
  const edits = cfg?.techEdits ?? {};
  const hidden = new Set(cfg?.techHidden ?? []);
  const std = TECHNIQUES.map((x) => ({ ...x, link: '', ...(edits[x.id] ?? {}), own: false, edited: !!edits[x.id] }));
  const own = (cfg?.techOwn ?? []).filter((x) => x?.id && clean(x.name)).map((x) => ({ sport: '', text: '', link: '', ...x, own: true }));
  return [...std, ...own].filter((x) => !hidden.has(x.id));
}
/** The technique of the week: changes every ISO week (stable within a week). */
export const techOfWeek = (list, day) => (list.length ? list[isoWeek(day) % list.length] : null);

/* ---------- «Mein Abend» ---------- */
export const MAX_RITUALS = 3;
export const RITUAL_IDEAS = ['A cup of tea', 'Dim the lights', 'Read a few pages', 'Lay out tomorrow’s things', 'Phone away at nine', 'A short stretch'];
/** The rituals (up to three, as typed or a suggestion key). */
export const ritualsOf = (cfg) => (Array.isArray(cfg?.rituals) ? cfg.rituals.filter((r) => r?.id && clean(r.name)).slice(0, MAX_RITUALS) : []);
/** Tick a ritual for a day (a second tap takes it back). ticks: { [ritualId]: ['YYYY-MM-DD'] } */
export function tickRitual(ticks = {}, id, day) {
  const list = new Set(ticks[id] ?? []);
  if (list.has(day)) list.delete(day);
  else list.add(day);
  return { ...ticks, [id]: [...list].sort() };
}
/** Evenings in a row with every ritual ticked, up to `day` (today counts once it is complete). */
export function eveningsInRow(rituals, ticks = {}, day) {
  if (!rituals.length) return 0;
  const full = (d) => rituals.every((r) => (ticks[r.id] ?? []).includes(d));
  let n = 0;
  let d = day;
  if (!full(d)) d = new Date(toMs(d) - MS).toISOString().slice(0, 10);
  while (full(d)) {
    n++;
    d = new Date(toMs(d) - MS).toISOString().slice(0, 10);
  }
  return n;
}
/** Short texts to arrive: read them or let the device read them out. */
export const ARRIVE = [
  { id: 'a1', name: 'Arrive for a moment', text: 'Sit or stand the way that feels good. Notice the floor under your feet or the chair under you. Watch a few breaths, no need to improve them. Then let your eyes wander and find three things that catch your attention. That is it. You have arrived.' },
  { id: 'a2', name: 'Three breaths', text: 'Breathe in and count to four. Breathe out and count to six. Do it three times. If you lose count, that is fine: start again, nobody is keeping score.' },
  { id: 'a3', name: 'Put the day down', text: 'Think of one thing that went well today. Then think of one thing that can wait until tomorrow. Imagine putting it on a shelf. It will still be there in the morning, promised.' },
];
export const QUESTION_GROUPS = [
  { key: 'connect', name: 'Connection' },
  { key: 'thanks', name: 'Gratitude' },
  { key: 'trust', name: 'Trust' },
  { key: 'direction', name: 'Direction' },
];
export const QUESTIONS = [
  { id: 'q1', group: 'connect', text: 'When do I feel connected with myself?' },
  { id: 'q2', group: 'connect', text: 'Who did I think of fondly today?' },
  { id: 'q3', group: 'thanks', text: 'What am I grateful for this week?' },
  { id: 'q4', group: 'thanks', text: 'Which small thing made me smile lately?' },
  { id: 'q5', group: 'trust', text: 'What can I trust, even when it is stormy?' },
  { id: 'q6', group: 'trust', text: 'Where did I let go of something lately?' },
  { id: 'q7', group: 'direction', text: 'What do I want more of next year?' },
  { id: 'q8', group: 'direction', text: 'Which way feels right, even if it is slower?' },
];
export function questionsOf(cfg) {
  const hidden = new Set(cfg?.qHidden ?? []);
  const edits = cfg?.qEdits ?? {};
  const own = (cfg?.qOwn ?? []).filter((q) => q?.id && clean(q.text)).map((q) => ({ group: '', ...q, own: true }));
  return [...QUESTIONS.map((q) => ({ ...q, ...(edits[q.id] ?? {}), own: false, edited: !!edits[q.id] })), ...own].filter((q) => !hidden.has(q.id));
}

/* ---------- «Was mir wesentlich ist» ---------- */
/** The big maybes: { id, title, moment, why, step, stepDue, done: [{ text, day }] } */
export const maybesOf = (cfg) => (Array.isArray(cfg?.maybes) ? cfg.maybes.filter((m) => m?.id && clean(m.title)) : []);
/** The step is done: it goes into the list of done steps, the field is empty for the next one. */
export const stepDone = (m, day) => (clean(m.step) ? { ...m, done: [...(m.done ?? []), { text: clean(m.step), day }], step: '', stepDue: null } : m);
/** «In this phase …» entries, newest first, with the months between the first and the newest. */
export function essentialSpan(entries = []) {
  const days = entries.map((e) => e.day).filter(Boolean).sort();
  if (days.length < 2) return 0;
  const [a, b] = [days[0], days[days.length - 1]].map((d) => d.split('-').map(Number));
  return (b[0] - a[0]) * 12 + (b[1] - a[1]);
}

/* ---------- «Reise-Wünsche» ---------- */
export const LONGINGS = [
  { key: 'space', name: 'Wide open space' },
  { key: 'people', name: 'Meeting people' },
  { key: 'move', name: 'Movement' },
  { key: 'quiet', name: 'Quiet' },
  { key: 'learn', name: 'Learning something new' },
];
export function longingsOf(cfg) {
  const own = (cfg?.longOwn ?? []).filter((l) => l?.key && clean(l.name)).map((l) => ({ ...l, own: true }));
  const hidden = new Set(cfg?.longHidden ?? []);
  return [...LONGINGS.map((l) => ({ ...l, own: false })), ...own].filter((l) => !hidden.has(l.key));
}
/** Counts per longing over the collected thoughts (the strongest first). */
export function longingCounts(entries = [], longings = []) {
  return longings.map((l) => ({ ...l, n: entries.filter((e) => (e.data?.moods ?? []).includes(l.key)).length })).sort((a, b) => b.n - a.n);
}

/* ---------- «Erste Nacht» ---------- */
export const NIGHT_STEPS = [
  { key: 'question', name: 'Your test question' },
  { key: 'plan', name: 'Route and bed' },
  { key: 'day', name: 'Pack your day in your head' },
  { key: 'after', name: 'After the night' },
];
export const PHASES = [
  { key: 'wake', name: 'Getting up' },
  { key: 'start', name: 'Setting off' },
  { key: 'way', name: 'On the way' },
  { key: 'pause', name: 'At a break' },
  { key: 'evening', name: 'In the evening' },
  { key: 'night', name: 'At night' },
];
export const TEST_QUESTIONS = ['Is my luggage too heavy?', 'How far do I want to ride in a day?', 'Do I sleep well away from home?', 'Do I find things in my bags quickly?'];
/** The plan of «Erste Nacht» made safe. */
export function nightOf(cfg) {
  const n = cfg?.night && typeof cfg.night === 'object' ? cfg.night : {};
  const phases = {};
  for (const p of PHASES) phases[p.key] = Array.isArray(n.phases?.[p.key]) ? n.phases[p.key].filter((x) => x && clean(x.name)) : [];
  return { step: Number.isInteger(n.step) ? Math.min(Math.max(n.step, 0), NIGHT_STEPS.length - 1) : 0, question: n.question ?? '', route: n.route ?? '', lunch: n.lunch ?? '', bed: n.bed ?? '', tripId: n.tripId ?? null, after: n.after ?? '', phases };
}
/** All things of the day plan; how many are «within reach» and where each one sits. */
export function phaseSummary(phases = {}) {
  const all = PHASES.flatMap((p) => (phases[p.key] ?? []).map((x) => ({ ...x, phase: p.key })));
  return { n: all.length, reach: all.filter((x) => x.reach).length, noPlace: all.filter((x) => !x.where).length };
}

/* ---------- «Fürs nächste Mal» ---------- */

/**
 * The three piles over all finished debriefs:
 *   proven  packed on at least `min` trips with a done debrief and never «not used» or «broken»
 *   unused  «not used» at least once (how often)
 *   missing named under «What was missing?» (how often, the same name counted once per trip)
 * trips: [{ id, entries: [{ itemId }] }], debriefs: [{ tripId, status, items, missing }],
 * nameOf(itemId) → shown name. → { proven: [{ key, itemId, name, n }], unused: […], missing: […] }
 */
export function nextPiles({ trips = [], debriefs = [], nameOf = (id) => id, min = 2 } = {}) {
  const done = debriefs.filter((d) => d?.status === 'done');
  const byTrip = new Map(trips.map((x) => [x.id, x]));
  const packed = {};
  const bad = {};
  const unused = {};
  const missing = {};
  for (const d of done) {
    const trip = byTrip.get(d.tripId);
    for (const e of trip?.entries ?? []) if (e?.itemId) packed[e.itemId] = (packed[e.itemId] ?? 0) + 1;
    for (const [id, state] of Object.entries(d.items ?? {})) {
      bad[id] = true;
      if (state === 'unused') unused[id] = (unused[id] ?? 0) + 1;
    }
    const names = new Set();
    for (const m of d.missing ?? []) {
      const name = clean(m?.itemId ? nameOf(m.itemId) : m?.name, 120);
      if (!name || names.has(name.toLowerCase())) continue;
      names.add(name.toLowerCase());
      const key = m?.itemId ? `item:${m.itemId}` : `name:${name.toLowerCase()}`;
      missing[key] = { key, itemId: m?.itemId ?? null, name, n: (missing[key]?.n ?? 0) + 1 };
    }
  }
  const byN = (a, b) => b.n - a.n || a.name.localeCompare(b.name);
  return {
    proven: Object.entries(packed).filter(([id, n]) => n >= min && !bad[id]).map(([id, n]) => ({ key: `item:${id}`, itemId: id, name: nameOf(id), n })).sort(byN),
    unused: Object.entries(unused).map(([id, n]) => ({ key: `item:${id}`, itemId: id, name: nameOf(id), n })).sort(byN),
    missing: Object.values(missing).sort(byN),
  };
}
export const PILES = [
  { key: 'proven', name: 'Proven', hint: 'Packed again and again, always used.' },
  { key: 'unused', name: 'Just came along', hint: 'Marked «not used» in a debrief.' },
  { key: 'missing', name: 'Missing', hint: 'Named under «What was missing?».' },
];
/** The marks by key (records of the table «frei», kind 'mark'): { [key]: mark } */
export const marksByKey = (marks = []) => Object.fromEntries(marks.map((m) => [m.key, m]));
/** The sentence for the next packing list (an English key with the name filled in). */
export const markLine = (pile) => (pile === 'missing' ? 'Take {name} next time' : pile === 'unused' ? 'Leave {name} at home next time' : 'Keep {name} on the list');

/* ---------- Heute: «Idea for today» (Noah 15:31 «2a») ---------- */
/** An impulse for Heute when there is no ride idea; null when switched off or none shown. */
export function todayImpulse(cfg, day) {
  if (cfg?.onToday === false) return null;
  return impulseOfDay(impulsesOf(cfg), day, 7);
}
/** Where «Try it» of an impulse leads. */
export function impulseHref(imp, colls = []) {
  if (imp?.go?.page) return pageHref(imp.go.page);
  if (imp?.go?.coll) {
    const c = colls.find((x) => x.type === imp.go.coll && !x.hidden) ?? colls.find((x) => x.id === imp.go.coll);
    return c ? collHref(c.id) : pageHref('sammlungen');
  }
  return `#/flow/impulse?i=${imp?.id ?? ''}`;
}
