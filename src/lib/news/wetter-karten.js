// «Wetter oben» W2 (Noah 23.11.2026 «b»): three small cards under the weather card on Today
export default {
  title: 'Three new weather cards on Today',
  lead: 'Under the weather card: the best day of the week, the chain after rain and the ride window.',
  points: [
    { text: '«Best day to ride» names the best day of the next week for a ride of two hours, with temperature and rain', go: { href: '#/', steps: [{ sel: '[data-heute-woche]' }], where: 'Today › under the weather card, once your home place is set and the weather service has answered.' } },
    { text: 'After rain of the last 24 hours a card says «Oil the chain» and leads to the round «After the rain ride»', go: { href: '#/', steps: [{ sel: '[data-heute-kette]' }], where: 'Today › under the weather card, after at least 1 mm of rain in the last 24 hours and with a bike in the app.' } },
    { text: '«Ride window» says how long it stays dry today and until when it is light', go: { href: '#/', steps: [{ sel: '[data-heute-fenster]' }], where: 'Today › under the weather card, while it is dry and the sun has not set.' } },
  ],
  small: [],
  test: ['Open Today: under the weather card stand up to three small cards.', 'Tap «Not today» on one of them: it leaves for the rest of the day, the others stay.', 'On a day after rain tap «Oil the chain»: the round «After the rain ride» opens.'],
  since: [],
  de: {
    'Three new weather cards on Today': 'Drei neue Wetterkarten auf Heute',
    'Under the weather card: the best day of the week, the chain after rain and the ride window.': 'Unter der Wetterkarte: der beste Tag der Woche, die Kette nach dem Regen und das Fahrfenster.',
    '«Best day to ride» names the best day of the next week for a ride of two hours, with temperature and rain': '«Bester Tag zum Fahren» nennt den besten Tag der nächsten Woche für eine Fahrt von zwei Stunden, mit Temperatur und Regen',
    'Today › under the weather card, once your home place is set and the weather service has answered.': 'Heute › unter der Wetterkarte, sobald dein Wohnort gesetzt ist und der Wetterdienst geantwortet hat.',
    'After rain of the last 24 hours a card says «Oil the chain» and leads to the round «After the rain ride»': 'Nach Regen in den letzten 24 Stunden sagt eine Karte «Kette ölen» und führt zur Runde «Nach der Regenfahrt»',
    'Today › under the weather card, after at least 1 mm of rain in the last 24 hours and with a bike in the app.': 'Heute › unter der Wetterkarte, nach mindestens 1 mm Regen in den letzten 24 Stunden und mit einem Velo in der App.',
    '«Ride window» says how long it stays dry today and until when it is light': '«Fahrfenster» sagt, wie lange es heute trocken bleibt und bis wann es hell ist',
    'Today › under the weather card, while it is dry and the sun has not set.': 'Heute › unter der Wetterkarte, solange es trocken ist und die Sonne nicht untergegangen ist.',
    'Open Today: under the weather card stand up to three small cards.': 'Öffne Heute: Unter der Wetterkarte stehen bis zu drei kleine Karten.',
    'Tap «Not today» on one of them: it leaves for the rest of the day, the others stay.': 'Tippe bei einer auf «Heute nicht»: Sie geht für den Rest des Tages, die anderen bleiben.',
    'On a day after rain tap «Oil the chain»: the round «After the rain ride» opens.': 'Tippe an einem Tag nach Regen auf «Kette ölen»: Die Runde «Nach der Regenfahrt» öffnet sich.',
  },
};
