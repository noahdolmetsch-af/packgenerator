// Noah 27.10.2026 «1a 2a»: voice notes in the Rückblick timeline, played where they were spoken. Fictional data.
import { describe, it, expect } from 'vitest';
import { timeline } from '../src/lib/review/ganz.js';

const VOICE = 'data:audio/webm;base64,AAAA';
const trip = { id: 'test_data_t', startDate: '2026-10-10', days: 2 };
const rides = [{ id: 'r1', date: '2026-10-10', startAt: '2026-10-10T08:00:00.000Z', totalH: 4, km: 80 }];

describe('timeline with voice notes', () => {
  it('a note keeps its own voice notes, a note without text still shows', () => {
    const notes = [
      { id: 'n1', day: 0, at: '2026-10-10T10:00:00.000Z', text: 'test_data_ Nebel', inputs: { voices: [{ id: 'v1', src: VOICE, s: 12, at: '2026-10-10T10:00:00.000Z', text: 'test_data_ gesagt' }] } },
      { id: 'n2', day: 0, at: '2026-10-10T11:00:00.000Z', text: '', inputs: { voices: [{ id: 'v2', src: VOICE, s: 30 }] } },
      { id: 'n3', day: 0, at: '2026-10-10T11:30:00.000Z', text: 'test_data_ ohne Ton' },
    ];
    const tl = timeline({ trip, rides, notes });
    const ns = tl.filter((e) => e.kind === 'note');
    expect(ns).toHaveLength(3);
    expect(ns[0].voices).toEqual([{ id: 'v1', src: VOICE, s: 12, text: 'test_data_ gesagt' }]);
    expect(ns[0].km).toBe(40);
    expect(ns[1]).toMatchObject({ text: '', voices: [{ id: 'v2', s: 30 }] });
    expect(ns[2].voices).toBeUndefined();
  });

  it('other voice notes («Hier bin ich», diary) become their own entries, in time order and by day', () => {
    const voices = [
      { day: 0, at: '2026-10-10T09:00:00.000Z', text: '', where: 'test_data_ Brücke', voices: [{ id: 'k1', src: VOICE, s: 8 }] },
      { day: 1, at: '2026-10-11T07:00:00.000Z', text: 'test_data_ Morgen', voices: [{ id: 'k2', src: VOICE, s: 20 }] },
      { day: 1, at: '2026-10-11T08:00:00.000Z', voices: [] },
    ];
    const tl = timeline({ trip, rides, voices });
    const vs = tl.filter((e) => e.kind === 'voice');
    expect(vs).toHaveLength(2);
    expect(vs[0]).toMatchObject({ day: 0, where: 'test_data_ Brücke', km: 20, voices: [{ id: 'k1' }] });
    expect(tl.indexOf(vs[0])).toBeGreaterThan(tl.findIndex((e) => e.kind === 'start'));
    expect(timeline({ trip, rides, voices, day: 1 }).map((e) => e.kind)).toEqual(['voice']);
  });

  it('without voice notes the timeline is as before', () => {
    const notes = [{ id: 'n1', day: 0, at: '2026-10-10T10:00:00.000Z', text: 'test_data_ a' }];
    const a = timeline({ trip, rides, notes });
    expect(a.map((e) => e.kind)).toEqual(['start', 'note', 'end']);
    expect(a[1]).toEqual({ kind: 'note', at: notes[0].at, day: 0, km: 40, tkm: 40, text: 'test_data_ a', photo: null, n: 2 });
  });
});
