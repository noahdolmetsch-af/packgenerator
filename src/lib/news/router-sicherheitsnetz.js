// Router-Sicherheitsnetz (Noah 05.11.2026 «ok bauen», Thread «Verbessern: Routing und Navigation»): the bike router can no longer spin for ever
export default {
  title: 'The bike router answers or says why not',
  lead: 'When the bike router is slow, far away or offline, the app now stops after 15 seconds and tells you what to do.',
  points: [
    { text: 'A time limit, one more try after a quick failure, and clear words: busy, too far, too slow, offline', href: '#/live', go: 'f.live' },
    { text: 'The same question within ten minutes is answered from memory, even without internet', href: '#/live', go: 'f.live' },
    { text: 'A line says that your position goes to brouter.de, which keeps requests for two weeks', href: '#/live', go: 'f.live' },
  ],
  small: [{ box: 'new', text: 'The surprise round and the round through a place use the same safety net', go: 'f.live' }],
  test: ['On the live map open «⋯ › Plan a new way to …»: under the list a line says what the router gets.', 'Switch off the internet and tap «Plan»: the answer is «Offline: a new way needs the internet» at once.'],
  since: [],
  de: {
    'The bike router answers or says why not': 'Der Velo-Router antwortet oder sagt, warum nicht',
    'When the bike router is slow, far away or offline, the app now stops after 15 seconds and tells you what to do.': 'Ist der Velo-Router langsam, zu weit weg oder offline, hört die App nach 15 Sekunden auf und sagt dir, was du tun kannst.',
    'A time limit, one more try after a quick failure, and clear words: busy, too far, too slow, offline': 'Ein Zeitlimit, ein zweiter Versuch nach einem schnellen Fehler und klare Worte: ausgelastet, zu weit, zu langsam, offline',
    'The same question within ten minutes is answered from memory, even without internet': 'Dieselbe Frage innerhalb von zehn Minuten wird aus dem Gedächtnis beantwortet, auch ohne Internet',
    'A line says that your position goes to brouter.de, which keeps requests for two weeks': 'Eine Zeile sagt, dass dein Standort an brouter.de geht, das Anfragen zwei Wochen aufbewahrt',
    'The surprise round and the round through a place use the same safety net': 'Die Überraschungsrunde und die Runde durch einen Ort nutzen dasselbe Sicherheitsnetz',
    'On the live map open «⋯ › Plan a new way to …»: under the list a line says what the router gets.': 'Auf der Live-Karte «⋯ › Neu planen zu …» öffnen: Eine Zeile sagt, was der Router bekommt.',
    'Switch off the internet and tap «Plan»: the answer is «Offline: a new way needs the internet» at once.': 'Internet ausschalten und «Planen» tippen: Die Antwort ist sofort «Offline: Ein neuer Weg braucht Internet».',
  },
};
