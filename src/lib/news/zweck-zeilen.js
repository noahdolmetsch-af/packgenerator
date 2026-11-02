// «Zweck-Zeilen» (Noah 1.11.2026): one line on «Parts» and «My setup» says what the page is for
export default {
  title: 'What each bike page is for',
  lead: '«Parts» and «My setup» now start with one line that says what they are for.',
  points: [{ text: '«Parts» is for the components on a bike, «My setup» for how it is set up for your rides', go: { href: '#/bikes?tab=rig', steps: [{ sel: '[data-purpose="setup"]' }], where: 'Bikes › My setup and Bikes › Parts, right under the title.' } }],
  small: [],
  test: ['Open Bikes › My setup: a line under the title says what the page is for.', 'Open Bikes › Parts: the same, for the components of the bike.'],
  since: [],
  de: {
    'What each bike page is for': 'Wofür jede Velo-Seite da ist',
    '«Parts» and «My setup» now start with one line that says what they are for.': '«Teile» und «Mein Setup» beginnen jetzt mit einer Zeile, die sagt, wofür sie da sind.',
    '«Parts» is for the components on a bike, «My setup» for how it is set up for your rides': '«Teile» ist für die Bauteile am Velo, «Mein Setup» dafür, wie es für deine Fahrten eingerichtet ist',
    'Bikes › My setup and Bikes › Parts, right under the title.': 'Velos › Mein Setup und Velos › Teile, direkt unter dem Titel.',
    'Open Bikes › My setup: a line under the title says what the page is for.': 'Öffne Velos › Mein Setup: eine Zeile unter dem Titel sagt, wofür die Seite da ist.',
    'Open Bikes › Parts: the same, for the components of the bike.': 'Öffne Velos › Teile: dasselbe, für die Bauteile des Velos.',
  },
};
