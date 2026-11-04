// «Das Logo zieht sich der Jahreszeit an» (Idee 30): the logo choice and what the secret does.
import { describe, it, expect } from 'vitest';
import { LOGOS, DEFAULT_LOGO, logoOf, afterSecret } from '../src/lib/logo/logo.js';

describe('logo', () => {
  it('is plain by default and knows three logos', () => {
    expect(DEFAULT_LOGO).toBe('plain');
    expect(LOGOS.map((l) => l.key)).toEqual(['plain', 'hat', 'bike']);
    expect(logoOf(null)).toBe('plain');
    expect(logoOf('x')).toBe('plain');
    expect(logoOf('hat')).toBe('hat');
  });
  it('the first time the secret is found the bike sign is the new logo', () => {
    expect(afterSecret(null, null)).toEqual({ unlocked: true, pick: 'bike', first: true });
    expect(afterSecret(null, 'hat')).toMatchObject({ pick: 'bike', first: true });
  });
  it('later the choice stays as it is', () => {
    expect(afterSecret('1', 'hat')).toEqual({ unlocked: true, pick: 'hat', first: false });
    expect(afterSecret('1', 'plain')).toMatchObject({ pick: 'plain', first: false });
    expect(afterSecret('1', 'wrong')).toMatchObject({ pick: 'plain', first: false });
  });
});
