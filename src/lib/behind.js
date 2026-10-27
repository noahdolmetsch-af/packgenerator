// Hängt das Handy fest? (Noah 20.10.2026 «bitte sicherstellen, dass das in Zukunft nicht wieder passiert»)
// His phone stayed on 0.157 for a day while 0.165 was online: the browser kept the old offline copy
// (most likely the new one never finished storing). swupdate.js asks for new versions, but when storing
// keeps failing, nothing told him. Now:
// - every build writes version.json next to the app (vite.config.js); it is never in the offline copy,
// - the app asks for it (on start, when it comes back, every hour) and compares with its own version,
// - when a newer version has been online for 15 minutes and this device still runs the old one,
//   a small bar says so (since 27.10.2026 after 2 minutes, before 15), with «Jetzt laden» (freshreload.js: loads anew from the internet, data stays).
// The 15 minutes give the normal update time to work first, so the bar only shows when it is stuck.
import { freshReload } from './freshreload.js';
import { t } from './i18n.svelte.js';

export const KEY = 'pg-behind';
// 27.10.2026 (Noah «1-5 a», question 3): 2 minutes instead of 15, so a stuck device hears about it soon
export const WAIT = 2 * 60 * 1000;
const BAR = 'data-behind-bar';

/** true when version a is newer than version b («0.165.0» > «0.157.0»). */
export function newer(a, b) {
  const pa = String(a).split('.').map(Number);
  const pb = String(b).split('.').map(Number);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const x = pa[i] || 0;
    const y = pb[i] || 0;
    if (x !== y) return x > y;
  }
  return false;
}

let memo = null; // when localStorage is not there

/**
 * Asks for the online version. Returns it when this device has been behind for WAIT, else null.
 */
/** The version that is online right now (version.json, never from the offline copy), or null offline / on an error. */
export async function onlineVersion(w = globalThis, { now = Date.now(), base = import.meta.env.BASE_URL } = {}) {
  if (w.navigator?.onLine === false) return null;
  try {
    const r = await w.fetch(`${base}version.json?t=${now}`, { cache: 'no-store' });
    if (!r.ok) return null;
    return (await r.json())?.version || null;
  } catch {
    return null;
  }
}

export async function checkBehind(w = globalThis, { now = Date.now(), running = __APP_VERSION__, base = import.meta.env.BASE_URL } = {}) {
  const live = await onlineVersion(w, { now, base });
  if (live === null) return null;
  const ls = (() => { try { return w.localStorage ?? null; } catch { return null; } })();
  if (!live || !newer(live, running)) {
    memo = null;
    try { ls?.removeItem(KEY); } catch { /* nothing */ }
    return null;
  }
  let seen = ls ? null : memo;
  try { if (ls) seen = JSON.parse(ls.getItem(KEY) ?? 'null'); } catch { seen = memo; }
  if (!seen || seen.v !== live) {
    seen = { v: live, at: now };
    memo = seen;
    try { ls?.setItem(KEY, JSON.stringify(seen)); } catch { /* memo keeps it */ }
  }
  return now - seen.at >= WAIT ? live : null;
}

/** The small bar at the top: «Version X ist da …» with «Jetzt laden» and «Später». */
export function showBehind(w, live) {
  const d = w.document;
  if (!d?.body || d.querySelector(`[${BAR}]`)) return;
  const bar = d.createElement('div');
  bar.setAttribute(BAR, '');
  bar.setAttribute('role', 'status');
  bar.style.cssText = 'position:fixed;left:8px;right:8px;top:calc(8px + env(safe-area-inset-top,0px));z-index:9998;display:flex;flex-wrap:wrap;gap:8px;align-items:center;padding:10px 12px;border-radius:12px;background:#1f3a33;color:#fff;font:500 14px/1.4 Inter,system-ui,sans-serif;box-shadow:0 4px 16px rgba(0,0,0,.2)';
  const text = d.createElement('span');
  text.style.cssText = 'flex:1 1 200px';
  text.textContent = `${t('Version {v} is online, but this device still runs an older one.', { v: live })} ${t('Your data stays on this device.')}`;
  const go = d.createElement('button');
  go.type = 'button';
  go.textContent = t('Load now|update');
  go.style.cssText = 'min-height:44px;padding:0 16px;border:0;border-radius:10px;background:#fff;color:#1f3a33;font:600 14px Inter,system-ui,sans-serif';
  go.onclick = () => freshReload(w);
  const later = d.createElement('button');
  later.type = 'button';
  later.textContent = t('Later|update');
  later.style.cssText = 'min-height:44px;padding:0 12px;border:1px solid rgba(255,255,255,.5);border-radius:10px;background:transparent;color:#fff;font:500 14px Inter,system-ui,sans-serif';
  later.onclick = () => bar.remove();
  bar.append(text, go, later);
  d.body.appendChild(bar);
}

/** Check and, when stuck, show the bar. */
export async function warnIfBehind(w = globalThis, opts) {
  const live = await checkBehind(w, opts);
  if (live) showBehind(w, live);
  return live;
}
