// Reserve-Router (Noah 05.11.2026 «2a und b», Thread «Verbessern: Routing und Navigation»): when brouter.de does not answer, a reserve router plans the way
export default {
  title: 'A reserve when the bike router is down',
  lead: 'If brouter.de does not answer, the app asks one reserve router once and says so.',
  points: [
    { text: 'The way comes from a reserve router (Valhalla, then OSRM) instead of an error', href: '#/live', go: 'f.live' },
    { text: 'A line on the way says that a reserve planned it, can differ and gives no climb', href: '#/live', go: 'f.live' },
  ],
  small: [{ box: 'new', text: 'The note about your position names the reserve routers too', go: 'f.live' }],
  test: ['On the live map open «⋯ › Plan a new way to …»: the note under the list also names the reserve routers.', 'The reserve is only asked when brouter.de fails, so it shows only on a bad day: then the way card carries the line «The usual bike router did not answer».'],
  since: [],
  de: {
    'A reserve when the bike router is down': 'Eine Reserve, wenn der Velo-Router ausfällt',
    'If brouter.de does not answer, the app asks one reserve router once and says so.': 'Antwortet brouter.de nicht, fragt die App einmal einen Reserve-Router und sagt es dir.',
    'The way comes from a reserve router (Valhalla, then OSRM) instead of an error': 'Der Weg kommt von einem Reserve-Router (Valhalla, dann OSRM) statt einer Fehlermeldung',
    'A line on the way says that a reserve planned it, can differ and gives no climb': 'Eine Zeile beim Weg sagt, dass eine Reserve ihn geplant hat, er abweichen kann und keine Höhenmeter hat',
    'The note about your position names the reserve routers too': 'Der Hinweis zu deinem Standort nennt auch die Reserve-Router',
    'On the live map open «⋯ › Plan a new way to …»: the note under the list also names the reserve routers.': 'Auf der Live-Karte «⋯ › Neu planen zu …» öffnen: Der Hinweis unter der Liste nennt auch die Reserve-Router.',
    'The reserve is only asked when brouter.de fails, so it shows only on a bad day: then the way card carries the line «The usual bike router did not answer».': 'Die Reserve wird nur gefragt, wenn brouter.de ausfällt, du siehst sie also nur an einem schlechten Tag: Dann trägt die Wegkarte die Zeile «Der gewohnte Velo-Router hat nicht geantwortet».',
  },
};
