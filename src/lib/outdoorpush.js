/**
 * «Draussen» PR 2 (Noah 21.11.2026 «2b»): the button «Remind me on the phone every day at 16:00» on the card.
 * It switches the push kind `outdoor` on (and the main switch with it, which asks the browser for notifications once,
 * like Ich › Erinnerungen aufs Handy) and sends the list to the server; off switches only this kind off.
 * → { ok: true } or { ok: false, code } with the code of push/client.js ('unsupported', 'denied', 'not_set_up', 'offline' …).
 */
import { db } from './db.js';
import { PUSH_KEY, pushOf } from './push/schedule.js';

export const outdoorRemindOn = (value) => {
  const p = pushOf(value);
  return p.on && p.kinds.outdoor;
};

export async function setOutdoorRemind(on) {
  const before = (await db.settings.get(PUSH_KEY))?.value ?? null;
  const p = pushOf(before);
  const save = (value) => db.settings.put({ key: PUSH_KEY, value });
  const { syncNow, supported } = await import('./push/client.js');
  if (on && !supported()) return { ok: false, code: 'unsupported' };
  await save({ ...p, on: on ? true : p.on, kinds: { ...p.kinds, outdoor: on } });
  try {
    await syncNow({ force: true });
  } catch (e) {
    // switching off stays off even when the phone list could not be sent; switching on is taken back
    if (!on) return { ok: true };
    await save(before ?? { ...p, on: p.on, kinds: { ...p.kinds, outdoor: false } });
    return { ok: false, code: e?.code ?? 'offline' };
  }
  return { ok: true };
}
