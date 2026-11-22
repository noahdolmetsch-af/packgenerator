/**
 * «Werkstatt-Quittung:» (Noah 05.11.2026): a text that is only a label with a colon and nothing after it, like the
 * start of a quick note («Workshop receipt: ») that nobody finished. It is no note and no learning. No imports.
 */
export const bareLabel = (text) => /^[^:\n]{1,60}:$/.test(String(text ?? '').trim());
