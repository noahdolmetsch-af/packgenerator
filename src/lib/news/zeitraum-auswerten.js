// «Zeitraum» on Auswerten (Noah 05.11.2026 «Idee B: 1a 2b 3a 4a»): one switch on top that the lists of the place follow
export default {
  title: 'One period for Analysis',
  lead: 'On Analysis one switch on top sets the period: week, month, year, everything or your own range.',
  points: [
    { text: 'Week, Month and Year can be paged back with ‹ ›; «Everything» and «Own range» are there too', go: { href: '#/auswerten', steps: [{ sel: '[data-period-bar]' }] } },
    { text: 'The list of your sports and the averages of «Your questions» follow the period; the cards of today say they do not', go: { href: '#/auswerten', steps: [{ sel: '[data-period-hint]' }] } },
  ],
  small: [{ box: 'new', text: 'Your choice is remembered on this device; paging back starts at the present again' }],
  test: ['Open Analysis: on top the switch shows «Week». Tap «Month»: the list below is named after the month.', 'Tap ‹: the month before. Tap «Everything»: the list covers all you recorded.'],
  since: [],
  de: {
    'One period for Analysis': 'Ein Zeitraum für Auswerten',
    'On Analysis one switch on top sets the period: week, month, year, everything or your own range.': 'Auf Auswerten stellt ein Schalter oben den Zeitraum ein: Woche, Monat, Jahr, Alles oder ein eigener Zeitraum.',
    'Week, Month and Year can be paged back with ‹ ›; «Everything» and «Own range» are there too': 'Woche, Monat und Jahr lassen sich mit ‹ › zurückblättern; «Alles» und «Eigener Zeitraum» gibt es auch',
    'The list of your sports and the averages of «Your questions» follow the period; the cards of today say they do not': 'Die Liste deiner Sportarten und die Mittelwerte bei «Wi gaht\'s?» folgen dem Zeitraum; die Karten von heute sagen, dass sie es nicht tun',
    'Your choice is remembered on this device; paging back starts at the present again': 'Deine Wahl wird auf diesem Gerät gemerkt; das Zurückblättern beginnt wieder bei heute',
    'Open Analysis: on top the switch shows «Week». Tap «Month»: the list below is named after the month.': 'Öffne Auswerten: Oben zeigt der Schalter «Woche». Tippe «Monat»: Die Liste darunter heisst nach dem Monat.',
    'Tap ‹: the month before. Tap «Everything»: the list covers all you recorded.': 'Tippe ‹: der Monat davor. Tippe «Alles»: Die Liste umfasst alles, was du erfasst hast.',
  },
};
