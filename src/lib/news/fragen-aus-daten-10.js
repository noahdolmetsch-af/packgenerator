// «Fragen aus deinen Daten», Stufe 2, Vermutungen testen (Noah 04.11.2026): Ja/Nein an einem Tag, der zu einem Hinweis aus «Was zusammenpasst» passt
export default {
  title: 'Test a guess from your data',
  lead: 'When «What goes together» shows a hint and today is a day that fits it, the check asks yes or no.',
  points: [
    { text: 'A hint such as «On days with more than 7 h of sleep your mood was higher» is asked about on a day that fits it', go: 'f.datenfragen' },
    { text: 'The question shows the hint as the reason; answer yes, no or not sure', go: 'f.datenfragen' },
    { text: 'A switch and a minimum strength for the hint under Me › Your questions', go: { href: '#/me/abfragen', steps: [{ sel: '[data-datenfragen]' }] } },
  ],
  test: [
    'With enough days of answers and Fitbit sleep, open the check on a day after a long night: it can ask «Does that fit today?» with the hint as the reason.',
    'Answer «Yes, that fits»: the answer is in Me › History.',
    'Open Me › Your questions: «A guess to test» has a switch and the minimum strength of the hint.',
  ],
  since: [],
  de: {
    'Test a guess from your data': 'Eine Vermutung aus deinen Daten prüfen',
    'When «What goes together» shows a hint and today is a day that fits it, the check asks yes or no.': 'Wenn «Was zusammenpasst» einen Hinweis zeigt und heute ein Tag ist, der dazu passt, fragt der Check mit Ja oder Nein.',
    'A hint such as «On days with more than 7 h of sleep your mood was higher» is asked about on a day that fits it': 'Ein Hinweis wie «An Tagen mit mehr als 7 h Schlaf war deine Stimmung höher» wird an einem Tag abgefragt, der dazu passt',
    'The question shows the hint as the reason; answer yes, no or not sure': 'Die Frage zeigt den Hinweis als Grund; antworte mit Ja, Nein oder Nicht sicher',
    'A switch and a minimum strength for the hint under Me › Your questions': 'Ein Schalter und eine Mindeststärke für den Hinweis unter Ich › Deine Abfragen',
    'With enough days of answers and Fitbit sleep, open the check on a day after a long night: it can ask «Does that fit today?» with the hint as the reason.': 'Mit genug Tagen an Antworten und Fitbit-Schlaf: Öffne den Check an einem Tag nach einer langen Nacht. Er kann «Stimmt das heute?» fragen, mit dem Hinweis als Grund.',
    'Answer «Yes, that fits»: the answer is in Me › History.': 'Antworte «Ja, das passt»: Die Antwort steht unter Ich › Verlauf.',
    'Open Me › Your questions: «A guess to test» has a switch and the minimum strength of the hint.': 'Öffne Ich › Deine Abfragen: «Eine Vermutung zum Testen» hat einen Schalter und die Mindeststärke des Hinweises.',
  },
};
