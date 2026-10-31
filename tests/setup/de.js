// The German texts load on demand (src/lib/i18n.svelte.js loadDe); the unit tests that switch to German need them from the start.
import { loadDe } from '../../src/lib/i18n.svelte.js';
await loadDe();
