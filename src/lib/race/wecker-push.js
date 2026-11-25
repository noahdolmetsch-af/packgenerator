/**
 * «Anmelde-Wecker» (Noah 24.11.2026, idea 2): the phone alarm of a race of the race atlas. It switches the push kind
 * `atlaswake` on (and the main switch with it, which asks the browser for notifications once) and sends the list to the
 * server. Off is the switch under Ich › Erinnerungen aufs Handy. → { ok: true } or { ok: false, code } with the code of
 * push/client.js.
 */
import { db } from '../db.js';
import { PUSH_KEY, pushOf } from '../push/schedule.js';

export const wakeOn = (value) => {
  const p = pushOf(value);
  return p.on && p.kinds.atlaswake;
};

export async function ensureAtlasWake() {
  const before = (await db.settings.get(PUSH_KEY))?.value ?? null;
  const p = pushOf(before);
  if (wakeOn(before)) return { ok: true };
  const { syncNow, supported } = await import('../push/client.js');
  if (!supported()) return { ok: false, code: 'unsupported' };
  await db.settings.put({ key: PUSH_KEY, value: { ...p, on: true, kinds: { ...p.kinds, atlaswake: true } } });
  try {
    await syncNow({ force: true });
  } catch (e) {
    await db.settings.put({ key: PUSH_KEY, value: before ?? { ...p, kinds: { ...p.kinds, atlaswake: false } } });
    return { ok: false, code: e?.code ?? 'offline' };
  }
  return { ok: true };
}
