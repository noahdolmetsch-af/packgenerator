// «Warteliste» (Noah 04.11.2026 «7a»): wer auf eine volle Zeit wartet, steht auf der Liste; Heute meldet, wenn ein Platz frei wird
export default {
  title: 'Waiting list for full times',
  lead: 'Put people on a waiting list for a full time; when a place is free, Heute tells you and a message is ready.',
  points: [{ text: 'Open a full time and add someone to «Waiting list»; when a place is free again, Heute shows «Place free» with a ready message to write', go: { href: '#/me/offers', steps: [{ text: 'Open an offer and tap a full time' }], where: 'Me › Offers › your offer › a full time › Waiting list.' } }],
  small: [],
  test: [
    'Open a full time (all places booked): under «Waiting list» enter a name and tap «Put on the waiting list».',
    'Cancel one booking of that time: Heute shows «Place free» with a «Write» button.',
  ],
  since: [],
  de: {
    'Waiting list for full times': 'Warteliste für volle Zeiten',
    'Put people on a waiting list for a full time; when a place is free, Heute tells you and a message is ready.': 'Setze Leute für eine volle Zeit auf eine Warteliste; wird ein Platz frei, sagt dir Heute Bescheid und eine Nachricht ist bereit.',
    'Open a full time and add someone to «Waiting list»; when a place is free again, Heute shows «Place free» with a ready message to write': 'Öffne eine volle Zeit und setze jemanden auf die «Warteliste»; wird wieder ein Platz frei, zeigt Heute «Platz frei» mit einer fertigen Nachricht zum Schreiben',
    'Open an offer and tap a full time': 'Öffne ein Angebot und tippe eine volle Zeit an',
    'Me › Offers › your offer › a full time › Waiting list.': 'Ich › Angebote › dein Angebot › eine volle Zeit › Warteliste.',
    'Open a full time (all places booked): under «Waiting list» enter a name and tap «Put on the waiting list».': 'Öffne eine volle Zeit (alle Plätze gebucht): gib unter «Warteliste» einen Namen ein und tippe «Auf die Warteliste setzen».',
    'Cancel one booking of that time: Heute shows «Place free» with a «Write» button.': 'Sage eine Buchung dieser Zeit ab: Heute zeigt «Platz frei» mit einem Knopf «Schreiben».',
  },
};
