/**
 * Heute › «Jetzt dran»: the lines about the backup. Noah 08.11.2026 «1-5 a» (UX-Test 1-02): «noch keine Backup-Datei»
 * and «Daten aus dem Backup vom …» are two different facts, so they are two lines and never one sentence.
 *   backup      red: the time for a backup (never saved, or n days old; a new debrief since)
 *   backupfrom  yellow, only when the data were loaded from a backup file: where they come from, one tap to Data
 * Pure; the page passes the run functions. Tested in tests/zahlen-gleich.test.js.
 */
import { t } from '../i18n.svelte.js';

/** backup: { due, days, afterTrip }; from: the date text of the loaded backup or '' (no import); backupNow: the button's run. */
export function backupRows({ backup, from = '', backupNow = () => {} } = {}) {
  if (!backup?.due) return [];
  const state = backup.days == null ? t('You have not saved a backup file yet.') : t('Your last backup is {n} days old.', { n: backup.days });
  const extra = backup.afterTrip && !from ? ` ${t('New debrief since the last backup: save one, then load it on the desktop.')}` : '';
  const rows = [{ key: 'backup', tone: 'bad', text: `${t('Time for a backup')}: ${state}${extra}`, act: { label: t('Download backup'), run: backupNow, busy: true }, short: t('Backup due') }];
  if (from) rows.push({ key: 'backupfrom', tone: 'warn', text: t('Your data comes from the backup of {date}. Is there something newer on your other device? Save a backup there and load it here.', { date: from }), act: { label: t('To Data'), href: '#/me/data' } });
  return rows;
}
