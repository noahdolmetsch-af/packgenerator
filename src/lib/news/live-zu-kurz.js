// Noah 28.10.2026 «nicht speichern, klar melden, kann zu testzwecken umgangen werden (trotzdem speichern)».
export default {
  title: 'Too short: said clearly',
  lead: 'A ride with fewer than 2 GPS points is not kept, and a window says so. «Save anyway» keeps it all the same.',
  points: [{ text: 'A window says why a ride was not saved, with a tip', href: '#/live', go: 'f.live' }],
  small: [{ box: 'nicer', text: '«Save anyway» for tests', go: 'f.live' }],
  test: ['Start a ride indoors and end it at once: the window «Not saved» says how many GPS points there were.', 'Tap «Save anyway»: the ride is in Trips.'],
  since: [],
  de: {
    'Too short: said clearly': 'Zu kurz: klar gesagt',
    'A ride with fewer than 2 GPS points is not kept, and a window says so. «Save anyway» keeps it all the same.': 'Eine Fahrt mit weniger als 2 GPS-Punkten wird nicht gespeichert, und ein Fenster sagt es. «Trotzdem speichern» legt sie trotzdem ab.',
    'A window says why a ride was not saved, with a tip': 'Ein Fenster sagt, warum eine Fahrt nicht gespeichert wurde, mit Tipp',
    '«Save anyway» for tests': '«Trotzdem speichern» zum Testen',
    'Start a ride indoors and end it at once: the window «Not saved» says how many GPS points there were.': 'Drinnen eine Fahrt starten und gleich beenden: Das Fenster «Nicht gespeichert» sagt, wie viele GPS-Punkte es gab.',
    'Tap «Save anyway»: the ride is in Trips.': '«Trotzdem speichern» antippen: Die Fahrt ist in Touren.',
  },
};
