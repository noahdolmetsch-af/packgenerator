// «Mein Abend: Zeit ohne Handy» (Noah 05.11.2026 «Touren 2a und b», Thread «Bauen: Freie Zeit Teil 1»)
export default {
  title: 'My evening: time without the phone',
  lead: 'A timer for an evening without the phone, and a button to note that it did you good.',
  points: [
    { text: 'Start a timer without the phone (10 to 45 minutes)', go: { href: '#/me/frei/abend', steps: [{ sel: '[data-eve-timer]' }] } },
    { text: 'Note that an evening did you good', go: { href: '#/me/frei/abend', steps: [{ sel: '[data-eve-count]' }] } },
  ],
  small: [{ box: 'new', text: 'The timer remembers its end time, also after you leave the page' }],
  test: ['Open «My evening», pick 10 minutes and tap «Start».', 'Leave the page and come back: the time still runs.', 'When it is over, tap «Did me good»: the count below goes up.'],
  since: [],
  de: {
    'My evening: time without the phone': 'Mein Abend: Zeit ohne Handy',
    'A timer for an evening without the phone, and a button to note that it did you good.': 'Ein Timer für einen Abend ohne Handy und ein Knopf, um zu notieren, dass er gut getan hat.',
    'Start a timer without the phone (10 to 45 minutes)': 'Einen Timer ohne Handy starten (10 bis 45 Minuten)',
    'Note that an evening did you good': 'Notieren, dass ein Abend gut getan hat',
    'The timer remembers its end time, also after you leave the page': 'Der Timer merkt sich sein Ende, auch wenn du die Seite verlässt',
    'Open «My evening», pick 10 minutes and tap «Start».': 'Öffne «Mein Abend», wähle 10 Minuten und tippe auf «Start».',
    'Leave the page and come back: the time still runs.': 'Verlasse die Seite und komm zurück: Die Zeit läuft weiter.',
    'When it is over, tap «Did me good»: the count below goes up.': 'Wenn sie um ist, tippe auf «Hat gut getan»: Die Zahl darunter steigt.',
  },
};
