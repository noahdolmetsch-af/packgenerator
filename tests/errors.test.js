// Paket Q #127: errors in plain words with a next step.
import { describe, it, expect } from 'vitest';
import { errorKind, plainError, NEXT } from '../src/lib/clear/errors.js';
import DE from '../src/lib/i18n/de/klarer.js';

describe('plain errors', () => {
  it('a network failure says: no internet', () => {
    expect(errorKind(new TypeError('Failed to fetch'), true)).toBe('offline');
    expect(errorKind(new Error('x'), false)).toBe('offline');
  });
  it('a full storage and a broken file get their own sentence', () => {
    expect(errorKind({ name: 'QuotaExceededError', message: 'quota' }, true)).toBe('full');
    expect(errorKind(new SyntaxError('Unexpected token < in JSON at position 0'), true)).toBe('file');
  });
  it('the app\'s own words stay', () => {
    expect(plainError(new Error('This is not a Pack Generator backup file.'), true)).toBe('This is not a Pack Generator backup file.');
  });
  it('technical text never comes through', () => {
    expect(plainError(new TypeError("Cannot read properties of undefined (reading 'id')"), true)).toBe(NEXT.other);
    expect(plainError(new Error('DatabaseClosedError: Database has been closed'), true)).toBe(NEXT.other);
  });
  it('every sentence has German', () => {
    for (const s of Object.values(NEXT)) expect(DE[s], s).toBeTruthy();
  });
});
