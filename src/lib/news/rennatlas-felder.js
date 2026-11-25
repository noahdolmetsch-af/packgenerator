// Rennatlas: mehr Angaben pro Rennen (Noah 25.11.2026, «alle neuen rennen in die app integrieren»)
export default {
  title: 'More facts for every race of the race atlas',
  lead: 'The window of a race now shows the support, the registration deadline, the last edition and two more links, and a climb that is only an estimate says so.',
  points: [
    { text: 'Race atlas › open a race: support, registration deadline, last edition and the links «Last edition» and «More information» are there when your file has them', go: { href: '#/race', steps: [{ text: 'Open the race atlas' }] } },
    { text: 'A climb taken from last year reads «about … m up» with the reason under it; the list says «about» too', go: { href: '#/race', steps: [{ text: 'Open the race atlas' }] } },
  ],
  test: [
    'Go to Trips › Races › «Race atlas» (with your file loaded) and open a race with an estimated climb.',
    'The climb reads «about … m up» with the reason under it.',
    'Further down, the links «Last edition» and «More information» open the organiser pages.',
  ],
  since: [],
  de: {
    'More facts for every race of the race atlas': 'Mehr Angaben zu jedem Rennen im Rennatlas',
    'The window of a race now shows the support, the registration deadline, the last edition and two more links, and a climb that is only an estimate says so.': 'Das Fenster eines Rennens zeigt jetzt die Unterstützung, die Anmeldefrist, die letzte Ausgabe und zwei weitere Links, und Höhenmeter, die nur geschätzt sind, sagen das.',
    'Race atlas › open a race: support, registration deadline, last edition and the links «Last edition» and «More information» are there when your file has them': 'Rennatlas › ein Rennen öffnen: Unterstützung, Anmeldefrist, letzte Ausgabe und die Links «Letzte Ausgabe» und «Weitere Informationen» stehen da, wenn deine Datei sie hat',
    'A climb taken from last year reads «about … m up» with the reason under it; the list says «about» too': 'Höhenmeter vom Vorjahr stehen als «ca. … Hm» mit dem Grund darunter; die Liste sagt auch «ca.»',
    'Go to Trips › Races › «Race atlas» (with your file loaded) and open a race with an estimated climb.': 'Geh zu Touren › Rennen › «Rennatlas» (mit geladener Datei) und öffne ein Rennen mit geschätzten Höhenmetern.',
    'The climb reads «about … m up» with the reason under it.': 'Die Höhenmeter stehen als «ca. … Hm» mit dem Grund darunter.',
    'Further down, the links «Last edition» and «More information» open the organiser pages.': 'Weiter unten öffnen die Links «Letzte Ausgabe» und «Weitere Informationen» die Seiten der Veranstalter.',
  },
};
