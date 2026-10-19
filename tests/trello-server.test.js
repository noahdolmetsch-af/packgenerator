// Trello on the server (api/google/index.js ?svc=trello, api/_lib/trello.js) with a fake Redis and a fake Trello.
// Fictional key, token and ids only.
import { describe, it, expect, vi } from 'vitest';
import { makeHandler, dueOf, dayOf, backPage, BOARD_NAME } from '../api/_lib/trello.js';
import { hash, KEYS } from '../api/_lib/oauth.js';

const REDIS = 'https://redis.example.test';
const DEVICE = 'test-device-key-not-real';
const TOKEN = 'testtrellotoken0123456789abcdef';
const ORG = 'a'.repeat(24);
const BOARD = 'b'.repeat(24);
const LIST = '1'.repeat(24);
const CARD = 'c'.repeat(24);

function world({ orgs = [{ id: ORG, displayName: 'Packgenerator' }], boards = [] } = {}) {
  const store = {};
  const sets = { [KEYS]: new Set([hash(DEVICE)]) };
  const calls = [];
  const doFetch = vi.fn(async (url, init = {}) => {
    if (url === REDIS) {
      const [cmd, k, ...rest] = JSON.parse(init.body);
      if (cmd === 'GET') return Response.json({ result: store[k] ?? null });
      if (cmd === 'SET') return Response.json({ result: (store[k] = rest[0]) && 'OK' });
      if (cmd === 'GETDEL') {
        const v = store[k] ?? null;
        delete store[k];
        return Response.json({ result: v });
      }
      if (cmd === 'DEL') return Response.json({ result: delete store[k] ? 1 : 0 });
      if (cmd === 'SISMEMBER') return Response.json({ result: sets[k]?.has(rest[0]) ? 1 : 0 });
      return Response.json({ result: 1 });
    }
    const u = new URL(url);
    calls.push({ method: init.method ?? 'GET', path: u.pathname.replace('/1/', ''), body: init.body ? JSON.parse(init.body) : null, auth: init.headers?.Authorization });
    const p = u.pathname.replace('/1/', '');
    if (p === 'members/me') return Response.json({ id: 'me' });
    if (p === 'members/me/organizations') return Response.json(orgs);
    if (p === `organizations/${ORG}/boards`) return Response.json(boards);
    if (p === 'boards' && init.method === 'POST') return Response.json({ id: BOARD, name: BOARD_NAME, url: 'https://trello.example/b' });
    if (p === `boards/${BOARD}`) return Response.json({ id: BOARD, name: BOARD_NAME, url: 'https://trello.example/b', closed: false });
    if (p === `boards/${BOARD}/lists`) return Response.json([{ id: LIST, name: 'To-dos', pos: 1 }]);
    if (p === `boards/${BOARD}/cards`) return Response.json([{ id: CARD, idList: LIST, name: 'Licht', due: '2026-10-20T07:00:00.000Z', dueComplete: false, pos: 1 }]);
    if (p === 'lists' && init.method === 'POST') return Response.json({ id: '2'.repeat(24) });
    if (p === 'cards' && init.method === 'POST') return Response.json({ id: 'd'.repeat(24) });
    return Response.json({});
  });
  const h = makeHandler({ env: () => ({ apiKey: 'testkey', redisUrl: REDIS, redisToken: 'r' }), doFetch });
  return { store, calls, h };
}
const req = (step, { method = 'GET', body, key = DEVICE } = {}) =>
  new Request(`https://packgen-three.vercel.app/api/google?svc=trello&step=${step}`, { method, headers: { ...(key ? { Authorization: `Bearer ${key}` } : {}), 'Content-Type': 'application/json' }, body: body ? JSON.stringify(body) : undefined });

