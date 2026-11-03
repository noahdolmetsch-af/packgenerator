// «Fragen aus deinen Daten», Schritt 3 (Noah 03.11.2026 «1b 2a 3a 4a 5a», «bau stufe 1»): change thresholds and wording yourself
export default {
  title: 'Change your data questions',
  lead: 'Each rule now has its own threshold and wording, and sits at the top of Your questions.',
  points: [
    { text: 'Change the threshold of a rule, for example how many beats above your usual', go: { href: '#/me/abfragen', steps: [{ sel: '[data-rule-val="ruhepuls"]' }] } },
    { text: 'Write the question in your own words; «Back to standard» brings the original back', go: { href: '#/me/abfragen', steps: [{ sel: '[data-rule-text="ruhepuls"]' }] } },
    { text: 'The reason line in the check has «Change this rule»', go: 'f.datenfragen' },
  ],
  small: [{ box: 'new', text: 'Without Fitbit values the page says why the pulse and sleep rules are quiet' }],
  test: [
    'Open Me › Your questions: «Questions from your data» is at the top.',
    'Change the threshold of «Resting pulse above your usual» and write your own question.',
    'Tap «Back to standard».',
  ],
  since: ['f.datenfragen'],
  de: {
    'Change your data questions': 'Deine Daten-Fragen anpassen',
    'Each rule now has its own threshold and wording, and sits at the top of Your questions.': 'Jede Regel hat jetzt ihre eigene Schwelle und eigene Worte und steht ganz oben unter Deine Abfragen.',
    'Change the threshold of a rule, for example how many beats above your usual': 'Ändere die Schwelle einer Regel, zum Beispiel um wie viele Schläge über deinem Üblichen',
    'Write the question in your own words; «Back to standard» brings the original back': 'Schreibe die Frage in deinen Worten; «Zurück zum Standard» bringt das Original zurück',
    'The reason line in the check has «Change this rule»': 'Die Grund-Zeile im Check hat «Regel ändern»',
    'Without Fitbit values the page says why the pulse and sleep rules are quiet': 'Ohne Fitbit-Werte sagt die Seite, warum die Regeln für Puls und Schlaf still sind',
    'Open Me › Your questions: «Questions from your data» is at the top.': 'Öffne Ich › Deine Abfragen: «Fragen aus deinen Daten» steht ganz oben.',
    'Change the threshold of «Resting pulse above your usual» and write your own question.': 'Ändere die Schwelle von «Ruhepuls über deinem Üblichen» und schreibe deine eigene Frage.',
    'Tap «Back to standard».': 'Tippe auf «Zurück zum Standard».',
  },
};
