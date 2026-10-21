/**
 * Google Health (server package with E3, Noah 12.10.2026 «b server zuerst»): read Noah's daily
 * values (sleep, steps, resting heart rate, HRV) from the Google Health API v4, the successor of
 * the Fitbit Web API. Observation only: no score, no diagnosis. Read only.
 *
 * Functions (thin files that only call makeHandler):
 *   api/google/index.js     POST ?step=start      Bearer <device key>, { returnTo } → { url }
 *                           GET  ?step=status     Bearer → { connected, scopes }
 *                           GET  ?step=data       Bearer, &type=<one of TYPES>&pageToken=… → { points, next }
 *                           GET  ?step=days       Bearer, &from=YYYY-MM-DD&to=YYYY-MM-DD (≤ 90 days)
 *                                                 → { days: [{ date, restingHr, hrvMs, sleep, steps, azm }] }
 *                                                 (googledays.js; the app keeps them, the server keeps none)
 *                           POST ?step=disconnect Bearer → { ok } (Google access withdrawn)
 *                           POST ?step=drive-upload Bearer, body = the PDF or JPEG (at most 4 MB),
 *                                &name=…&root=pdf|photos&group=… → { id, link }
 *                           POST ?step=drive-move   Bearer, { fileId, root, group } → { ok }
 *                           POST ?step=drive-rename Bearer, { fileId, name } → { ok }
 *                           GET  ?step=cal-list     Bearer → { calendars: [{ id, name, color, primary, write }] }
 *                           GET  ?step=cal-events   Bearer, &from&to (≤ 92 days) &cal=id,id (default primary)
 *                                                   → { events: [googleplan.js eventRow] }
 *                           POST ?step=cal-save     Bearer, { cal, gid?, title, day, lastDay?, allDay, from?, to?,
 *                                                   where?, note? } → { event } (new without gid, else changed)
 *                           POST ?step=cal-delete   Bearer, { cal, gid } → { ok }
 *                           GET  ?step=task-lists   Bearer → { lists: [{ id, title }] }
 *                           GET  ?step=tasks        Bearer, &list=id (default: every list) → { tasks: [taskRow] }
 *                                                   (open ones and the ones done in the last 30 days)
 *                           POST ?step=task-save    Bearer, { list, id?, title?, notes?, due?, done? } → { task }
 *                           POST ?step=task-delete  Bearer, { list, id } → { ok }
 *                           POST ?step=own-sync     Bearer, { items: [ownBody item] } → { cal, made, changed, removed }
 *                                                   (package G: the app's own calendar «Packgenerator», made once;
 *                                                   its events follow the list: new, changed, gone)
 *                           POST ?step=own-list     Bearer → { list: { id, title } } (package G: the task list
 *                                                   «Packgenerator Notizen», made once)
 *                           GET  ?step=mail-list    Bearer, &q=… (Gmail search; default the inbox) &page=token
 *                                                   → { mails: [googlemail.js mailRow], next }
 *                           GET  ?step=mail-get     Bearer, &id=… → { mail: { …mailRow, text, files } }
 *                           GET  ?step=mail-file    Bearer, &id=…&att=… → { data (base64), size } («Mail in die App»:
 *                                                   one attachment, at most FILE_MAX; the server keeps nothing)
 *                           POST ?step=mail-send    Bearer, { to, cc?, subject, text, replyTo? (message id),
 *                                                   files?: [{ name, type, data (base64) }] at most 3, FILE_MAX together }
 *                                                   → { id } (sent only after Noah's tap on «Senden»)
 *
 * Google Kalender und Aufgaben (package GA, Noah 15.10.2026 «3 beides», 21:11 «3b» with «Woche planen»):
 * scopes calendar.events (read and write events) + calendar.calendarlist.readonly (which calendars) and
 * tasks; asked for with { services: ['calendar', 'tasks'] }. The server keeps no event and no task.
 *
 * Google Mail (package GM, Noah 15.10.2026 «4a»: read and send together): scopes gmail.readonly and
 * gmail.send (services: ['mail']); the app keeps no mail on the device either, it fetches what a page shows.
 *
 * Google Drive (package «Dokumente-PDF», Noah 15.10.2026 «1b»: the imported PDFs also in his Drive,
 * «2a» every group its own subfolder): only the scope drive.file, so the app sees nothing in Drive but
 * the folders and files it made itself. Start with { services: ['drive'] } asks for Drive in addition
 * (include_granted_scopes keeps the Fitbit values). Folder ids are kept in Redis (google:drive:folders).
 *   api/google/callback.js  GET  (Google sends the browser back here; the redirect URI configured in
 *                           Google Cloud is https://packgen-three.vercel.app/api/google/callback)
 *
 * The device key comes from the Strava login (api/strava.js): only Noah's devices can connect Google.
 * Environment (values only in the Vercel project «packgen»): GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET.
 * Redis: google:tokens (JSON). While the Google app is in testing mode a refresh token ends after
 * 7 days; then the data step answers 401 google_login_needed and the app asks for a new login.
 */
