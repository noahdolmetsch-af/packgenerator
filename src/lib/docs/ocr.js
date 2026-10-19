/**
 * Dokumente-PDF, Noah «5a»: the app reads the text of the pages, on the device (tesseract.js, free).
 * Used for the search and the suggested name and date. The reader and the German and English language
 * files are loaded once from the internet when they are first needed (about 15 MB) and then kept by
 * the browser. Without a connection, or if it fails, the document is simply kept without text.
 */
export const OCR_LANGS = ['deu', 'eng'];
export const OCR_TIMEOUT_MS = 120_000;
/** The reader itself, the same version as in package.json (tesseract.js would ask for «@v7.0.0»). */
export const OCR_WORKER = 'https://cdn.jsdelivr.net/npm/tesseract.js@7.0.0/dist/worker.min.js';

/** Is the reader reachable? Without this check a failing worker shows up as an error in the page. */
async function reachable(doFetch) {
  try {
    return (await doFetch(OCR_WORKER, { method: 'HEAD', cache: 'force-cache' })).ok;
  } catch {
    return false;
  }
}

/** The text of all pages (JPEG data URLs), or '' when it cannot be read now. onstep(i, n): progress. */
export async function readText(srcs, { onstep = () => {}, online = globalThis.navigator?.onLine !== false, doFetch = (...a) => fetch(...a) } = {}) {
  if (!online || !srcs?.length) return '';
  if (!(await reachable(doFetch))) return '';
  let worker = null;
  const work = (async () => {
    const { createWorker } = await import('tesseract.js');
    worker = await createWorker(OCR_LANGS, 1, { workerPath: OCR_WORKER, errorHandler: () => {} });
    const parts = [];
    for (let i = 0; i < srcs.length; i++) {
      onstep(i + 1, srcs.length);
      const { data } = await worker.recognize(srcs[i]);
      parts.push(String(data?.text ?? '').trim());
    }
    return parts.join('\n\n').slice(0, 20_000);
  })();
  const timeout = new Promise((resolve) => setTimeout(() => resolve(''), OCR_TIMEOUT_MS));
  try {
    return await Promise.race([work, timeout]);
  } catch {
    return '';
  } finally {
    worker?.terminate?.().catch?.(() => {});
  }
}
