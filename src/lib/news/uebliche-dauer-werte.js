// «Übliche Dauer: deine Standardwerte» (Noah 21.11.2026 «Standartwert beim abhaken: eishockey 2h, tennis 1h, yoga 1h, sauna blöcke von 12 min, Gym: eGym 20 min, Laufband 20 min, laufen indoor 10 min blöcke»)
export default {
  title: 'Your usual durations',
  lead: 'Ice hockey counts 2 hours, tennis and yoga 1 hour, gym and running indoors 20 minutes, sauna 12 minutes, until you set your own.',
  points: [
    { text: 'The usual duration of these sports is already set; the editor and the list show «standard»', go: { href: '#/flow/sports', steps: [{ sel: '[data-usual-list] summary' }] } },
  ],
  small: [{ box: 'new', text: 'Your own value always wins; nothing is written into your ticks', go: { href: '#/flow/sports', steps: [{ sel: '[data-usual-list] summary' }] } }],
  test: ['On Active › My sports open the fold «Usual duration»: Ice hockey shows 120 min (standard).', 'Tap «+» next to a sport: the value is yours now; tap «Standard» to take the standard back.'],
  since: [],
  de: {
    'Your usual durations': 'Deine üblichen Dauern',
    'Ice hockey counts 2 hours, tennis and yoga 1 hour, gym and running indoors 20 minutes, sauna 12 minutes, until you set your own.': 'Eishockey zählt 2 Stunden, Tennis und Yoga 1 Stunde, Gym und Laufen indoor 20 Minuten, Sauna 12 Minuten, bis du eigene Werte einstellst.',
    'The usual duration of these sports is already set; the editor and the list show «standard»': 'Die übliche Dauer dieser Sportarten ist schon eingestellt; das Bearbeiten-Fenster und die Liste zeigen «Standard»',
    'Your own value always wins; nothing is written into your ticks': 'Dein eigener Wert gilt immer; in deine Haken wird nichts geschrieben',
    'On Active › My sports open the fold «Usual duration»: Ice hockey shows 120 min (standard).': 'Öffne auf Aktiv › Meine Sportarten die Zeile «Übliche Dauer»: Eishockey zeigt 120 min (Standard).',
    'Tap «+» next to a sport: the value is yours now; tap «Standard» to take the standard back.': 'Tippe bei einer Sportart auf «+»: der Wert gehört jetzt dir; tippe «Standard», um den Standard zurückzuholen.',
  },
};
