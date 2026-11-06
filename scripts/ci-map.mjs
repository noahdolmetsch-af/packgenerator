// Which phone specs does a changed app file touch? (Noah 05.11.2026 «3a ja», step 3 of the test plan)
// The phone tests of a pull request run only the specs of the areas it changed, found from the app's own
// imports, never from a hand-kept list:
//   1. Every src/*.js and src/*.svelte file and every tests/e2e/*.js file is a node; an import (static,
//      import(...) or import.meta.glob) is an edge.
//   2. «Core» = everything the app loads at the start (the static imports of src/main.js, src/start.js and
//      so on). A changed core file can show on every page: all specs run.
//   3. Any other changed file is only loaded by some pages. Walk the imports backwards: the pages (App.svelte
//      PAGES) it ends in, and the specs that import it, are the affected ones. A spec belongs to a page when
//      it opens one of the page's addresses (#/pack, #/gear/supplies …).
//   4. Anything not understood (a file that ends nowhere, a page without an address, a changed asset) runs all.
// The night run (volle-pruefung.yml) still runs everything, so a miss here is found the next morning.
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, posix } from 'node:path';

const CODE = /\.(?:js|mjs|svelte)$/;
const SKIP_DIR = new Set(['node_modules', 'dist', '.git', 'qa', 'test-results', 'playwright-report']);

function walk(root, dir, out) {
  if (!existsSync(join(root, dir))) return out;
  for (const name of readdirSync(join(root, dir))) {
    if (SKIP_DIR.has(name)) continue;
    const rel = posix.join(dir, name);
    const st = statSync(join(root, rel));
    if (st.isDirectory()) walk(root, rel, out);
    else if (CODE.test(name)) out.push(rel);
  }
  return out;
}

