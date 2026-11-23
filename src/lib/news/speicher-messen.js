// Noah 23.11.2026 (thread «Speicher der App auf 1 GB senken»): measure where the storage goes, on the phone
export default {
  title: 'Storage on this device',
  lead: 'Me › Data now shows where the storage of the app goes, and says whether a big number is real space.',
  points: [{ text: 'Me › Data › Storage on this device: one tap measures caches and data, read only', go: { href: '#/me/data', steps: [{ sel: '[data-storage-measure]' }] } }],
  small: [],
  test: ['Open Me › Data and tap «Measure storage».', 'A list shows the map pictures, the AI models and your data with their sizes; «Copy the line» copies it.'],
  since: [],
  de: {
    'Storage on this device': 'Speicher auf diesem Gerät',
    'Me › Data now shows where the storage of the app goes, and says whether a big number is real space.': 'Ich › Daten zeigt jetzt, wohin der Speicher der App geht, und sagt, ob eine grosse Zahl echter Platz ist.',
    'Me › Data › Storage on this device: one tap measures caches and data, read only': 'Ich › Daten › Speicher auf diesem Gerät: ein Tipp misst Zwischenspeicher und Daten, nur lesen',
    'Open Me › Data and tap «Measure storage».': 'Öffne Ich › Daten und tippe auf «Speicher messen».',
    'A list shows the map pictures, the AI models and your data with their sizes; «Copy the line» copies it.': 'Eine Liste zeigt Kartenbilder, KI-Modelle und deine Daten mit ihren Grössen; «Zeile kopieren» kopiert sie.',
  },
};
