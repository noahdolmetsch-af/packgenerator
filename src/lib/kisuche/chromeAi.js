/**
 * «Kluge Suche» part 3: the AI built into Chrome on a computer (Prompt API, `LanguageModel`). Free and
 * on the device: nothing leaves it. Only where Chrome offers it; everywhere else the button stays away.
 * The model may need a one-time download (Chrome does it after a tap).
 */
const OPTS_DE = { expectedInputs: [{ type: 'text', languages: ['de', 'en'] }], expectedOutputs: [{ type: 'text', languages: ['de'] }] };
const SYSTEM = 'Du hilfst bei Velotouren und beim Packen. Antworte kurz auf Deutsch (Schweizer Schreibweise, ss statt ß), höchstens 6 Sätze. Nutze nur die Einträge aus der App, die mitkommen; erfinde keine Sachen dazu.';

const api = () => (typeof globalThis !== 'undefined' ? globalThis.LanguageModel : undefined);
let opts = OPTS_DE;

/** 'available' | 'downloadable' | 'downloading' | 'none'. German first; else the model's own languages. */
export async function aiStatus() {
  const LM = api();
  if (!LM?.availability || !LM?.create) return 'none';
  try {
    let s = await LM.availability(OPTS_DE);
    opts = OPTS_DE;
    if (s === 'unavailable') {
      s = await LM.availability();
      opts = {};
    }
    return ['available', 'downloadable', 'downloading'].includes(s) ? s : 'none';
  } catch {
    return 'none';
  }
}

/** Ask the local model. onProgress(0..1) while it downloads. Throws when Chrome refuses. */
export async function askLocal(text, onProgress = () => {}) {
  const LM = api();
  const session = await LM.create({
    ...opts,
    initialPrompts: [{ role: 'system', content: SYSTEM }],
    monitor(m) {
      m.addEventListener?.('downloadprogress', (e) => onProgress(e.loaded ?? 0));
    },
  });
  try {
    return String(await session.prompt(text)).trim();
  } finally {
    session.destroy?.();
  }
}