import { route, json, needStore, redisEnv, pick, ApiError, API_BASE } from './core.js';
import { needDevice, saveState, takeState, backToApp, jsonBody } from './oauth.js';
import { makeAccount } from './account.js';
import { MAX_DAYS, spanDays, rollUpBody, listFilter, daysFrom, chunks } from './googledays.js';
import { MAIL_SCOPES, GMAIL_API, MAIL_PAGE, FILE_MAX, mailRow, bodyOf, rawMail } from './googlemail.js';
import { CALENDAR_SCOPES, TASKS_SCOPE, CALENDAR_API, TASKS_API, MAX_EVENT_DAYS, MAX_CALS, spanOf, dayStart, dayEnd, eventRow, eventBody, taskRow, taskBody, calRow, listRow, OWN_CAL_SCOPE, OWN_CAL_NAME, OWN_LIST_NAME, MAX_OWN_ITEMS, KEY_PROP, ownBody, sameEvent } from './googleplan.js';

export const AUTHORIZE_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
export const TOKEN_URL = 'https://oauth2.googleapis.com/token';
export const REVOKE_URL = 'https://oauth2.googleapis.com/revoke';
export const API = 'https://health.googleapis.com/v4/users/me';
export const CALLBACK = `${API_BASE}/api/google/callback`;
export const SCOPES = [
  'https://www.googleapis.com/auth/googlehealth.sleep.readonly',
  'https://www.googleapis.com/auth/googlehealth.activity_and_fitness.readonly',
  'https://www.googleapis.com/auth/googlehealth.health_metrics_and_measurements.readonly',
];
/** Drive: only the files and folders this app made (no look into the rest of Noah's Drive). */
export const DRIVE_SCOPE = 'https://www.googleapis.com/auth/drive.file';
export const DRIVE_API = 'https://www.googleapis.com/drive/v3/files';
export const DRIVE_UPLOAD = 'https://www.googleapis.com/upload/drive/v3/files';
/** The two top folders in «Meine Ablage» (Noah 15.10.2026: «Importierte PDF»; photos kept as photos). */
export const DRIVE_ROOTS = { pdf: 'Importierte PDF', photos: 'Importierte Fotos' };
export const DRIVE_MAX_BYTES = 4 * 1024 * 1024;
const FOLDER = 'application/vnd.google-apps.folder';
const FOLDERS_KEY = 'google:drive:folders';
const OWN_CAL_KEY = 'google:cal:own';
const OWN_LIST_KEY = 'google:tasks:own';

/** Every scope this app may ask Google for. */
const KNOWN_SCOPES = [...SCOPES, DRIVE_SCOPE, ...CALENDAR_SCOPES, TASKS_SCOPE, OWN_CAL_SCOPE, ...MAIL_SCOPES];

/** The scopes to ask for: Fitbit values, Drive, or both (unknown names are ignored). */
export function scopesFor(services) {
  const list = Array.isArray(services) ? services : ['health'];
  const out = [
    ...(list.includes('health') ? SCOPES : []),
    ...(list.includes('drive') ? [DRIVE_SCOPE] : []),
    ...(list.includes('calendar') ? CALENDAR_SCOPES : []),
    ...(list.includes('tasks') ? [TASKS_SCOPE] : []),
    ...(list.includes('owncal') ? [OWN_CAL_SCOPE] : []),
    ...(list.includes('mail') ? MAIL_SCOPES : []),
  ];
  return out.length ? out : SCOPES;
}

/** A file or folder name Drive accepts: no line breaks or slashes, at most 120 characters. */
export function cleanName(v, fallback = 'Dokument') {
  const s = String(v ?? '').replace(/[\u0000-\u001f/\\]+/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 120);
  return s || fallback;
}

/** The data types tested with Noah's account on 12.10.2026 (all 200 OK). */
export const TYPES = ['sleep', 'steps', 'daily-resting-heart-rate', 'daily-heart-rate-variability', 'active-zone-minutes'];
/** Pages per list call in the days step (a night or a day is one point; 90 days fit in one page). */
const MAX_PAGES = 5;
/** Sleep (and exercise) come at most 25 per page (health.googleapis.com discovery, v4); the rest 200. */
export const pageSizeOf = (type) => (type === 'sleep' ? 25 : 200);
/** Errors that stop the whole fetch: the login, the connection or Google's limit. */
const STOPS = new Set(['google_login_needed', 'not_connected', 'google_busy', 'google_unreachable']);

export function googleEnv(e = process.env) {
  return { clientId: pick('GOOGLE_CLIENT_ID', e), clientSecret: pick('GOOGLE_CLIENT_SECRET', e), ...redisEnv(e) };
}

