import { DATA_TABLES } from './db.js';
import { t } from './i18n.svelte.js';
import { validateBackup, countRows, KEY_OF } from './backup.js';

/**
 * «Sicherung prüfen» (Noah 02.11.2026 «1a»): a dry run. Reads a backup file and says whether it is whole and
 * what it holds. Pure: it never touches the database, so nothing can be overwritten by looking.
 * Returns { ok, problems, counts, total, exportedAt, lastChange }.
 */
export function checkBackup(data) {
  const problems = validateBackup(data);
  const counts = problems.length && !data?.tables ? {} : countRows(data);
  if (!problems.length) {
    for (const name of DATA_TABLES) {
      const rows = data.tables[name] ?? [];
      const key = KEY_OF[name] ?? 'id';
      const bad = rows.filter((r) => !r || typeof r !== 'object' || r[key] === undefined || r[key] === null).length;
      if (bad) problems.push(t('Table "{name}": {n} records are damaged (no ID).', { name, n: bad }));
      const seen = new Set();
      let twice = 0;
      for (const r of rows) {
        const k = r?.[key];
        if (k === undefined || k === null) continue;
        const id = JSON.stringify(k);
        if (seen.has(id)) twice++;
        seen.add(id);
      }
      if (twice) problems.push(t('Table "{name}": {n} records appear twice.', { name, n: twice }));
    }
  }
  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  if (!problems.length && total === 0) problems.push(t('The file is a backup but holds no records.'));
  return { ok: problems.length === 0, problems, counts, total, exportedAt: data?.exportedAt ?? null, lastChange: data?.lastChange ?? null };
}

/**
 * Is there a second copy outside this device? rec: the meta record OFFSITE_KEY (or undefined).
 * 'none' (never confirmed), 'ok', or 'old' (older than `days`). Only a hint, never a must.
 */
export function offsiteState(rec, now = new Date(), days = 30) {
  if (!rec?.at) return { kind: 'none', days: null };
  const age = Math.floor((now - new Date(rec.at)) / 864e5);
  return { kind: age >= days ? 'old' : 'ok', days: age };
}
