// «Zurück zu Heute» (UI-Prüfung 07.11.2026, Noah «4a»): the page of a value in Analyse leads back to the page you came from
export default {
  title: 'Back to where you came from',
  lead: 'The page of a value in Analyse now has «Back to Heute» (or Aktiv, Touren …) at the top left, when you came from there.',
  points: [{ text: 'Open a value from Heute or Aktiv: «Back to …» leads back to that page', go: { href: '#/auswerten/analyse/rhr', where: 'Analyse › any value, top left above the title. It shows when you came from Heute, Aktiv, Touren or another place, not from Auswerten itself.' } }],
  small: [],
  test: ['Open any page outside Auswerten (for example Heute), then a value of Analyse by a link or tile: top left it says «Back to Heute».', 'Tap it: you are back on that page.'],
  since: [],
  de: {
    'Back to where you came from': 'Zurück dahin, woher du kamst',
    'The page of a value in Analyse now has «Back to Heute» (or Aktiv, Touren …) at the top left, when you came from there.': 'Die Seite eines Werts in der Analyse hat jetzt oben links «Zurück zu Heute» (oder Aktiv, Touren …), wenn du von dort kamst.',
    'Open a value from Heute or Aktiv: «Back to …» leads back to that page': 'Öffne einen Wert von Heute oder Aktiv aus: «Zurück zu …» führt auf diese Seite zurück',
    'Analyse › any value, top left above the title. It shows when you came from Heute, Aktiv, Touren or another place, not from Auswerten itself.': 'Analyse › ein beliebiger Wert, oben links über dem Titel. Es erscheint, wenn du von Heute, Aktiv, Touren oder einem anderen Ort kamst, nicht von Auswerten selbst.',
    'Open any page outside Auswerten (for example Heute), then a value of Analyse by a link or tile: top left it says «Back to Heute».': 'Öffne eine Seite ausserhalb von Auswerten (zum Beispiel Heute), dann einen Wert der Analyse über einen Link oder eine Kachel: oben links steht «Zurück zu Heute».',
    'Tap it: you are back on that page.': 'Tippe darauf: du bist wieder auf dieser Seite.',
  },
};
