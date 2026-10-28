// «Neueste Version» in Ich (Noah 27.10.2026 «1-5 a», questions 1 and 2): the device's version next to the one
// that is online, so you can tell «not online yet» from «this device is stuck».
import { newer } from './behind.js';

/**
 * What the line says. `running` is this device's version, `live` the one online (null: not known).
 * 'unknown' offline or no answer · 'newer' a newer one is online · 'current' this device has the newest.
 */
export function versionState(running, live) {
  if (!live) return 'unknown';
  return newer(live, running) ? 'newer' : 'current';
}

// «Gemergt, noch nicht online» (Noah 27.10.2026, question 5): GitHub tells, without an account, which merge
// went online last (the newest successful «Build and deploy» on main) and which merges came after it.
const API = 'https://api.github.com/repos/noahdolmetsch-af/packgenerator';
const KEEP = 2 * 60 * 1000; // GitHub answers 60 questions an hour without an account: ask at most every 2 minutes
let cache = null;

/** How many of these commits are merged pull requests (the merges of main into a branch do not count). */
export function countMerges(commits) {
  return (commits || []).filter((c) => /^Merge pull request #\d+/.test(c?.commit?.message || '')).length;
}

async function ask(w, url) {
  const r = await w.fetch(url, { headers: { Accept: 'application/vnd.github+json' } });
  return r.ok ? r.json() : null;
}

/** Merges on main that are not online yet: a number, or null when it is not known (offline, no answer). */
export async function notOnlineYet(w = globalThis, { now = Date.now() } = {}) {
  if (w.navigator?.onLine === false) return null;
  if (cache && now - cache.at < KEEP) return cache.n;
  try {
    const runs = await ask(w, `${API}/actions/workflows/deploy.yml/runs?branch=main&event=push&status=success&per_page=1`);
    const sha = runs?.workflow_runs?.[0]?.head_sha;
    if (!sha) return null;
    const diff = await ask(w, `${API}/compare/${sha}...main`);
    if (!Array.isArray(diff?.commits)) return null;
    cache = { at: now, n: countMerges(diff.commits) };
    return cache.n;
  } catch {
    return null;
  }
}

/** For tests: forget the last answer. */
export function forgetNotOnline() {
  cache = null;
}
