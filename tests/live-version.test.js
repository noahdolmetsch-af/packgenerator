// Live-Check (21.11.2026): a NEWER version online than the one the run was started for is no failure.
import { describe, it, expect } from 'vitest';
import { isNewerOrSame, shownVersion } from './e2e/live/version.js';

describe('Live-Check version', () => {
  it('reads the version from the Ich page text', () => {
    expect(shownVersion('Settings and the app, only on this device · Version 0.976.0·')).toBe('0.976.0');
    expect(shownVersion('Einstellungen · Version v1.2.30 ·')).toBe('1.2.30');
    expect(shownVersion('Belongs to App and help')).toBe('');
  });
  it('same or newer passes, older does not (numbers, not text)', () => {
    expect(isNewerOrSame('0.975.1', '0.975.1')).toBe(true);
    expect(isNewerOrSame('0.976.0', '0.975.1')).toBe(true);
    expect(isNewerOrSame('0.977.0', '0.975.1')).toBe(true);
    expect(isNewerOrSame('0.975.0', '0.975.1')).toBe(false);
    expect(isNewerOrSame('0.974.9', '0.975.1')).toBe(false);
    expect(isNewerOrSame('0.1000.0', '0.999.0')).toBe(true); // 1000 is more than 999 (a text compare would say less)
    expect(isNewerOrSame('1.0.0', '0.999.9')).toBe(true);
  });
});
