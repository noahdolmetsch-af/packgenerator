// «Seiten-Chips gefüllt» (Noah 23.11.2026 «1-5 a», Design-Abgleich): the chosen page under the tabs of a place is filled
export default {
  title: 'The chosen page under the tabs is filled',
  lead: 'Under the tabs of Week, Tours, Bikes and Analysis the chip of the page you are on is now filled, like the chosen button of a switch.',
  points: [{ text: 'The page you are on stands out as a filled chip under the tabs', go: { href: '#/auswerten', steps: [{ sel: 'nav.psubs a[aria-current="page"]' }], where: 'Analysis › Overview, the two chips «Questions» and «Overview» under the tabs.' } }],
  small: [],
  test: ['Open Analysis › Overview: the chip «Overview» under the tabs is filled in the main colour.', 'Tap «Questions»: that chip is filled now and the page changes.'],
  since: [],
  de: {
    'The chosen page under the tabs is filled': 'Die gewählte Seite unter den Reitern ist gefüllt',
    'Under the tabs of Week, Tours, Bikes and Analysis the chip of the page you are on is now filled, like the chosen button of a switch.': 'Unter den Reitern von Woche, Touren, Velos und Auswerten ist der Chip der Seite, auf der du bist, jetzt gefüllt, wie das gewählte Feld eines Umschalters.',
    'The page you are on stands out as a filled chip under the tabs': 'Die Seite, auf der du bist, steht als gefüllter Chip unter den Reitern',
    'Analysis › Overview, the two chips «Questions» and «Overview» under the tabs.': 'Auswerten › Übersicht, die zwei Chips «Fragen» und «Übersicht» unter den Reitern.',
    'Open Analysis › Overview: the chip «Overview» under the tabs is filled in the main colour.': 'Öffne Auswerten › Übersicht: der Chip «Übersicht» unter den Reitern ist in der Hauptfarbe gefüllt.',
    'Tap «Questions»: that chip is filled now and the page changes.': 'Tippe «Fragen»: dieser Chip ist jetzt gefüllt und die Seite wechselt.',
  },
};
