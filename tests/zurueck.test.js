// Durchklick-Fund 3 (Noah «3a»): «Zurück» names where you came from; a page opened directly names its own place (src/lib/nav/zurueck.js)
import { describe, it, expect } from 'vitest';
import { prevMove, backCrumbs } from '../src/lib/nav/zurueck.js';
import { ALL_PLACES } from '../src/lib/nav.js';

const label = (k) => ALL_PLACES.find((p) => p.key === k)?.label ?? null;
const href = (k) => ALL_PLACES.find((p) => p.key === k)?.href ?? null;
const wetterCrumb = [{ label: 'Trips|place', href: '#/trips' }];

describe('prevMove', () => {
  it('remembers where you came from when you step onto another page', () => {
    expect(prevMove(null, '#/', '#/wetter')).toEqual({ from: '#/', to: '#/wetter' });
  });
  it('keeps it while you stay on the page (a tab, a filter)', () => {
    const old = { from: '#/', to: '#/wetter' };
    expect(prevMove(old, '#/wetter', '#/wetter?tab=radar')).toBe(old);
  });
  it('has nothing without a start', () => {
    expect(prevMove(null, null, '#/wetter')).toBe(null);
  });
});

describe('backCrumbs', () => {
  it('names the place you came from, with its address', () => {
    const out = backCrumbs(wetterCrumb, { from: '#/', to: '#/wetter' }, '#/wetter', label, href);
    expect(out).toEqual([{ label: 'Today|place', href: '#/' }]);
  });
  it('keeps the crumb when you came from the same place', () => {
    const out = backCrumbs(wetterCrumb, { from: '#/trips', to: '#/wetter' }, '#/wetter', label, href);
    expect(out).toBe(wetterCrumb);
  });
  it('names the own place of a page that is opened directly and has a crumb of another place', () => {
    const me = [{ label: 'Me|place', href: '#/me' }];
    const out = backCrumbs(me, null, '#/me/weight', label, href);
    expect(out[0].href).toBe(href('analysis'));
  });
  it('keeps a crumb that already names the place of the page', () => {
    expect(backCrumbs(wetterCrumb, null, '#/wetter', label, href)).toBe(wetterCrumb);
  });
  it('leaves deeper paths alone', () => {
    const deep = [{ label: 'Bike', href: '#/bikes' }, { label: 'Care', href: '#/bikes?tab=care' }];
    expect(backCrumbs(deep, { from: '#/', to: '#/bikes/x' }, '#/bikes/x', label, href)).toBe(deep);
  });
  it('ignores a move that was made for another page', () => {
    expect(backCrumbs(wetterCrumb, { from: '#/', to: '#/dreams' }, '#/wetter', label, href)).toBe(wetterCrumb);
  });
});
