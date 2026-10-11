/**
 * Hobby pages 2 «Kissenzeit» (B1, B8; H6a, H28a): the quotes. Only authors who died long ago, and
 * only our own translations from the original (design/hobby-seiten/zitate.md): the German and English
 * text is in the record (not via t()), the source line says «public domain · own translation».
 * The first five are on by default; six more are a suggestion to add. Own quotes (setting flow.quotes)
 * stay on the device and never come into the repository.
 */
export const QUOTES_KEY = 'flow.quotes';

export const QUOTES = [
  {
    id: 'aurel-5-16',
    std: true,
    author: 'Marcus Aurelius',
    authorDe: 'Marc Aurel',
    source: 'Meditations V,16',
    sourceDe: 'Selbstbetrachtungen V,16',
    de: 'Wie du oft denkst, so wird dein Geist. Denn die Seele nimmt die Farbe ihrer Gedanken an.',
    en: 'As you often think, so your mind becomes; for the soul takes on the colour of its thoughts.',
    orig: 'Οἷα ἂν πολλάκις φαντασθῇς, τοιαύτη σοι ἔσται ἡ διάνοια· βάπτεται γὰρ ὑπὸ τῶν φαντασιῶν ἡ ψυχή.',
  },
  {
    id: 'laozi-64',
    std: true,
    author: 'Laozi',
    authorDe: 'Laozi',
    source: 'Daodejing 64',
    sourceDe: 'Daodejing 64',
    de: 'Eine Reise von tausend Meilen beginnt unter deinen Füssen.',
    en: 'A journey of a thousand miles begins beneath your feet.',
    orig: '千里之行，始於足下。',
  },
  {
    id: 'epiktet-5',
    std: true,
    author: 'Epictetus',
    authorDe: 'Epiktet',
    source: 'Enchiridion 5',
    sourceDe: 'Handbüchlein der Moral 5',
    de: 'Nicht die Dinge beunruhigen die Menschen, sondern ihre Meinungen über die Dinge.',
    en: 'It is not things that disturb people, but their opinions about things.',
    orig: 'Ταράσσει τοὺς ἀνθρώπους οὐ τὰ πράγματα, ἀλλὰ τὰ περὶ τῶν πραγμάτων δόγματα.',
  },
  {
    id: 'pascal-139',
    std: true,
    author: 'Blaise Pascal',
    authorDe: 'Pascal',
    source: 'Pensées 139 (Brunschvicg)',
    sourceDe: 'Pensées 139 (Brunschvicg)',
    de: 'Alles Unglück der Menschen kommt von einem Einzigen: dass sie nicht ruhig in einem Zimmer bleiben können.',
    en: "All of people's unhappiness comes from one thing alone: not knowing how to stay quietly in a room.",
    orig: '… tout le malheur des hommes vient d’une seule chose, qui est de ne savoir pas demeurer en repos dans une chambre.',
  },
  {
    id: 'seneca-104',
    std: true,
    author: 'Seneca',
    authorDe: 'Seneca',
    source: 'Letters to Lucilius 104,26',
    sourceDe: 'Briefe an Lucilius 104,26',
    de: 'Nicht weil es schwer ist, wagen wir es nicht; weil wir es nicht wagen, ist es schwer.',
    en: 'It is not because things are hard that we do not dare; it is because we do not dare that they are hard.',
    orig: 'Non quia difficilia sunt non audemus, sed quia non audemus difficilia sunt.',
  },
  {
    id: 'aurel-4-3',
    author: 'Marcus Aurelius',
    authorDe: 'Marc Aurel',
    source: 'Meditations IV,3',
    sourceDe: 'Selbstbetrachtungen IV,3',
    de: 'Nirgends zieht sich der Mensch ruhiger und ungestörter zurück als in die eigene Seele.',
    en: 'Nowhere does a person retreat more quietly and undisturbed than into their own soul.',
    orig: 'οὐδαμοῦ γὰρ οὔτε ἡσυχιώτερον οὔτε ἀπραγμονέστερον ἄνθρωπος ἀναχωρεῖ ἢ εἰς τὴν ἑαυτοῦ ψυχήν.',
  },
  {
    id: 'dhammapada-1',
    author: 'Dhammapada',
    authorDe: 'Dhammapada',
    source: 'verse 1',
    sourceDe: 'Vers 1',
    de: 'Allem geht der Geist voran, der Geist ist das Wichtigste, aus Geist ist alles gemacht.',
    en: 'Mind goes before all things; mind is foremost; all is made of mind.',
    orig: 'Manopubbaṅgamā dhammā, manoseṭṭhā manomayā.',
  },
  {
    id: 'dhammapada-5',
    author: 'Dhammapada',
    authorDe: 'Dhammapada',
    source: 'verse 5',
    sourceDe: 'Vers 5',
    de: 'Feindschaft kommt durch Feindschaft nie zur Ruhe. Ohne Feindschaft kommt sie zur Ruhe. Das ist ein altes Gesetz.',
    en: 'Hatred is never calmed by hatred. Without hatred it is calmed. This is an old law.',
    orig: 'Na hi verena verāni sammantīdha kudācanaṃ; averena ca sammanti, esa dhammo sanantano.',
  },
  {
    id: 'laozi-16',
    author: 'Laozi',
    authorDe: 'Laozi',
    source: 'Daodejing 16',
    sourceDe: 'Daodejing 16',
    de: 'Erreiche die äusserste Leere, bewahre tiefe Stille.',
    en: 'Reach the utmost emptiness, keep a deep stillness.',
    orig: '致虛極，守靜篤。',
  },
  {
    id: 'laozi-33',
    author: 'Laozi',
    authorDe: 'Laozi',
    source: 'Daodejing 33',
    sourceDe: 'Daodejing 33',
    de: 'Wer andere kennt, ist klug. Wer sich selbst kennt, ist klar.',
    en: 'Who knows others is clever. Who knows themselves is clear.',
    orig: '知人者智，自知者明。',
  },
  {
    id: 'seneca-1-3',
    author: 'Seneca',
    authorDe: 'Seneca',
    source: 'Letters to Lucilius 1,3',
    sourceDe: 'Briefe an Lucilius 1,3',
    de: 'Alles, Lucilius, gehört anderen; nur die Zeit gehört uns.',
    en: 'Everything, Lucilius, belongs to others; only time is ours.',
    orig: 'Omnia, Lucili, aliena sunt, tempus tantum nostrum est.',
  },
];

