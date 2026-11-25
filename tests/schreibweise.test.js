import { describe, it, expect } from 'vitest';
import { suggestSpelling } from '../src/lib/schreibweise.js';

describe('suggestSpelling: only a suggestion for the spelling of a rule text', () => {
  it('a capital at the start and «5h» as «5 Std.»', () => {
    expect(suggestSpelling('warum hast du letzte nacht weniger als 5h geschlafen?')).toBe('Warum hast du letzte nacht weniger als 5 Std. geschlafen?');
  });
  it('3.5h, 3,5 h and a capital after a question mark', () => {
    expect(suggestSpelling('Schlaf unter 3.5h? was half dir')).toBe('Schlaf unter 3.5 Std.? Was half dir');
    expect(suggestSpelling('Weniger als 3,5 h')).toBe('Weniger als 3,5 Std.');
  });
  it('a text that is fine stays null, an empty one too', () => {
    expect(suggestSpelling('Was war gestern anders?')).toBeNull();
    expect(suggestSpelling('Du hast 5 Std. geschlafen. Wie war es?')).toBeNull();
    expect(suggestSpelling('')).toBeNull();
    expect(suggestSpelling(null)).toBeNull();
  });
  it('no capital after an abbreviation with a dot', () => {
    expect(suggestSpelling('Nur 5 Std. geschlafen. und jetzt?')).toBe('Nur 5 Std. geschlafen. Und jetzt?');
    expect(suggestSpelling('Nur 5 Std. geschlafen?')).toBeNull();
  });
  it('words with an h after a number are left alone', () => {
    expect(suggestSpelling('Die 5hundert Meter')).toBeNull();
    expect(suggestSpelling('Der 3. Hang')).toBeNull();
  });
});
