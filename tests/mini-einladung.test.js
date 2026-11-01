// Mini-Tools «Spontan-Einladung» (Noah 28.10.2026, idea 5): invite, weather, replies. Fictional data only.
import { describe, it, expect } from 'vitest';
import { inviteQuestion, readInvite, cleanReply, groupReplies, daysOpen, wxOf, cleanUrl, inviteText } from '../src/lib/mini/einladung.js';

const T = (s, v = {}) => s.replace(/\{(\w+)\}/g, (_, k) => String(v[k]));

describe('the invite', () => {
  it('needs a day and keeps only clean parts', () => {
    expect(inviteQuestion({ title: 'Feierabendrunde' })).toBeNull();
    const q = inviteQuestion({ title: ' Feierabendrunde ', day: '2026-11-03', time: '17:30', where: 'Brunnen', routeUrl: 'javascript:alert(1)', wx: { place: 'Testdorf', min: 4.4, max: 11.6, rain: 20 } });
    expect(q).toMatchObject({ kind: 'invite', title: 'Feierabendrunde', time: '17:30', routeUrl: '', wx: { place: 'Testdorf', min: 4, max: 12, rain: 20 } });
    expect(readInvite({ ...q, pk: 'k' }).pk).toBe('k');
    expect(readInvite({ ...q, kind: 'list', pk: 'k' })).toBeNull();
    expect(cleanUrl('https://example.test/route/1')).toBe('https://example.test/route/1');
  });
  it('takes the weather of the day from a forecast', () => {
    const f = { place: { name: 'Testdorf, Testkanton' }, days: [{ date: '2026-11-03', min: 3, max: 9, rainPct: 60 }] };
    expect(wxOf(f, '2026-11-03')).toEqual({ place: 'Testdorf', min: 3, max: 9, rain: 60 });
    expect(wxOf(f, '2026-11-04')).toBeNull();
  });
  it('groups the replies and stays open until the day after', () => {
    expect(cleanReply({ name: 'A', reply: 'x' })).toBeNull();
    const g = groupReplies([cleanReply({ name: 'A', reply: 'y' }), cleanReply({ name: 'B', reply: 'n' }), cleanReply({ name: 'C', reply: 'm' }), cleanReply({ name: 'D', reply: 'y' })]);
    expect(g.y.map((r) => r.name)).toEqual(['A', 'D']);
    expect(daysOpen('2026-11-02', '2026-11-03')).toBe(2);
    expect(daysOpen('2026-11-02', '2026-11-02')).toBe(1);
    expect(inviteText({ title: 'Runde', time: '17:30', where: 'Brunnen' }, g, T, 'Di 3.11.')).toBe('Runde\nDi 3.11., 17:30\nBrunnen\nIn: A, D\nMaybe: C');
  });
});
