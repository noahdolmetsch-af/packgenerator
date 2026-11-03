// The German texts load on demand (src/lib/i18n.svelte.js loadDe) and are big: loading them for each of the 540 unit
// test files cost over half of the test time. A unit test that needs German imports this file as its FIRST import:
//   import './setup/de.js';
import { loadDe } from '../../src/lib/i18n.svelte.js';
await loadDe();
