// Auffälligkeiten 28.10.2026 (Noah «2a»): a quick-start trip gets a readable name instead of the time stamp
export default {
  title: 'Readable trip names',
  lead: 'A quick start is called «Ride Wed 28 Oct», not «202610281545».',
  points: [{ text: 'Trips: a quick-start trip has the weekday and the day as its name', href: '#/trips', go: null }],
  test: ['On Today tap «Quick start»: the new trip is called «Ride» with the weekday and the day.', 'Tap «Quick start» again on the same day: the second one gets « (2)».'],
  de: {
    'Readable trip names': 'Lesbare Tour-Namen',
    'A quick start is called «Ride Wed 28 Oct», not «202610281545».': 'Ein Schnellstart heisst «Ausfahrt Mi 28. Okt.», nicht «202610281545».',
    'Trips: a quick-start trip has the weekday and the day as its name': 'Touren: eine Schnellstart-Tour trägt Wochentag und Tag als Namen',
    'On Today tap «Quick start»: the new trip is called «Ride» with the weekday and the day.': 'Tippe auf Heute auf «Schnellstart»: die neue Tour heisst «Ausfahrt» mit Wochentag und Tag.',
    'Tap «Quick start» again on the same day: the second one gets « (2)».': 'Tippe am gleichen Tag noch einmal auf «Schnellstart»: die zweite bekommt « (2)».',
  },
};
