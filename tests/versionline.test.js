// «Neueste Version» in Ich (Noah 27.10.2026): the row tells «up to date», «newer online» and «not known» apart.
import { describe, it, expect, vi } from 'vitest';
import { versionState } from '../src/lib/versionline.js';
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
