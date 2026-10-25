/**
 * Paket C «Ruhig und persönlich» (Noah 24.10.2026, 996 Ideen «5a»): the page Ich › Ruhig und persönlich
 * (#/me/ruhig) and its sub-pages #/me/ruhig/<key>. Titles and lines are English keys for t().
 * Pure, tested in tests/ruhig.test.js.
 */
export const RUHIG_HASH = '#/me/ruhig';
export const SUBS = [
  { key: 'weniger', icon: 'leaf', title: 'Less app for the moment', sub: 'A workspace for one plan, a calm view, a budget for reminders' },
  { key: 'versuche', icon: 'flask', title: 'Small experiments', sub: 'A question, a time span, a clear end' },
  { key: 'herkunft', icon: 'search', title: 'Where a value comes from', sub: 'Measured or guessed, special days, counter-examples' },
  { key: 'spaeter', icon: 'mail', title: 'Your later self', sub: 'Letters for a moment, a later view of a day' },
  { key: 'bedeutung', icon: 'heart', title: 'Meaning next to numbers', sub: 'Trips by meaning, good decisions' },
  { key: 'koennen', icon: 'award', title: 'What you can do', sub: 'A skill map; know-how instead of gear' },
  { key: 'teilen', icon: 'share', title: 'Share with a preview', sub: 'See what the other person sees' },
  { key: 'zahlen', icon: 'ruler', title: 'Numbers that stay clear', sub: 'One ride, two roles; what a scale meant; a talk about body values' },
  { key: 'belege', icon: 'message', title: 'Assistant with sources', sub: 'Answers with your entries, own no-gos, question a plan' },
];
export const subOf = (key) => SUBS.find((s) => s.key === key) ?? null;
/** The sub-page of a hash: «#/me/ruhig/versuche?x» → 'versuche'; the overview → ''. */
export function subKeyOf(hash) {
  const m = /^#\/me\/ruhig\/([a-z]+)/.exec(String(hash ?? ''));
  return m && subOf(m[1]) ? m[1] : '';
}
export const subHash = (key) => (key ? `${RUHIG_HASH}/${key}` : RUHIG_HASH);
