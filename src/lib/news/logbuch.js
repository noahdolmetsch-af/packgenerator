// «Verbesserungs-Logbuch» (Noah 21.11.2026 «freigabe»): Ich › Logbuch, step 1 of 4
export default {
  title: 'Your improvement log',
  lead: 'A place in the app for everything that bothers you or is missing, kept right when you see it.',
  points: [
    { text: 'New page «Improvement log» under Me: 13 kinds in four groups, how urgent it is, the page and the block', go: 'f.logbuch' },
    { text: 'Filter by group, mark an entry as done or change and delete it (with Undo)', go: { href: '#/me/logbuch', steps: [{ sel: '[data-lb-new]' }] } },
  ],
  small: [{ box: 'new', text: 'Everything stays on this device and goes into your backup; nothing is sent and nothing is synced', go: { href: '#/me/data', steps: [{ text: 'Backup' }], where: 'The backup counts the entries of the log.' } }],
  test: ['Open Me › Improvement log and tap «New entry».', 'Pick «Change text», write one sentence and tap «Save»: the entry shows in the list.'],
  since: ['f.logbuch'],
  de: {
    'Your improvement log': 'Dein Verbesserungs-Logbuch',
    'A place in the app for everything that bothers you or is missing, kept right when you see it.': 'Ein Platz in der App für alles, was dich stört oder fehlt, gleich dann festgehalten, wenn du es siehst.',
    'New page «Improvement log» under Me: 13 kinds in four groups, how urgent it is, the page and the block': 'Neue Seite «Verbesserungs-Logbuch» unter Ich: 13 Arten in vier Gruppen, wie dringend es ist, die Seite und der Block',
    'Filter by group, mark an entry as done or change and delete it (with Undo)': 'Nach Gruppe filtern, einen Eintrag als erledigt markieren oder ändern und löschen (mit Rückgängig)',
    'Everything stays on this device and goes into your backup; nothing is sent and nothing is synced': 'Alles bleibt auf diesem Gerät und kommt ins Backup; nichts wird gesendet und nichts abgeglichen',
    'The backup counts the entries of the log.': 'Das Backup zählt die Einträge des Logbuchs.',
    'Open Me › Improvement log and tap «New entry».': 'Öffne Ich › Verbesserungs-Logbuch und tippe auf «Neuer Eintrag».',
    'Pick «Change text», write one sentence and tap «Save»: the entry shows in the list.': 'Wähle «Text ändern», schreib einen Satz und tippe auf «Speichern»: der Eintrag steht in der Liste.',
  },
};
