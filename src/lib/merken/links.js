/**
 * «Gehört zu» (Noah 05.11.2026 «N3»): a to-do can belong to a trip, a bike or a note. Stored on the to-do:
 * todo.links = [{ kind: 'trip' | 'bike' | 'note', ref: id, label }]. The label is the name at the time (a fallback
 * when the thing is gone). The trip, the bike and the note show their open to-dos; nothing is mandatory.
 * Pure functions; the caller writes (merkendb.js).
 */

export const LINK_KINDS = ['trip', 'bike', 'note'];
export const linksOf = (todo) => (Array.isArray(todo?.links) ? todo.links : []);

/** The to-do with one more link (once per thing; an unknown kind or an empty ref changes nothing). */
export function addLink(todo, link) {
  if (!link || !LINK_KINDS.includes(link.kind) || !link.ref) return todo;
  if (linksOf(todo).some((l) => l.kind === link.kind && l.ref === link.ref)) return todo;
  return { ...todo, links: [...linksOf(todo), { kind: link.kind, ref: String(link.ref), label: String(link.label ?? '').slice(0, 80) }] };
}
export const removeLink = (todo, kind, ref) => ({ ...todo, links: linksOf(todo).filter((l) => !(l.kind === kind && l.ref === ref)) });

/** The open to-dos that belong to one trip, bike or note, in the order they are kept. */
export const todosFor = (todos, kind, ref) =>
  (todos ?? []).filter((td) => !td.kind && !td.doneAt && !td.off && linksOf(td).some((l) => l.kind === kind && l.ref === ref));

/** The name of a link now: the live name when the thing still exists, else the stored label. */
export function linkName(link, { trips = [], bikes = [], notes = [] } = {}, noteName = (n) => n?.title || n?.text || '') {
  const live = link.kind === 'trip' ? trips.find((x) => x.id === link.ref)?.title : link.kind === 'bike' ? bikes.find((x) => x.id === link.ref)?.name : noteName(notes.find((x) => x.id === link.ref));
  return live || link.label || '';
}
