/**
 * Trello (Noah 19.10.2026 «1a 2a 3b 4a 5a», «1a 2a»): Merken to-dos and own lists in both directions with
 * ONE fresh board «Packgenerator» in his own workspace «Packgenerator». The app never touches another board.
 *
 * Login without a secret: Trello's own authorize page gives a token for this app's API key (read and
 * write, never expires) and sends the browser back to ?step=back with the token in the fragment. That
 * small page posts it to ?step=finish with the login state; the server checks the token with Trello and
 * keeps it in Redis (trello:token). The app never sees it.
 *
 * No function file of its own (Vercel Hobby limit): api/google/index.js hands ?svc=trello here. Steps:
 *   POST ?step=start      Bearer <device key>, { returnTo } → { url } (Trello's authorize page)
 *   GET  ?step=back       (Trello sends the browser here) → a tiny page that posts the token to finish
 *   POST ?step=finish     { state, token } → { to } (back into the app)
 *   GET  ?step=status     Bearer → { connected, board }
 *   GET  ?step=board      Bearer → { board, lists, cards } (makes the board once when it is missing)
 *   POST ?step=apply      Bearer, { ops: [op] } (≤ 60) → { results: [{ ref, id }] }
 *        op = { op: 'list-new', ref, name } | { op: 'list-rename', id, name } | { op: 'list-archive', id }
 *           | { op: 'card-new', ref, list | listRef, name, due, done } | { op: 'card-set', id, name?, due?, done? }
 *           | { op: 'card-archive', id }
 *   POST ?step=disconnect Bearer → { ok } (the token is withdrawn at Trello and forgotten here)
 *
 * Environment (only in the Vercel project «packgen»): TRELLO_API_KEY (not secret, but kept there too).
 * Redis: trello:token, trello:board ({ id, name, url }).
 */
import { route, json, needStore, redisEnv, pick, ApiError, API_BASE } from './core.js';
import { needDevice, saveState, takeState, safeReturn, jsonBody } from './oauth.js';

export const TRELLO_API = 'https://api.trello.com/1';
export const AUTHORIZE = 'https://trello.com/1/authorize';
export const BACK = `${API_BASE}/api/google?svc=trello&step=back`;
export const BOARD_NAME = 'Packgenerator';
export const WORKSPACE_NAME = 'Packgenerator';
export const MAX_OPS = 60;
export const MAX_NAME = 500;
const TOKEN_KEY = 'trello:token';
const BOARD_KEY = 'trello:board';
/** Trello ids are 24 hex characters. */
export const goodId = (v) => typeof v === 'string' && /^[0-9a-f]{24}$/.test(v);
const goodRef = (v) => typeof v === 'string' && /^[\w:.@-]{1,120}$/.test(v);
const DAY = /^\d{4}-\d{2}-\d{2}$/;

export function trelloEnv(e = process.env) {
  return { apiKey: pick('TRELLO_API_KEY', e), ...redisEnv(e) };
}

/** A card or list name as Trello takes it: one line, at most 500 characters. */
export function cleanText(v) {
  return String(v ?? '').replace(/[\u0000-\u001f]+/g, ' ').replace(/\s+/g, ' ').trim().slice(0, MAX_NAME);
}

/** The day of a Trello due (an ISO time) in Zurich; null without one. */
export function dayOf(due) {
  if (!due) return null;
  const d = new Date(due);
  if (Number.isNaN(d.getTime())) return null;
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Zurich', year: 'numeric', month: '2-digit', day: '2-digit' }).format(d);
}

