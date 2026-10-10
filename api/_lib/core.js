/**
 * v0.77.0 (KI-Helfer): the shared parts of the small Pack Generator server on Vercel (project
 * «packgen», https://packgen-three.vercel.app). Taken from the parked Strava server (branch
 * wip-strava, 29b1ca6) without its Strava parts, so Strava can later add its own file next to this.
 *
 * The app stays on GitHub Pages; this folder runs on Vercel as plain Node functions (Web standard
 * Request → Response, no framework, no SDK). Files under api/_lib are not functions themselves
 * (the underscore). There is deliberately no vercel.json (it would change the other Vercel project
 * «packgenerator», which builds the app previews from this repo).
 *
 * What lives here:
 * - env: pick the first set variable of a list of names (values are never logged or answered);
 * - redis: Upstash Redis over its REST API with fetch;
 * - CORS: only the app (GitHub Pages), the Vercel previews of this project and http://localhost:*;
 * - ApiError and route(): clear JSON errors, never the details of an unexpected one.
 */

export const API_BASE = 'https://packgen-three.vercel.app';
export const APP_ORIGIN = 'https://noahdolmetsch-af.github.io';

/** The first non-empty value of these variable names, trimmed ('' when none is set). */
export function pick(names, e = process.env) {
  const list = Array.isArray(names) ? names : [names];
  return list.map((n) => e[n]).find((v) => typeof v === 'string' && v.trim())?.trim() ?? '';
}

/** The storage variables (the Upstash integration of Vercel sets the KV_ names). */
export const REDIS_ENV = {
  url: ['KV_REST_API_URL', 'UPSTASH_REDIS_REST_URL'],
  token: ['KV_REST_API_TOKEN', 'UPSTASH_REDIS_REST_TOKEN'],
};

export function redisEnv(e = process.env) {
  return { redisUrl: pick(REDIS_ENV.url, e).replace(/\/+$/, ''), redisToken: pick(REDIS_ENV.token, e) };
}

export class ApiError extends Error {
  constructor(status, code, message, extra = null) {
    super(message);
    this.status = status;
    this.code = code;
    this.extra = extra;
  }
}

export const NO_STORAGE = () => new ApiError(503, 'storage_not_set_up', 'Storage not set up: connect an Upstash Redis store to the Vercel project (KV_REST_API_URL and KV_REST_API_TOKEN).');

/** Redis over the Upstash REST API: one command per request, e.g. cmd('SET', 'k', 'v', 'EX', 60). */
export function redis(cfg = redisEnv(), doFetch = (...a) => fetch(...a)) {
  if (!cfg.redisUrl || !cfg.redisToken) return null;
  const cmd = async (...args) => {
    let res;
    try {
      res = await doFetch(cfg.redisUrl, {
        method: 'POST',
        headers: { Authorization: `Bearer ${cfg.redisToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(args.map(String)),
      });
    } catch {
      throw new ApiError(503, 'storage_unreachable', 'The storage could not be reached.');
    }
    const body = await res.json().catch(() => ({}));
    if (!res.ok || body.error) throw new ApiError(503, 'storage_error', 'The storage answered with an error.');
    return body.result ?? null;
  };
  return {
    cmd,
    get: (k) => cmd('GET', k),
    set: (k, v, ttl) => (ttl ? cmd('SET', k, v, 'EX', ttl) : cmd('SET', k, v)),
    del: (k) => cmd('DEL', k),
    incrbyfloat: (k, n) => cmd('INCRBYFLOAT', k, n),
    expire: (k, s) => cmd('EXPIRE', k, s),
  };
}

export function needStore(cfg = redisEnv(), doFetch) {
  const r = redis(cfg, doFetch);
  if (!r) throw NO_STORAGE();
  return r;
}

/* ---------- CORS ---------- */

/**
 * The origins that may read the answers: the app on GitHub Pages, the Vercel previews of this
 * project (packgen-….vercel.app) and http://localhost:* for development.
 */
export function allowedOrigin(origin) {
  if (!origin) return false;
  if (origin === APP_ORIGIN) return true;
  if (/^https:\/\/packgen(?:-[a-z0-9-]+)?\.vercel\.app$/.test(origin)) return true;
  return /^http:\/\/(localhost|127\.0\.0\.1)(:\d{1,5})?$/.test(origin);
}

export function corsHeaders(request) {
  const origin = request.headers.get('origin');
  const h = { Vary: 'Origin' };
  if (allowedOrigin(origin)) {
    h['Access-Control-Allow-Origin'] = origin;
    h['Access-Control-Allow-Methods'] = 'GET, POST, OPTIONS';
    h['Access-Control-Allow-Headers'] = 'Authorization, Content-Type';
    h['Access-Control-Max-Age'] = '600';
  }
  return h;
}

/** The answer to a browser's preflight: 204 for the app, 403 for anyone else. */
export function preflight(request) {
  const ok = allowedOrigin(request.headers.get('origin'));
  return new Response(null, { status: ok ? 204 : 403, headers: corsHeaders(request) });
}

export function json(request, status, body, extra = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', ...corsHeaders(request), ...extra },
  });
}

/** Wraps a handler: OPTIONS, the allowed methods and errors as clear JSON. name: for the one log line. */
export function route(methods, name = 'api') {
  return async (request) => {
    if (request.method === 'OPTIONS') return preflight(request);
    const fn = methods[request.method];
    if (!fn) return json(request, 405, { error: 'method_not_allowed', code: 'method_not_allowed', message: `Use ${Object.keys(methods).join(' or ')}.` }, { Allow: [...Object.keys(methods), 'OPTIONS'].join(', ') });
    try {
      return await fn(request);
    } catch (err) {
      if (err instanceof ApiError) return json(request, err.status, { error: err.code, code: err.code, message: err.message, ...(err.extra ?? {}) });
      // Only the kind of error, never its details (they could hold a key or a request body).
      console.error(`${name}: unexpected error`, err?.name ?? 'Error');
      return json(request, 500, { error: 'server_error', code: 'server_error', message: 'Something went wrong on the server.' });
    }
  };
}