/** The setting made safe: { add: [ids of suggestions taken], off: [ids left out], own: [{ id, text, source }] }. */
export function quoteSet(v) {
  const o = v && typeof v === 'object' ? v : {};
  const ids = (l) => (Array.isArray(l) ? l.filter((x) => typeof x === 'string') : []);
  const own = (Array.isArray(o.own) ? o.own : []).filter((q) => q && typeof q.text === 'string' && q.text.trim()).map((q) => ({ id: String(q.id), text: q.text.trim(), source: String(q.source ?? '').trim() }));
  return { add: ids(o.add), off: ids(o.off), own };
}
/**
 * The quotes to show and the suggestions still open, in the language: { shown: [{ id, text, line,
 * orig?, own? }], sugg: [...] }. de: the app speaks German.
 */
export function quotesOf(setting, de = true) {
  const s = quoteSet(setting);
  const view = (q) => ({ id: q.id, text: de ? q.de : q.en, author: de ? q.authorDe : q.author, source: de ? q.sourceDe : q.source, orig: q.orig });
  const on = QUOTES.filter((q) => (q.std || s.add.includes(q.id)) && !s.off.includes(q.id));
  const sugg = QUOTES.filter((q) => !q.std && !s.add.includes(q.id) && !s.off.includes(q.id));
  return { shown: [...on.map(view), ...s.own.map((q) => ({ id: q.id, text: q.text, source: q.source, own: true }))], sugg: sugg.map(view), off: QUOTES.filter((q) => s.off.includes(q.id)).length };
}
/** One quote for the day (B3, later): the same all day, the next one tomorrow. */
export function quoteOfDay(shown, day) {
  if (!shown.length) return null;
  const n = Math.floor(Date.parse(`${day}T00:00:00Z`) / 86400000);
  return shown[((n % shown.length) + shown.length) % shown.length];
}
