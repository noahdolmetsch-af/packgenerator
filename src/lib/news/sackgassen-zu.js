// «Keine Sackgassen bei Rennen und Unterwegs» (thread «Navigation ohne Sackgassen», Noah 23.11.2026 «ja»)
export default {
  title: 'No more dead ends on Races and On the way',
  lead: 'A race that is gone now says so, and On the way without a trip leads to the trips.',
  points: [
    { text: 'A race that was deleted or is on another device says «This race is not here» and leads back to the races, instead of loading for ever', go: { href: '#/race', where: 'Trips › Races: open a link to a race that no longer exists.' } },
    { text: 'On the way with no trip yet has a second button «To the trips»', go: { href: '#/ride', where: 'Trips › On the way, while no trip exists.' } },
  ],
  small: [],
  test: [
    'Open a link to a race that was deleted: the page says «This race is not here» and «To the races» leads back.',
    'On a new device without trips open «On the way»: next to «Create a trip» a button «To the trips» opens the trips.',
  ],
  since: [],
  de: {
    'No more dead ends on Races and On the way': 'Keine Sackgassen mehr bei Rennen und Unterwegs',
    'A race that is gone now says so, and On the way without a trip leads to the trips.': 'Ein Rennen, das es nicht mehr gibt, sagt es jetzt, und Unterwegs ohne Tour führt zu den Touren.',
    'A race that was deleted or is on another device says «This race is not here» and leads back to the races, instead of loading for ever': 'Ein Rennen, das gelöscht wurde oder auf einem anderen Gerät liegt, sagt «Dieses Rennen ist nicht da» und führt zurück zu den Rennen, statt ewig zu laden',
    'Trips › Races: open a link to a race that no longer exists.': 'Touren › Rennen: einen Link zu einem Rennen öffnen, das es nicht mehr gibt.',
    'On the way with no trip yet has a second button «To the trips»': 'Unterwegs ohne Tour hat einen zweiten Knopf «Zu den Touren»',
    'Trips › On the way, while no trip exists.': 'Touren › Unterwegs, solange es keine Tour gibt.',
    'Open a link to a race that was deleted: the page says «This race is not here» and «To the races» leads back.': 'Öffne einen Link zu einem gelöschten Rennen: Die Seite sagt «Dieses Rennen ist nicht da», und «Zu den Rennen» führt zurück.',
    'On a new device without trips open «On the way»: next to «Create a trip» a button «To the trips» opens the trips.': 'Öffne auf einem neuen Gerät ohne Touren «Unterwegs»: Neben «Tour anlegen» öffnet ein Knopf «Zu den Touren» die Touren.',
  },
};
