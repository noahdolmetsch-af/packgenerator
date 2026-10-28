// Auffälligkeiten 28.10.2026 (Noah «1a»): «Tour beenden …» always as a visible button at the bottom of Unterwegs
export default {
  title: 'End the trip, easy to find',
  lead: '«End the trip …» is a button at the bottom of On the way, before you set off too.',
  points: [{ text: 'On the way: «End the trip …» at the bottom of the page, no longer in «…»', href: '#/ride', go: 'f.finish' }],
  test: ['Open On the way on a trip day before «Start riding»: at the bottom of the page «End the trip …» shows.', 'Tap it: the app asks first; «Ride on» closes the question.'],
  de: {
    'End the trip, easy to find': 'Tour beenden, leicht zu finden',
    '«End the trip …» is a button at the bottom of On the way, before you set off too.': '«Tour beenden …» ist ein Knopf unten auf Unterwegs, auch vor dem Losfahren.',
    'On the way: «End the trip …» at the bottom of the page, no longer in «…»': 'Unterwegs: «Tour beenden …» unten auf der Seite, nicht mehr im «…»',
    'Open On the way on a trip day before «Start riding»: at the bottom of the page «End the trip …» shows.': 'Öffne Unterwegs an einem Tour-Tag vor «Losfahren»: unten auf der Seite steht «Tour beenden …».',
    'Tap it: the app asks first; «Ride on» closes the question.': 'Tippe darauf: die App fragt zuerst; «Weiterfahren» schliesst die Frage.',
  },
};
