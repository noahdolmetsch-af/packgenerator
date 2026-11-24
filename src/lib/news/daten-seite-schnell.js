// Noah 24.11.2026 (Tempo-Zeile): die Seite «Daten» wartete mehrere Sekunden, weil sie alle Sicherungen vor Updates las
export default {
  title: 'The Data page opens fast again',
  lead: 'It no longer reads every safety copy just to list them. Me › Data › Storage now also shows how much the copies take.',
  points: [{ text: 'Me › Data opens at once, even with many copies before updates', go: { href: '#/me/data', steps: [{ sel: '[data-storage-measure]' }] } }],
  small: [],
  test: ['Open Me › Data: the page stands within a second.', 'Tap «Measure storage»: the row «Copies before updates» says how many copies there are and how much they take.'],
  since: [],
  de: {
    'The Data page opens fast again': 'Die Seite «Daten» öffnet wieder schnell',
    'It no longer reads every safety copy just to list them. Me › Data › Storage now also shows how much the copies take.': 'Sie liest nicht mehr jede Kopie, nur um sie aufzulisten. Ich › Daten › Speicher zeigt jetzt auch, wie viel die Kopien brauchen.',
    'Me › Data opens at once, even with many copies before updates': 'Ich › Daten öffnet sofort, auch mit vielen Kopien unter «Vor Updates»',
    'Open Me › Data: the page stands within a second.': 'Öffne Ich › Daten: Die Seite steht innerhalb einer Sekunde.',
    'Tap «Measure storage»: the row «Copies before updates» says how many copies there are and how much they take.': 'Tippe auf «Speicher messen»: Die Zeile «Vor Updates» nennt, wie viele Kopien es gibt und wie viel sie brauchen.',
  },
};
