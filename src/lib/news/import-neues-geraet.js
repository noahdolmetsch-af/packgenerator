// UI-Test 26.10.2026 T10 «Import auf ein leeres Gerät» (G5-04, G1-08): «Check import» counts a device with only the examples of the first start as empty and suggests «Replace all data» (firststart.js onlyExamples); after a merge it says how the examples go
export default {
  title: 'Import on a new device',
  lead: 'On a new device the app now suggests the right way to take over your backup.',
  points: [{ text: 'A device with only the examples counts as empty: the suggestion is «Replace all data»', href: '#/me/data', go: 'f.sync' }],
  small: [{ box: 'nicer', text: 'After «Merge» the app says how the examples of the first start go', go: 'f.sync' }],
  test: ['Me › Data and backup, open a backup on a device with only the examples: the suggestion says «This device is still empty …».', 'With your own data on the device the suggestion stays as before.'],
  since: [],
  de: {
    'Import on a new device': 'Import auf ein neues Gerät',
    'On a new device the app now suggests the right way to take over your backup.': 'Auf einem neuen Gerät schlägt die App jetzt den richtigen Weg vor, dein Backup zu übernehmen.',
    'A device with only the examples counts as empty: the suggestion is «Replace all data»': 'Ein Gerät mit nur den Beispielen gilt als leer: der Vorschlag heisst «Alle Daten ersetzen»',
    'After «Merge» the app says how the examples of the first start go': 'Nach «Zusammenführen» sagt die App, wie die Beispiele vom ersten Start weggehen',
    'Me › Data and backup, open a backup on a device with only the examples: the suggestion says «This device is still empty …».': 'Ich › Daten und Backup, ein Backup auf einem Gerät mit nur den Beispielen öffnen: Der Vorschlag sagt «Dieses Gerät ist noch leer …».',
    'With your own data on the device the suggestion stays as before.': 'Mit eigenen Daten auf dem Gerät bleibt der Vorschlag wie bisher.',
  },
};
