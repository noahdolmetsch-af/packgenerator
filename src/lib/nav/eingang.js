// «Zurück am Eingang» (thread «Navigation ohne Sackgassen», Noah 23.11.2026 «ja»: Zurück führt nie aus der App hinaus).
// Wer die App mit einer Adresse tief in der App öffnet (Nachricht, Lesezeichen, geteilte Tour), hat vor sich in der
// Verlaufsliste nur die Seite davor (oft eine andere App oder Webseite): Zurück würde die App verlassen. Darum legen wir
// beim ersten Tipp einmal Heute darunter: Zurück führt dann auf Heute, nicht hinaus. Heute selbst bleibt der Eingang:
// dort verlässt Zurück die App wie bei jeder App (keine Falle).
// Warum erst beim ersten Tipp: Chrome überspringt einen Verlaufseintrag, den eine Seite ohne Tipp angelegt hat, beim
// Zurück (Schutz vor Verlauf-Missbrauch). Ein beim Start angelegter Eintrag wäre übersprungen worden, und ein Fenster
// zu schliessen (backclose.js) hätte die Seite verlassen. Im Tipp angelegt ist der Eintrag ein ganz normaler.
// Wer nach dem Öffnen sofort Zurück drückt, ohne die Seite je anzutippen, geht dorthin zurück, woher er kam.

const KEY = 'eingang';
const EVENTS = ['pointerup', 'keydown', 'click'];

/** Is this address a page deeper than Heute? */
export const isDeep = (hash) => !!hash && hash !== '#' && hash !== '#/' && !/^#\/?\?/.test(hash);

const seen = () => {
  try {
    return !!sessionStorage.getItem(KEY);
  } catch {
    return false;
  }
};
const remember = () => {
  try {
    sessionStorage.setItem(KEY, '1');
  } catch {
    /* private mode: the entry marker below keeps a reload from stacking another Heute */
  }
};

/** Put Heute under the page that is shown now. Needs a tap (user activation), else it waits for the next one. */
export function place() {
  try {
    if (!isDeep(location.hash)) return true;
    if (!(navigator.userActivation?.isActive ?? true)) return false;
    if (history.state?.eg) return true;
    const here = location.pathname + location.search + location.hash;
    history.replaceState({ eg: 1 }, '', location.pathname + location.search + '#/');
    history.pushState(null, '', here);
    return true;
  } catch {
    return true; // no history: nothing to do
  }
}

/**
 * Called once when the app starts. On a deep address it waits for the first tap or key and then puts Heute underneath.
 * Once per tab (sessionStorage): a reload never stacks another Heute. Returns a function that stops waiting.
 */
export function entrance() {
  try {
    if (!isDeep(location.hash) || seen() || history.state?.eg) {
      remember();
      return () => {};
    }
  } catch {
    return () => {};
  }
  const stop = () => EVENTS.forEach((e) => window.removeEventListener(e, onGesture, true));
  const onGesture = () => {
    if (!place()) return; // a key without activation (Tab, Esc): wait for the next
    stop();
    remember();
  };
  EVENTS.forEach((e) => window.addEventListener(e, onGesture, true));
  return stop;
}
