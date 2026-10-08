/**
 * v0.30.0 (Noah 1a): the tip "Use it offline (home screen)". Chrome and Android offer the install
 * once (beforeinstallprompt); the event is kept here so the tip's button can open it. Safari and
 * Firefox have no such event: the tip then says where the browser has it.
 */
let offer = null;
if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    offer = e;
  });
  window.addEventListener('appinstalled', () => (offer = null));
}

/** Opened from the home screen (or installed as an app on the desktop)? */
export const standalone = () => {
  try {
    return window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
  } catch {
    return false;
  }
};

/** Open the browser's install question. true: it was shown; false: the browser has none to show. */
export async function install() {
  if (!offer) return false;
  const e = offer;
  offer = null;
  await e.prompt();
  return true;
}
