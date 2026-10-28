// «FIT-Dateien ganz lesen» (Noah 27.10.2026 «2a», thread «Geräte und Datenquellen»): a FIT file is a ride with all its values
export default {
  title: 'FIT files with all their values',
  lead: 'Upload a FIT file from your bike computer or watch like a GPX, with what only the unit knows.',
  points: [
    { text: 'Rides › Choose file takes .fit too: km, climbing, pauses, heart rate, cadence, power and temperature', href: '#/debrief/ride' },
    { text: 'New on the ride page: «From the unit» with normalized power, IF / TSS, training effect, left / right balance, laps, gear changes and battery' },
  ],
  small: [{ box: 'new', text: 'Works for Garmin, Wahoo, Hammerhead, Coros, Polar and Suunto; the file stays on your device' }],
  test: [
    'In Garmin Connect open a ride, ⚙ → Export Original, open the ZIP: you get a .fit file.',
    'In the app: Touren › Rückblick › Fahrten › Datei wählen, choose the .fit file, save: the ride page shows km, Puls and, under «Vom Gerät», Normleistung and Trainingseffekt.',
  ],
  since: [],
  de: {
    'FIT files with all their values': 'FIT-Dateien mit allen Werten',
    'Upload a FIT file from your bike computer or watch like a GPX, with what only the unit knows.':
      'Lade eine FIT-Datei vom Velocomputer oder von der Uhr wie ein GPX hoch, mit dem, was nur das Gerät weiss.',
    'Rides › Choose file takes .fit too: km, climbing, pauses, heart rate, cadence, power and temperature':
      'Fahrten › Datei wählen nimmt auch .fit: km, Höhenmeter, Pausen, Puls, Trittfrequenz, Leistung und Temperatur',
    'New on the ride page: «From the unit» with normalized power, IF / TSS, training effect, left / right balance, laps, gear changes and battery':
      'Neu auf der Fahrt-Seite: «Vom Gerät» mit Normleistung, IF / TSS, Trainingseffekt, Links / rechts, Runden, Schaltvorgängen und Akku',
    'Works for Garmin, Wahoo, Hammerhead, Coros, Polar and Suunto; the file stays on your device':
      'Geht für Garmin, Wahoo, Hammerhead, Coros, Polar und Suunto; die Datei bleibt auf deinem Gerät',
    'In Garmin Connect open a ride, ⚙ → Export Original, open the ZIP: you get a .fit file.':
      'In Garmin Connect eine Fahrt öffnen, ⚙ → Export Original, die ZIP-Datei öffnen: darin ist eine .fit-Datei.',
    'In the app: Touren › Rückblick › Fahrten › Datei wählen, choose the .fit file, save: the ride page shows km, Puls and, under «Vom Gerät», Normleistung and Trainingseffekt.':
      'In der App: Touren › Rückblick › Fahrten › Datei wählen, die .fit-Datei wählen, speichern: Die Fahrt-Seite zeigt km, Puls und unter «Vom Gerät» Normleistung und Trainingseffekt.',
  },
};
