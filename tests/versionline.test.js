// «Neueste Version» in Ich (Noah 27.10.2026): the row tells «up to date», «newer online» and «not known» apart.
import { describe, it, expect, vi } from 'vitest';
import { versionState, countMerges, notOnlineYet, forgetNotOnline } from '../src/lib/versionline.js';
import { onlineVersion } from '../src/lib/behind.js';

describe('versionline', () => {
  it('says which state the device is in', () => {
    expect(versionState('0.235.0', '0.236.0')).toBe('newer');
    expect(versionState('0.235.0', '0.235.0')).toBe('current');
    expect(versionState('0.236.0', '0.235.0')).toBe('current');
    expect(versionState('0.235.0', null)).toBe('unknown');
  });

  it('asks version.json past the offline copy, and gives null offline or on an error', async () => {
    const fetch = vi.fn(async () => ({ ok: true, json: async () => ({ version: '0.236.0' }) }));
    expect(await onlineVersion({ navigator: { onLine: true }, fetch }, { base: '/', now: 5 })).toBe('0.236.0');
    expect(fetch).toHaveBeenCalledWith('/version.json?t=5', { cache: 'no-store' });
    expect(await onlineVersion({ navigator: { onLine: false }, fetch }, { base: '/' })).toBe(null);
    expect(await onlineVersion({ navigator: {}, fetch: async () => ({ ok: false }) }, { base: '/' })).toBe(null);
    expect(await onlineVersion({ navigator: {}, fetch: async () => { throw new Error('x'); } }, { base: '/' })).toBe(null);
  });
});

describe('not online yet (question 5)', () => {
  const merge = (m) => ({ commit: { message: m } });
  it('counts only merged pull requests', () => {
    expect(countMerges([merge('Merge pull request #1 from x'), merge("Merge branch 'main' into y"), merge('Fix a test'), merge('Merge pull request #2: Titel')])).toBe(2);
    expect(countMerges(undefined)).toBe(0);
  });

  it('asks GitHub for the last deploy and the merges after it, and keeps the answer 2 minutes', async () => {
    forgetNotOnline();
    const fetch = vi.fn(async (url) => ({
      ok: true,
      json: async () => (url.includes('/runs?') ? { workflow_runs: [{ head_sha: 'abc' }] } : { commits: [merge('Merge pull request #7 from z'), merge('x')] }),
    }));
    expect(await notOnlineYet({ navigator: { onLine: true }, fetch }, { now: 1000 })).toBe(1);
    expect(fetch.mock.calls[0][0]).toContain('/actions/workflows/deploy.yml/runs?branch=main&event=push&status=success');
    expect(fetch.mock.calls[1][0]).toContain('/compare/abc...main');
    expect(await notOnlineYet({ navigator: { onLine: true }, fetch }, { now: 60_000 })).toBe(1);
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it('gives null offline, on an error or without an answer', async () => {
    forgetNotOnline();
    expect(await notOnlineYet({ navigator: { onLine: false }, fetch: vi.fn() })).toBe(null);
    expect(await notOnlineYet({ navigator: {}, fetch: async () => ({ ok: false }) })).toBe(null);
    expect(await notOnlineYet({ navigator: {}, fetch: async () => { throw new Error('x'); } })).toBe(null);
  });
});
