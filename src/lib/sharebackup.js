/**
 * P3b «Abgleich Handy–Computer» (Noah 15.10.2026 «1a»): a backup file shared to the app
 * («Teilen › Pack Generator» on Android, from mail, chat, Drive or Files). public/share-target.js keeps
 * it in this cache and opens #/me/data?shared=backup; Ich › Daten und Backup reads it like a picked
 * file («Check import»). The names must match public/share-target.js.
 */
export const SHARE_BACKUP_CACHE = 'pg-shared-backup';
export const SHARE_BACKUP_KEY = 'shared-backup';
