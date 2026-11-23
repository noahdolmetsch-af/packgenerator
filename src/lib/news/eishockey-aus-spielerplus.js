// «Eishockey aus Spielerplus» (Noah 23.11.2026 «1a», Thread «Wochenplan-Vorschläge verlässlich machen»)
export default {
  title: 'Ice hockey comes from Spielerplus',
  lead: 'When your Spielerplus calendar is connected, its dates are the ice hockey of the week. The plan adds none of its own.',
  points: [
    { text: 'In Training › Week and in the weekly plan the dates of your Spielerplus calendar (training and game) are the ice hockey; there is no extra Sunday unit any more', go: { href: '#/flow/wochenplan', where: 'Training › Weekly plan, with a Spielerplus calendar connected in Me › Connections.' } },
    { text: 'A week without a date has no ice hockey; the plan says so under the hours', go: { href: '#/flow/wochenplan', where: 'Training › Weekly plan, next week without a team date.' } },
  ],
  small: [{ box: 'new', text: 'The dates now count for hard days, overlaps and the ski tour week; in Training › Week they carry the name of the team' }],
  test: [
    'Open Training › Weekly plan with a Spielerplus calendar connected: under the hours it says that the ice hockey comes from the calendar.',
    'Look at Training › Week: the team dates stand on their days, and there is no «Ice hockey» suggestion on Sunday as well.',
  ],
  since: [],
  de: {
    'Ice hockey comes from Spielerplus': 'Eishockey kommt aus Spielerplus',
    'When your Spielerplus calendar is connected, its dates are the ice hockey of the week. The plan adds none of its own.': 'Ist dein Spielerplus-Kalender verbunden, sind seine Termine das Eishockey der Woche. Der Plan setzt keins dazu.',
    'In Training › Week and in the weekly plan the dates of your Spielerplus calendar (training and game) are the ice hockey; there is no extra Sunday unit any more': 'In Training › Woche und im Wochenplan sind die Termine deines Spielerplus-Kalenders (Training und Spiel) das Eishockey; eine zusätzliche Einheit am Sonntag gibt es nicht mehr',
    'Training › Weekly plan, with a Spielerplus calendar connected in Me › Connections.': 'Training › Wochenplan, mit einem Spielerplus-Kalender, der unter Ich › Verbindungen verbunden ist.',
    'A week without a date has no ice hockey; the plan says so under the hours': 'Eine Woche ohne Termin hat kein Eishockey; der Plan sagt es unter den Stunden',
    'Training › Weekly plan, next week without a team date.': 'Training › Wochenplan, nächste Woche ohne Termin des Teams.',
    'The dates now count for hard days, overlaps and the ski tour week; in Training › Week they carry the name of the team': 'Die Termine zählen jetzt für harte Tage, Überschneidungen und die Skitour-Woche; in Training › Woche tragen sie den Namen des Teams',
    'Open Training › Weekly plan with a Spielerplus calendar connected: under the hours it says that the ice hockey comes from the calendar.': 'Öffne Training › Wochenplan mit verbundenem Spielerplus-Kalender: Unter den Stunden steht, dass das Eishockey aus dem Kalender kommt.',
    'Look at Training › Week: the team dates stand on their days, and there is no «Ice hockey» suggestion on Sunday as well.': 'Öffne Training › Woche: Die Termine des Teams stehen an ihren Tagen, und am Sonntag steht nicht zusätzlich ein Vorschlag «Eishockey».',
  },
};
