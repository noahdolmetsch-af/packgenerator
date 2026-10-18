/**
 * P3b «Daten sicher», app rule 3a (Noah 15.10.2026 «3a»): closing a window (✕, «Cancel», Escape, back,
 * a tap beside it) closes it FIRST and keeps what was typed; only «Discard» deletes it.
 *
 * Most windows are made fresh on every opening, so a typed text was gone after closing. This action
 * keeps the typed fields of a window under its key (in memory and in sessionStorage, so a reload keeps
 * them too; never in the database, a backup or an export). When the same window opens again (the same
 * key: the same record, or «new»), the fields come back, with one quiet line on top:
 * «Your text from before is back.» and «Discard», which puts the fields back as they were.
 *
 * Use on a <dialog>: `<dialog use:keepTyped={'link:' + (link?.id ?? 'new')}>`, or on a form that is
 * shown inside a window (open while it is on the page).
 * Saving forgets the kept text: a click on the window's main button (`.hi`, a submit button or
 * [data-saves]) marks the window as saved, and its closing then drops the kept text. A button with
 * [data-keeps] never counts as saving. Fields inside [data-keep-off] are left alone.
 * Windows that save as you type (Quick note, item, trip, note) do not need it.
 */
import { t } from '../i18n.svelte.js';

const PREFIX = 'pg.typed.';
const FIELDS = [
  'input:not([type])',
  'input[type=text]',
  'input[type=search]',
  'input[type=number]',
  'input[type=date]',
  'input[type=month]',
  'input[type=time]',
  'input[type=url]',
  'input[type=email]',
  'input[type=tel]',
  'textarea',
].join(',');
const SAVES = '.hi, [type=submit], [data-saves]';
const mem = new Map();

function read(key) {
  if (mem.has(key)) return mem.get(key);
  try {
    const v = JSON.parse(sessionStorage.getItem(PREFIX + key) ?? 'null');
    return v && typeof v === 'object' ? v : null;
  } catch {
    return null;
  }
}
function write(key, values) {
  mem.set(key, values);
  try {
    sessionStorage.setItem(PREFIX + key, JSON.stringify(values));
  } catch {
    /* private window or full: memory is enough */
  }
}
function drop(key) {
  mem.delete(key);
  try {
    sessionStorage.removeItem(PREFIX + key);
  } catch {
    /* nothing to drop */
  }
}
/** Only for tests: is something kept under this key? */
export const keptFor = (key) => read(key);

/** The window's typed fields, each with a name that stays the same from one opening to the next. */
function fieldsOf(node) {
  const seen = new Map();
  return [...node.querySelectorAll(FIELDS)]
    .filter((el) => !el.disabled && !el.readOnly && !el.closest('[data-keep-off]'))
    .map((el, i) => {
      const id = el.id && !/^(svelte|\d)/.test(el.id) && !/\d{3,}/.test(el.id) ? el.id : '';
      const base = el.name || id || el.getAttribute('aria-label') || el.placeholder || `#${i}`;
      const n = (seen.get(base) ?? 0) + 1;
      seen.set(base, n);
      return { el, name: n > 1 ? `${base}~${n}` : base };
    });
}
const valuesOf = (list) => Object.fromEntries(list.map(({ el, name }) => [name, el.value]));
const sameAs = (a, b) => Object.keys(a).every((k) => (a[k] ?? '') === (b?.[k] ?? ''));

function put(list, values) {
  for (const { el, name } of list) {
    if (!(name in values) || el.value === values[name]) continue;
    el.value = values[name];
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
  }
}

export function keepTyped(node, key) {
  let k = key;
  let first = null; // the fields as the window opened (before the kept text came back)
  let saved = false;
  let typed = false;
  let restoring = false;
  let bar = null;
  let opened = false;
  let timer = null;

  const removeBar = () => {
    bar?.remove();
    bar = null;
  };
  const showBar = () => {
    removeBar();
    bar = document.createElement('p');
    bar.className = 'kept-bar';
    bar.setAttribute('role', 'status');
    bar.dataset.keptBar = '';
    const text = document.createElement('span');
    text.textContent = t('Your text from before is back.');
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'link';
    btn.dataset.keeps = '';
    btn.textContent = t('Discard');
    btn.addEventListener('click', discard);
    bar.append(text, btn);
    node.prepend(bar);
  };
  function discard() {
    drop(k);
    if (first) {
      restoring = true;
      put(fieldsOf(node), first);
      restoring = false;
    }
    removeBar();
  }

  const onOpen = () => {
    if (opened) return;
    opened = true;
    saved = false;
    typed = false;
    first = valuesOf(fieldsOf(node)); // so a very quick first key is kept too
    clearTimeout(timer);
    // the window draws its fields first (some fill them in an effect when they open)
    timer = setTimeout(() => {
      if (!isOpen() || typed) return; // typing already: nothing comes back over it
      const list = fieldsOf(node);
      first = valuesOf(list);
      const kept = read(k);
      if (kept && !sameAs(kept, first)) {
        restoring = true;
        put(list, kept);
        restoring = false;
        showBar();
      }
    }, 30);
  };
  const onClosed = () => {
    if (!opened) return;
    opened = false;
    clearTimeout(timer);
    if (saved) drop(k);
    removeBar();
  };

  // not a <dialog> (a form shown inside a window, like «Report a problem»): open while it is on the page
  const isOpen = () => (node.tagName === 'DIALOG' ? node.open : node.isConnected);
  const onInput = () => {
    if (restoring || !isOpen() || !first) return;
    typed = true;
    saved = false; // typed again after a main button that did not close the window
    const now = valuesOf(fieldsOf(node));
    if (sameAs(now, first) && sameAs(first, now)) drop(k);
    else write(k, now);
  };
  const onClick = (e) => {
    const btn = e.target?.closest?.('button, [type=submit]');
    if (btn && node.contains(btn) && btn.matches(SAVES) && !btn.matches('[data-keeps]')) saved = true;
  };
  const onSubmit = (e) => {
    // a <form method="dialog"> closes the window: only its main button counts as saving
    const by = e.submitter;
    if (!by || (by.matches(SAVES) && !by.matches('[data-keeps]'))) saved = true;
  };

  node.addEventListener('input', onInput, true);
  node.addEventListener('change', onInput, true);
  node.addEventListener('click', onClick, true);
  node.addEventListener('submit', onSubmit, true);
  node.addEventListener('close', onClosed);
  const watch = new MutationObserver(() => (node.open ? onOpen() : onClosed()));
  if (node.tagName === 'DIALOG') watch.observe(node, { attributes: true, attributeFilter: ['open'] });
  if (isOpen()) onOpen();

  return {
    update(next) {
      if (next !== k) {
        onClosed();
        k = next;
        if (isOpen()) onOpen();
      }
    },
    destroy() {
      watch.disconnect();
      clearTimeout(timer);
      if (saved) drop(k);
      removeBar();
      node.removeEventListener('input', onInput, true);
      node.removeEventListener('change', onInput, true);
      node.removeEventListener('click', onClick, true);
      node.removeEventListener('submit', onSubmit, true);
      node.removeEventListener('close', onClosed);
    },
  };
}

/**
 * Rule 3a: ✕ closes a window the same way as Escape and back. The window's own `cancel` handling runs
 * first (BikeDialog, BagDialog, RenameSheet, ItemDialog and TripDialog keep what was typed there).
 */
export function closeKeep(dialog) {
  if (!dialog?.open) return;
  const ev = new Event('cancel', { cancelable: true });
  dialog.dispatchEvent(ev);
  if (!ev.defaultPrevented && dialog.open) dialog.close();
}