export function makeHandler({ env = () => googleEnv(), doFetch = (...a) => fetch(...a), now = () => Date.now(), account = null } = {}) {
  // Paket R: «Mit Google anmelden» shares this callback address (the one registered in Google Cloud)
  const signIn = account ?? makeAccount({ doFetch });
  const setUp = (cfg) => {
    if (!cfg.clientId || !cfg.clientSecret) throw new ApiError(503, 'not_set_up', 'Google is not set up on the server (GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET).');
  };

  async function tokenCall(cfg, params) {
    let res;
    try {
      res = await doFetch(TOKEN_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ client_id: cfg.clientId, client_secret: cfg.clientSecret, ...params }).toString(),
      });
    } catch {
      throw new ApiError(502, 'google_unreachable', 'Google could not be reached.');
    }
    const body = await res.json().catch(() => null);
    if (!res.ok || !body?.access_token) {
      if (res.status === 400 || res.status === 401) throw new ApiError(401, 'google_login_needed', 'Google needs a new login.');
      throw new ApiError(502, 'google_error', 'Google answered with an error.');
    }
    return body;
  }

  async function accessToken(cfg, store) {
    const raw = await store.get('google:tokens');
    if (!raw) throw new ApiError(409, 'not_connected', 'Google is not connected.');
    const t = JSON.parse(raw);
    if ((t.expires_at ?? 0) - 60_000 > now()) return t.access_token;
    if (!t.refresh_token) throw new ApiError(401, 'google_login_needed', 'Google needs a new login.');
    const fresh = await tokenCall(cfg, { grant_type: 'refresh_token', refresh_token: t.refresh_token });
    await store.set('google:tokens', JSON.stringify({ ...t, access_token: fresh.access_token, expires_at: now() + (Number(fresh.expires_in) || 3600) * 1000 }));
    return fresh.access_token;
  }

  /**
   * Google's own reason for a refused Health call, as one log line (Noah 21.10.2026: 403 for every value
   * although the login allows them). Only Google's status, reason and the start of its message: no token,
   * no values, no person.
   */
  async function logRefusal(res, path) {
    const body = await res
      .clone()
      .json()
      .catch(() => null);
    const e = body?.error ?? {};
    const reasons = (Array.isArray(e.details) ? e.details : []).map((d) => d?.reason).filter(Boolean);
    const type = String(path).split('/')[1]?.split(/[/:?]/)[0] ?? '';
    console.log(`google health ${res.status} ${type}: ${e.status ?? ''} ${reasons.join(',')} ${String(e.message ?? '').slice(0, 200)}`.trim());
  }

  /** One call to the Health API; Google's errors become the app's error codes. */
  async function healthCall(token, path, init = {}) {
    let res;
    try {
      res = await doFetch(`${API}/${path}`, { ...init, headers: { Authorization: `Bearer ${token}`, ...(init.body ? { 'Content-Type': 'application/json' } : {}) } });
    } catch {
      throw new ApiError(502, 'google_unreachable', 'Google could not be reached.');
    }
    if (!res.ok) await logRefusal(res, path);
    if (res.status === 401) throw new ApiError(401, 'google_login_needed', 'Google needs a new login.');
    if (res.status === 429) throw new ApiError(429, 'google_busy', 'Google allows only a few requests right now. Try again later.');
    // Google refuses the values (Noah 21.10.2026: still 403 after a new login with all ticks granted)
    if (res.status === 403) throw new ApiError(403, 'google_scope', 'Google gives no access to this value. Connect Fitbit again and tick the values.');
    if (!res.ok) throw new ApiError(502, 'google_error', 'Google answered with an error.');
    return res.json().catch(() => ({}));
  }

  /** Every data point of one type for the days from..to (a few pages at most). */
  async function listAll(token, type, from, to) {
    const out = [];
    let pageToken = '';
    for (let i = 0; i < MAX_PAGES; i++) {
      const q = new URLSearchParams({ filter: listFilter(type, from, to), pageSize: String(pageSizeOf(type)), ...(pageToken ? { pageToken } : {}) });
      const body = await healthCall(token, `dataTypes/${type}/dataPoints?${q}`);
      out.push(...(body.dataPoints ?? []));
      pageToken = body.nextPageToken ?? '';
      if (!pageToken) break;
    }
    return out;
  }

  const rollUp = async (token, type, from, to) =>
    (await healthCall(token, `dataTypes/${type}/dataPoints:dailyRollUp`, { method: 'POST', body: JSON.stringify(rollUpBody(from, to)) })).rollupDataPoints ?? [];

  /** One Drive, Calendar or Tasks call; Google's answer as JSON, or a clear error. */
  async function gapi(token, url, init = {}, forbidden = ['drive_not_allowed', 'Google Drive is not allowed yet: connect Drive in the app.']) {
    let res;
    try {
      res = await doFetch(url, { ...init, headers: { Authorization: `Bearer ${token}`, ...(init.headers ?? {}) } });
    } catch {
      throw new ApiError(502, 'google_unreachable', 'Google could not be reached.');
    }
    if (res.status === 401) throw new ApiError(401, 'google_login_needed', 'Google needs a new login.');
    if (res.status === 403) throw new ApiError(403, ...forbidden);
    if (res.status === 404 || res.status === 410) throw new ApiError(404, forbidden[0] === 'drive_not_allowed' ? 'drive_missing' : 'google_missing', 'It is no longer in Google.');
    if (res.status === 429) throw new ApiError(429, 'google_busy', 'Google allows only a few requests right now. Try again later.');
    if (!res.ok) throw new ApiError(502, 'google_error', 'Google answered with an error.');
    if (res.status === 204) return {};
    return res.json().catch(() => ({}));
  }
  const drive = (token, url, init) => gapi(token, url, init);
  const NO_CAL = ['calendar_not_allowed', 'Google Calendar is not allowed yet: connect it in the app.'];
  const NO_TASKS = ['tasks_not_allowed', 'Google Tasks is not allowed yet: connect it in the app.'];
  const cal = (token, path, init) => gapi(token, `${CALENDAR_API}/${path}`, init, NO_CAL);
  const tasks = (token, path, init) => gapi(token, `${TASKS_API}/${path}`, init, NO_TASKS);
  const NO_MAIL = ['mail_not_allowed', 'Google Mail is not allowed yet: connect it in the app.'];
  const gmail = (token, path, init) => gapi(token, `${GMAIL_API}/${path}`, init, NO_MAIL);
  const sendJson = (method, body) => ({ method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  const enc = encodeURIComponent;
  /** A calendar, list or item id as Google makes them (letters, digits, @ . _ - and #). */
  const goodId = (v) => typeof v === 'string' && /^[\w@.#+-]{1,300}$/.test(v);
  const needId = (v, what) => {
    if (!goodId(v)) throw new ApiError(400, 'bad_request', `Bad ${what}.`);
    return v;
  };

  /** Every page of a Google list call (at most five). */
  async function pages(get, path, params, key) {
    const out = [];
    let pageToken = '';
    for (let i = 0; i < MAX_PAGES; i++) {
      const body = await get(`${path}?${new URLSearchParams({ ...params, ...(pageToken ? { pageToken } : {}) })}`);
      out.push(...(body[key] ?? []));
      pageToken = body.nextPageToken ?? '';
      if (!pageToken) break;
    }
    return out;
  }

  /** The id of a folder «name» in «parent» (made once, then kept in Redis). */
  async function folder(token, store, name, parent) {
    const known = JSON.parse((await store.get(FOLDERS_KEY)) ?? '{}');
    const k = `${parent}/${name}`;
    if (known[k]) return known[k];
    const q = `name = '${name.replace(/['\\]/g, '\\$&')}' and mimeType = '${FOLDER}' and '${parent}' in parents and trashed = false`;
    const found = await drive(token, `${DRIVE_API}?${new URLSearchParams({ q, fields: 'files(id)', pageSize: '1' })}`);
    const id = found.files?.[0]?.id ?? (await drive(token, `${DRIVE_API}?fields=id`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, mimeType: FOLDER, parents: [parent] }) })).id;
    await store.set(FOLDERS_KEY, JSON.stringify({ ...known, [k]: id }));
    return id;
  }

  /** «Importierte PDF» (or «Importierte Fotos») in «Meine Ablage», and the group as its subfolder. */
  async function folderFor(token, store, root, group) {
    const top = await folder(token, store, DRIVE_ROOTS[root === 'photos' ? 'photos' : 'pdf'], 'root');
    const g = cleanName(group, '');
    return g && g !== DRIVE_ROOTS.pdf && g !== DRIVE_ROOTS.photos ? folder(token, store, g, top) : top;
  }

  /** The id of the app's own calendar: kept in Redis, made again when it was deleted in Google. */
  async function ownCal(token, store) {
    const known = await store.get(OWN_CAL_KEY);
    if (known) {
      try {
        await cal(token, `calendars/${enc(known)}`);
        return known;
      } catch (err) {
        if (err?.code !== 'google_missing') throw err;
      }
    }
    const made = await cal(token, 'calendars', sendJson('POST', { summary: OWN_CAL_NAME, timeZone: 'Europe/Zurich', description: 'Touren und Termine aus dem Packgenerator. Die App trägt sie ein; Änderungen hier überschreibt sie.' }));
    if (!goodId(made.id)) throw new ApiError(502, 'google_error', 'Google answered with an error.');
    await store.set(OWN_CAL_KEY, made.id);
    return made.id;
  }

  /** The app's own task list (by its id in Redis, else by its name, else made new). */
  async function ownList(token, store) {
    const known = await store.get(OWN_LIST_KEY);
    const lists = await pages((p) => tasks(token, p), 'users/@me/lists', { maxResults: '100' }, 'items');
    const hit = lists.find((l) => l.id === known) ?? lists.find((l) => l.title === OWN_LIST_NAME);
    const list = hit ?? (await tasks(token, 'users/@me/lists', sendJson('POST', { title: OWN_LIST_NAME })));
    if (!goodId(list.id)) throw new ApiError(502, 'google_error', 'Google answered with an error.');
    if (list.id !== known) await store.set(OWN_LIST_KEY, list.id);
    return listRow(list);
  }

  const callback = async (request) => {
    const url = new URL(request.url);
    const cfg = env();
    const store = needStore(cfg, doFetch);
    const st = await takeState(store, null, url.searchParams.get('state'));
    if (st?.kind === 'account') return signIn.callback(st, url);
    if (st?.kind !== 'google') return backToApp(null, { google: 'error', error: 'expired' });
    setUp(cfg);
    if (url.searchParams.get('error') || !url.searchParams.get('code')) return backToApp(st.returnTo, { google: 'error', error: 'denied' });
    const tok = await tokenCall(cfg, { grant_type: 'authorization_code', code: url.searchParams.get('code'), redirect_uri: CALLBACK });
    const granted = String(tok.scope ?? '').split(' ');
    if (!KNOWN_SCOPES.some((s) => granted.includes(s))) return backToApp(st.returnTo, { google: 'error', error: 'scope' });
    await store.set('google:tokens', JSON.stringify({ access_token: tok.access_token, refresh_token: tok.refresh_token ?? null, expires_at: now() + (Number(tok.expires_in) || 3600) * 1000, scope: granted.join(' ') }));
    return backToApp(st.returnTo, { google: 'connected' });
  };

  const main = route(
    {
      GET: async (request) => {
        const url = new URL(request.url);
        const step = url.searchParams.get('step');
        const cfg = env();
        const store = needStore(cfg, doFetch);
        await needDevice(request, store);
        setUp(cfg);
        if (step === 'status') {
          const raw = await store.get('google:tokens');
          const scopes = raw ? JSON.parse(raw).scope ?? '' : '';
          const has = scopes.split(' ');
          return json(request, 200, { ok: true, connected: !!raw, scopes, drive: has.includes(DRIVE_SCOPE), calendar: CALENDAR_SCOPES.every((x) => has.includes(x)), tasks: has.includes(TASKS_SCOPE), owncal: has.includes(OWN_CAL_SCOPE), mail: MAIL_SCOPES.every((x) => has.includes(x)) });
        }
        if (step === 'cal-list') {
          const token = await accessToken(cfg, store);
          const list = await pages((p) => cal(token, p), 'users/me/calendarList', { minAccessRole: 'reader', maxResults: '100' }, 'items');
          return json(request, 200, { ok: true, calendars: list.map(calRow).filter(Boolean) });
        }
        if (step === 'cal-events') {
          const from = url.searchParams.get('from');
          const to = url.searchParams.get('to');
          const n = spanOf(from, to);
          if (!n || n > MAX_EVENT_DAYS) throw new ApiError(400, 'bad_request', `from and to must be days (YYYY-MM-DD), at most ${MAX_EVENT_DAYS} days.`);
          const cals = (url.searchParams.get('cal') || 'primary').split(',').filter(Boolean).slice(0, MAX_CALS);
          cals.forEach((c) => needId(c, 'cal'));
          const token = await accessToken(cfg, store);
          const events = [];
          // One calendar after the other: Google allows only a few requests at once.
          for (const c of cals) {
            const items = await pages((p) => cal(token, p), `calendars/${enc(c)}/events`, { timeMin: dayStart(from), timeMax: dayEnd(to), singleEvents: 'true', orderBy: 'startTime', maxResults: '250', timeZone: 'Europe/Zurich' }, 'items');
            events.push(...items.map((e) => eventRow(e, c)).filter(Boolean));
          }
          events.sort((a, b) => (a.day + (a.allDay ? '' : a.start)).localeCompare(b.day + (b.allDay ? '' : b.start)));
          return json(request, 200, { ok: true, from, to, events });
        }
        if (step === 'mail-list') {
          const q = String(url.searchParams.get('q') ?? '').slice(0, 500).trim();
          const page = url.searchParams.get('page');
          if (page && !/^\d{1,40}$/.test(page)) throw new ApiError(400, 'bad_request', 'Bad page.');
          const token = await accessToken(cfg, store);
          const list = await gmail(token, `messages?${new URLSearchParams({ maxResults: String(MAIL_PAGE), q: q || 'in:inbox', ...(page ? { pageToken: page } : {}) })}`);
          const ids = (list.messages ?? []).map((m) => m.id).filter(goodId);
          // A few at a time: Google allows only a few requests at once.
          const mails = [];
          for (let i = 0; i < ids.length; i += 5) {
            const part = await Promise.all(ids.slice(i, i + 5).map((id) => gmail(token, `messages/${enc(id)}?format=metadata&metadataHeaders=From&metadataHeaders=To&metadataHeaders=Cc&metadataHeaders=Subject&metadataHeaders=Message-ID&metadataHeaders=References`)));
            mails.push(...part.map(mailRow).filter(Boolean));
          }
          return json(request, 200, { ok: true, mails, next: list.nextPageToken ?? null });
        }
        if (step === 'mail-get') {
          const id = needId(url.searchParams.get('id'), 'id');
          const token = await accessToken(cfg, store);
          const m = await gmail(token, `messages/${enc(id)}?format=full`);
          return json(request, 200, { ok: true, mail: { ...mailRow(m), ...bodyOf(m.payload) } });
        }
        if (step === 'mail-file') {
          const id = needId(url.searchParams.get('id'), 'id');
          const att = String(url.searchParams.get('att') ?? '');
          if (!/^[\w-]{1,4000}$/.test(att)) throw new ApiError(400, 'bad_request', 'Bad att.');
          const token = await accessToken(cfg, store);
          const part = await gmail(token, `messages/${enc(id)}/attachments/${enc(att)}`);
          const size = Number(part.size) || 0;
          if (size > FILE_MAX) throw new ApiError(413, 'too_big', 'This attachment is too big.');
          const data = String(part.data ?? '').replace(/-/g, '+').replace(/_/g, '/');
          return json(request, 200, { ok: true, data, size });
        }
        if (step === 'task-lists') {
          const token = await accessToken(cfg, store);
          const lists = await pages((p) => tasks(token, p), 'users/@me/lists', { maxResults: '100' }, 'items');
          return json(request, 200, { ok: true, lists: lists.map(listRow).filter(Boolean) });
        }
        if (step === 'tasks') {
          const one = url.searchParams.get('list');
          if (one) needId(one, 'list');
          const token = await accessToken(cfg, store);
          const lists = one ? [one] : (await pages((p) => tasks(token, p), 'users/@me/lists', { maxResults: '100' }, 'items')).map((l) => l.id).filter(goodId).slice(0, 20);
          const since = new Date(now() - 30 * 864e5).toISOString();
          const out = [];
          for (const l of lists) {
            const items = await pages((p) => tasks(token, p), `lists/${enc(l)}/tasks`, { showCompleted: 'true', showHidden: 'true', completedMin: since, maxResults: '100' }, 'items');
            const open = await pages((p) => tasks(token, p), `lists/${enc(l)}/tasks`, { showCompleted: 'false', maxResults: '100' }, 'items');
            const seen = new Set();
            for (const t of [...open, ...items]) {
              if (seen.has(t.id)) continue;
              seen.add(t.id);
              const r = taskRow(t, l);
              if (r) out.push(r);
            }
          }
          return json(request, 200, { ok: true, tasks: out });
        }
        if (step === 'data') {
          const type = url.searchParams.get('type');
          if (!TYPES.includes(type)) throw new ApiError(400, 'bad_request', `type must be one of ${TYPES.join(', ')}.`);
          const pageToken = url.searchParams.get('pageToken');
          if (pageToken && !/^[\w.~-]{1,2000}$/.test(pageToken)) throw new ApiError(400, 'bad_request', 'Bad pageToken.');
          const token = await accessToken(cfg, store);
          const body = await healthCall(token, `dataTypes/${type}/dataPoints${pageToken ? `?pageToken=${encodeURIComponent(pageToken)}` : ''}`);
          return json(request, 200, { ok: true, type, points: body.dataPoints ?? [], next: body.nextPageToken ?? null });
        }
        if (step === 'days') {
          const from = url.searchParams.get('from');
          const to = url.searchParams.get('to');
          const n = spanDays(from, to);
          if (!n || n > MAX_DAYS) throw new ApiError(400, 'bad_request', `from and to must be days (YYYY-MM-DD), at most ${MAX_DAYS} days apart.`);
          const token = await accessToken(cfg, store).catch((err) => {
            console.log(`google days: no login, ${err?.code}`);
            throw err;
          });
          // One after the other: Google allows only a few requests at once. A value Google refuses no
          // longer stops the others (Noah 21.10.2026: «fitbit … werden nicht korrekt geliefert»); its name
          // goes back in «missing», so the app can say which one did not come. A login that is no longer
          // valid still stops everything: then nothing can come.
          const missing = [];
          let refused = null;
          const core = async (type, get) => {
            try {
              return await get();
            } catch (err) {
              if (STOPS.has(err?.code)) {
                console.log(`google days: stopped, ${err.code}`);
                throw err;
              }
              missing.push(type);
              refused = err;
              return [];
            }
          };
          const steps = await core('steps', () => rollUp(token, 'steps', from, to));
          const azm = await core('active-zone-minutes', () => rollUp(token, 'active-zone-minutes', from, to));
          const sleep = await core('sleep', () => listAll(token, 'sleep', from, to));
          const rhr = await core('daily-resting-heart-rate', () => listAll(token, 'daily-resting-heart-rate', from, to));
          const hrv = await core('daily-heart-rate-variability', () => listAll(token, 'daily-heart-rate-variability', from, to));
          if (missing.length === TYPES.length) {
            console.log(`google days: nothing came, ${refused?.code}`);
            throw refused;
          }
          // «Form und Erholung» / Garmin-Übersicht: calories and the highest pulse, 14 days per request.
          // Optional: a refused type (no permission, an older account) leaves these values out.
          const extra = async (type) => {
            const out = [];
            try {
              for (const [a, b] of chunks(from, to)) out.push(...(await rollUp(token, type, a, b)));
            } catch {
              return [];
            }
            return out;
          };
          const kcal = await extra('total-calories');
          const kcalActive = await extra('active-energy-burned');
          const hr = await extra('heart-rate');
          // «Körperwerte»: oxygen, breathing rate and skin temperature, also optional
          const listed = async (type) => {
            try {
              return await listAll(token, type, from, to);
            } catch {
              return [];
            }
          };
          const spo2 = await listed('daily-oxygen-saturation');
          const breath = await listed('daily-respiratory-rate');
          const skin = await listed('daily-sleep-temperature-derivations');
          const days = daysFrom({ steps, azm, sleep, rhr, hrv, kcal, kcalActive, hr, spo2, breath, skin }, from, to);
          // one line for the Vercel log: how many days and which values did not come (no values, no names)
          console.log(`google days: ${n} asked, ${days.length} with values${missing.length ? `, missing ${missing.join(' ')}` : ''}`);
          return json(request, 200, { ok: true, from, to, days, missing });
        }
        throw new ApiError(400, 'bad_request', 'Unknown step.');
      },

      POST: async (request) => {
        const step = new URL(request.url).searchParams.get('step');
        const cfg = env();
        const store = needStore(cfg, doFetch);
        await needDevice(request, store);
        if (step === 'start') {
          setUp(cfg);
          const body = await jsonBody(request);
          const state = await saveState(store, 'google', { returnTo: typeof body.returnTo === 'string' ? body.returnTo.slice(0, 500) : null });
          // Noah 21.10.2026: connecting Mail or Kalender later dropped the Fitbit ticks (the values stopped
          // with google_scope). Every new login asks again for what this Google login already allows.
          const had = String(JSON.parse((await store.get('google:tokens')) ?? '{}').scope ?? '').split(' ').filter(Boolean);
          const scope = [...new Set([...scopesFor(body.services), ...had.filter((x) => KNOWN_SCOPES.includes(x))])];
          const q = new URLSearchParams({ client_id: cfg.clientId, redirect_uri: CALLBACK, response_type: 'code', access_type: 'offline', prompt: 'consent', include_granted_scopes: 'true', scope: scope.join(' '), state });
          return json(request, 200, { ok: true, url: `${AUTHORIZE_URL}?${q}` });
        }
        if (step === 'drive-upload') {
          setUp(cfg);
          const url = new URL(request.url);
          const type = (request.headers.get('content-type') ?? '').split(';')[0].trim();
          if (type !== 'application/pdf' && type !== 'image/jpeg') throw new ApiError(415, 'bad_type', 'Send a PDF or a JPEG.');
          const bytes = new Uint8Array(await request.arrayBuffer());
          if (!bytes.length) throw new ApiError(400, 'bad_request', 'The file is empty.');
          if (bytes.length > DRIVE_MAX_BYTES) throw new ApiError(413, 'too_big', 'The file is bigger than 4 MB.');
          const token = await accessToken(cfg, store);
          const parent = await folderFor(token, store, url.searchParams.get('root'), url.searchParams.get('group'));
          const meta = { name: cleanName(url.searchParams.get('name')), parents: [parent], mimeType: type };
          const boundary = `pg${now().toString(36)}`;
          const head = `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(meta)}\r\n--${boundary}\r\nContent-Type: ${type}\r\n\r\n`;
          const body = new Blob([head, bytes, `\r\n--${boundary}--`]);
          const made = await drive(token, `${DRIVE_UPLOAD}?uploadType=multipart&fields=id,webViewLink`, { method: 'POST', headers: { 'Content-Type': `multipart/related; boundary=${boundary}` }, body });
          return json(request, 200, { ok: true, id: made.id, link: made.webViewLink ?? null });
        }
        if (step === 'drive-move' || step === 'drive-rename') {
          setUp(cfg);
          const body = await jsonBody(request);
          const fileId = String(body.fileId ?? '');
          if (!/^[\w-]{5,200}$/.test(fileId)) throw new ApiError(400, 'bad_request', 'Bad fileId.');
          const token = await accessToken(cfg, store);
          if (step === 'drive-rename') {
            await drive(token, `${DRIVE_API}/${fileId}?fields=id`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: cleanName(body.name) }) });
          } else {
            const parent = await folderFor(token, store, body.root, body.group);
            const now0 = await drive(token, `${DRIVE_API}/${fileId}?fields=parents`);
            const q = new URLSearchParams({ addParents: parent, removeParents: (now0.parents ?? []).filter((p) => p !== parent).join(','), fields: 'id' });
            await drive(token, `${DRIVE_API}/${fileId}?${q}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: '{}' });
          }
          return json(request, 200, { ok: true });
        }
        if (step === 'cal-save' || step === 'cal-delete') {
          setUp(cfg);
          const body = await jsonBody(request);
          const c = needId(body.cal || 'primary', 'cal');
          const gid = body.gid ? needId(body.gid, 'gid') : null;
          if (step === 'cal-delete' && !gid) throw new ApiError(400, 'bad_request', 'Bad gid.');
          let send = null;
          if (step === 'cal-save') {
            try {
              send = eventBody(body);
            } catch (err) {
              throw new ApiError(400, 'bad_request', `Bad ${err.message}.`);
            }
          }
          const token = await accessToken(cfg, store);
          if (step === 'cal-delete') {
            await cal(token, `calendars/${enc(c)}/events/${enc(gid)}`, { method: 'DELETE' });
            return json(request, 200, { ok: true });
          }
          const made = await cal(token, `calendars/${enc(c)}/events${gid ? `/${enc(gid)}` : ''}`, sendJson(gid ? 'PATCH' : 'POST', send));
          return json(request, 200, { ok: true, event: eventRow(made, c) });
        }
        if (step === 'own-sync') {
          setUp(cfg);
          const body = await jsonBody(request, 400_000);
          const items = Array.isArray(body.items) ? body.items.slice(0, MAX_OWN_ITEMS) : null;
          if (!items) throw new ApiError(400, 'bad_request', 'Bad items.');
          let wanted;
          try {
            wanted = new Map(items.map((it) => [String(it.key), ownBody(it)]));
          } catch (err) {
            throw new ApiError(400, 'bad_request', `Bad ${err.message}.`);
          }
          const token = await accessToken(cfg, store);
          const c = await ownCal(token, store);
          const old = await pages((p) => cal(token, p), `calendars/${enc(c)}/events`, { maxResults: '250', showDeleted: 'false' }, 'items');
          const byKey = new Map();
          const out = { made: 0, changed: 0, removed: 0 };
          // One after the other: Google allows only a few requests at once.
          for (const e of old) {
            const k = e.extendedProperties?.private?.[KEY_PROP];
            if (!k) continue; // an event Noah made himself in this calendar stays
            if (wanted.has(k) && !byKey.has(k)) byKey.set(k, e);
            else if (goodId(e.id)) {
              await cal(token, `calendars/${enc(c)}/events/${enc(e.id)}`, { method: 'DELETE' });
              out.removed++;
            }
          }
          for (const [k, b] of wanted) {
            const e = byKey.get(k);
            if (!e) {
              await cal(token, `calendars/${enc(c)}/events`, sendJson('POST', b));
              out.made++;
            } else if (!sameEvent(e, b)) {
              await cal(token, `calendars/${enc(c)}/events/${enc(e.id)}`, sendJson('PATCH', b));
              out.changed++;
            }
          }
          return json(request, 200, { ok: true, cal: c, ...out });
        }
        if (step === 'own-list') {
          setUp(cfg);
          const token = await accessToken(cfg, store);
          return json(request, 200, { ok: true, list: await ownList(token, store) });
        }
        if (step === 'mail-send') {
          setUp(cfg);
          // «Aus der App mailen»: with up to 3 attachments (FILE_MAX together), so the body may be larger
          const body = await jsonBody(request, 4_400_000);
          let reply = null;
          const token = await accessToken(cfg, store);
          if (body.replyTo) {
            const m = await gmail(token, `messages/${enc(needId(body.replyTo, 'replyTo'))}?format=metadata&metadataHeaders=Message-ID&metadataHeaders=References&metadataHeaders=Subject`);
            reply = mailRow(m);
          }
          let raw;
          try {
            raw = rawMail({ ...body, inReplyTo: reply?.msgId || undefined, references: reply?.refs || undefined });
          } catch (err) {
            throw new ApiError(400, 'bad_request', `Bad ${err.message}.`);
          }
          const sent = await gmail(token, 'messages/send', sendJson('POST', { raw, ...(reply ? { threadId: reply.thread } : {}) }));
          return json(request, 200, { ok: true, id: sent.id ?? null });
        }
        if (step === 'task-save' || step === 'task-delete') {
          setUp(cfg);
          const body = await jsonBody(request);
          const l = needId(body.list || '@default', 'list');
          const id = body.id ? needId(body.id, 'id') : null;
          if (step === 'task-delete' && !id) throw new ApiError(400, 'bad_request', 'Bad id.');
          let send = null;
          if (step === 'task-save') {
            try {
              send = taskBody(body);
            } catch (err) {
              throw new ApiError(400, 'bad_request', `Bad ${err.message}.`);
            }
            if (!id && !send.title) throw new ApiError(400, 'bad_request', 'Bad title.');
          }
          const token = await accessToken(cfg, store);
          if (step === 'task-delete') {
            await tasks(token, `lists/${enc(l)}/tasks/${enc(id)}`, { method: 'DELETE' });
            return json(request, 200, { ok: true });
          }
          const made = await tasks(token, `lists/${enc(l)}/tasks${id ? `/${enc(id)}` : ''}`, sendJson(id ? 'PATCH' : 'POST', send));
          return json(request, 200, { ok: true, task: taskRow(made, l) });
        }
        if (step === 'disconnect') {
          const raw = await store.get('google:tokens');
          if (raw) {
            const t = JSON.parse(raw);
            try {
              await doFetch(REVOKE_URL, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ token: t.refresh_token || t.access_token }).toString() });
            } catch {
              // Google unreachable: the server forgets the tokens anyway.
            }
          }
          await store.del('google:tokens');
          await store.del(FOLDERS_KEY);
          await store.del(OWN_CAL_KEY);
          await store.del(OWN_LIST_KEY);
          return json(request, 200, { ok: true });
        }
        throw new ApiError(400, 'bad_request', 'Unknown step.');
      },
    },
    'google',
  );

  return { main, callback: route({ GET: callback }, 'google-callback') };
}
