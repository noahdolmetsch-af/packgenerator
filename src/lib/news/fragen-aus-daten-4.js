// «Fragen aus deinen Daten», Stufe 2, Schritt 1 (Noah 03.11.2026 «1b 2a 3a 4a 5a», «bau Stufe 2»): Training aus Strava
export default {
  title: 'Your training asks too',
  lead: 'After a long day out and after a pause from training, the check asks one open question and says why.',
  points: [
    { text: 'After a day of three hours or more outside, the morning check asks how your legs feel', go: 'f.datenfragen' },
    { text: 'After four days without training (Strava or tennis) it asks what kept you from it', go: 'f.datenfragen' },
    { text: 'Both rules have a switch, a threshold and your own wording, like the others', go: { href: '#/me/abfragen', steps: [{ sel: '[data-rule="fahrt"]' }] } },
  ],
  small: [{ box: 'new', text: 'Without Strava activities the page says why the training rules are quiet' }],
  test: [
    'Open Me › Your questions: «Questions from your data» now has two training rules.',
    'Change the hours of «After a long day out» to 2 and write the question in your own words.',
    'Switch «A pause from training» off and on again.',
  ],
  since: [],
  de: {
    'Your training asks too': 'Auch dein Training fragt nach',
    'After a long day out and after a pause from training, the check asks one open question and says why.': 'Nach einem langen Tag unterwegs und nach einer Trainingspause stellt der Check eine offene Frage und sagt, warum.',
    'After a day of three hours or more outside, the morning check asks how your legs feel': 'Nach einem Tag von drei Stunden oder mehr draussen fragt der Morgen-Check, wie sich die Beine anfühlen',
    'After four days without training (Strava or tennis) it asks what kept you from it': 'Nach vier Tagen ohne Training (Strava oder Tennis) fragt er, was dich davon abgehalten hat',
    'Both rules have a switch, a threshold and your own wording, like the others': 'Beide Regeln haben Schalter, Schwelle und eigene Worte, wie die anderen',
    'Without Strava activities the page says why the training rules are quiet': 'Ohne Strava-Aktivitäten sagt die Seite, warum die Trainings-Regeln still sind',
    'Open Me › Your questions: «Questions from your data» now has two training rules.': 'Öffne Ich › Deine Abfragen: «Fragen aus deinen Daten» hat jetzt zwei Trainings-Regeln.',
    'Change the hours of «After a long day out» to 2 and write the question in your own words.': 'Ändere die Stunden bei «Nach einem langen Tag unterwegs» auf 2 und schreibe die Frage in deinen Worten.',
    'Switch «A pause from training» off and on again.': 'Schalte «Pause vom Training» aus und wieder ein.',
  },
};
