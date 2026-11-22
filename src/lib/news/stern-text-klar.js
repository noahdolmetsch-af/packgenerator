// «UI-Test Flow» Fund 7 (Noah 17.11.2026 «c»): the line under the tick message says which star and of what
export default {
  title: 'A clearer line under the tick message',
  lead: 'After a tick the small line now says «Noch 1× bis zum 1. Stern von «Wochen in Folge»», so you see what the star is for.',
  points: [{ text: 'The line names the star and the milestone it belongs to', go: { href: '#/flow', steps: [{ sel: 'main button.tile' }], where: 'Aktiv › Heute: tick an activity that is close to its next star.' } }],
  small: [],
  test: ['Open Aktiv › Heute and tick an activity that is one step from its next star.', 'Under «Done» a line reads «Noch 1× bis zum 1. Stern von «…»».'],
  since: [],
  de: {
    'A clearer line under the tick message': 'Eine klarere Zeile unter der Abhaken-Meldung',
    'After a tick the small line now says «Noch 1× bis zum 1. Stern von «Wochen in Folge»», so you see what the star is for.': 'Nach dem Abhaken sagt die kleine Zeile jetzt «Noch 1× bis zum 1. Stern von «Wochen in Folge»», damit du siehst, wofür der Stern ist.',
    'The line names the star and the milestone it belongs to': 'Die Zeile nennt den Stern und den Meilenstein, zu dem er gehört',
    'Aktiv › Heute: tick an activity that is close to its next star.': 'Aktiv › Heute: hake eine Aktivität ab, die kurz vor ihrem nächsten Stern steht.',
    'Open Aktiv › Heute and tick an activity that is one step from its next star.': 'Öffne Aktiv › Heute und hake eine Aktivität ab, die einen Schritt vor ihrem nächsten Stern steht.',
    'Under «Done» a line reads «Noch 1× bis zum 1. Stern von «…»».': 'Unter der Meldung steht eine Zeile «Noch 1× bis zum 1. Stern von «…»».',
  },
};
