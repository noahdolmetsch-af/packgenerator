// Mini-Tools «Wann muss ich losfahren?» (Noah 28.10.2026 «1b 2a 3a», idea 10)
export default {
  title: 'When do I leave?',
  lead: 'Everybody starts somewhere else; the app says when each one leaves so you all arrive together.',
  points: [{ text: 'Me › Mini tools › When do I leave?: meeting point, time, start places', href: '#/me/mini/abfahrt', go: 'f.miniabfahrt' }],
  small: [
    { box: 'new', go: 'f.miniabfahrt', text: 'Each person with their own speed and buffer' },
    { box: 'new', go: 'f.miniabfahrt', text: 'Send the plan to the group in one tap' },
  ],
  test: [
    'Open Me › Mini tools › When do I leave? and tap «New meeting».',
    'Search «Olten» as the meeting point and set 09:00.',
    'Add a person, search «Aarau» as the start place: a departure time before 09:00 appears.',
  ],
  since: ['f.miniabfahrt'],
  de: {
    'Everybody starts somewhere else; the app says when each one leaves so you all arrive together.': 'Alle starten woanders; die App sagt, wann wer losfährt, damit ihr gleichzeitig ankommt.',
    'Me › Mini tools › When do I leave?: meeting point, time, start places': 'Ich › Mini-Tools › Wann muss ich losfahren?: Treffpunkt, Zeit, Startorte',
    'Each person with their own speed and buffer': 'Jede Person mit eigenem Tempo und Puffer',
    'Send the plan to the group in one tap': 'Den Plan mit einem Tipp an die Gruppe schicken',
    'Open Me › Mini tools › When do I leave? and tap «New meeting».': 'Öffne Ich › Mini-Tools › Wann muss ich losfahren? und tipp «Neues Treffen».',
    'Search «Olten» as the meeting point and set 09:00.': 'Such «Olten» als Treffpunkt und stell 09:00 ein.',
    'Add a person, search «Aarau» as the start place: a departure time before 09:00 appears.': 'Füge eine Person hinzu und such «Aarau» als Startort: eine Abfahrtszeit vor 09:00 erscheint.',
  },
};
