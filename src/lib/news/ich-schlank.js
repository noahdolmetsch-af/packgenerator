// «Versteckte Funktionen» Schritt 9 «Ich schlank» (Noah 04.11.2026 «a: Nur noch in Planen»): Ich keeps data, settings and help
export default {
  title: 'Me: only data, settings and help',
  lead: 'Documents, photo album, friends and mini tools now live in «All here» on Plan. Me is shorter.',
  points: [
    { text: 'Documents, photo album, friends and mini tools: in «All here» on Plan', go: { href: '#/week', steps: [{ sel: '[data-all-here="plan"]' }] } },
    { text: 'A document that expires soon waits for you on top of Me', go: { href: '#/me', steps: [{ sel: '[data-section="waiting"]' }] } },
  ],
  small: [],
  test: ['Open Me: the rows «Documents», «Photo album», «With friends» and «Mini tools» are gone; the note on top says where they are.', 'Open Plan: in «All here» tap «Documents»: the documents open.'],
  since: [],
  de: {
    'Me: only data, settings and help': 'Ich: nur noch Daten, Einstellungen und Hilfe',
    'Documents, photo album, friends and mini tools now live in «All here» on Plan. Me is shorter.': 'Dokumente, Fotoalbum, Mit Freunden und Mini-Tools sind jetzt in «Alles hier» bei Planen. Ich ist kürzer.',
    'Documents, photo album, friends and mini tools: in «All here» on Plan': 'Dokumente, Fotoalbum, Mit Freunden und Mini-Tools: in «Alles hier» bei Planen',
    'A document that expires soon waits for you on top of Me': 'Ein Dokument, das bald abläuft, wartet oben bei Ich auf dich',
    'Open Me: the rows «Documents», «Photo album», «With friends» and «Mini tools» are gone; the note on top says where they are.': 'Öffne Ich: Die Zeilen «Dokumente», «Fotoalbum», «Mit Freunden» und «Mini-Tools» sind weg; der Hinweis oben sagt, wo sie sind.',
    'Open Plan: in «All here» tap «Documents»: the documents open.': 'Öffne Planen: Tippe in «Alles hier» auf «Dokumente»: Die Dokumente öffnen sich.',
  },
};
