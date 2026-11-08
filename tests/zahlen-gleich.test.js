// «Widersprüchliche Zahlen reparieren» (Noah 08.11.2026 «1-5 a», UX-Test 1-02, 1-03, 2a-04, 2b-02, 3-04, G6-03).
// Wächter: wo dieselbe Zahl an zwei Stellen steht, kommt sie aus EINER Regel. Wird rot, wenn eine Stelle wieder
// eigene Wege rechnet. Fictional data only (test_data_gtp_), calendar days.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { backupRows } from '../src/lib/home/backuprows.js';
import { factCounts, waitingCount } from '../src/lib/review/state.js';
import { buildWeek } from '../src/lib/woche.js';
import { weekClose } from '../src/lib/woche/abschluss.js';
import { viewSummary } from '../src/lib/gear/material.js';
import { gearStats } from '../src/lib/gear.js';
import { flowStates, normAct } from '../src/lib/flow.js';
import { weekGoals } from '../src/lib/flowweek.js';
import { weekGoalsMet } from '../src/lib/weekreview.js';

const P = 'test_data_gtp_';
const src = (f) => readFileSync(new URL(`../${f}`, import.meta.url), 'utf8');

describe('Heute: Backup-Zeile sagt nie «kein Backup» und «Daten aus dem Backup» in einem Satz (1-02)', () => {
  it('zwei Zeilen, wenn die Daten aus einem Backup stammen', () => {
    const rows = backupRows({ backup: { due: true, days: null }, from: '8. Nov., 07:00' });
    expect(rows.map((r) => r.key)).toEqual(['backup', 'backupfrom']);
    expect(rows[0].tone).toBe('bad');
    expect(rows[1].tone).toBe('warn');
    expect(rows[0].text).not.toContain('8. Nov.');
    expect(rows[1].text).toContain('8. Nov.');
    expect(rows[1].act.href).toBe('#/me/data');
  });
  it('ohne Import eine Zeile; nicht fällig keine', () => {
    expect(backupRows({ backup: { due: true, days: 12 } })).toHaveLength(1);
    expect(backupRows({ backup: { due: false, days: 2 }, from: 'x' })).toEqual([]);
  });
});

describe('Heute: die Zahlen auf der Tour-Karte haben ein Wort (1-03)', () => {
  const home = src('src/pages/Home.svelte');
  it('keine nackte «1 / 8»-Zahl und kein «+9 weitere» daneben', () => {
    expect(home).not.toMatch(/\{cardTrips\.length\} ›/);
    expect(home).not.toContain("'+{n} more trip'");
    expect(home).toContain("t('Trip {i} of {n}'");
    expect(home).toContain("t('Also in progress: {n}'");
  });
});

