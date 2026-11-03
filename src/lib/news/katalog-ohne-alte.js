// «332 sichtbar», Frage 3 (Noah 27.10.2026 «3a»): the four functions left out on purpose (shop, two kinds of
// invoices, offers) leave the catalogue «What the app can do»
export default {
  title: 'A tidier catalogue',
  lead: 'Four functions you said no to are gone from «What the app can do».',
  // gone from the catalogue: nothing to show (know/newsgo.js go: null)
  points: [{ text: 'Shop, invoices, bills and offers no longer stand in the catalogue', href: '#/features', go: null }],
  small: [],
  test: ['Open «What the app can do» and search «Shop».', 'No entry «Shop without fees» appears; «Invoices» and «Offers» are gone too.'],
  since: [],
  de: {
    'A tidier catalogue': 'Ein aufgeräumter Katalog',
    'Four functions you said no to are gone from «What the app can do».': 'Vier Funktionen, zu denen du nein gesagt hast, stehen nicht mehr in «Was die App alles kann».',
    'Shop, invoices, bills and offers no longer stand in the catalogue': 'Shop, Rechnungen, Rechnungen zu zahlen und Angebote stehen nicht mehr im Katalog',
    'Open «What the app can do» and search «Shop».': 'Öffne «Was die App alles kann» und suche «Shop».',
    'No entry «Shop without fees» appears; «Invoices» and «Offers» are gone too.': 'Es erscheint kein Eintrag «Shop ohne Gebühren»; «Rechnungen» und «Angebote» sind auch weg.',
  },
};
