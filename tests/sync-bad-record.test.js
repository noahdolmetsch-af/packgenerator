// Noah 03.11.2026: a phone that cannot store a record says so (not «server error»). Fictional data only.
import 'fake-indexeddb/auto';
import { describe, it, expect } from 'vitest';
import { errCode } from '../src/lib/sync/engine.js';

describe('the error of a round', () => {
  it('says «storage full» for a full phone, not «server»', () => {
    expect(errCode(Object.assign(new Error(), { name: 'QuotaExceededError' }))).toBe('storage_full');
    expect(errCode(Object.assign(new Error(), { name: 'DataError' }))).toBe('local_error');
    expect(errCode(Object.assign(new Error(), { code: 'offline' }))).toBe('offline');
  });
});
