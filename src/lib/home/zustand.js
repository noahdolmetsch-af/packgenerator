// «Ist alles in Ordnung?» auf Heute (Noah 02.11.2026 «1a danach 3 und 4»): what the app knows about its own state
// shows on Today as a quiet line, and only when something is not right. Each line has its one button.
// The backup and the backup folder already have their lines in Home.svelte; this adds the rest.
// Pure: gets what the page knows, returns rows like those of the «Important today» list. English keys for t().
import { t, tn } from '../i18n.svelte.js';

export const STORAGE_WARN = 80; // % of the browser's space used

/**
 * in: { storage: { used, quota } | null, keep: 'kept' | 'not' | 'unknown', sync: { on, error }, hasData, health: { state, dirty } | null (sync/health.js) }
 * acts: { keepNow, syncNow } called by the buttons. Returns [{ key, tone: 'warn', text, short, act }].
 */
export function zustandRows({ storage = null, keep = 'unknown', sync = null, hasData = false, health = null } = {}, acts = {}) {
  const rows = [];
  if (storage?.quota) {
    const pct = Math.min(100, Math.round((storage.used / storage.quota) * 100));
    if (pct >= STORAGE_WARN) rows.push({ key: 'z:space', tone: 'warn', text: t('The space of this browser is {pct} % full. Save a backup file, then there is room to clear.', { pct }), short: t('Space is running low'), act: { label: t('Open'), href: '#/me/data' } });
  }
  if (hasData && keep === 'not') rows.push({ key: 'z:keep', tone: 'warn', text: t('The browser may delete your data when the device runs low on space. One tap asks it to keep it.'), short: t('Data not kept yet'), hint: t('If the browser says no: put the app on your home screen and use it every day. Then it keeps the data. A backup file protects you meanwhile.'), act: { label: t('Keep my data'), run: acts.keepNow } });
  // Noah 21.11.2026 «1-5a»: the sync off on a device with data, or changes that did not go out
  if (health?.state === 'off') rows.push({ key: 'z:syncoff', tone: 'warn', text: t('The sync is off. What you change here does not reach your other device.'), short: t('Sync is off'), act: { label: t('Switch on'), href: '#/me/data' } });
  if (health?.state === 'alone') rows.push({ key: 'z:alone', tone: 'warn', text: t('The sync is on, but no other device has sent anything into it yet. Is your other device paired with the same code?'), short: t('No second device yet'), act: { label: t('Pair'), href: '#/me/data' }, act2: acts.onlyOne ? { label: t('Only one device'), run: acts.onlyOne, quiet: true } : undefined });
  const unsent = health?.state === 'late' && health.dirty > 0;
  if (unsent) rows.push({ key: 'z:unsent', tone: 'warn', text: tn(health.dirty, '{n} change is not sent to your other device yet. The app tries again by itself.', '{n} changes are not sent to your other device yet. The app tries again by itself.'), short: t('Changes not sent yet'), act: { label: t('Try now'), run: acts.syncNow } });
  if (!unsent && sync?.on && sync.error) rows.push({ key: 'z:sync', tone: 'warn', text: t('The automatic sync did not work last time. The app tries again by itself.'), short: t('Sync did not work'), act: { label: t('Try now'), run: acts.syncNow } });
  return rows;
}
