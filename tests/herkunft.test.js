// «Zurück zu Heute» (UI-Prüfung A2, Noah «4a»): the value page of Analyse remembers where you came from
import { describe, it, expect } from 'vitest';
import { noteMove, backOf } from '../src/lib/nav/herkunft.js';

describe('noteMove', () => {
  it('keeps the address you left when you step onto a value from outside Analyse', () => {
    expect(noteMove(null, '#/', '#/auswerten/analyse/rhr')).toBe('#/');
    expect(noteMove('#/', '#/flow', '#/auswerten/analyse/rhr?zeit=m3')).toBe('#/flow');
  });
  it('keeps the old one while you stay inside Auswerten or Analyse', () => {
    expect(noteMove('#/', '#/auswerten/analyse', '#/auswerten/analyse/rhr')).toBe('#/');
    expect(noteMove('#/', '#/auswerten/analyse/rhr', '#/auswerten/analyse/sleep')).toBe('#/');
    expect(noteMove('#/', '#/auswerten', '#/auswerten/analyse/rhr')).toBe('#/');
  });
  it('does not change for other pages and without a start', () => {
    expect(noteMove('#/', '#/flow', '#/bikes')).toBe('#/');
    expect(noteMove(null, '#/flow', '#/bikes')).toBe(null);
    expect(noteMove('#/', '', '#/auswerten/analyse/rhr')).toBe('#/');
  });
});

describe('backOf', () => {
  it('names the place of the address', () => {
    expect(backOf('#/')).toEqual({ href: '#/', place: 'Today|place' });
    expect(backOf('#/flow')).toEqual({ href: '#/flow', place: 'Active|place' });
    expect(backOf('#/bikes')).toEqual({ href: '#/bikes', place: 'Bikes|place' });
  });
  it('is nothing for no address, for Auswerten itself and for pages without a place', () => {
    expect(backOf(null)).toBe(null);
    expect(backOf('#/auswerten')).toBe(null);
    expect(backOf('#/auswerten/analyse')).toBe(null);
  });
});
