// The catalogue's source text for specs that read it as text: features.js plus the files of src/lib/featreg/
// (one per new function), whose entries also begin with `{ id: 'f.…'`.
import { readFileSync, readdirSync } from 'node:fs';

const DIR = new URL('../../src/lib/featreg/', import.meta.url);
export const FEATURES_JS = readFileSync(new URL('../../src/lib/features.js', import.meta.url), 'utf8');
export const FEATREG_SRC = readdirSync(DIR)
  .filter((f) => /^[a-z0-9][a-z0-9-]*\.js$/.test(f) && f !== 'index.js')
  .map((f) => readFileSync(new URL(f, DIR), 'utf8'))
  .join('\n');
export const FEATURE_SRC_ALL = `${FEATURES_JS}\n${FEATREG_SRC}`;
