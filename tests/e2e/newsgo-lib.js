// «Ausprobieren» (Noah 27.10.2026): where a line of «What is new» leads, for specs. know/newsgo.js needs Svelte
// (through the catalogue), so this reads the same rules from plain files: a line's go (or newsgo-map.js), else its href.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { GO } from '../../src/lib/know/newsgo-map.js';

const src = readFileSync(fileURLToPath(new URL('../../src/lib/features.js', import.meta.url)), 'utf8');
const FEAT_HREF = Object.fromEntries([...src.matchAll(/\{ id: '([^']+)'[^\n]*?href: '([^']+)'/g)].map((m) => [m[1], m[2]]));

/** The target of a line: undefined (none given), null (no link), a function id or an object. */
export const goOf = (p) => (Object.hasOwn(p, 'go') ? p.go : Object.hasOwn(GO, p.text) ? GO[p.text] : undefined);

/** The address a line's link shows, or null when the line is no link. */
export function linkOf(p) {
  const g = goOf(p);
  if (g === undefined) return p.href || p.action ? (p.href ?? null) : null;
  if (g === null) return null;
  if (typeof g === 'string') return FEAT_HREF[g] ?? null;
  return g.href ?? '#/me/news';
}

/** Is the target exact (a function, steps, or a line where it shows up)? */
const exact = (g) => g != null && (typeof g === 'string' || !!g.steps?.length || !!g.where);

/** The line «Try it» of a version takes (know/newsgo.js tryOf). */
export function tryLine(e) {
  const rows = [...(e.points ?? []), ...(e.small ?? [])].filter((p) => linkOf(p));
  return rows.find((p) => exact(goOf(p))) ?? rows[0] ?? null;
}
