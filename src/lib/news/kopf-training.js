// «Knapper Seitenkopf» Training (Noah 23.11.2026 «1-5 a», Design-Abgleich): one short sentence under the title
export default {
  title: 'A shorter head on Training',
  lead: 'Training says in one short sentence what it is for. That Strava brings the activities by itself is said where the list is empty.',
  points: [{ text: 'Training starts with one short sentence, the week comes higher up', go: { href: '#/flow/training', steps: [{ sel: 'header.ph' }], where: 'Active › Training, under the title.' } }],
  small: [],
  test: ['Open Active › Training: under the title stands one short sentence.', 'Switch to «Activities»: with no activities, the empty view says that Strava brings them.'],
  since: [],
  de: {
    'A shorter head on Training': 'Ein kürzerer Kopf bei Training',
    'Training says in one short sentence what it is for. That Strava brings the activities by itself is said where the list is empty.': 'Training sagt in einem kurzen Satz, wofür es da ist. Dass Strava die Aktivitäten von selbst bringt, steht dort, wo die Liste leer ist.',
    'Training starts with one short sentence, the week comes higher up': 'Training beginnt mit einem kurzen Satz, die Woche kommt weiter nach oben',
    'Active › Training, under the title.': 'Aktiv › Training, unter dem Titel.',
    'Open Active › Training: under the title stands one short sentence.': 'Öffne Aktiv › Training: unter dem Titel steht ein kurzer Satz.',
    'Switch to «Activities»: with no activities, the empty view says that Strava brings them.': 'Wechsle zu «Aktivitäten»: ohne Aktivitäten sagt die leere Ansicht, dass Strava sie bringt.',
  },
};
