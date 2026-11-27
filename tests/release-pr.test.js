// «Alle Releases» part 1 (Noah 27.11.2026 «alles freigegeben», thread «Alle Releases mit Testanleitung auflisten»): every release knows its GitHub PR
// number, and the merges without a news file are kept as «releases nobody sees». Nothing visible changes: WHATS_NEW stays as it is.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { numberHistory, prOfSubject, titleOfSubject, botTitle, compare, ANCHOR_VERSION } from '../scripts/news.mjs';
import { EXACT } from '../src/lib/news/index.gen.js';
import { WHATS_NEW, RELEASES_OHNE, prOf } from '../src/lib/whatsnew-full.js';
import { WHATS_NEW_ALT } from '../src/lib/whatsnew-alt.js';
import { PR_ALT } from '../src/lib/whatsnew-alt-pr.js';

describe('the PR number of a merge', () => {
  it('reads the number from a squash merge and from an old merge commit', () => {
    expect(prOfSubject('Packschritte: die Pfeile stehen bei der Überschrift des Schritts (#1815)')).toBe(1815);
    expect(prOfSubject('Merge pull request #290 from noahdolmetsch-af/claude/project-thread-weeix9')).toBe(290);
    expect(prOfSubject('Merge pull request #293: Versionsnummer beim Merge')).toBe(293);
    expect(prOfSubject('Initial commit')).toBeNull();
    expect(prOfSubject('Fix (#12) the thing')).toBeNull(); // only the one at the end counts
  });
  it('cuts the number and the merge words from the title', () => {
    expect(titleOfSubject('Kleider: deine Kleider vor «Aufräumen» (#1804)')).toBe('Kleider: deine Kleider vor «Aufräumen»');
    expect(titleOfSubject('Merge pull request #293: Versionsnummer beim Merge')).toBe('Versionsnummer beim Merge');
    expect(titleOfSubject('Merge pull request #290 from noahdolmetsch-af/x')).toBe('');
  });
  it('a bot merge has a fixed title', () => {
    expect(botTitle('Merge pull request #1259 from noahdolmetsch-af/dependabot/npm_and_yarn/alle-bibliotheken-9f7b')).toBe('Bibliotheken aktualisiert (automatisch)');
    expect(botTitle('Merge pull request #280 from noahdolmetsch-af/claude/project-thread-amrm2s')).toBe('');
  });
});

describe('numberHistory keeps the PR numbers and the releases without a news file', () => {
  const h = [
    { date: '2026-10-28', added: [], pr: 300, title: 'CI schneller' },
    { date: '2026-10-28', added: ['kleider-sets.js'], pr: 301, title: 'Kleider-Sets' },
    { date: '2026-10-29', added: [], pr: 302, title: 'Regel', time: '09:15' },
    { date: '2026-10-29', added: [], pkg: '0.240.0', pr: 303, title: 'von Hand' },
  ];
  const r = numberHistory(h);
  it('a news file gets the PR number of its merge', () => {
    expect(r.files['kleider-sets.js']).toEqual({ version: '0.233.0', date: '2026-10-28', pr: 301 });
  });
  it('a merge without a news file is a release without a visible change, with its patch number', () => {
    expect(r.ohne).toEqual([
      { version: '0.232.1', date: '2026-10-28', pr: 300, title: 'CI schneller' },
      { version: '0.233.1', date: '2026-10-29', time: '09:15', pr: 302, title: 'Regel' },
    ]);
  });
  it('a version set by hand is no release without a visible change (it is an entry of the hand-numbered list)', () => {
    expect(r.ohne.some((o) => o.pr === 303)).toBe(false);
    expect(r.version).toBe('0.240.0');
  });
  it('without PR numbers (an old test history) nothing breaks', () => {
    expect(numberHistory([{ date: 'd', added: [] }]).ohne).toEqual([{ version: '0.232.1', date: 'd', title: '' }]);
  });
});

describe('the frozen list of the hand-numbered versions', () => {
  it('every hand-numbered version has a PR number, and nothing else is in the map', () => {
    expect(Object.keys(PR_ALT).sort()).toEqual(WHATS_NEW_ALT.map((e) => e.version).sort());
    for (const [v, pr] of Object.entries(PR_ALT)) expect(Number.isInteger(pr) && pr > 0, v).toBe(true);
  });
  it('the PR numbers grow with the version, give or take PRs merged out of order', () => {
    // the hand-numbered list is newest first; the PR number grows with the version, give or take PRs merged out of order
    const rows = WHATS_NEW_ALT.map((e) => PR_ALT[e.version]).reverse();
    for (let i = 1; i < rows.length; i++) expect(rows[i] + 40, `${WHATS_NEW_ALT.length - i}`).toBeGreaterThanOrEqual(rows[i - 1]);
  });
  it('prOf reads the map for a hand-numbered entry', () => {
    expect(prOf({ version: '0.1.0' })).toBe(1);
    expect(prOf({ version: '0.999.9' })).toBeNull();
    expect(prOf({ version: '0.999.9', pr: 55 })).toBe(55);
  });
});

describe('the releases without a visible change, on this checkout', () => {
  it('are no entries of «What is new» and have no version twice', () => {
    const seen = new Set(WHATS_NEW.map((e) => e.version));
    expect(seen.size).toBe(WHATS_NEW.length);
    for (const o of RELEASES_OHNE) {
      expect(seen.has(o.version), o.version).toBe(false);
      seen.add(o.version);
      expect(typeof o.title).toBe('string');
      expect(o.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
    for (let i = 1; i < RELEASES_OHNE.length; i++) expect(compare(RELEASES_OHNE[i - 1].version, RELEASES_OHNE[i].version)).toBe(1);
  });
  // with the whole history (GitHub's checks, a full clone) every merge is exactly one release: the numbers add up to the merges on main
  // the newest commit of a checkout that is not merged yet (the PR's own commit) has no number: GitHub gives it one at the merge
  it.runIf(EXACT)('with the whole history every news entry has its PR number and every merge since 0.232.0 is a release', () => {
    const all = [...WHATS_NEW.filter((e) => compare(e.version, ANCHOR_VERSION) > 0 && !PR_ALT[e.version]), ...RELEASES_OHNE];
    const newest = all.reduce((a, b) => (compare(a.version, b.version) >= 0 ? a : b));
    for (const e of all) if (e !== newest || e.pr) expect(e.pr, e.version).toBeGreaterThan(0);
  });
});
