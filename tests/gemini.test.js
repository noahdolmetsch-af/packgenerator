// «Frag Gemini» (Noah 23.11.2026): the app's side: the call, the photo size and the actions Gemini may suggest.
import { describe, it, expect } from 'vitest';
import { askGemini, reasonOf, ASK_URL } from '../src/lib/gemini/client.js';
import { fitSize } from '../src/lib/gemini/photo.js';
import { toActions } from '../src/lib/gemini/befehl.js';

const res = (status, body) => ({ ok: status < 400, status, json: async () => body });

describe('client', () => {
  it('sends only the question, the language, the day and the photo', async () => {
    let sent;
    const r = await askGemini({ text: 'Hi', image: { mime: 'image/jpeg', data: 'QUJD', preview: 'data:x' }, lang: 'de', today: '2026-11-23' }, { doFetch: async (url, init) => ((sent = { url, body: JSON.parse(init.body) }), res(200, { ok: true, text: 'Hallo' })) });
    expect(r).toEqual({ ok: true, text: 'Hallo' });
    expect(sent.url).toBe(ASK_URL);
    expect(Object.keys(sent.body).sort()).toEqual(['image', 'lang', 'mode', 'text', 'today']);
    expect(sent.body.image).toEqual({ mime: 'image/jpeg', data: 'QUJD' }); // no preview goes out
  });
  it('names the reason of a failure', async () => {
    expect(await askGemini({ text: 'a' }, { doFetch: async () => { throw new Error('x'); } })).toEqual({ ok: false, reason: 'offline' });
    expect(await askGemini({ text: 'a' }, { doFetch: async () => res(429, { code: 'busy' }) })).toMatchObject({ ok: false, reason: 'busy' });
    expect(reasonOf(429, 'daily_cap')).toBe('busy');
    expect(reasonOf(503, 'not_set_up')).toBe('not_set_up');
    expect(reasonOf(413, 'image_too_big')).toBe('too_big');
    expect(reasonOf(502, 'ai_unavailable')).toBe('failed');
  });
  it('hands on what the server says about a failure (code, models tried), nothing else', async () => {
    const r = await askGemini({ text: 'a' }, { doFetch: async () => res(502, { code: 'ai_unavailable', tried: ['m1:404', 'm2:403'], message: 'secret-ish' }) });
    expect(r).toEqual({ ok: false, reason: 'failed', detail: '502 ai_unavailable m1:404 m2:403' });
  });
});

describe('photo', () => {
  it('fits the long side, never enlarges', () => {
    expect(fitSize(4000, 3000)).toEqual({ w: 1024, h: 768 });
    expect(fitSize(3000, 4000)).toEqual({ w: 768, h: 1024 });
    expect(fitSize(800, 600)).toEqual({ w: 800, h: 600 });
    expect(fitSize(0, 5)).toEqual({ w: 0, h: 0 });
  });
});

describe('actions', () => {
  it('makes the actions of the search and checks them again', () => {
    const a = toActions([
      { kind: 'remind', text: 'reifen pumpen', due: '2026-11-27' },
      { kind: 'remind', text: 'ohne Tag' },
      { kind: 'list', name: 'Wochenende', points: ['Sonnencreme', 'Snacks'] },
      { kind: 'note', text: 'Kette quietscht' },
      { kind: 'value', qid: 'koerper.ruhepuls', value: 48 },
      { kind: 'value', qid: 'koerper.waage', value: 5 },
      { kind: 'remove', id: 1 },
    ]);
    expect(a.map((x) => x.kind)).toEqual(['remind', 'remind', 'list', 'cmd']);
    expect(a[0]).toMatchObject({ text: 'Reifen pumpen', due: '2026-11-27', writes: true });
    expect(a[1].due).toBeNull();
    expect(a[3].cmd).toEqual({ kind: 'note', text: 'Kette quietscht' });
    expect(toActions('x')).toEqual([]);
  });
  it('writes only the four adding kinds, at most four', () => {
    const many = Array.from({ length: 9 }, (_, i) => ({ kind: 'note', text: `Notiz ${i}` }));
    expect(toActions(many)).toHaveLength(4);
    expect(toActions([{ kind: 'value', qid: 'erholung.schlaf', value: 7 }])[0]).toEqual({ kind: 'value', qid: 'erholung.schlaf', value: 7, writes: true });
  });
});
