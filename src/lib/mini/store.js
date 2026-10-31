/**
 * Mini-Tools: what this device keeps (db.settings, no new table, so the backup has it as it is).
 *
 *   'mini-tools'   [{ id, kind, title, note, opts, made, srv: { id, key, del, end, pub, priv } | null,
 *                     answers: [{ a, name, picks, note, at }], me: { picks }, read, closed }]
 *                  (the questions I made; answers are a copy of the last read)
 *   'mini-joined'  { [server id]: { aid, del, name, picks, note, at } }  (my answers to other people's questions)
 */
export const MINE_KEY = 'mini-tools';
export const JOINED_KEY = 'mini-joined';

export const listOf = (v) => (Array.isArray(v) ? v.filter((x) => x && typeof x.id === 'string') : []);
export const joinedOf = (v) => (v && typeof v === 'object' && !Array.isArray(v) ? v : {});

export async function readMine(db) {
  return listOf((await db.settings.get(MINE_KEY))?.value);
}
export async function saveMine(db, list) {
  await db.settings.put({ key: MINE_KEY, value: list });
}
/** Change one question (fn gets a copy and returns the new one). */
export async function updateOne(db, id, fn) {
  const list = await readMine(db);
  const next = list.map((x) => (x.id === id ? fn(structuredClone(x)) : x));
  await saveMine(db, next);
  return next.find((x) => x.id === id) ?? null;
}
export async function readJoined(db) {
  return joinedOf((await db.settings.get(JOINED_KEY))?.value);
}
export async function saveJoined(db, sid, entry) {
  const all = await readJoined(db);
  await db.settings.put({ key: JOINED_KEY, value: { ...all, [sid]: entry } });
}

/** Is the question still open on the server? */
export const running = (q, now = Date.now()) => !!q?.srv?.id && !q.closed && Date.parse(q.srv.end) > now;
