// «Seitentitel im Browser-Tab» (Noah 23.11.2026 «2a»): src/lib/nav/tabtitle.js
import { describe, it, expect } from 'vitest';
import { pageTitle, tabTitle, short, runClock, ridingMs } from '../src/lib/nav/tabtitle.js';

describe('pageTitle', () => {
  it('Heute is the name of the app', () => {
    expect(pageTitle({ app: 'Pack Generator', home: true, place: 'Heute', h1: 'Guten Morgen' })).toBe('Pack Generator');
  });
  it('the page title comes first, then the place', () => {
    expect(pageTitle({ place: 'Touren', h1: 'Jura-Runde' })).toBe('Jura-Runde · Touren');
  });
  it('place and tab are kept, never the same name twice', () => {
    expect(pageTitle({ place: 'Woche', tab: 'Woche' })).toBe('Woche');
    expect(pageTitle({ place: 'Touren', tab: 'Übersicht', h1: 'Touren' })).toBe('Übersicht · Touren');
    expect(pageTitle({ place: 'Touren', tab: 'Übersicht', h1: 'Jura-Runde' })).toBe('Jura-Runde · Übersicht · Touren');
  });
  it('a page without a place ends with the name of the app', () => {
    expect(pageTitle({ app: 'Pack Generator', h1: 'Packliste Jura' })).toBe('Packliste Jura · Pack Generator');
    expect(pageTitle({ app: 'Pack Generator' })).toBe('Pack Generator');
  });
  it('a long name is cut', () => {
    expect(short('x'.repeat(100)).length).toBe(60);
    expect(short('  a   b  ')).toBe('a b');
  });
});

describe('tabTitle', () => {
  it('a running time comes first', () => {
    expect(tabTitle({ place: 'Heute', running: { time: '12:34', name: 'Meditation' } })).toBe('▶ 12:34 · Meditation');
  });
  it('a paused one says so', () => {
    expect(tabTitle({ running: { time: '0:05', name: 'Fahrt', paused: true } })).toBe('⏸ 0:05 · Fahrt');
  });
  it('nothing runs: the words of the page', () => {
    expect(tabTitle({ place: 'Material', h1: 'Zelt' })).toBe('Zelt · Material');
    expect(tabTitle({ place: 'Material', running: null })).toBe('Material');
  });
});

describe('runClock and ridingMs', () => {
  it('writes m:ss and h:mm:ss', () => {
    expect(runClock(754)).toBe('12:34');
    expect(runClock(3725)).toBe('1:02:05');
    expect(runClock(-3)).toBe('0:00');
  });
  it('leaves the pauses out of the riding time', () => {
    expect(ridingMs(1000, [[2000, 3000]], 11000)).toBe(9000);
    expect(ridingMs(1000, [[2000, null]], 5000)).toBe(1000); // paused now: the time stands
    expect(ridingMs(1000, [], 4000)).toBe(3000);
  });
});
