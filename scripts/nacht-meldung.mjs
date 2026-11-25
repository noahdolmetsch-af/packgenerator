#!/usr/bin/env node
// Night run (volle-pruefung.yml), 24.11.2026 (Noah «a-c alle», c = Nachtlauf, thread «Tests schneller machen»):
// the short morning message «is everything green?». Until then the night run said something only when a test was NEW red
// (an issue and a mail); on a green night nobody heard anything, so «green» and «did not run» looked the same.
// Now the report job writes one standing issue («Nacht-Meldung») and overwrites its title and body every night
// (no comment, so no mail): the title says green or red with the date, the body has the line below. The coordinator
// reads it in the morning round and tells Noah. Costs nothing (GITHUB_TOKEN, a public repository).
// Red tests are named (up to 5): the new ones from the comparison report (vergleich.md), else the first of the red list.
// Usage: node scripts/nacht-meldung.mjs titel|text   (the facts come from the environment, see `fromEnv`)
import { existsSync, readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

const num = (v) => (v === undefined || v === null || v === '' || Number.isNaN(Number(v)) ? null : Number(v));
const tests = (n) => `${n} ${n === 1 ? 'Test' : 'Tests'}`;

const SHOW = 5;
const clip = (names) => (names.length > SHOW ? `${names.slice(0, SHOW).join('; ')}; und ${names.length - SHOW} weitere` : names.join('; '));

/** Names of the NEW red tests: the «- name» lines under «Neu rot seit der letzten Nacht» in the comparison report. */
export function neueNamen(report) {
  const lines = String(report || '').split('\n');
  const at = lines.findIndex((l) => l.startsWith('**Neu rot'));
  if (at < 0) return [];
  const out = [];
  for (const l of lines.slice(at + 1)) {
    if (l.startsWith('- ')) { if (!l.startsWith('- …')) out.push(l.slice(2).trim()); } else if (l.trim() && out.length) break;
  }
  return out;
}

/** Names of the red tests from the list of the night (one per line). */
export function listenNamen(list) {
  return String(list || '').split('\n').map((l) => l.trim()).filter(Boolean);
}

/**
 * i: { datum, sha, e2e, gesamttest, rot, neu, erster, unvollstaendig, wackler, rundgang, rundgangAlterH, run }
 * namen: names of the red tests to show (array, optional).
 * e2e / gesamttest: job results of this run («success», «failure», «cancelled», «skipped»).
 * rot / neu: number of red tests today / new red since the night before (null when the comparison step did not run).
 */
export function gruen(i) {
  return i.e2e === 'success' && i.gesamttest === 'success' && !(num(i.rot) > 0);
}

export function titel(i) {
  return `Nacht-Meldung ${i.datum}: ${gruen(i) ? 'alles grün' : 'ROT'}`;
}

export function text(i) {
  const out = [];
  const rot = num(i.rot);
  const neu = num(i.neu);
  if (gruen(i)) {
    out.push(`Nacht ${i.datum}: alles grün. Browsertests (Handy und Computer) und Gesamttest sind auf main \`${i.sha}\` durchgelaufen.`);
  } else {
    out.push(`Nacht ${i.datum}: ROT.`);
    if (i.erster === true || i.erster === 'yes') {
      out.push(`${tests(rot ?? 0)} rot (erster Vergleich: sie gelten ab jetzt als bekannt).`);
    } else if (neu > 0) {
      out.push(`${tests(neu)} neu rot, ${tests(Math.max((rot ?? 0) - neu, 0))} weiterhin rot.`);
    } else if (rot > 0) {
      out.push(`Nichts Neues rot, ${tests(rot)} weiterhin rot.`);
    } else {
      out.push('Es fehlen Ergebnisse (Zeitlimit oder Absturz eines Teils).');
    }
    if (i.unvollstaendig === true || i.unvollstaendig === 'yes') out.push('Bei mindestens einem Teil fehlt die Liste.');
    if (i.namen && i.namen.length) out.push(`Rot: ${clip(i.namen)}.`);
    out.push(`Main-Stand: \`${i.sha}\`.`);
  }
  const w = num(i.wackler);
  if (w > 0) out.push(`Wackel-Tests, die an zwei Nächten wackelten: ${w}.`);
  const alt = num(i.rundgangAlterH);
  if (!i.rundgang || (alt !== null && alt > 30)) out.push('Rundgang: kein frischer Lauf.');
  else out.push(`Rundgang: ${i.rundgang === 'success' ? 'grün' : 'rot'}.`);
  if (i.run) out.push(`Lauf: ${i.run}`);
  return out.join(' ');
}

/** The facts from the environment of the workflow step (all strings, empty when unknown). */
export function fromEnv(env) {
  const read = (f) => (f && existsSync(f) ? readFileSync(f, 'utf8') : '');
  const neu = neueNamen(read(env.VERGLEICH_DATEI));
  return {
    namen: neu.length ? neu : listenNamen(read(env.ROT_LISTE_DATEI)),
    datum: env.DATUM || '?',
    sha: (env.SHA || '').slice(0, 8),
    e2e: env.E2E,
    gesamttest: env.GESAMTTEST,
    rot: env.ROT,
    neu: env.NEU,
    erster: env.ERSTER,
    unvollstaendig: env.UNVOLLSTAENDIG,
    wackler: env.WACKLER,
    rundgang: env.RUNDGANG,
    rundgangAlterH: env.RUNDGANG_ALTER_H,
    run: env.RUN,
  };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const what = process.argv[2];
  const i = fromEnv(process.env);
  if (what === 'titel') process.stdout.write(`${titel(i)}\n`);
  else if (what === 'text') process.stdout.write(`${text(i)}\n`);
  else {
    process.stderr.write('Usage: node scripts/nacht-meldung.mjs titel|text\n');
    process.exit(2);
  }
}
