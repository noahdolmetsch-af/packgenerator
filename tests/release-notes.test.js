// The GitHub release entry after every going online (Noah 27.10.2026 «5a»): scripts/release-notes.mjs.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { formatNotes, parseSubject } from '../scripts/release-notes.mjs';

describe('release notes', () => {
  it('reads the PR number and title of both merge styles', () => {
    expect(parseSubject('Merge pull request #320: Schnellspur')).toEqual({ pr: 320, subject: 'Schnellspur' });
    expect(parseSubject('Merge pull request #301 from noahdolmetsch-af/claude/x')).toEqual({ pr: 301, subject: '' });
    expect(parseSubject('«Heute ruhiger» Teil 3 (#296)')).toEqual({ pr: 296, subject: '«Heute ruhiger» Teil 3' });
    expect(parseSubject('Fix a typo')).toEqual({ subject: 'Fix a typo' });
  });

  it('names the version, the live page and every merge with its «Was ist neu» title', () => {
    const md = formatNotes('0.244.0', [
      { pr: 321, subject: 'Katalog springt hin', news: ['Der Katalog zeigt die Stelle'] },
      { pr: 320, subject: 'Schnellspur', news: [] },
    ]);
    expect(md).toContain('**0.244.0**');
    expect(md).toContain('https://noahdolmetsch-af.github.io/packgenerator/');
    expect(md).toContain('Darin (2):');
    expect(md).toContain('[#321](https://github.com/noahdolmetsch-af/packgenerator/pull/321) Katalog springt hin · Was ist neu: «Der Katalog zeigt die Stelle»');
    expect(md).toContain('[#320](https://github.com/noahdolmetsch-af/packgenerator/pull/320) Schnellspur\n');
  });

  it('runs right after going online, on main only, and never stops going online', () => {
    const deploy = readFileSync(new URL('../.github/workflows/deploy.yml', import.meta.url), 'utf8');
    const job = deploy.slice(deploy.indexOf('\n  online:'));
    expect(job).toContain("if: github.ref == 'refs/heads/main'");
    expect(job).toContain('contents: write');
    const entry = job.slice(job.indexOf('actions/deploy-pages'));
    expect(entry).toContain('node scripts/release-notes.mjs');
    expect(entry).toContain('continue-on-error: true');
  });
});
