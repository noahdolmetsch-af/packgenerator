// Wächter «Dateigrösse» (Tempo «Seiten später laden», 19.10.2026): the build stops when one JavaScript
// file passes 3 MB. The offline store keeps files up to 6 MiB each (vite.config.js); above that the app
// no longer starts without internet. 3 MB leaves room, and a page that grows that big should be split.
// Used as a Vite plugin in vite.config.js; tests/size-guard.test.js checks the rule and the source.

export const MAX_JS_BYTES = 3_000_000;

// Big tools load on first use only (dynamic import), never with the start or a page's own file.
export const HEAVY = ['pdf-lib', 'tesseract.js', '@imgly/background-removal', 'onnxruntime-web', '@ffmpeg/ffmpeg', '@mediapipe/tasks-vision', 'pdfjs-dist', 'heic2any'];

/** The JS files over the limit: [{ name, bytes }]. files: [{ name, bytes }]. */
export const oversize = (files, limit = MAX_JS_BYTES) => files.filter((f) => /\.m?js$/.test(f.name) && f.bytes > limit);

/** Static imports of a heavy tool in one source text: the names found (dynamic import() is fine). */
export function heavyStatic(text) {
  const found = [];
  for (const lib of HEAVY) {
    const esc = lib.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&');
    if (new RegExp(`(^|\\n)\\s*import\\s[^;]*?from\\s*['"]${esc}(/[^'"]*)?['"]`).test(text) || new RegExp(`(^|\\n)\\s*import\\s*['"]${esc}['"]`).test(text)) found.push(lib);
  }
  return found;
}

// Tempo-Budget (Noah 02.11.2026 «3a», thread «App wird langsam»): what a German app reads and compiles before the first
// screen. Measured 02.11.2026: 3.8 MB JS (German texts 2.75 MB, start 0.61 MB, runtime 0.21 MB) = start 1.1–2.2 s at 4× slower CPU.
// The budget leaves about 13 % room; going over it needs a reason (and a new number here), not a quiet creep.
// 04.11.2026 (Noah «a»): 4.5 → 4.6 MB, because the app start measured 4.50 MB after the new Analyse and Form texts.
// 04.11.2026 (Noah «b», thread «Erklären und beheben: Start-Grenze bei 98 %»): 4.6 → 5.0 MB, because the start measured 4.52 MB (98 %).
export const MAX_START_JS_BYTES = 5_000_000;
const START_NAME = /^assets\/(main|start|icons|i18n|de|de-texts-\d+|gear|index\.gen|neu\.gen|preload-helper|modulepreload-polyfill|stravanames)[-.]/;

// Warning before the limit (Noah 04.11.2026 «Test-Plan 1»): at 90 % of the start budget every build says so, as a
// yellow note on the check and in the summary, without failing the PR. Then Noah decides (move texts behind
// import(), or raise the budget with a reason) BEFORE the limit stops the next PR.
export const WARN_START_RATIO = 0.9;

/** The warning text when the start is at 90 % of the budget or more (and still within it), else null. */
export function startWarning(start, limit = MAX_START_JS_BYTES) {
  if (start <= limit * WARN_START_RATIO || start > limit) return null;
  const pct = Math.round((start / limit) * 100);
  return `The start loads ${(start / 1e6).toFixed(2)} MB of JavaScript: ${pct} % of the ${(limit / 1e6).toFixed(1)} MB budget (scripts/size-guard.mjs). Noah decides now what moves behind import() or whether the budget grows, before the next PR is stopped.`;
}

/** The bytes of the files that load before the first screen. files: [{ name, bytes }]. */
export const startBytes = (files) => files.filter((f) => /\.m?js$/.test(f.name) && START_NAME.test(f.name)).reduce((n, f) => n + f.bytes, 0);

/** The Vite plugin: fails the build with a clear message. */
export function sizeGuard(limit = MAX_JS_BYTES) {
  return {
    name: 'size-guard',
    apply: 'build',
    generateBundle(_, bundle) {
      const files = Object.values(bundle)
        .filter((c) => c.type === 'chunk')
        .map((c) => ({ name: c.fileName, bytes: Buffer.byteLength(c.code) }));
      const start = startBytes(files);
      const warn = startWarning(start);
      if (warn) {
        this.warn(`size-guard: ${warn}`);
        // GitHub shows this line as a yellow note on the check and in the summary; the build stays green
        if (process.env.GITHUB_ACTIONS) console.log(`::warning title=Start-Grenze fast erreicht::${warn}`);
      }
      if (start > MAX_START_JS_BYTES)
        this.error(`size-guard: the start loads ${(start / 1e6).toFixed(2)} MB of JavaScript, over the budget of ${(MAX_START_JS_BYTES / 1e6).toFixed(1)} MB (scripts/size-guard.mjs). Move texts and tools that are not needed at the start behind import().`);
      const big = oversize(files, limit);
      if (big.length)
        this.error(`size-guard: ${big.map((b) => `${b.name} ${(b.bytes / 1e6).toFixed(2)} MB`).join(', ')} over ${(limit / 1e6).toFixed(1)} MB. Load pages and big tools with import() (src/lib/nav/lazy.js).`);
    },
  };
}
