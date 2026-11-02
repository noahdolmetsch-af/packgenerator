/**
 * Never a white page (Noah 2.11.2026 «leere Maske, grosses Problem»): when an error outside a page's own
 * <svelte:boundary> makes Svelte take the whole app away, #app stays empty. This watches for it and draws a
 * small plain card in its place: the data is safe, one tap loads the newest version. Nothing is changed.
 */
import { t } from '../i18n.svelte.js';
import { freshReload } from '../freshreload.js';

export function watchWhitePage(target = globalThis.document?.getElementById('app'), { wait = 600, win = globalThis.window, doc = globalThis.document } = {}) {
  if (!target || !win) return () => {};
  let timer = 0;
  const check = () => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      if (target.querySelector('[data-white-card]') || target.children.length) return;
      const card = doc.createElement('section');
      card.setAttribute('data-white-card', '');
      card.setAttribute('role', 'alert');
      card.style.cssText = 'max-width:30rem;margin:15vh auto 0;padding:1rem;font:16px/1.4 system-ui,sans-serif';
      const h = doc.createElement('h1');
      h.textContent = t('Something went wrong here');
      h.style.fontSize = '1.4rem';
      const p = doc.createElement('p');
      p.textContent = t('Your data is safe. The app could not be shown.');
      const b = doc.createElement('button');
      b.type = 'button';
      b.textContent = t('Reload the newest version');
      b.style.cssText = 'padding:.8rem 1.2rem;font-size:1rem;border-radius:.6rem;border:0;background:#1f3a2e;color:#fff';
      b.addEventListener('click', () => freshReload());
      card.append(h, p, b);
      target.append(card);
    }, wait);
  };
  win.addEventListener('error', check);
  win.addEventListener('unhandledrejection', check);
  return () => {
    clearTimeout(timer);
    win.removeEventListener('error', check);
    win.removeEventListener('unhandledrejection', check);
  };
}
