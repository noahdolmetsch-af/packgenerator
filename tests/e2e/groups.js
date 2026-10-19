// Paket A (Noah 18.10.2026, app rule «every group can be renamed and deleted»): helpers for the «…» of a
// group heading (src/lib/ui/GroupActions.svelte), on a phone (sheet) and a computer (list) alike.
// The caller accepts or dismisses the delete question itself (page.on('dialog', …)).
import DE from '../../src/lib/i18n/de/index.js';

const T = (en, vars) => {
  const text = DE[en] ?? en.replace(/\|[a-z]+$/, '');
  return vars ? text.replace(/\{(\w+)\}/g, (m, k) => vars[k] ?? m) : text;
};
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** Opens the «…» of the group «name» and returns its visible entries. */
export async function groupMenu(page, name) {
  await page.getByRole('button', { name: T('More for the group {name}', { name }), exact: true }).click();
  return page.getByRole('menuitem').filter({ visible: true });
}

/** «…» › «Umbenennen», types the new name and saves; returns the rename form (gone afterwards). */
export async function renameGroupVia(page, name, to) {
  const items = await groupMenu(page, name);
  await items.filter({ hasText: new RegExp(`^\\s*${esc(T('Rename'))}`) }).click();
  const form = page.locator('[data-group-rename]');
  await form.getByLabel(T('New name of the group')).fill(to);
  await form.getByRole('button', { name: T('Save'), exact: true }).click();
  return form;
}

/** «…» › «Löschen» (the question goes to the caller's dialog handler). */
export async function deleteGroupVia(page, name) {
  const items = await groupMenu(page, name);
  await items.filter({ hasText: new RegExp(`^\\s*${esc(T('Delete'))}`) }).click();
}
