// The German of the handbook that only the handbook needs (texte-de.js, about 200 KB) is not part of the start (Tempo-Budget,
// scripts/size-guard.mjs). Importing this file adds it to t(); the pages Handbook and Small apps import it, and the card
// «What you can do here» gets it with loadHandbook() (load.js).
import { addDe } from '../i18n.svelte.js';
import DE from './texte-de.js';

addDe(DE);
