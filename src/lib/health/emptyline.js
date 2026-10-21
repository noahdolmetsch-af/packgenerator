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
    const login = ['google_login_needed', 'not_connected'].includes(code);
    const text = login ? 'Fitbit is connected, but Google needs a new login.' : code === 'google_scope' ? 'Fitbit is connected, but Google refuses the values right now.' : 'Fitbit is connected, but the last fetch did not work.';
    return { why: 'failed', text, href: '#/me/fitbit', link: 'To Fitbit' };
  }
  return { why: 'none', text: h.last?.date ? 'No Fitbit values for today yet. The last ones are from {date}.' : 'No Fitbit values yet.', date: h.last?.date ?? null, href: '#/me/fitbit', link: 'To Fitbit' };
}
