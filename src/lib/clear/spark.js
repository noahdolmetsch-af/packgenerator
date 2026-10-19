/**
 * Paket Q #340 «Leere Stellen zeigen eigene Inhalte»: an empty place shows one thing of your own
 * instead of nothing: a learning from an earlier trip or one of your inspiration links. The choice
 * changes once a day (the same all day). Pure, tested in tests/spark.test.js.
 */

/** A small number from a text (the day plus the place), so every place picks its own thing. */
function seedOf(s) {
  let h = 0;
  for (const c of String(s)) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return h;
}

/**
 * learnings: [{ id, rule, source }], links: [{ id, url, title }] → one spark or null:
 * { kind: 'learning', text, from } or { kind: 'link', text, href }.
 */
export function sparkOf({ learnings = [], links = [] }, day, place = '') {
  const pool = [
    ...learnings.filter((l) => l?.rule?.trim() && !l.archived).map((l) => ({ kind: 'learning', text: l.rule.trim(), from: l.source ?? '' })),
    ...links.filter((l) => l?.url && (l.title || l.url)).map((l) => ({ kind: 'link', text: l.title || l.url, href: l.url })),
  ];
  if (!pool.length) return null;
  return pool[seedOf(`${day}|${place}`) % pool.length];
}
