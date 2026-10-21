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

/** The Vite plugin: fails the build with a clear message. */
export function sizeGuard(limit = MAX_JS_BYTES) {
  return {
    name: 'size-guard',
    apply: 'build',
    generateBundle(_, bundle) {
      const files = Object.values(bundle)
        .filter((c) => c.type === 'chunk')
        .map((c) => ({ name: c.fileName, bytes: Buffer.byteLength(c.code) }));
      const big = oversize(files, limit);
      if (big.length)
        this.error(`size-guard: ${big.map((b) => `${b.name} ${(b.bytes / 1e6).toFixed(2)} MB`).join(', ')} over ${(limit / 1e6).toFixed(1)} MB. Load pages and big tools with import() (src/lib/nav/lazy.js).`);
    },
  };
}
