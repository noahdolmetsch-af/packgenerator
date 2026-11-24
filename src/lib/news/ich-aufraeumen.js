// Sitemap «Wichtiges nach vorn, Ich aufräumen» (Noah 24.11.2026): Ich hat 16 Zeilen in 5 Gruppen statt 24 Türen
export default {
  title: 'Me is tidied up',
  lead: 'Me has 16 rows in 5 groups instead of 24. Documents and the improvement log are easy to find, the three reminder pages share one row.',
  points: [
    { text: 'Documents are a row in the group Data; the improvement log moved to Help', go: { href: '#/me', steps: [{ sel: '[data-me-row="docs"]' }], where: 'Me › Data › Documents.' } },
    { text: 'One row «Reminders and alerts» instead of three; the three pages lead to each other with «Continue to»', go: { href: '#/me', steps: [{ sel: '[data-row="reminders"]' }], where: 'Me › Reminders.' } },
  ],
  small: [{ box: 'new', text: 'Small apps, Project shelf, Kursblick and Offers and requests wait under «More»; every old address still works' }],
  test: ['Open Me: five groups, Documents under Data, one row for reminders.', 'Tap «Reminders and alerts», then «Continue to» at the end of the page: the other reminder pages open.'],
  since: [],
  de: {
    'Me is tidied up': 'Ich ist aufgeräumt',
    'Me has 16 rows in 5 groups instead of 24. Documents and the improvement log are easy to find, the three reminder pages share one row.': 'Ich hat 16 Zeilen in 5 Gruppen statt 24. Dokumente und das Logbuch sind leicht zu finden, die drei Erinnerungs-Seiten teilen sich eine Zeile.',
    'Documents are a row in the group Data; the improvement log moved to Help': 'Dokumente sind eine Zeile in der Gruppe Daten; das Verbesserungs-Logbuch steht jetzt in Hilfe',
    'Me › Data › Documents.': 'Ich › Daten › Dokumente.',
    'One row «Reminders and alerts» instead of three; the three pages lead to each other with «Continue to»': 'Eine Zeile «Erinnerungen und Hinweise» statt drei; die drei Seiten führen mit «Weiter zu» ineinander',
    'Me › Reminders.': 'Ich › Erinnerungen.',
    'Small apps, Project shelf, Kursblick and Offers and requests wait under «More»; every old address still works': 'Kleine Apps, Projekt-Ablage, Kursblick und Angebote und Anfragen stehen unter «Mehr»; jede alte Adresse geht weiter',
    'Open Me: five groups, Documents under Data, one row for reminders.': 'Öffne Ich: fünf Gruppen, Dokumente unter Daten, eine Zeile für Erinnerungen.',
    'Tap «Reminders and alerts», then «Continue to» at the end of the page: the other reminder pages open.': 'Tippe auf «Erinnerungen und Hinweise», dann am Seitenende auf «Weiter zu»: die anderen Erinnerungs-Seiten öffnen.',
  },
};
