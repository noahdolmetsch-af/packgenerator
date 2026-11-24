// Reparatur zu #1514 (Main wieder grün): three pack files keep a wish or the last trip in the browser storage and are now named in the device map
export default {
  title: 'Nothing visible: device map completed',
  lead: 'Nothing changes for you. The three new packing files are now listed in the map of what stays on the device, so the tests are green again.',
  points: [{ text: 'Nothing visible: the map of what stays on this device names the new packing files', go: null }],
  small: [{ box: 'new', text: 'Nothing visible: the packing steps and the last trip stay on this device, as before' }],
  test: ['Open Trips, tap «Continue with …» on a pack card: the packing list opens in Steps, as before.', 'Open «Your suggestion» for a trip: it shows the offer, as before.'],
  since: [],
  de: {
    'Nothing visible: device map completed': 'Nichts Sichtbares: Geräte-Karte ergänzt',
    'Nothing changes for you. The three new packing files are now listed in the map of what stays on the device, so the tests are green again.': 'Für dich ändert sich nichts. Die drei neuen Pack-Dateien stehen jetzt in der Karte dessen, was auf dem Gerät bleibt, damit die Tests wieder grün sind.',
    'Nothing visible: the map of what stays on this device names the new packing files': 'Nichts Sichtbares: die Karte dessen, was auf diesem Gerät bleibt, nennt die neuen Pack-Dateien',
    'Nothing visible: the packing steps and the last trip stay on this device, as before': 'Nichts Sichtbares: die Packschritte und die letzte Tour bleiben auf diesem Gerät, wie vorher',
    'Open Trips, tap «Continue with …» on a pack card: the packing list opens in Steps, as before.': 'Öffne Touren, tippe auf einer Pack-Karte «Weiter mit …»: die Packliste öffnet sich in Schritten, wie vorher.',
    'Open «Your suggestion» for a trip: it shows the offer, as before.': 'Öffne «Dein Vorschlag» für eine Tour: er zeigt das Angebot, wie vorher.',
  },
};
