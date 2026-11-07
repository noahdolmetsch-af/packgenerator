// Schlangen-Ampel (Noah 05.11.2026 «2a», thread «Verbessern: GitHub-Warteschlange und Tests»): GitHub gives the
// repository 20 test computers at once and has no priority, so 26 pull requests with the label «ok» (5 phone test
// parts each) kept the going-online of main waiting for over an hour. Before the label «ok» is set, run
//   node scripts/schlange.mjs
// It counts the jobs that wait or run right now and says how many more pull requests may get «ok».
// Green: put «ok» only as many times as it says. Yellow or red: wait, the label can follow later.
// Reads only; needs the `gh` command (or GH_TOKEN) with read access. Never changes anything.
import { execFileSync } from 'node:child_process';

/** Jobs waiting or running at which the light changes. A pull request with «ok» adds about 6 jobs. */
export const GRUEN_BIS = 30;
export const GELB_BIS = 60;
export const JOBS_PRO_PR = 6;

/** Count the jobs that are not finished, split into waiting and running. Skipped jobs are finished. */
export function zaehle(jobs) {
  let wartend = 0;
  let laufend = 0;
  for (const j of jobs) {
    if (j.status === 'queued' || j.status === 'waiting' || j.status === 'pending') wartend++;
    else if (j.status === 'in_progress') laufend++;
  }
  return { wartend, laufend, offen: wartend + laufend };
}

/** The light, a short German line and how many more pull requests may get «ok» now. */
export function ampel(offen) {
  if (!(offen >= 0)) return { farbe: 'unbekannt', frei: 0, text: 'Schlange nicht lesbar: kein «ok» setzen, erst nachsehen.' };
  if (offen < GRUEN_BIS) {
    const frei = Math.max(1, Math.floor((GRUEN_BIS - offen) / JOBS_PRO_PR));
    return { farbe: 'gruen', frei, text: `Grün: ${offen} Jobs offen. Noch ${frei} PR mit «ok» ist in Ordnung.` };
  }
  if (offen < GELB_BIS) return { farbe: 'gelb', frei: 0, text: `Gelb: ${offen} Jobs offen. Noch kein «ok» setzen, kurz warten.` };
  return { farbe: 'rot', frei: 0, text: `Rot: ${offen} Jobs offen. Kein «ok» setzen, das Online-Stellen von main steht sonst hinten an.` };
}

const gh = (path) => JSON.parse(execFileSync('gh', ['api', '--paginate', '--slurp', path], { encoding: 'utf8', maxBuffer: 64e6 }));

/** All jobs of the runs that are not finished (queued, waiting or running), of every workflow. */
export function offeneJobs(repo = process.env.GITHUB_REPOSITORY || 'noahdolmetsch-af/packgenerator') {
  const jobs = [];
  for (const status of ['queued', 'in_progress']) {
    const runs = gh(`repos/${repo}/actions/runs?status=${status}&per_page=100`).flatMap((p) => p.workflow_runs);
    for (const r of runs) jobs.push(...gh(`repos/${repo}/actions/runs/${r.id}/jobs?per_page=100`).flatMap((p) => p.jobs));
  }
  return jobs;
}

if (process.argv[1] && process.argv[1].endsWith('schlange.mjs')) {
  try {
    const { wartend, laufend, offen } = zaehle(offeneJobs());
    console.log(`${ampel(offen).text} (wartend ${wartend}, laufend ${laufend}, 20 Rechner)`);
  } catch (e) {
    console.log(`${ampel(NaN).text} (${e.message.split('\n')[0]})`);
  }
}
