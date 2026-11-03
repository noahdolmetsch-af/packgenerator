// «Ist alles in Ordnung?» auf Heute (Noah 02.11.2026 «1a danach 3 und 4»): what the app knows about its own state
// shows on Today as a quiet line, and only when something is not right. Each line has its one button.
// The backup and the backup folder already have their lines in Home.svelte; this adds the rest.
// Pure: gets what the page knows, returns rows like those of the «Important today» list. English keys for t().
import { t } from '../i18n.svelte.js';

export const STORAGE_WARN = 80; // % of the browser's space used

/**
 * in: { storage: { used, quota } | null, keep: 'kept' | 'not' | 'unknown', sync: { on, error }, hasData }
 * acts: { keepNow, syncNow } called by the buttons. Returns [{ key, tone: 'warn', text, short, act }].
 */
export function zustandRows({ storage = null, keep = 'unknown', sync = null, hasData = false } = {}, acts = {}) {
  const rows = [];
  if (storage?.quota) {
    const pct = Math.min(100, Math.round((storage.used / storage.quota) * 100));
    if (pct >= STORAGE_WARN) rows.push({ key: 'z:space', tone: 'warn', text: t('The space of this browser is {pct} % full. Save a backup file, then there is room to clear.', { pct }), short: t('Space is running low'), act: { label: t('Open'), href: '#/me/data' } });
  }
  if (hasData && keep === 'not') rows.push({ key: 'z:keep', tone: 'warn', text: t('The browser may delete your data when the device runs low on space. One tap asks it to keep it.'), short: t('Data not kept yet'), act: { label: t('Keep my data'), run: acts.keepNow } });
  if (sync?.on && sync.error) rows.push({ key: 'z:sync', tone: 'warn', text: t('The automatic sync did not work last time. The app tries again by itself.'), short: t('Sync did not work'), act: { label: t('Try now'), run: acts.syncNow } });
  return rows;
}
