// «Pfad nennt auch die Seite unter dem Reiter» (thread «Navigation ohne Sackgassen», Fix nach «Pfad aus einer Quelle»)
export default {
  title: 'The path names the page under the tab too',
  lead: 'Under Week › Training the path says «Recovery» again, not only «Training».',
  points: [
    { text: 'Pages under a tab with several pages (Training: Plan, Sports, Recovery) show that page in the path again', go: { href: '#/flow/rest', where: 'Week › Training › Recovery: the path reads «Week › Training › Recovery».' } },
  ],
  small: [{ box: 'new', text: '«What does me good» now starts with «Week › Training › Recovery»' }],
  test: [
    'Open Week › Training › Recovery: the path reads «Week › Training › Recovery».',
    'Open «What does me good» from Recovery: the path starts with the same three names.',
  ],
  since: [],
  de: {
    'The path names the page under the tab too': 'Der Pfad nennt auch die Seite unter dem Reiter',
    'Under Week › Training the path says «Recovery» again, not only «Training».': 'Unter Woche › Training steht im Pfad wieder «Erholung», nicht nur «Training».',
    'Pages under a tab with several pages (Training: Plan, Sports, Recovery) show that page in the path again': 'Seiten unter einem Reiter mit mehreren Seiten (Training: Plan, Sport, Erholung) zeigen diese Seite im Pfad wieder',
    'Week › Training › Recovery: the path reads «Week › Training › Recovery».': 'Woche › Training › Erholung: der Pfad lautet «Woche › Training › Erholung».',
    '«What does me good» now starts with «Week › Training › Recovery»': '«Was mir gut tut» beginnt jetzt mit «Woche › Training › Erholung»',
    'Open Week › Training › Recovery: the path reads «Week › Training › Recovery».': 'Öffne Woche › Training › Erholung: Der Pfad lautet «Woche › Training › Erholung».',
    'Open «What does me good» from Recovery: the path starts with the same three names.': 'Öffne «Was mir gut tut» von Erholung aus: Der Pfad beginnt mit denselben drei Namen.',
  },
};
