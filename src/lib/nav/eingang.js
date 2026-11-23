// «Zurück am Eingang» (thread «Navigation ohne Sackgassen», Noah 23.11.2026 «ja»: Zurück führt nie aus der App hinaus).
// Wer die App mit einer Adresse tief in der App öffnet (Nachricht, Lesezeichen, geteilte Tour), hat vor sich in der
// Verlaufsliste nur die Seite davor (oft eine andere App oder Webseite): Zurück würde die App verlassen. Darum legen wir
// beim Start einmal Heute darunter: Zurück führt dann auf Heute, nicht hinaus. Heute selbst bleibt der Eingang:
// dort verlässt Zurück die App wie bei jeder App (keine Falle).

const KEY = 'eingang';

/** Is this address a page deeper than Heute? */
export const isDeep = (hash) => !!hash && hash !== '#' && hash !== '#/' && !/^#\/?\?/.test(hash);

/**
 * Called once when the app starts. Returns true when Heute was put under the page.
 * Once per tab (sessionStorage), so a reload never stacks another Heute; the entry marker is the fallback when
 * the storage is not there (private mode).
 */
export function entrance() {
  try {
    if (!isDeep(location.hash)) {
      try {
        sessionStorage.setItem(KEY, '1');
      } catch {
        /* private mode */
      }
      return false;
    }
    let seen = false;
    try {
      seen = !!sessionStorage.getItem(KEY);
      sessionStorage.setItem(KEY, '1');
    } catch {
      seen = false;
    }
    if (seen || history.state?.pgv || history.state?.eg) return false;
    const here = location.pathname + location.search + location.hash;
    history.replaceState({ eg: 1 }, '', location.pathname + location.search + '#/');
    history.pushState(null, '', here);
    return true;
  } catch {
    return false; // no history: the app starts as it is
  }
}
