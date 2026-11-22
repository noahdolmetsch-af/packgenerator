// «Dauer nachtragen» (Noah 21.11.2026, Sportjahr S12): Haken ohne gemessene Zeit, ein Tipp schreibt die Dauer
export default {
  title: 'Add the duration',
  lead: 'Ticks without minutes count with the usual duration («ca.»). Now you can add the real length with one tap.',
  points: [
    { text: 'New list «Add the duration» in My activities: tap 15, 30, 45, 60 or type your own length, and the time counts as measured', go: { href: '#/flow/sports', steps: [{ sel: '[data-nachtragen]' }], where: 'Active › My activities: the list «Add the duration». It shows only while there are ticks without a measured time.' } },
  ],
  small: [{ box: 'new', text: 'Undo takes the minutes back' }],
  test: ['Open Active › My activities, open «Add the duration»: the ticks without a measured time are listed, newest first.', 'Tap «30 min» at one tick: it leaves the list. Tap «Undo» within a few seconds: it is back.'],
  since: [],
  de: {
    'Add the duration': 'Dauer nachtragen',
    'Ticks without minutes count with the usual duration («ca.»). Now you can add the real length with one tap.': 'Haken ohne Minuten zählen mit der üblichen Dauer («ca.»). Jetzt trägst du die echte Länge mit einem Tipp nach.',
    'New list «Add the duration» in My activities: tap 15, 30, 45, 60 or type your own length, and the time counts as measured': 'Neue Liste «Dauer nachtragen» in Meine Aktivitäten: tippe 15, 30, 45, 60 oder tippe deine eigene Länge, dann zählt die Zeit als gemessen',
    'Active › My activities: the list «Add the duration». It shows only while there are ticks without a measured time.': 'Aktiv › Meine Aktivitäten: die Liste «Dauer nachtragen». Sie erscheint nur, solange es Haken ohne gemessene Zeit gibt.',
    'Undo takes the minutes back': 'Rückgängig nimmt die Minuten wieder weg',
    'Open Active › My activities, open «Add the duration»: the ticks without a measured time are listed, newest first.': 'Öffne Aktiv › Meine Aktivitäten und «Dauer nachtragen»: die Haken ohne gemessene Zeit stehen da, die neuesten zuerst.',
    'Tap «30 min» at one tick: it leaves the list. Tap «Undo» within a few seconds: it is back.': 'Tippe bei einem Haken auf «30 Min»: er verschwindet aus der Liste. Tippe in ein paar Sekunden auf «Rückgängig»: er ist wieder da.',
  },
};
