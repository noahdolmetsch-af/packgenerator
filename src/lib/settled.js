// v0.80.0 «Tests stabil»: <html data-ready="1"> once the data tidy-up has finished (at start-up and
// after an import). Nothing in the app reads it; the browser tests wait for it instead of guessing.
let busy = 0;
const html = () => globalThis.document?.documentElement;

/** Runs `work` (async); while any such work runs, data-ready is not set. */
export async function settling(work) {
  busy += 1;
  if (html()) delete html().dataset.ready;
  try {
    return await work();
  } finally {
    busy -= 1;
    if (!busy && html()) html().dataset.ready = '1';
  }
}
