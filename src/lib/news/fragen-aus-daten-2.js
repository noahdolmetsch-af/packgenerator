// «Fragen aus deinen Daten», Schritt 2 (Noah 03.11.2026 «1b 2a 3a 4a 5a»): two more rules, short night and low mood
export default {
  title: 'More questions from your data',
  lead: 'A short night and a few low days now get one open question each.',
  points: [
    { text: 'After a night under 6 hours the check asks what kept you awake', go: { href: '#/me/abfragen', steps: [{ sel: '[data-rule="schlaf"]' }] } },
    { text: 'After three days of low mood the check asks what would do you good today', go: { href: '#/me/abfragen', steps: [{ sel: '[data-rule="stimmung"]' }] } },
  ],
  small: [{ box: 'new', text: 'Every rule has its own switch; up to 3 such questions a day' }],
  test: [
    'Open Me › Your questions: under «Questions from your data» there are three rules.',
    'Switch «Short night» off and on again.',
  ],
  since: [],
  de: {
    'More questions from your data': 'Mehr Fragen aus deinen Daten',
    'A short night and a few low days now get one open question each.': 'Eine kurze Nacht und ein paar gedrückte Tage bekommen jetzt je eine offene Frage.',
    'After a night under 6 hours the check asks what kept you awake': 'Nach einer Nacht unter 6 Stunden fragt der Check, was dich wachgehalten hat',
    'After three days of low mood the check asks what would do you good today': 'Nach drei Tagen gedrückter Stimmung fragt der Check, was dir heute gut tun würde',
    'Every rule has its own switch; up to 3 such questions a day': 'Jede Regel hat ihren eigenen Schalter; bis zu 3 solche Fragen pro Tag',
    'Open Me › Your questions: under «Questions from your data» there are three rules.': 'Öffne Ich › Deine Abfragen: unter «Fragen aus deinen Daten» stehen drei Regeln.',
    'Switch «Short night» off and on again.': 'Schalte «Kurze Nacht» aus und wieder ein.',
  },
};
