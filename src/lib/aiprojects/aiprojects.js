/**
 * «Meine KI-Projekte» (Noah 19.10.2026 «2a»): your own links to AI projects, threads and chats
 * (claude.ai, ChatGPT, Gemini …). The app cannot read them from the services (there is no way to), so
 * you add them yourself: add, rename, change the address, delete (with Undo), reorder with arrows or by
 * dragging. Stored in db.settings 'aiProjects' as [{ id, title, url, at }]; in the backup like any setting.
 */
export const AI_PROJECTS_KEY = 'aiProjects';

/** The service of an address, for the small label: 'Claude', 'ChatGPT' … or the host. */
export function serviceOf(url = '') {
  let host = '';
  try {
    host = new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return '';
  }
  if (host.endsWith('claude.ai')) return 'Claude';
  if (host.endsWith('chatgpt.com') || host.endsWith('openai.com')) return 'ChatGPT';
  if (host.endsWith('gemini.google.com')) return 'Gemini';
  if (host.endsWith('perplexity.ai')) return 'Perplexity';
  if (host.endsWith('mistral.ai')) return 'Le Chat';
  if (host.endsWith('copilot.microsoft.com')) return 'Copilot';
  if (host.endsWith('duck.ai') || host.endsWith('duckduckgo.com')) return 'DuckDuckGo';
  return host;
}

/** A web address as typed, made whole: «claude.ai/project/x» → «https://claude.ai/project/x»; '' when it is none. */
export function cleanUrl(s = '') {
  const v = String(s ?? '').trim();
  if (!v) return '';
  const full = /^https?:\/\//i.test(v) ? v : `https://${v}`;
  try {
    const u = new URL(full);
    return /\./.test(u.hostname) ? u.href : '';
  } catch {
    return '';
  }
}

/** The list with a new link at the end (its title: the one given, else the service's name). */
export function addProject(list = [], { title = '', url = '' }, { id, at = new Date().toISOString() }) {
  const href = cleanUrl(url);
  if (!href) return list;
  return [...list, { id, title: String(title).trim() || serviceOf(href) || href, url: href, at }];
}

/** One link changed (title and/or address); an empty title keeps the old one, a bad address too. */
export function editProject(list = [], id, { title, url } = {}) {
  return list.map((p) => {
    if (p.id !== id) return p;
    const href = url == null ? p.url : cleanUrl(url) || p.url;
    const name = title == null ? p.title : String(title).trim() || p.title;
    return { ...p, title: name, url: href };
  });
}

/** Row `from` moved to place `to`. */
export function moveProject(list = [], from, to) {
  if (from === to || from < 0 || from >= list.length) return list;
  const next = [...list];
  const [x] = next.splice(from, 1);
  next.splice(Math.max(0, Math.min(to, next.length)), 0, x);
  return next;
}