describe('Touren, Rückblick, Logbuch, Vergangene Touren: «wartet auf Rückblick» zählt gleich (2a-04)', () => {
  const rows = [
    { id: 't1', kind: 'trip' }, // Tour, Rückblick fehlt
    { id: 't2', kind: 'trip' }, // Tour, bewertet
    { id: 'r1', kind: 'ride' }, // hochgeladene Fahrt, wartet auf den kurzen Rückblick
    { id: 'r2', kind: 'ride' }, // hochgeladene Fahrt, Alles gut gedrückt
  ];
  const states = { t1: { state: 'done' }, t2: { state: 'rated' }, r1: { state: 'done' }, r2: { state: 'rated' } };
  it('eine Regel: Abgeschlossen und noch nicht bewertet, Touren und Fahrten', () => {
    expect(waitingCount(rows, states)).toBe(2);
    expect(waitingCount(rows, states)).toBe(factCounts(rows, states).done);
    expect(waitingCount(rows.filter((r) => r.kind === 'trip'), states)).toBe(1);
  });
  it('alle vier Seiten rechnen mit waitingCount, keine hat eine eigene Regel', () => {
    for (const f of ['src/pages/Trips.svelte', 'src/lib/review/Hub.svelte', 'src/lib/review/Logbook.svelte', 'src/pages/PastTrips.svelte']) expect(src(f), f).toContain('waitingCount(');
    // der alte Weg (nur offene Touren zählen) ist weg
    expect(src('src/lib/review/Logbook.svelte')).not.toMatch(/filter\(\(s\) => s\.open\)/);
    expect(src('src/lib/review/Hub.svelte')).not.toMatch(/factCounts\(stats\.rows\.filter/);
  });
});

describe('Woche: eine Tour in der Woche ist nicht «nichts geplant» (2b-02)', () => {
  const base = { monday: '2026-11-02', today: '2026-11-08', actName: (id) => `act ${id}` };
  const trips = [{ id: `${P}trip1`, title: `${P}Tour`, startDate: '2026-11-07', days: 3 }];
  it('die Zeile zählt die Tour einmal, auch wenn sie mehrere Tage dauert', () => {
    const w = buildWeek({ ...base, trips });
    expect(w.sums.trips).toBe(1);
    expect(w.sums.sessions + w.sums.dates + w.sums.todos).toBe(0);
  });
  it('der Wochen-Abschluss kennt die Tour: nicht leer, wenn nur sie im Plan stand', () => {
    const w = buildWeek({ ...base, trips });
    const c = weekClose(w.days, base.monday, base.today, w.sums.trips);
    expect(c.trips).toBe(1);
    expect(c.done.n + c.open.n).toBe(0);
    const wc = src('src/lib/woche/WeekClose.svelte');
    expect(wc).toContain('close.trips');
  });
  it('ohne Tour bleibt es «nichts geplant»', () => {
    const w = buildWeek({ ...base, trips: [] });
    expect(w.sums.trips).toBe(0);
    expect(weekClose(w.days, base.monday, base.today, w.sums.trips).trips).toBe(0);
  });
});

describe('Material: die Kachel «gewogen» und die Zeile «nicht im Materialgewicht» sagen dasselbe (3-04)', () => {
  const it0 = (id, category, weightG) => ({ id: `${P}${id}`, name: `${P}${id}`, category, weightG, qty: 1, ownership: 'owned' });
  const list = [it0('zelt', 'sleep', 1500), it0('jacke', 'rain', 400), it0('riegel', 'food', 2000), it0('wasser', 'food', 1000)];
  it('Essen und Trinken steht neben dem Gerätegewicht, nicht darin', () => {
    const s = viewSummary(list, {});
    expect(s.foodG).toBe(3000);
    expect(s.gearG).toBe(1900);
    expect(s.gearG + s.foodG).toBe(s.g);
  });
  it('das Gerätegewicht der Kachel ist das Gesamtgewicht der Übersicht (ohne Essen)', () => {
    expect(viewSummary(list, {}).gearG).toBe(gearStats(list).total);
    expect(viewSummary(list, {}).foodG).toBe(gearStats(list).consumablesG);
  });
});

describe('Aktiv: Kopfzeile, Wochenkarte und Wochenrückblick zählen dieselben Ziele (G6-03)', () => {
  const ACTS = [
    normAct({ id: 'bike', name: 'Bike', icon: 'bike', ring: 'move', goals: [{ id: 'g', count: 2, days: 7 }] }),
    normAct({ id: 'yoga', name: 'Yoga', icon: 'yoga', ring: 'move', goals: [{ id: 'g', count: 1, days: 7 }] }),
    normAct({ id: 'sauna', name: 'Sauna', icon: 'sauna', ring: 'rest', goals: [{ id: 'g', count: 1, days: 7 }] }),
    normAct({ id: 'meditation', name: 'Meditation', icon: 'lotus', ring: 'mind', goals: [{ id: 'g', count: 1, days: 1 }] }),
  ];
  const log = [{ id: `${P}1`, actId: 'yoga', day: '2026-11-04', at: '2026-11-04T10:00:00.000Z', n: 1 }];
  it('die Kopfzeile (alle Ziele) ist das «von N» des Wochenrückblicks', () => {
    const today = '2026-11-08';
    const states = flowStates(ACTS, log, today, []);
    const all = weekGoals(states);
    const review = weekGoalsMet({ flowActs: ACTS, log, tripDays: [] }, '2026-11-02', today);
    expect(all.length).toBe(review.of);
    expect(all.filter((g) => g.met).length).toBe(review.met);
    expect(all.filter((g) => !g.met).length).toBe(review.of - review.met); // die Wochenkarte: «n offen»
  });
  it('die Kopfzeile von Aktiv zählt alle Ziele, nicht nur die des Rings «Bewegen»', () => {
    const flow = src('src/pages/Flow.svelte');
    expect(flow).toContain('weekGoals(states)');
    expect(flow).not.toContain('rings.move.of ? tn(');
  });
});
