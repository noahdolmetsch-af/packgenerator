// «Aktivität anlegen?» (Noah 21.11.2026 «4a», Thread «Sportjahr», S7): Strava sports without an activity
export default {
  title: 'Strava sports get a sport',
  lead: 'When Strava knows a sport you have no activity for, «My sports» asks once and counts the Strava activities back in time.',
  points: [
    { text: 'A card in «My sports» lists the Strava sports without an activity; «Make sport» makes it and counts the old activities', go: 'f.stravaneu' },
    { text: '«Do not ask» says no for good; both can be undone right away', go: 'f.stravaneu' },
  ],
  small: [],
  test: ['Open Active › My sports and look for the card «activities from Strava without a sport».', 'Tap «Make sport» for one and then «Undo».'],
  since: ['f.stravaneu'],
  de: {
    'Strava sports get a sport': 'Strava-Sportarten bekommen eine Sportart',
    'When Strava knows a sport you have no activity for, «My sports» asks once and counts the Strava activities back in time.': 'Wenn Strava eine Sportart kennt, für die du keine Aktivität hast, fragt «Meine Sportarten» einmal und zählt die Strava-Aktivitäten rückwirkend mit.',
    'A card in «My sports» lists the Strava sports without an activity; «Make sport» makes it and counts the old activities': 'Eine Karte in «Meine Sportarten» listet die Strava-Sportarten ohne Aktivität; «Sportart anlegen» legt sie an und zählt die alten Aktivitäten mit',
    '«Do not ask» says no for good; both can be undone right away': '«Nicht fragen» sagt für immer nein; beides lässt sich gleich rückgängig machen',
    'Open Active › My sports and look for the card «activities from Strava without a sport».': 'Öffne Aktiv › Meine Sportarten und such die Karte «Aktivitäten aus Strava ohne Sportart».',
    'Tap «Make sport» for one and then «Undo».': 'Tippe bei einer auf «Sportart anlegen» und dann auf «Rückgängig».',
  },
};
