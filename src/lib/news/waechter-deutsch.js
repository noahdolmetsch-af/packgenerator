// «Wächter Fehlendes Deutsch» (Frontend-Durchklick Etappe 1, Noah 05.11.2026 «1a»): nur eine Prüfung, keine Änderung in der App
export default {
  title: 'A check for missing German',
  lead: 'A test now stops a change that brings a text without German into the app.',
  points: [
    { text: 'Nothing changes in the app: every text on the pages already has German, and a new text without German now fails the check before it goes online', go: null },
  ],
  small: [],
  test: [
    'Open any page in German (Me › Appearance › language): no English sentence is left.',
    'Nothing else to check: this change only adds a test.',
  ],
  since: [],
  de: {
    'A check for missing German': 'Eine Prüfung gegen fehlendes Deutsch',
    'A test now stops a change that brings a text without German into the app.': 'Ein Test stoppt jetzt eine Änderung, die einen Text ohne Deutsch in die App bringt.',
    'Nothing changes in the app: every text on the pages already has German, and a new text without German now fails the check before it goes online': 'In der App ändert sich nichts: jeder Text auf den Seiten hat schon Deutsch, und ein neuer Text ohne Deutsch fällt jetzt in der Prüfung durch, bevor er online geht',
    'Open any page in German (Me › Appearance › language): no English sentence is left.': 'Öffne irgendeine Seite auf Deutsch (Ich › Aussehen › Sprache): es bleibt kein englischer Satz übrig.',
    'Nothing else to check: this change only adds a test.': 'Sonst gibt es nichts zu prüfen: diese Änderung fügt nur einen Test hinzu.',
  },
};