/** A day as Trello's due: 09:00 in Zurich (Trello's own default for a date without time). */
export function dueOf(day) {
  if (!day || !DAY.test(day)) return null;
  const noon = new Date(`${day}T12:00:00Z`);
  // the hour in Zurich at 12:00 UTC tells the offset (1 in winter, 2 in summer)
  const h = Number(new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Zurich', hour: '2-digit', hourCycle: 'h23' }).format(noon));
  const off = h - 12;
  return new Date(Date.UTC(Number(day.slice(0, 4)), Number(day.slice(5, 7)) - 1, Number(day.slice(8, 10)), 9 - off)).toISOString();
}

export const cardRow = (c) => ({ id: c.id, list: c.idList, name: String(c.name ?? ''), due: dayOf(c.due), done: !!c.dueComplete, pos: Number(c.pos) || 0 });
export const listRow = (l) => ({ id: l.id, name: String(l.name ?? ''), pos: Number(l.pos) || 0 });

/** The tiny page Trello sends the browser to: it posts the token (from the fragment) to finish. */
export function backPage(state) {
  const s = JSON.stringify(String(state ?? '').slice(0, 100)).replace(/</g, '\\u003c');
  return `<!doctype html><html lang="de"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="referrer" content="no-referrer"><title>Trello</title></head>
<body style="font:16px system-ui,sans-serif;padding:24px"><p id="m">Trello wird verbunden …</p>
<script>
(async () => {
  const token = new URLSearchParams(location.hash.slice(1)).get('token') || '';
  history.replaceState(null, '', location.pathname + location.search);
  let to = '';
  try {
    const r = await fetch('?svc=trello&step=finish', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ state: ${s}, token }) });
    to = (await r.json()).to || '';
  } catch (e) {}
  if (to) location.replace(to); else document.getElementById('m').textContent = 'Das hat nicht geklappt. Schliesse diese Seite und versuche es in der App noch einmal.';
})();
</script></body></html>`;
}

/** Back into the app with the result in the fragment (as the Google login). */
export function appUrl(returnTo, params) {
  const base = safeReturn(returnTo);
  const sep = base.includes('?', base.indexOf('#')) ? '&' : '?';
  return `${base}${sep}${new URLSearchParams(params)}`;
}

export function makeHandler({ env = () => trelloEnv(), doFetch = (...a) => fetch(...a) } = {}) {
  const setUp = (cfg) => {
    if (!cfg.apiKey) throw new ApiError(503, 'not_set_up', 'Trello is not set up on the server (TRELLO_API_KEY).');
  };

  /** One Trello call; Trello's errors become the app's error codes. */
  async function api(cfg, token, path, { method = 'GET', params = {}, body } = {}) {
    let res;
    const q = new URLSearchParams(params).toString();
    try {
      res = await doFetch(`${TRELLO_API}/${path}${q ? `?${q}` : ''}`, {
        method,
        headers: { Authorization: `OAuth oauth_consumer_key="${cfg.apiKey}", oauth_token="${token}"`, Accept: 'application/json', ...(body ? { 'Content-Type': 'application/json' } : {}) },
        body: body ? JSON.stringify(body) : undefined,
      });
    } catch {
      throw new ApiError(502, 'trello_unreachable', 'Trello could not be reached.');
    }
    if (res.status === 401) throw new ApiError(401, 'trello_login_needed', 'Trello needs a new login.');
    if (res.status === 404) throw new ApiError(404, 'trello_missing', 'It is no longer in Trello.');
    if (res.status === 429) throw new ApiError(429, 'trello_busy', 'Trello allows only a few requests right now. Try again later.');
    if (!res.ok) throw new ApiError(502, 'trello_error', 'Trello answered with an error.');
    return res.json().catch(() => ({}));
  }

  async function token(store) {
    const t = await store.get(TOKEN_KEY);
    if (!t) throw new ApiError(409, 'not_connected', 'Trello is not connected.');
    return t;
  }

  /** The board «Packgenerator»: the kept one if it is still open, else found or made in the workspace. */
  async function board(cfg, store, tok) {
    const kept = JSON.parse((await store.get(BOARD_KEY)) ?? 'null');
    if (kept?.id) {
      try {
        const b = await api(cfg, tok, `boards/${kept.id}`, { params: { fields: 'name,url,closed' } });
        if (!b.closed) return { id: kept.id, name: b.name, url: b.url };
      } catch (err) {
        if (err.code !== 'trello_missing') throw err;
      }
    }
    const orgs = await api(cfg, tok, 'members/me/organizations', { params: { fields: 'displayName,name' } });
    const org = (Array.isArray(orgs) ? orgs : []).find((o) => String(o.displayName ?? '').trim().toLowerCase() === WORKSPACE_NAME.toLowerCase());
    if (!org) throw new ApiError(409, 'trello_no_workspace', `Make a workspace «${WORKSPACE_NAME}» in Trello first.`);
    const boards = await api(cfg, tok, `organizations/${org.id}/boards`, { params: { filter: 'open', fields: 'name,url' } });
    let b = (Array.isArray(boards) ? boards : []).find((x) => x.name === BOARD_NAME);
    if (!b) {
      try {
        b = await api(cfg, tok, 'boards', { method: 'POST', body: { name: BOARD_NAME, idOrganization: org.id, defaultLists: false, defaultLabels: false, prefs_permissionLevel: 'private', desc: 'Von der App Packgenerator: Merken-To-dos und eigene Listen. Andere Boards fasst die App nie an.' } });
      } catch (err) {
        if (err.code === 'trello_error') throw new ApiError(409, 'trello_board_limit', 'Trello did not allow a new board in this workspace (limit?).');
        throw err;
      }
    }
    const out = { id: b.id, name: b.name, url: b.url };
    await store.set(BOARD_KEY, JSON.stringify(out));
    return out;
  }

  const name = (v) => {
    const n = cleanText(v);
    if (!n) throw new ApiError(400, 'bad_request', 'Bad name.');
    return n;
  };
  const id = (v) => {
    if (!goodId(v)) throw new ApiError(400, 'bad_request', 'Bad id.');
    return v;
  };

  /** One change; returns the Trello id it made or changed. */
  async function applyOne(cfg, tok, b, op, made) {
    switch (op.op) {
      case 'list-new':
        return (await api(cfg, tok, 'lists', { method: 'POST', body: { name: name(op.name), idBoard: b.id, pos: 'bottom' } })).id;
      case 'list-rename':
        await api(cfg, tok, `lists/${id(op.id)}`, { method: 'PUT', body: { name: name(op.name) } });
        return op.id;
      case 'list-archive':
        await api(cfg, tok, `lists/${id(op.id)}/closed`, { method: 'PUT', body: { value: true } });
        return op.id;
      case 'card-new': {
        const list = op.list ? id(op.list) : made.get(op.listRef);
        if (!goodId(list)) throw new ApiError(400, 'bad_request', 'Bad list.');
        const due = dueOf(op.due);
        return (await api(cfg, tok, 'cards', { method: 'POST', body: { idList: list, name: name(op.name), pos: 'bottom', ...(due ? { due } : {}), dueComplete: !!op.done } })).id;
      }
      case 'card-set': {
        const body = {};
        if ('name' in op) body.name = name(op.name);
        if ('due' in op) body.due = dueOf(op.due);
        if ('done' in op) body.dueComplete = !!op.done;
        await api(cfg, tok, `cards/${id(op.id)}`, { method: 'PUT', body });
        return op.id;
      }
      case 'card-archive':
        await api(cfg, tok, `cards/${id(op.id)}`, { method: 'PUT', body: { closed: true } });
        return op.id;
      default:
        throw new ApiError(400, 'bad_request', 'Unknown op.');
    }
  }

  const main = route(
    {
      GET: async (request) => {
        const url = new URL(request.url);
        const step = url.searchParams.get('step');
        const cfg = env();
        if (step === 'back') {
          return new Response(backPage(url.searchParams.get('state')), { status: 200, headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store', 'Referrer-Policy': 'no-referrer' } });
        }
        const store = needStore(cfg, doFetch);
        await needDevice(request, store);
        setUp(cfg);
        if (step === 'status') {
          const t = await store.get(TOKEN_KEY);
          return json(request, 200, { ok: true, connected: !!t, board: t ? JSON.parse((await store.get(BOARD_KEY)) ?? 'null') : null });
        }
        if (step === 'board') {
          const tok = await token(store);
          const b = await board(cfg, store, tok);
          const [lists, cards] = await Promise.all([
            api(cfg, tok, `boards/${b.id}/lists`, { params: { filter: 'open', fields: 'name,pos' } }),
            api(cfg, tok, `boards/${b.id}/cards`, { params: { filter: 'open', fields: 'name,idList,due,dueComplete,pos' } }),
          ]);
          const open = (Array.isArray(lists) ? lists : []).map(listRow).sort((a, x) => a.pos - x.pos);
          const ids = new Set(open.map((l) => l.id));
          const rows = (Array.isArray(cards) ? cards : []).map(cardRow).filter((c) => ids.has(c.list)).sort((a, x) => a.pos - x.pos);
          return json(request, 200, { ok: true, board: b, lists: open, cards: rows });
        }
        throw new ApiError(400, 'bad_request', 'Unknown step.');
      },
      POST: async (request) => {
        const url = new URL(request.url);
        const step = url.searchParams.get('step');
        const cfg = env();
        const store = needStore(cfg, doFetch);
        if (step === 'finish') {
          // no device key: the browser comes from Trello; the login state proves the start was on Noah's device
          setUp(cfg);
          const body = await jsonBody(request, 2000);
          const st = await takeState(store, 'trello', body.state);
          if (!st) return json(request, 200, { ok: false, to: appUrl(null, { trello: 'error', error: 'expired' }) });
          const tok = String(body.token ?? '');
          if (!/^[\w-]{20,200}$/.test(tok)) return json(request, 200, { ok: false, to: appUrl(st.returnTo, { trello: 'error', error: 'denied' }) });
          try {
            await api(cfg, tok, 'members/me', { params: { fields: 'id' } });
          } catch {
            return json(request, 200, { ok: false, to: appUrl(st.returnTo, { trello: 'error', error: 'denied' }) });
          }
          await store.set(TOKEN_KEY, tok);
          return json(request, 200, { ok: true, to: appUrl(st.returnTo, { trello: 'connected' }) });
        }
        await needDevice(request, store);
        setUp(cfg);
        if (step === 'start') {
          const body = await jsonBody(request);
          const state = await saveState(store, 'trello', { returnTo: safeReturn(body.returnTo) });
          const q = new URLSearchParams({ expiration: 'never', name: 'Packgenerator', scope: 'read,write', response_type: 'token', callback_method: 'fragment', key: cfg.apiKey, return_url: `${BACK}&state=${state}` });
          return json(request, 200, { ok: true, url: `${AUTHORIZE}?${q}` });
        }
        if (step === 'apply') {
          const body = await jsonBody(request, 200_000);
          const ops = Array.isArray(body.ops) ? body.ops : [];
          if (ops.length > MAX_OPS) throw new ApiError(400, 'bad_request', `At most ${MAX_OPS} changes at once.`);
          for (const op of ops) if (op?.ref != null && !goodRef(op.ref)) throw new ApiError(400, 'bad_request', 'Bad ref.');
          const tok = await token(store);
          const b = await board(cfg, store, tok);
          const made = new Map();
          const results = [];
          // one after the other: a new card may need the list made just before
          for (const op of ops) {
            let out = null;
            try {
              out = await applyOne(cfg, tok, b, op, made);
            } catch (err) {
              // a card or list already gone in Trello: nothing to change any more
              if (err.code !== 'trello_missing') throw err;
            }
            if (op.ref && out) made.set(op.ref, out);
            results.push({ ref: op.ref ?? null, id: out });
          }
          return json(request, 200, { ok: true, results });
        }
        if (step === 'disconnect') {
          const t = await store.get(TOKEN_KEY);
          if (t && cfg.apiKey) {
            try {
              await api(cfg, t, `tokens/${t}`, { method: 'DELETE' });
            } catch {
              // Trello unreachable: the server forgets the token anyway
            }
          }
          await store.del(TOKEN_KEY);
          await store.del(BOARD_KEY);
          return json(request, 200, { ok: true });
        }
        throw new ApiError(400, 'bad_request', 'Unknown step.');
      },
    },
    'trello',
  );

  return { main };
}
