// «Das Velo zeigt seine Pflege» (Noah 03.11.2026 «b», Paket C «Das Velo lebt», Idee 22)
export default {
  title: 'Your bike shows its care',
  lead: 'On the bike cards a small drawn bike gleams after care and gets dusty when no care is recorded for long.',
  points: [
    { text: 'Bikes: the card of each bike shows a drawn bike; it gleams for a week after a wash, an oiling or a service', go: { href: '#/bikes', steps: [{ sel: '[data-velo-card]' }] } },
    { text: 'No care recorded for 45 days: dust on the bike; after 90 days a cobweb hangs on the wheel', go: { href: '#/bikes', where: 'Bikes: on the card of a bike without any recorded care for a long time.' } },
  ],
  small: [{ box: 'new', text: 'Without any record the bike looks normal, never dusty' }],
  test: ['Open Bikes: every bike card shows a small drawn bike.', 'Log a care step for a bike (washed, chain oiled or a service), then open Bikes: its drawing gleams and the card says «Cared for lately».', 'A bike with no care for a long time shows dust and says for how many days.'],
  since: [],
  de: {
    'Your bike shows its care': 'Dein Velo zeigt seine Pflege',
    'On the bike cards a small drawn bike gleams after care and gets dusty when no care is recorded for long.': 'Auf den Velo-Karten glänzt ein kleines gezeichnetes Velo nach der Pflege und staubt ein, wenn lange keine Pflege eingetragen ist.',
    'Bikes: the card of each bike shows a drawn bike; it gleams for a week after a wash, an oiling or a service': 'Velos: Die Karte jedes Velos zeigt ein gezeichnetes Velo; es glänzt eine Woche lang nach Putzen, Ölen oder Service',
    'No care recorded for 45 days: dust on the bike; after 90 days a cobweb hangs on the wheel': 'Seit 45 Tagen keine Pflege eingetragen: Staub auf dem Velo; nach 90 Tagen hängt eine Spinnwebe am Rad',
    'Bikes: on the card of a bike without any recorded care for a long time.': 'Velos: auf der Karte eines Velos, bei dem lange keine Pflege eingetragen ist.',
    'Without any record the bike looks normal, never dusty': 'Ohne Eintrag sieht das Velo normal aus, nie staubig',
    'Open Bikes: every bike card shows a small drawn bike.': 'Öffne Velos: Jede Velo-Karte zeigt ein kleines gezeichnetes Velo.',
    'Log a care step for a bike (washed, chain oiled or a service), then open Bikes: its drawing gleams and the card says «Cared for lately».': 'Trage bei einem Velo einen Pflegeschritt ein (geputzt, Kette geölt oder Service) und öffne dann Velos: Seine Zeichnung glänzt und die Karte sagt «Zuletzt gepflegt».',
    'A bike with no care for a long time shows dust and says for how many days.': 'Ein Velo ohne Pflege seit langer Zeit zeigt Staub und sagt, seit wie vielen Tagen.',
  },
};
