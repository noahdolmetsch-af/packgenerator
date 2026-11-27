// «Touren: laufende Tour zuerst» (impeccable F2, Noah «1-5a» 24.11.2026): the band of the running trip stands first; «Upload ride» goes under «Planned».
export default {
  title: 'Trips: the running trip first',
  lead: 'On the overview of Trips the band «On the way» stands right under the title, so the running trip is the first thing you see.',
  points: [
    { text: 'The band of the running trip («On the way · day 2 of 3») stands right under the title, before the cards and «Planned»', go: { href: '#/trips', steps: [{ sel: '[data-pack-band]' }], where: 'Trips, when a trip is running or being packed' } },
    { text: '«Upload ride» is a quiet link under «Planned»; «New: every trip has a sport» waits at the end of the page', go: { href: '#/trips', steps: [{ sel: '[data-trips-quiet]' }], where: 'Trips, under «Planned»' } },
  ],
  test: [
    'Open Trips: with a trip that is running or being packed, its band stands right under the title.',
    'Scroll to «Planned»: «Upload ride» stands there as a quiet link; a tap opens it.',
  ],
  since: [],
  de: {
    'Trips: the running trip first': 'Touren: die laufende Tour zuerst',
    'On the overview of Trips the band «On the way» stands right under the title, so the running trip is the first thing you see.': 'Auf der Übersicht von Touren steht das Band «Unterwegs» direkt unter dem Titel, die laufende Tour ist das Erste, was du siehst.',
    'The band of the running trip («On the way · day 2 of 3») stands right under the title, before the cards and «Planned»': 'Das Band der laufenden Tour («Unterwegs · Tag 2 von 3») steht direkt unter dem Titel, vor den Karten und «Geplant»',
    'Trips, when a trip is running or being packed': 'Touren, wenn eine Tour läuft oder gepackt wird',
    '«Upload ride» is a quiet link under «Planned»; «New: every trip has a sport» waits at the end of the page': '«Fahrt hochladen» ist ein ruhiger Link unter «Geplant»; «Neu: Jede Tour hat eine Sportart» wartet am Seitenende',
    'Trips, under «Planned»': 'Touren, unter «Geplant»',
    'Open Trips: with a trip that is running or being packed, its band stands right under the title.': 'Touren öffnen: bei einer Tour, die läuft oder gepackt wird, steht ihr Band direkt unter dem Titel.',
    'Scroll to «Planned»: «Upload ride» stands there as a quiet link; a tap opens it.': 'Zu «Geplant» scrollen: «Fahrt hochladen» steht dort als ruhiger Link; ein Tipp öffnet ihn.',
  },
};
