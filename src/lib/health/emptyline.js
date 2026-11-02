/**
 * The line a Heute tile shows when it has no Fitbit value (Noah 21.10.2026: Heute said «Verbinde Fitbit»
 * while Fitbit was connected and only the fetch failed). Pure: the tile passes the Fitbit state
 * (client.svelte.js health) and gets { why, text, href, link } (English keys, the tile translates them).
 * - not connected: connect it (Verbindungen)
 * - connected, the last fetch failed: a new login, Google refuses the values, or another error (to Ich › Fitbit)
 * - connected, nothing new yet: the last values are from {date} (to Ich › Fitbit)
 */
export function fitbitEmpty(h) {
  if (!h?.prefs?.connected) return { why: 'off', text: null, href: '#/me/connections', link: 'Connections|body' };
  const code = h.error || (h.lastTry && !h.lastTry.ok ? h.lastTry.code : '');
  if (code) {
    const TEXT = {
      google_login_needed: 'Fitbit is connected, but Google needs a new login.',
      not_connected: 'Fitbit is connected, but Google needs a new login.',
      google_scope: 'Fitbit is connected, but Google refuses the values right now.',
      timeout: 'Fitbit is connected, but Google or the server took too long. Open Fitbit and tap «Try again».',
      network: 'Fitbit is connected, but there was no connection. The app tries again later.',
      unauthorized: 'Fitbit is connected, but this device has no key yet.',
      google_busy: 'Fitbit is connected, but Google is busy. Try again later.',
      daily_cap: 'Fitbit is connected, but the server has done enough for today. It works again tomorrow.',
    };
    const text = TEXT[code] ?? 'Fitbit is connected, but the last fetch did not work.';
    return { why: 'failed', text, href: '#/me/fitbit', link: 'To Fitbit' };
  }
  return { why: 'none', text: h.last?.date ? 'No Fitbit values for today yet. The last ones are from {date}.' : 'No Fitbit values yet.', date: h.last?.date ?? null, href: '#/me/fitbit', link: 'To Fitbit' };
}

/**
 * Noah 2.11.2026 «3a»: «Stand 07:42» under the Fitbit tiles of Heute. The time of the last fetch that worked
 * (the last try when it worked, else the stored lastSync). → { at: ISO string | null, failed: bool, code }
 */
export function fitbitStand(h) {
  if (!h?.prefs?.connected) return null;
  const t = h.lastTry;
  const failed = Boolean(h.error || (t && t.ok === false));
  const at = t && t.ok ? t.at : h.prefs.lastSync ?? null;
  return { at, failed, code: h.error || (t && !t.ok ? t.code : '') };
}
