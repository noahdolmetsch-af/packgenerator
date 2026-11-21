// «Meilensteine motivierender» PR 1 (Noah 21.11.2026 «1-5 a», Idee 1 «a»): «Dein nächster Stern» ganz oben
export default {
  title: 'Your next star',
  lead: 'On top of Milestones one big card shows the star that is closest.',
  points: [
    { text: 'The card shows how much is missing and what your weekly plan has for it', go: { href: '#/flow/milestones', steps: [{ sel: '[data-hero]' }] } },
    { text: 'Without a plan it names a date from your pace of the last weeks, as a guess', go: { href: '#/flow/milestones', where: 'Shows once a sport has about a week of ticks and is not in the plan.' } },
  ],
  small: [{ box: 'new', text: '«Soon within reach» sits below the card and does not repeat its star', go: { href: '#/flow/milestones', steps: [{ text: 'Soon within reach' }] } }],
  test: ['Open Auswerten › Milestones: the big card «Your next star» is on top.', 'Tap «Tick off today»: Active opens.'],
  since: [],
  de: {
    'Your next star': 'Dein nächster Stern',
    'On top of Milestones one big card shows the star that is closest.': 'Oben auf Meilensteine zeigt eine grosse Karte den Stern, der am nächsten ist.',
    'The card shows how much is missing and what your weekly plan has for it': 'Die Karte zeigt, wie viel fehlt und was dein Wochenplan dafür hat',
    'Without a plan it names a date from your pace of the last weeks, as a guess': 'Ohne Plan nennt sie ein Datum aus deinem Tempo der letzten Wochen, als Schätzung',
    'Shows once a sport has about a week of ticks and is not in the plan.': 'Erscheint, sobald eine Sportart etwa eine Woche Haken hat und nicht im Plan steht.',
    '«Soon within reach» sits below the card and does not repeat its star': '«Bald erreichbar» steht unter der Karte und wiederholt deren Stern nicht',
    'Open Auswerten › Milestones: the big card «Your next star» is on top.': 'Öffne Auswerten › Meilensteine: oben steht die grosse Karte «Dein nächster Stern».',
    'Tap «Tick off today»: Active opens.': 'Tippe auf «Heute abhaken»: Aktiv öffnet sich.',
  },
};
