// Fix: the test of «Temperatures by height» sets its answers before Today loads (Bündler 23.11.2026)
export default {
  title: 'Height test made steadier',
  lead: 'Only a test changed: the height card is checked in a fixed order, nothing in the app.',
  points: [{ text: 'The test of the height card no longer depends on how fast Today loads', go: null }],
  test: ['Open Weather and look at the card «Temperatures by height»: it shows the same as before.', 'Open Today: nothing changed.'],
  de: {
    'Height test made steadier': 'Höhen-Test stabiler',
    'Only a test changed: the height card is checked in a fixed order, nothing in the app.': 'Nur ein Test hat sich geändert: die Höhen-Karte wird in fester Reihenfolge geprüft, in der App ändert sich nichts.',
    'The test of the height card no longer depends on how fast Today loads': 'Der Test der Höhen-Karte hängt nicht mehr davon ab, wie schnell Heute lädt',
    'Open Weather and look at the card «Temperatures by height»: it shows the same as before.': 'Öffne Wetter und schau die Karte «Temperaturen nach Höhe» an: sie zeigt dasselbe wie vorher.',
    'Open Today: nothing changed.': 'Öffne Heute: nichts hat sich geändert.',
  },
};
