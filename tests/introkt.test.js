// KT «Kacheln antippbar» (3a): the pure rules of the short intro on Today (src/lib/home/introkt.js)
import { describe, it, expect } from 'vitest';
import { INTRO_KEY, STEPS, introSteps, introDue, nextStep, mainLabel, bubblePlace } from '../src/lib/home/introkt.js';
import DE from '../src/lib/i18n/de/index.js';

describe('KT intro: steps', () => {
  it('has three steps in the order tile, tick, customise', () => {
    expect(STEPS.map((s) => s.id)).toEqual(['tile', 'tick', 'custom']);
    expect(INTRO_KEY).toBe('homeIntroKT');
  });
  it('leaves a step out when its element is not on Today', () => {
    const none = STEPS[1].sel;
    expect(introSteps((sel) => sel !== none).map((s) => s.id)).toEqual(['tile', 'custom']);
    expect(introSteps(() => false)).toEqual([]);
    expect(introSteps(() => true)).toHaveLength(3);
  });
  it('every word has a German entry', () => {
    for (const s of STEPS) for (const k of [s.title, s.text, s.key, s.more].filter(Boolean)) expect(DE[k], k).toBeTruthy();
    for (const k of ['Next {i}/{n}|intro', 'Done|intro', 'Skip|intro', 'Start page intro', 'Show the start page intro again']) expect(DE[k], k).toBeTruthy();
  });
});

describe('KT intro: when it comes', () => {
  it('once after an update, never again once seen', () => {
    expect(introDue({ value: null, updated: true })).toBe(true);
    expect(introDue({ value: null, updated: false })).toBe(false);
    expect(introDue({ value: true, updated: true })).toBe(false);
  });
  it('asked again from Me (false) without an update', () => {
    expect(introDue({ value: false, updated: false })).toBe(true);
  });
  it('not while editing, over a sheet, in the playground or with hush', () => {
    for (const k of ['editing', 'sheet', 'play', 'hush']) expect(introDue({ value: false, updated: true, [k]: true }), k).toBe(false);
  });
});

describe('KT intro: going through', () => {
  it('next step, then done', () => {
    expect(nextStep(0, 3)).toBe(1);
    expect(nextStep(1, 3)).toBe(2);
    expect(nextStep(2, 3)).toBeNull();
    expect(nextStep(0, 1)).toBeNull();
  });
  it('the main button: «Next n/3», «Done» on the last', () => {
    expect(mainLabel(0, 3)).toEqual({ key: 'Next {i}/{n}|intro', vars: { i: 1, n: 3 } });
    expect(mainLabel(1, 2)).toEqual({ key: 'Done|intro', vars: {} });
  });
});

describe('KT intro: where the bubble goes', () => {
  const screen = { vw: 390, vh: 844, bw: 340, bh: 180 };
  it('under the element when there is room', () => {
    const p = bubblePlace({ top: 100, bottom: 200, left: 20, width: 90 }, screen);
    expect(p.below).toBe(true);
    expect(p.top).toBe(214);
    expect(p.left).toBe(20);
  });
  it('above the element near the bottom', () => {
    const p = bubblePlace({ top: 700, bottom: 780, left: 300, width: 80 }, screen);
    expect(p.below).toBe(false);
    expect(p.top).toBe(700 - 14 - 180);
    // pushed inside the screen; the arrow still points near the element
    expect(p.left).toBe(390 - 12 - 340);
    expect(p.arrow).toBeGreaterThan(200);
    expect(p.arrow).toBeLessThanOrEqual(340 - 18);
  });
});