describe('Trello server', () => {
  it('days and Trello due times in Zurich', () => {
    expect(dueOf('2026-10-20')).toBe('2026-10-20T07:00:00.000Z'); // summer time
    expect(dueOf('2026-12-01')).toBe('2026-12-01T08:00:00.000Z');
    expect(dayOf('2026-10-19T22:30:00.000Z')).toBe('2026-10-20');
    expect(dueOf('bad')).toBeNull();
  });

  it('only Noah\'s devices may start; the login comes back through the small page into the app', async () => {
    const w = world();
    expect((await w.h.main(req('start', { method: 'POST', body: {}, key: 'other' }))).status).toBe(401);
    const start = await (await w.h.main(req('start', { method: 'POST', body: { returnTo: 'https://noahdolmetsch-af.github.io/packgenerator/#/calendar' } }))).json();
    const u = new URL(start.url);
    expect(u.origin + u.pathname).toBe('https://trello.com/1/authorize');
    expect(u.searchParams.get('scope')).toBe('read,write');
    const state = new URL(u.searchParams.get('return_url')).searchParams.get('state');
    const page = await (await w.h.main(req('back', { key: null }))).text();
    expect(page).toContain('step=finish');
    const fin = await (await w.h.main(req('finish', { method: 'POST', body: { state, token: TOKEN }, key: null }))).json();
    expect(fin.to).toBe('https://noahdolmetsch-af.github.io/packgenerator/#/calendar?trello=connected');
    expect(w.store['trello:token']).toBe(TOKEN);
    // a used state does not work twice
    const again = await (await w.h.main(req('finish', { method: 'POST', body: { state, token: TOKEN }, key: null }))).json();
    expect(again.to).toContain('error=expired');
  });

  it('the return page never runs a state as code', () => {
    expect(backPage('</script><script>alert(1)')).not.toContain('</script><script>alert');
  });

  it('makes the board once in the workspace «Packgenerator» and reads it', async () => {
    const w = world();
    w.store['trello:token'] = TOKEN;
    const r = await (await w.h.main(req('board'))).json();
    expect(r.board.id).toBe(BOARD);
    expect(r.lists).toEqual([{ id: LIST, name: 'To-dos', pos: 1 }]);
    expect(r.cards[0]).toMatchObject({ id: CARD, list: LIST, name: 'Licht', due: '2026-10-20', done: false });
    const made = w.calls.find((c) => c.path === 'boards' && c.method === 'POST');
    expect(made.body).toMatchObject({ name: BOARD_NAME, idOrganization: ORG, defaultLists: false });
    expect(made.auth).toContain('oauth_token="' + TOKEN);
    // the second time the kept board is used
    w.calls.length = 0;
    await w.h.main(req('board'));
    expect(w.calls.some((c) => c.path === 'boards' && c.method === 'POST')).toBe(false);
  });

  it('without the workspace «Packgenerator» it says so and makes nothing', async () => {
    const w = world({ orgs: [{ id: ORG, displayName: 'Andere' }] });
    w.store['trello:token'] = TOKEN;
    const r = await w.h.main(req('board'));
    expect(r.status).toBe(409);
    expect((await r.json()).code).toBe('trello_no_workspace');
  });

  it('applies changes one after the other; a new card gets the list made before', async () => {
    const w = world();
    w.store['trello:token'] = TOKEN;
    const ops = [{ op: 'list-new', ref: 'L:x', name: 'Einkauf' }, { op: 'card-new', ref: 'C:i1', listRef: 'L:x', name: 'Brot', due: '2026-10-20', done: false }, { op: 'card-set', id: CARD, done: true }];
    const r = await (await w.h.main(req('apply', { method: 'POST', body: { ops } }))).json();
    expect(r.results).toEqual([{ ref: 'L:x', id: '2'.repeat(24) }, { ref: 'C:i1', id: 'd'.repeat(24) }, { ref: null, id: CARD }]);
    const card = w.calls.find((c) => c.path === 'cards' && c.method === 'POST');
    expect(card.body).toMatchObject({ idList: '2'.repeat(24), name: 'Brot', due: '2026-10-20T07:00:00.000Z' });
    expect(w.calls.find((c) => c.path === `cards/${CARD}`).body).toEqual({ dueComplete: true });
  });

  it('refuses bad ids and too many changes', async () => {
    const w = world();
    w.store['trello:token'] = TOKEN;
    expect((await w.h.main(req('apply', { method: 'POST', body: { ops: [{ op: 'card-archive', id: '../boards' }] } }))).status).toBe(400);
    expect((await w.h.main(req('apply', { method: 'POST', body: { ops: Array(61).fill({ op: 'card-archive', id: CARD }) } }))).status).toBe(400);
  });

  it('disconnect withdraws the token and forgets it', async () => {
    const w = world();
    w.store['trello:token'] = TOKEN;
    await w.h.main(req('disconnect', { method: 'POST', body: {} }));
    expect(w.store['trello:token']).toBeUndefined();
    expect(w.calls.some((c) => c.method === 'DELETE' && c.path === `tokens/${TOKEN}`)).toBe(true);
  });
});

describe('Trello rides in /api/google (Vercel function limit)', () => {
  it('?svc=trello reaches the Trello steps, the return page posts back to the same address', async () => {
    const { GET } = await import('../api/google/index.js');
    const res = await GET(new Request('https://packgen-three.vercel.app/api/google?svc=trello&step=back&state=s1'));
    expect(res.headers.get('content-type')).toContain('text/html');
    expect(await res.text()).toContain("fetch('?svc=trello&step=finish'");
  });
});
