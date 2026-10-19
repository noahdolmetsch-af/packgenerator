/**
 * Trello (Noah 19.10.2026 «1a 2a 3b 4a 5a» and «1a 2a»): the Merken to-dos and each own list can live in
 * the app only or also in Trello, on ONE fresh board «Packgenerator» in his workspace «Packgenerator».
 * Both directions. Every list has exactly one place: app only, or app + Trello (Google Tasks keeps its own
 * lists on «Termine und Aufgaben»; nothing is copied between Trello and Google).
 *
 * Pure functions; trello/sync.js reads and writes the app data around them.
 *
 *   unit  = { key, kind: 'todos' | 'list', name, sync: boolean, link: null | { id, name, seen: [cardId] }, items: [item] }
 *   item  = { id, text, due: day | null, done: boolean, t: null | { id, name, due, done }, repeat? }
 *           t is what Trello had at the last sync (the common base of a three-way merge).
 *   board = { board: { id }, lists: [{ id, name }], cards: [{ id, list, name, due, done }] }  (server step «board»)
 *   reg   = { boardId, seenLists: [listId] }
 *
 * Rules of the merge:
 * - A field changed in Trello since the last sync wins; else a field changed in the app goes to Trello.
 * - A card that was there at the last sync but has no item any more was deleted in the app → archived in Trello.
 * - An item whose card is gone from its list (deleted, archived or moved) goes from that list; a card moved
 *   to another linked list arrives there as new.
 * - A new card (or Trello list) becomes a new item (or list) in the app; one with the same text as an item
 *   not sent yet is that item (so two devices never make it twice).
 * - A list archived in Trello becomes «app only» again with all its items. Switching a list to «app only»
 *   or deleting it in the app archives its Trello list (it stays in Trello's archive).
 */

export const TRELLO_KEY = 'trello';
export const TODOS_KEY = 'todos';
export const LREF = (key) => `L:${key}`;
export const CREF = (id) => `C:${id}`;

const FIELDS = ['name', 'due', 'done'];
const snap = (it) => ({ name: it.text, due: it.due ?? null, done: !!it.done });
const norm = (s) => String(s ?? '').trim().toLowerCase();

/**
 * Brings app and Trello together. newKey() gives the key of a list that comes from Trello; newItemId() the id
 * of an item that comes from Trello; onDone(item) may change an item ticked in Trello (a repeating to-do moves
 * on instead of being done). Returns { units, ops, reg }: the units as they are after the sync (new ones from
 * Trello included, items waiting for a Trello id have t.id = null), the changes Trello still needs and the new reg.
 */
