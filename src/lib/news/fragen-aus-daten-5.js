// «Fragen aus deinen Daten», Stufe 2, Schritt 2 (Noah 03.11.2026 «bau Stufe 2»): Pause vom Training
export default {
  title: 'A question after a training pause',
  lead: 'After a few days without training the check asks what kept you from it, and says why.',
  points: [
    { text: 'Four days without training (Strava or tennis) bring the question «What kept you from training lately?»', go: 'f.datenfragen' },
    { text: 'Change the days or the wording, or switch the rule off', go: { href: '#/me/abfragen', steps: [{ sel: '[data-rule-val="pause"]' }] } },
  ],
  small: [{ box: 'new', text: 'Without Strava activities the page says why the training rules are quiet' }],
  test: [
    'Open Me › Your questions: «A pause from training» is the fifth rule.',
    'Change the days to 2 or switch the rule off and on.',
    'After a few days without training, the next morning check asks what kept you, with «Why am I asking this?».',
  ],
  since: [],
  de: {
    'A question after a training pause': 'Eine Frage nach einer Trainingspause',
    'After a few days without training the check asks what kept you from it, and says why.': 'Nach ein paar Tagen ohne Training fragt der Check, was dich davon abgehalten hat, und sagt warum.',
    'Four days without training (Strava or tennis) bring the question «What kept you from training lately?»': 'Vier Tage ohne Training (Strava oder Tennis) bringen die Frage «Was hat dich zuletzt vom Training abgehalten?»',
    'Change the days or the wording, or switch the rule off': 'Ändere die Tage oder die Worte, oder schalte die Regel aus',
    'Without Strava activities the page says why the training rules are quiet': 'Ohne Strava-Aktivitäten sagt die Seite, warum die Trainings-Regeln still sind',
    'Open Me › Your questions: «A pause from training» is the fifth rule.': 'Öffne Ich › Deine Abfragen: «Pause vom Training» ist die fünfte Regel.',
    'Change the days to 2 or switch the rule off and on.': 'Ändere die Tage auf 2 oder schalte die Regel aus und wieder ein.',
    'After a few days without training, the next morning check asks what kept you, with «Why am I asking this?».': 'Nach ein paar Tagen ohne Training fragt der nächste Morgen-Check, was dich abgehalten hat, mit «Warum frage ich das?».',
  },
};
