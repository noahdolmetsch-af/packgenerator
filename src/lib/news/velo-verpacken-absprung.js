// «Velos-Pflege einbauen» (Noah 03.11.2026 «3a»): «Pack the bike» where a trip by train needs it
export default {
  title: 'Pack the bike for the train',
  lead: 'A trip with the arrival «train» now names «Pack the bike for the train» in its row on Bikes › Care.',
  points: [{ text: 'Bikes › Care › «Before {trip}»: «Pack the bike for the train»', go: { href: '#/bikes?tab=care', where: 'Shows in the folded row «Before …» of a trip whose arrival is «train».' } }],
  small: [],
  test: [
    'Plan a trip, set the arrival to «Train», choose a bike.',
    'Open Bikes › Care, open the row «Before …»: «Pack the bike for the train» opens the checklist.',
  ],
  since: [],
  de: {
    'Pack the bike for the train': 'Velo für den Zug verpacken',
    'A trip with the arrival «train» now names «Pack the bike for the train» in its row on Bikes › Care.': 'Eine Tour mit der Anreise «Zug» nennt jetzt «Velo für den Zug verpacken» in ihrer Zeile bei Velos › Pflege.',
    'Bikes › Care › «Before {trip}»: «Pack the bike for the train»': 'Velos › Pflege › «Vor {trip}»: «Velo für den Zug verpacken»',
    'Shows in the folded row «Before …» of a trip whose arrival is «train».': 'Steht in der eingeklappten Zeile «Vor …» einer Tour, deren Anreise «Zug» ist.',
    'Plan a trip, set the arrival to «Train», choose a bike.': 'Plane eine Tour, stelle die Anreise auf «Zug» und wähle ein Velo.',
    'Open Bikes › Care, open the row «Before …»: «Pack the bike for the train» opens the checklist.': 'Öffne Velos › Pflege und die Zeile «Vor …»: «Velo für den Zug verpacken» öffnet die Checkliste.',
  },
};
