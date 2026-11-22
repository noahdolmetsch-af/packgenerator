// «Temperaturen nach Höhe» (Noah 05.11.2026 «1b 2a und c 3a …»): the air temperature at 1000, 2000 and 3000 m on the weather page
export default {
  title: 'Temperatures by height',
  lead: 'Next to the lake: how warm or cold the air is at 1000, 2000 and 3000 m above sea level.',
  points: [
    { text: 'The weather page shows the temperature at 1000, 2000 and 3000 m: now, at 6, 12 and 18 h and for the next two days', go: { href: '#/wetter', where: 'Weather › «Now», the card with the lake temperature, under it «Temperatures by height».' } },
    { text: 'Pick more places (Sedrun, Davos, Ascona …), a Swiss peak of about 1000, 2000 or 3000 m, or add a place of your own', go: { href: '#/wetter', where: 'Weather › «Now» › «Choose places and peaks».' } },
  ],
  small: [{ box: 'new', text: 'Offline the last kept values show with their time' }],
  test: [
    'Open the weather page: under the lake temperature you see the card «Temperatures by height» with three heights.',
    'Open «Choose places and peaks» and tap «Davos» and a peak: each gets its own table.',
    'Add a place of your own, rename it, delete it and tap «Undo».',
  ],
  since: [],
  de: {
    'Temperatures by height': 'Temperaturen nach Höhe',
    'Next to the lake: how warm or cold the air is at 1000, 2000 and 3000 m above sea level.': 'Neben dem See: wie warm oder kalt die Luft auf 1000, 2000 und 3000 m ü. M. ist.',
    'The weather page shows the temperature at 1000, 2000 and 3000 m: now, at 6, 12 and 18 h and for the next two days': 'Die Wetterseite zeigt die Temperatur auf 1000, 2000 und 3000 m: jetzt, um 6, 12 und 18 Uhr und für die nächsten zwei Tage',
    'Weather › «Now», the card with the lake temperature, under it «Temperatures by height».': 'Wetter › «Jetzt», die Karte mit der Seetemperatur, darunter «Temperaturen nach Höhe».',
    'Pick more places (Sedrun, Davos, Ascona …), a Swiss peak of about 1000, 2000 or 3000 m, or add a place of your own': 'Wähle mehr Orte (Sedrun, Davos, Ascona …), einen Schweizer Gipfel um 1000, 2000 oder 3000 m oder füge einen eigenen Ort hinzu',
    'Weather › «Now» › «Choose places and peaks».': 'Wetter › «Jetzt» › «Orte und Gipfel wählen».',
    'Offline the last kept values show with their time': 'Ohne Netz erscheinen die zuletzt gemerkten Werte mit Uhrzeit',
    'Open the weather page: under the lake temperature you see the card «Temperatures by height» with three heights.': 'Öffne die Wetterseite: Unter der Seetemperatur siehst du die Karte «Temperaturen nach Höhe» mit drei Höhen.',
    'Open «Choose places and peaks» and tap «Davos» and a peak: each gets its own table.': 'Öffne «Orte und Gipfel wählen» und tippe auf «Davos» und einen Gipfel: Jeder bekommt eine eigene Tabelle.',
    'Add a place of your own, rename it, delete it and tap «Undo».': 'Füge einen eigenen Ort hinzu, benenne ihn um, lösche ihn und tippe auf «Rückgängig».',
  },
};
