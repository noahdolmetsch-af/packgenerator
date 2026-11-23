/**
 * «Challenges» (Noah 22.11.2026): the phone reminder of an own challenge. It switches the push kind `ziele` on (and the
 * main switch with it, which asks the browser for notifications once) and sends the list to the server. The time of the
 * reminder sits in each challenge (`remindAt`). → { ok: true } or { ok: false, code } with the code of push/client.js.
 */
import { db } from './db.js';
import { PUSH_KEY, pushOf } from './push/schedule.js';

export const zielRemindOn = (value) => {
  const p = pushOf(value);
  return p.on && p.kinds.ziele;
};

/** Switch the kind on (a challenge got a time). Off is the switch under Ich › Erinnerungen aufs Handy. */
export async function ensureZielRemind() {
  const before = (await db.settings.get(PUSH_KEY))?.value ?? null;
  const p = pushOf(before);
  if (zielRemindOn(before)) return { ok: true };
  const { syncNow, supported } = await import('./push/client.js');
  if (!supported()) return { ok: false, code: 'unsupported' };
  await db.settings.put({ key: PUSH_KEY, value: { ...p, on: true, kinds: { ...p.kinds, ziele: true } } });
  try {
    await syncNow({ force: true });
  } catch (e) {
    await db.settings.put({ key: PUSH_KEY, value: before ?? { ...p, kinds: { ...p.kinds, ziele: false } } });
    return { ok: false, code: e?.code ?? 'offline' };
  }
  return { ok: true };
}
