// Fix: on a narrow phone the small line (type and km) of a bike card was cut off with «…»; now it wraps.
export default {
  title: 'Bike cards show the full line',
  lead: 'On narrow phones the type and km of a bike are no longer cut off.',
  points: [{ text: 'Type and km on a bike card wrap to a second line instead of being cut off', href: '#/bikes', go: { href: '#/bikes', where: 'On Velos: the line with type and km under the bike name is complete.' } }],
  small: [],
  test: ['Open Velos on a phone: under each bike name the type and km are fully readable.', 'Rotate or narrow the window: the line wraps, nothing is cut with «…».'],
  since: [],
  de: {
    'On Velos: the line with type and km under the bike name is complete.': 'Auf Velos: die Zeile mit Typ und km unter dem Velo-Namen ist vollständig.',
    'Bike cards show the full line': 'Velo-Karten zeigen die ganze Zeile',
    'On narrow phones the type and km of a bike are no longer cut off.': 'Auf schmalen Handys werden Typ und km eines Velos nicht mehr abgeschnitten.',
    'Type and km on a bike card wrap to a second line instead of being cut off': 'Typ und km auf der Velo-Karte brechen in die zweite Zeile um, statt abgeschnitten zu werden',
    'Open Velos on a phone: under each bike name the type and km are fully readable.': 'Öffne Velos auf dem Handy: unter jedem Velo-Namen sind Typ und km ganz lesbar.',
    'Rotate or narrow the window: the line wraps, nothing is cut with «…».': 'Drehe das Handy oder mache das Fenster schmal: die Zeile bricht um, nichts wird mit «…» abgeschnitten.',
  },
};