export function reconcile(unitsIn, board, regIn = {}, { newKey, newItemId, onDone = (x) => x } = {}) {
  const lists = new Map(board.lists.map((l) => [l.id, l]));
  const cardsOf = new Map(board.lists.map((l) => [l.id, []]));
  for (const c of board.cards) cardsOf.get(c.list)?.push(c);
  const fresh = regIn.boardId && regIn.boardId !== board.board.id;
  // a new board (the old one was deleted in Trello): every link starts again, nothing is lost in the app
  const units = fresh ? unitsIn.map((u) => ({ ...u, link: null, items: u.items.map((it) => ({ ...it, t: null })) })) : unitsIn;
  const seenLists = new Set(fresh ? [] : (regIn.seenLists ?? []));
  const ops = [];
  const out = [];
  const linked = new Set(units.filter((u) => u.link?.id).map((u) => u.link.id));
  const unlink = (u) => ({ ...u, link: null, items: u.items.map((it) => ({ ...it, t: null })) });

  // Trello lists that are new to the app and match a list waiting to be sent (same name): the same list
  const newLists = board.lists.filter((l) => !linked.has(l.id) && !seenLists.has(l.id));
  const bindList = new Map();
  for (const u of units) {
    if (!u.sync || u.link) continue;
    const l = newLists.find((x) => norm(x.name) === norm(u.name) && ![...bindList.values()].includes(x.id));
    if (l) bindList.set(u.key, l.id);
  }

  for (const u0 of units) {
    let u = u0;
    if (u.link?.id && !lists.has(u.link.id)) {
      // archived or deleted in Trello: app only again
      out.push({ ...unlink(u), sync: false });
      continue;
    }
    if (!u.sync) {
      if (u.link?.id) ops.push({ op: 'list-archive', id: u.link.id });
      out.push(u.link ? unlink(u) : u);
      continue;
    }
    if (!u.link?.id && bindList.has(u.key)) {
      const l = lists.get(bindList.get(u.key));
      u = { ...u, link: { id: l.id, name: l.name, seen: [] } };
    }
    if (!u.link?.id) {
      // newly sent to Trello: the list, then every item as a card
      const ref = LREF(u.key);
      ops.push({ op: 'list-new', ref, name: u.name });
      const items = u.items.map((it) => {
        ops.push({ op: 'card-new', ref: CREF(it.id), listRef: ref, name: it.text, due: it.due ?? null, done: !!it.done });
        return { ...it, t: { id: null, ...snap(it) } };
      });
      out.push({ ...u, link: { id: null, name: u.name, seen: [] }, items });
      continue;
    }
    const tl = lists.get(u.link.id);
    let name = u.name;
    if (tl.name !== u.link.name) name = u.kind === 'list' ? tl.name : u.name;
    else if (u.kind === 'list' && u.name !== u.link.name) ops.push({ op: 'list-rename', id: tl.id, name: u.name });
    const cards = cardsOf.get(tl.id) ?? [];
    const byId = new Map(cards.map((c) => [c.id, c]));
    const seen = new Set(u.link.seen ?? []);
    const used = new Set();
    const items = [];
    for (const it0 of u.items) {
      let it = it0;
      if (!it.t?.id) {
        // not in Trello yet: a new card with the same text (another device sent it) is this item
        const twin = cards.find((c) => !seen.has(c.id) && !used.has(c.id) && norm(c.name) === norm(it.text) && !u.items.some((x) => x.t?.id === c.id));
        if (twin) it = { ...it, t: { id: twin.id, ...snap(it) } };
      }
      if (!it.t?.id) {
        ops.push({ op: 'card-new', ref: CREF(it.id), list: tl.id, name: it.text, due: it.due ?? null, done: !!it.done });
        items.push({ ...it, t: { id: null, ...snap(it) } });
        continue;
      }
      const card = byId.get(it.t.id);
      if (!card) continue; // gone from this list in Trello
      used.add(card.id);
      const base = it.t;
      const app = snap(it);
      const next = {};
      for (const f of FIELDS) next[f] = card[f] !== base[f] ? card[f] : app[f];
      let merged = { ...it, text: next.name, due: next.due, done: next.done };
      if (next.done && !base.done && card.done && !app.done) merged = onDone(merged);
      const final = snap(merged);
      const set = {};
      for (const f of FIELDS) if (final[f] !== card[f]) set[f] = final[f];
      if (Object.keys(set).length) ops.push({ op: 'card-set', id: card.id, ...set });
      items.push({ ...merged, t: { id: card.id, ...final } });
    }
    for (const c of cards) {
      if (used.has(c.id)) continue;
      if (seen.has(c.id)) {
        ops.push({ op: 'card-archive', id: c.id }); // deleted in the app
        continue;
      }
      const it = { id: newItemId(), text: c.name, due: c.due, done: c.done, t: { id: c.id, name: c.name, due: c.due, done: c.done }, fromTrello: true };
      items.push(it);
    }
    out.push({ ...u, name, link: { id: tl.id, name: u.kind === 'todos' || tl.name !== u.link.name ? tl.name : name, seen: items.map((x) => x.t?.id).filter(Boolean) }, items });
  }

  const bound = new Set([...bindList.values()]);
  for (const l of board.lists) {
    if (linked.has(l.id) || bound.has(l.id)) continue;
    if (seenLists.has(l.id)) {
      ops.push({ op: 'list-archive', id: l.id }); // the list was deleted in the app
      continue;
    }
    const items = (cardsOf.get(l.id) ?? []).map((c) => ({ id: newItemId(), text: c.name, due: c.due, done: c.done, t: { id: c.id, name: c.name, due: c.due, done: c.done }, fromTrello: true }));
    out.push({ key: newKey(), kind: 'list', name: l.name, sync: true, link: { id: l.id, name: l.name, seen: items.map((x) => x.t.id) }, items, fromTrello: true });
  }
  const reg = { boardId: board.board.id, seenLists: out.filter((u) => u.link?.id).map((u) => u.link.id) };
  return { units: out, ops, reg };
}

/** After Trello made the new lists and cards: their ids into the units (and the reg). results: [{ ref, id }] */
export function bindIds(units, results, reg) {
  const ids = new Map(results.filter((r) => r.ref && r.id).map((r) => [r.ref, r.id]));
  const out = units.map((u) => {
    if (!u.link) return u;
    const lid = u.link.id ?? ids.get(LREF(u.key)) ?? null;
    const items = u.items.map((it) => (it.t && !it.t.id && ids.get(CREF(it.id)) ? { ...it, t: { ...it.t, id: ids.get(CREF(it.id)) } } : it));
    if (!lid) return { ...u, link: null, items: items.map((it) => ({ ...it, t: null })) };
    return { ...u, link: { ...u.link, id: lid, seen: items.map((x) => x.t?.id).filter(Boolean) }, items };
  });
  return { units: out, reg: { ...reg, seenLists: out.filter((u) => u.link?.id).map((u) => u.link.id) } };
}

/** Cut the changes into parts the server takes at once (a later part gets the new list ids, withIds). */
export function opParts(ops, max = 60) {
  const parts = [];
  for (let i = 0; i < ops.length; i += max) parts.push(ops.slice(i, i + max));
  return parts;
}

/** A part with the lists made in earlier parts filled in (listRef → list). made: Map ref → id */
export const withIds = (part, made) => part.map((op) => (op.listRef && made.has(op.listRef) ? { ...op, list: made.get(op.listRef), listRef: undefined } : op));

/** The open items of Trello lists that are due (today or late), for «Heute wichtig» (Noah «5a»). */
export function dueInTrello(units, today) {
  const out = [];
  for (const u of units) {
    if (!u.sync || !u.link) continue;
    for (const it of u.items) if (!it.done && it.due && it.due <= today) out.push({ unit: u, item: it });
  }
  return out.sort((a, b) => a.item.due.localeCompare(b.item.due));
}
