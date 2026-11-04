// Tempo-Budget (scripts/size-guard.mjs): the «Good to know» tips and their German are about 160 KB, so they load when a
// card «What you can do here» first shows, not with the start. Returns WISSEN; the German goes to t() through addDe().
import { addDe } from '../i18n.svelte.js';

let loading = null;
export const loadWissen = () =>
  (loading ??= Promise.all([import('./index.js'), import('./texte-de.js')]).then(([w, de]) => {
    addDe(de.default);
    return w.WISSEN;
  }));
