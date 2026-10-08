/**
 * v0.35.0 (Noah, from now on every release): "New in the last updates" at the top of "What the app
 * can do" (#/features), and once after an update a quiet line on Today. Each release adds an entry
 * at the top: version, date, 2-4 points in plain words (English keys for t(), German in
 * i18n/de/whatsnew.js), each with the address of the exact place ("Try it").
 * action 'data': the place is "Your data" on Today (nav.js openData) instead of an address.
 * Pure, tested in tests/whatsnew.test.js.
 */

export const WHATS_NEW = [
  {
    version: '0.36.0',
    date: '2026-10-08',
    points: [
      { text: '"Check import": your reviewed gear list waits on its own page; nothing goes into Gear before you check it.', href: '#/gear/import' },
      { text: 'One button takes the safe ones; unsure items are decided with one tap. A backup comes first, "Undo" puts it back.', href: '#/gear/import' },
      { text: 'Items the list does not name can be archived: they move to Gone, past trips stay complete.', href: '#/gear/import' },
      { text: 'New areas for your items: Cycling, Hiking and Everyday.', href: '#/gear' },
    ],
  },
  {
    version: '0.35.0',
    date: '2026-10-08',
    points: [
      { text: 'Switch between your trips: the small "more" button in the dark band lists every trip and debrief still in progress.', href: '#/pack' },
      { text: 'After every change the band says "Saved ✓" for a moment.', href: '#/pack?day' },
      { text: 'Nothing typed is lost: a new trip, a new item and a quick note are kept as soon as you type, also when you close the window.', href: '#/pack' },
      { text: 'This list: what is new, with a button to try each point.', href: '#/features' },
    ],
  },
  {
    version: '0.34.0',
    date: '2026-10-08',
    points: [
      { text: 'Today shows the next step until the trip, with a small timeline.', href: '#/' },
      { text: 'A shopping list and a charge list for the days before the trip.', href: '#/pack?shop' },
      { text: 'On a trip of several days, On the way has a block for the evening.', href: '#/ride' },
      { text: 'Send the backup to your other device; an import says whether it is newer or older.', href: '#/', action: 'data' },
    ],
  },
  {
    version: '0.33.0',
    date: '2026-10-08',
    points: [
      { text: 'Every new trip brings everything in Standard, also from a template or a copy.', href: '#/pack' },
      { text: '"Leave at home" really takes the item out of Standard.', href: '#/gear' },
      { text: 'Standard items you did not use show on the ballast card (tools and what you wear never).', href: '#/pack' },
    ],
  },
  {
    version: '0.32.0',
    date: '2026-10-08',
    points: [
      { text: 'The same words everywhere: building blocks, templates, "On me".', href: '#/blocks' },
      { text: 'The item window has two switches: Standard and On me.', href: '#/gear' },
      { text: 'In Gear, the filter "Comes along" (computer): Standard, On me, in a building block, stays at home.', href: '#/gear' },
      { text: 'The building blocks page in three groups.', href: '#/blocks' },
    ],
  },
];

/** How many versions show open; the older ones fold away. */
export const SHOWN = 3;
/** localStorage: the newest version seen on Today. */
export const SEEN_KEY = 'whatsnew.seen';
/** The version before this list existed: a device with data but no mark comes from there. */
export const BEFORE = '0.34.0';

/** -1, 0 or 1 for two versions like "0.35.0" (missing parts count as 0). */
export function compareVersions(a = '0', b = '0') {
  const pa = String(a).split('.').map((x) => Number(x) || 0);
  const pb = String(b).split('.').map((x) => Number(x) || 0);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const d = (pa[i] ?? 0) - (pb[i] ?? 0);
    if (d) return d < 0 ? -1 : 1;
  }
  return 0;
}

/** The entries to show open (the newest SHOWN) and the older ones (folded). */
export function splitNews(list = WHATS_NEW, shown = SHOWN) {
  return { recent: list.slice(0, shown), older: list.slice(shown) };
}

/**
 * Today's hint "New since your last visit": { show, mark }. seen: the stored version (null: none);
 * hasData: the device has trips, items or bikes (then it is an update from before this list, not a
 * first install). show: say it once now; mark: the version to store (null: nothing to store).
 * A first install (no mark, no data) shows nothing and stores the current version.
 */
export function newsHint(seen, hasData, current = WHATS_NEW[0].version) {
  const from = seen ?? (hasData ? BEFORE : null);
  if (from == null) return { show: false, mark: current };
  if (compareVersions(from, current) >= 0) return { show: false, mark: seen === current ? null : current };
  return { show: true, mark: current };
}

/** The entries newer than a version (what changed since the last visit). */
export const newerThan = (version, list = WHATS_NEW) => list.filter((e) => compareVersions(e.version, version) > 0);
