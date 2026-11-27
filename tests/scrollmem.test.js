// «Position merken» and «Link auf den Abschnitt» (thread «Navigation ohne Sackgassen»): the pure parts.
import { describe, it, expect } from 'vitest';
import { remember, restartOf } from '../src/lib/nav/scrollmem.js';
import { atOf, atHref } from '../src/lib/nav/at.js';

describe('remember: the kept positions', () => {
  it('keeps a position per address and replaces the old one', () => {
    let m = remember({}, '#/a', 400);
    m = remember(m, '#/b', 900);
    m = remember(m, '#/a', 120);
    expect(m).toEqual({ '#/a': 120, '#/b': 900 });
  });
  it('drops an address that is back at the top', () => {
    expect(remember({ '#/a': 400 }, '#/a', 0)).toEqual({});
  });
  it('keeps at most `max` addresses, the oldest go first', () => {
    let m = {};
    for (let i = 1; i <= 5; i++) m = remember(m, `#/p${i}`, i * 100, 3);
    expect(Object.keys(m)).toEqual(['#/p3', '#/p4', '#/p5']);
  });
});

describe('restartOf: a start that should return to the kept place', () => {
  it('a reload and a restored tab do, a fresh start does not', () => {
    expect(restartOf('reload')).toBe(true);
    expect(restartOf('back_forward')).toBe(true);
    expect(restartOf('navigate')).toBe(false);
    expect(restartOf(undefined)).toBe(false);
  });
});

describe('at: the section an address names', () => {
  it('reads and writes the section', () => {
    expect(atOf('#/me/lists?at=names-h')).toBe('names-h');
    expect(atOf('#/me/lists?a=1&at=x')).toBe('x');
    expect(atOf('#/me/lists')).toBe('');
    expect(atHref('#/me/lists', 'names-h')).toBe('#/me/lists?at=names-h');
    expect(atHref('#/bikes?tab=care', 'x')).toBe('#/bikes?tab=care&at=x');
    expect(atHref('#/bikes?tab=care&at=old', 'x')).toBe('#/bikes?tab=care&at=x');
    expect(atHref('#/bikes?at=x', '')).toBe('#/bikes');
  });
});
