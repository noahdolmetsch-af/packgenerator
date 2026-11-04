// «Fragen aus deinen Daten», Stufe 2, Schritt 3 (Noah 03.11.2026 «bau Stufe 2»): Tennis
export default {
  title: 'Tennis asks too',
  lead: 'After a game and after a court time that did not happen, the check asks one open question and says why.',
  points: [
    { text: 'The day after a noted game, the morning check asks what worked and what did not', go: 'f.datenfragen' },
    { text: 'A planned court time you marked as not played asks what got in the way', go: 'f.datenfragen' },
    { text: 'Both rules have a switch, a threshold and your own wording, like the others', go: { href: '#/me/abfragen', steps: [{ sel: '[data-rule="spiel"]' }] } },
  ],
  small: [{ box: 'new', text: 'Without tennis entries the page says why the tennis rules are quiet' }],
  test: [
    'Open Me › Your questions: «Questions from your data» now has two tennis rules.',
    'Change the minutes of «After a tennis game» and write the question in your own words.',
    'Switch «A court time that did not happen» off and on again.',
  ],
  since: [],
  de: {
    'Tennis asks too': 'Auch Tennis fragt nach',
    'After a game and after a court time that did not happen, the check asks one open question and says why.': 'Nach einem Spiel und nach einer Platzzeit, die ausfiel, stellt der Check eine offene Frage und sagt, warum.',
    'The day after a noted game, the morning check asks what worked and what did not': 'Am Tag nach einem eingetragenen Spiel fragt der Morgen-Check, was geklappt hat und was nicht',
    'A planned court time you marked as not played asks what got in the way': 'Eine geplante Platzzeit, die du als nicht gespielt markiert hast, fragt, was dazwischenkam',
    'Both rules have a switch, a threshold and your own wording, like the others': 'Beide Regeln haben Schalter, Schwelle und eigene Worte, wie die anderen',
    'Without tennis entries the page says why the tennis rules are quiet': 'Ohne Tennis-Einträge sagt die Seite, warum die Tennis-Regeln still sind',
    'Open Me › Your questions: «Questions from your data» now has two tennis rules.': 'Öffne Ich › Deine Abfragen: «Fragen aus deinen Daten» hat jetzt zwei Tennis-Regeln.',
    'Change the minutes of «After a tennis game» and write the question in your own words.': 'Ändere die Minuten bei «Nach einem Tennisspiel» und schreibe die Frage in deinen Worten.',
    'Switch «A court time that did not happen» off and on again.': 'Schalte «Platzzeit, die ausfiel» aus und wieder ein.',
  },
};
