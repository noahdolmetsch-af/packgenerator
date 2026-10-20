// Newer Chrome writes Swiss thousands as «1'250»; src/lib/swissnum.js keeps «1’250» everywhere.
// The test builds a fake browser that writes the straight apostrophe, then installs the fix on it.
import { describe, it, expect } from 'vitest';
import { installSwissNumbers, fixGroup } from '../src/lib/swissnum.js';

const Real = Intl.NumberFormat;
const straight = (s) => s.replace(/’/g, "'");

function fakeBrowser() {
  class NF {

    constructor(locales, options) {
      this._nf = new Real(locales, options);
    }
    resolvedOptions() {
      return this._nf.resolvedOptions();
    }
  }
  // like the real one: `format` is a getter returning a bound function
  Object.defineProperty(NF.prototype, 'format', {
    configurable: true,
    get() {
      const nf = this._nf;
      return (n) => straight(nf.format(n));
    },
  });
  NF.prototype.formatToParts = function (n) {
    return this._nf.formatToParts(n).map((p) => ({ ...p, value: straight(p.value) }));
  };
  function Num(v) {
    this.v = v;
  }
  Num.prototype.toLocaleString = function (locales, options) {
    return new NF(locales, options).format(this.v);
  };
  return { Intl: { NumberFormat: NF }, Number: Num };
}

describe('Swiss numbers keep the typographic apostrophe', () => {
  it('fixGroup turns the straight apostrophe into the typographic one', () => {
    expect(fixGroup("1'250")).toBe('1’250');
    expect(fixGroup(12)).toBe(12);
  });

  it('a browser writing «1\'250» gets «1’250» back for de-CH, others stay as they are', () => {
    const g = fakeBrowser();
    expect(new g.Intl.NumberFormat('de-CH').format(1250)).toBe("1'250");
    expect(installSwissNumbers(g)).toBe(true);
    expect(new g.Intl.NumberFormat('de-CH').format(1250)).toBe('1’250');
    expect(new g.Intl.NumberFormat('de-CH', { minimumFractionDigits: 2 }).format(12345.5)).toBe('12’345.50');
    expect(new g.Intl.NumberFormat(['de-CH', 'en']).format(5000)).toBe('5’000');
    expect(new g.Intl.NumberFormat('de-CH').formatToParts(1250).map((p) => p.value).join('')).toBe('1’250');
    expect(new g.Number(1180).toLocaleString('de-CH')).toBe('1’180');
    expect(new g.Number(1180).toLocaleString('en')).toBe('1,180');
    expect(new g.Number(1180).toLocaleString('de-DE')).toBe('1.180');
    // installing twice changes nothing
    expect(installSwissNumbers(g)).toBe(false);
  });

  it('a browser that already writes «’» is left alone', () => {
    const g = { Intl: { NumberFormat: Real }, Number };
    if (new Real('de-CH').format(1000).includes("'")) return; // this Node writes «'» itself
    expect(installSwissNumbers(g)).toBe(false);
  });

  it('main.js installs it before anything else', async () => {
    const { readFileSync } = await import('node:fs');
    const main = readFileSync(new URL('../src/main.js', import.meta.url), 'utf8');
    expect(main.indexOf("import './lib/swissnum.js';")).toBeGreaterThanOrEqual(0);
    expect(main.indexOf("import './lib/swissnum.js';")).toBeLessThan(main.indexOf("import '@fontsource"));
  });
});
