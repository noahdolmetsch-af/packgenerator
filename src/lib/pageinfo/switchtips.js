/**
 * «Gut zu wissen» from the search (Noah 28.10.2026 «b»): «Gut zu wissen ausblenden» switches the tip line
 * under the page titles off on every page (the same switch as Ich › Eigene Werte › «Tips on all pages»),
 * «Tipps einblenden» on again. → { text, undo }: undo puts back exactly what was stored before.
 */
import { db } from '../db.js';
import { PAGEINFO_KEY, setTipsOn } from '../pageinfo.js';
import { t } from '../i18n.svelte.js';

const plain = (x) => (x == null ? x : JSON.parse(JSON.stringify(x)));

export async function switchTips(on) {
  const before = plain((await db.settings.get(PAGEINFO_KEY))?.value);
  await db.settings.put({ key: PAGEINFO_KEY, value: setTipsOn(before, on) });
  return {
    text: on ? t('«Good to know» is back on the pages.') : t('«Good to know» hidden on all pages. Back: search «show tips».'),
    undo: () => (before === undefined ? db.settings.delete(PAGEINFO_KEY) : db.settings.put({ key: PAGEINFO_KEY, value: before })),
  };
}
