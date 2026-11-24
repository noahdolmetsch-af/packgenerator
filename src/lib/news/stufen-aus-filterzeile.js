// «Aktionen in Auswerten» (Noah 23.11.2026 «1-5a», 5a), Teil 5: «Stufen ändern» ist nicht mehr in der Filterzeile der Meilensteine
export default {
  title: 'Milestones: a calmer filter row',
  lead: 'The filter row of «Milestones» shows only the sports; «Change numbers and stages» sits at the end of the page.',
  points: [
    { text: '«Milestones» no longer has a «Change stages» button next to the sport filters; «Change numbers and stages» at the end of the page does the same', go: { href: '#/flow/milestones', where: 'Scroll to the end of «Milestones»: «Change numbers and stages» opens the numbers.' } },
  ],
  small: [],
  test: [
    'Open «Milestones»: the filter row shows only the sports.',
    'Scroll to the end and open «Change numbers and stages»: the numbers can be changed there.',
  ],
  since: [],
  de: {
    'Milestones: a calmer filter row': 'Meilensteine: eine ruhigere Filterzeile',
    'The filter row of «Milestones» shows only the sports; «Change numbers and stages» sits at the end of the page.': 'Die Filterzeile der «Meilensteine» zeigt nur noch die Sportarten; «Zahlen und Stufen ändern» steht am Seitenende.',
    '«Milestones» no longer has a «Change stages» button next to the sport filters; «Change numbers and stages» at the end of the page does the same': 'Bei den «Meilensteinen» steht neben den Sportarten kein Knopf «Stufen ändern» mehr; «Zahlen und Stufen ändern» am Seitenende tut dasselbe',
    'Scroll to the end of «Milestones»: «Change numbers and stages» opens the numbers.': 'Scrolle ans Ende der «Meilensteine»: «Zahlen und Stufen ändern» öffnet die Zahlen.',
    'Open «Milestones»: the filter row shows only the sports.': 'Öffne «Meilensteine»: Die Filterzeile zeigt nur die Sportarten.',
    'Scroll to the end and open «Change numbers and stages»: the numbers can be changed there.': 'Scrolle ans Ende und öffne «Zahlen und Stufen ändern»: Dort lassen sich die Zahlen ändern.',
  },
};
