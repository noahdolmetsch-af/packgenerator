// «Tour-Ampel» (Noah 05.11.2026, Touren 3a): packed, weather, bike, devices in four lines before the trip
export default {
  title: 'Ready to go? Four lines before the trip',
  lead: 'Before a trip, Pack shows at a glance what is still open.',
  points: [{ text: 'A small card on Pack: packed, weather, bike and devices, each with a tap to what is missing', go: { href: '#/pack', where: 'Shows on Pack for a planned trip that has not started yet.', steps: [{ sel: '[data-ampel]' }] } }],
  small: [{ box: 'new', text: 'Only a look at your data: nothing is blocked' }],
  test: [
    'Open a planned trip in Pack: the card «Ready to go?» is under the trip header.',
    'Tap a yellow line, for example «Packed 60 %»: the page takes you to what is open.',
  ],
  since: [],
  de: {
    'Ready to go? Four lines before the trip': 'Bereit zur Abfahrt? Vier Zeilen vor der Tour',
    'Before a trip, Pack shows at a glance what is still open.': 'Vor einer Tour zeigt Packen auf einen Blick, was noch offen ist.',
    'A small card on Pack: packed, weather, bike and devices, each with a tap to what is missing': 'Eine kleine Karte in Packen: gepackt, Wetter, Velo und Geräte, jede Zeile mit einem Tipp zu dem, was fehlt',
    'Shows on Pack for a planned trip that has not started yet.': 'Steht in Packen bei einer geplanten Tour, die noch nicht begonnen hat.',
    'Only a look at your data: nothing is blocked': 'Nur ein Blick auf deine Daten: nichts wird gesperrt',
    'Open a planned trip in Pack: the card «Ready to go?» is under the trip header.': 'Öffne in Packen eine geplante Tour: unter dem Tourkopf steht die Karte «Bereit zur Abfahrt?».',
    'Tap a yellow line, for example «Packed 60 %»: the page takes you to what is open.': 'Tippe auf eine gelbe Zeile, zum Beispiel «Gepackt 60 %»: die Seite führt dich zu dem, was offen ist.',
  },
};