// the three kinds of import in one pass; `from` also covers `export … from`
const STATIC = /(?:^|[\s;{}>])(?:import|export)\s[^'"`;]*?from\s*['"]([^'"]+)['"]|(?:^|[\s;>])import\s*['"]([^'"]+)['"]/g;
const DYNAMIC = /\bimport\(\s*['"]([^'"]+)['"]\s*\)/g;
const GLOB = /import\.meta\.glob\(\s*['"]([^'"]+)['"]/g;

function globToRe(pattern) {
  const esc = pattern.replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*\*\//g, '(?:.*/)?').replace(/\*/g, '[^/]*');
  return new RegExp(`^${esc}$`);
}

/** The import graph: nodes are file paths, `edges` importer → [{to, lazy}]. */
export function buildGraph(root = '.', read = (f) => readFileSync(join(root, f), 'utf8')) {
  const files = [...walk(root, 'src', []), ...walk(root, 'tests/e2e', [])];
  const known = new Set(files);
  const edges = new Map();
  const resolve = (from, spec) => {
    if (!spec.startsWith('.')) return null; // a package
    const p = posix.normalize(posix.join(posix.dirname(from), spec));
    return known.has(p) ? p : null;
  };
  for (const f of files) {
    const text = read(f);
    const list = [];
    const add = (spec, lazy) => {
      const to = resolve(f, spec);
      if (to) list.push({ to, lazy });
    };
    for (const m of text.matchAll(STATIC)) add(m[1] ?? m[2], false);
    for (const m of text.matchAll(DYNAMIC)) add(m[1], true);
    for (const m of text.matchAll(GLOB)) {
      const re = globToRe(posix.normalize(posix.join(posix.dirname(f), m[1])));
      for (const g of files) if (re.test(g)) list.push({ to: g, lazy: true });
    }
    edges.set(f, list);
  }
  return { files, edges, text: read };
}

/** Files loaded at the start: the static imports (all depth) of the entry files. */
export function coreOf(graph, entries = ['src/main.js', 'src/start.js']) {
  const core = new Set();
  const stack = entries.filter((e) => graph.edges.has(e));
  while (stack.length) {
    const f = stack.pop();
    if (core.has(f)) continue;
    core.add(f);
    for (const e of graph.edges.get(f) ?? []) if (!e.lazy) stack.push(e.to);
  }
  return core;
}

/** App.svelte: PAGES name → file, and page key (the address part after #/) → PAGES names. */
export function pagesOf(graph, app = 'src/App.svelte') {
  const text = graph.text(app);
  const files = {};
  for (const m of text.matchAll(/^\s+(\w+):\s*\(\)\s*=>\s*import\('\.\/pages\/([\w.-]+\.svelte)'\)/gm)) files[m[1]] = `src/pages/${m[2]}`;
  const keys = {}; // PAGES name → page keys
  let current = null;
  for (const line of text.split('\n')) {
    const c = /^ {2}\{(?:#if|:else if) (.*)\}\s*$/.exec(line);
    if (c) current = [...c[1].matchAll(/\bpage === '([\w-]+)'/g)].map((m) => m[1]);
    else if (/^ {2}\{(?::else|\/if)\}\s*$/.test(line)) current = []; // the fallback has no address of its own
    for (const m of line.matchAll(/<LazyPage load=\{PAGES\.(\w+)\}/g)) {
      keys[m[1]] ??= new Set();
      for (const k of current ?? []) keys[m[1]].add(k);
    }
  }
  return { files, keys };
}

const ROUTE = /#\/([\w/-]*)/g;
/** The page keys (every segment of every address like #/trips/fuel) a spec opens. */
export function routesOf(text) {
  const out = new Set();
  for (const m of text.matchAll(ROUTE)) for (const seg of m[1].split('/')) if (seg) out.add(seg);
  return out;
}

// the phone job of a pull request never runs these folders (playwright.config.js testIgnore)
const NOT_IN_PR = /^tests\/e2e\/(?:gesamttest|nachtrundgang|live)\//;
const isSpec = (f) => /^tests\/e2e\/(?:[\w-]+\/)*[\w.-]+\.spec\.js$/.test(f) && !NOT_IN_PR.test(f);

/**
 * The specs that a set of changed app files touches, or null when all must run.
 * `graph` from buildGraph(); changed: repository paths.
 */
export function specsFor(changed, graph, core = coreOf(graph)) {
  const { files, edges } = graph;
  const { files: pageFiles, keys } = pagesOf(graph);
  const pageOfFile = new Map(Object.entries(pageFiles).map(([name, f]) => [f, name]));
  // importers, backwards; App.svelte → its pages is the page loader itself, not a dependency
  const back = new Map();
  for (const [from, list] of edges) {
    for (const e of list) {
      if (from === 'src/App.svelte' && pageOfFile.has(e.to)) continue;
      if (!back.has(e.to)) back.set(e.to, []);
      back.get(e.to).push(from);
    }
  }
  const reach = new Set();
  const stack = [];
  for (const f of changed) {
    if (!files.includes(f)) return null; // new or deleted file, or not code: be safe
    if (core.has(f)) return null;
    stack.push(f);
  }
  while (stack.length) {
    const f = stack.pop();
    if (reach.has(f)) continue;
    if (core.has(f)) return null; // a start file loads it: any page can show it
    reach.add(f);
    for (const from of back.get(f) ?? []) stack.push(from);
  }
  const pageNames = [...reach].map((f) => pageOfFile.get(f)).filter(Boolean);
  const specsHit = new Set([...reach].filter(isSpec));
  // every end of the walk must be a page or a spec, else it is a file we do not understand
  for (const f of reach) {
    const up = back.get(f) ?? [];
    if (!up.length && !pageOfFile.has(f) && !isSpec(f) && !NOT_IN_PR.test(f)) return null;
  }
  const wanted = new Set();
  for (const name of pageNames) {
    const ks = keys[name];
    if (!ks || !ks.size) return null; // a page without an address: do not guess
    for (const k of ks) wanted.add(k);
  }
  for (const f of files.filter(isSpec)) {
    if (specsHit.has(f)) continue;
    const r = routesOf(graph.text(f));
    for (const k of wanted) if (r.has(k)) { specsHit.add(f); break; }
  }
  return [...specsHit].sort();
}
