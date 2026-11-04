// «Richtung zeigen» (Paket A Seitenwechsel 1): which way a change of page glides (src/lib/nav/slide.js)
import { describe, it, expect } from 'vitest';
import { depthOf, slideDir } from '../src/lib/nav/slide.js';

describe('depthOf', () => {
  it('Heute is 0, the pages of a place and Ich itself are 1', () => {
    expect(depthOf('#/')).toBe(0);
    expect(depthOf('')).toBe(0);
    for (const h of ['#/trips', '#/trips/dreams', '#/gear', '#/bikes', '#/bikes?tab=care', '#/flow', '#/auswerten', '#/week', '#/me', '#/pack/templates', '#/debrief']) expect(depthOf(h), h).toBe(1);
  });
  it('a page opened from there is 2', () => {
    for (const h of ['#/tour/abc', '#/spur/abc', '#/me/handbook', '#/trips/fuel']) expect(depthOf(h), h).toBe(2);
  });
  it('the work on one tour is 3', () => {
    for (const h of ['#/pack', '#/ride', '#/live/abc', '#/trip/abc/packed', '#/debrief/abc']) expect(depthOf(h), h).toBe(3);
  });
});

describe('slideDir', () => {
  it('deeper glides forward, higher glides back', () => {
    expect(slideDir('#/trips', '#/tour/abc')).toBe('fwd');
    expect(slideDir('#/tour/abc', '#/pack')).toBe('fwd');
    expect(slideDir('#/', '#/tour/abc')).toBe('fwd');
    expect(slideDir('#/pack', '#/tour/abc')).toBe('back');
    expect(slideDir('#/tour/abc', '#/trips')).toBe('back');
    expect(slideDir('#/me/handbook', '#/me')).toBe('back');
  });
  it('the top level and the same depth stand still', () => {
    expect(slideDir('#/', '#/trips')).toBe(null);
    expect(slideDir('#/trips', '#/gear')).toBe(null);
    expect(slideDir('#/trips', '#/trips/dreams')).toBe(null);
    expect(slideDir('#/tour/a', '#/tour/b')).toBe(null);
    expect(slideDir('#/me', '#/')).toBe(null);
  });
});
