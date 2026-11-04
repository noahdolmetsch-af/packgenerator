// «Aktiv und Auswerten» 3a: the Sunday thread runs from Friday 17:00 to the end of Monday. Dates on the device clock.
import './setup/de.js';
import { describe, it, expect } from 'vitest';
import { sonntagsFaden } from '../src/lib/sonntag.js';

const at = (d, h = 12, m = 0) => new Date(2026, 10, d, h, m); // 2 Nov 2026 is a Monday

describe('the Sunday thread', () => {
  it('Monday to Friday afternoon: nothing, except Monday itself looks back at the week before', () => {
    expect(sonntagsFaden(at(3))).toBeNull(); // Tuesday
    expect(sonntagsFaden(at(4))).toBeNull(); // Wednesday
    expect(sonntagsFaden(at(5, 23, 59))).toBeNull(); // Thursday night
    expect(sonntagsFaden(at(6, 16, 59))).toBeNull(); // Friday before 17:00
  });
  it('from Friday 17:00 through Sunday: the week is almost over', () => {
    for (const d of [at(6, 17, 0), at(6, 23, 59), at(7, 0, 1), at(8, 23, 59)]) expect(sonntagsFaden(d).text).toBe('The week is almost over. Look back at it');
  });
  it('Monday all day: a new week begins, look back at the last one', () => {
    expect(sonntagsFaden(at(9, 0, 1)).text).toBe('A new week begins. Look back at the last one');
    expect(sonntagsFaden(at(9, 23, 59)).text).toBe('A new week begins. Look back at the last one');
    expect(sonntagsFaden(at(10, 0, 1))).toBeNull(); // Tuesday
  });
});
