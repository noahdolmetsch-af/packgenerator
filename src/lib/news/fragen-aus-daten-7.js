// «Fragen aus deinen Daten», Stufe 2, Wiederholungsschutz (Noah 04.11.2026 «2a»): nie zwei aus derselben Gruppe, nach dreimal Überspringen «seltener?»
export default {
  title: 'Fewer repeats in your data questions',
  lead: 'Never two data questions from the same group on a day, and after three skips the check offers to ask less often.',
  points: [
    { text: 'Never two questions from your data of the same group on one day', go: 'f.datenfragen' },
    { text: 'Skipped three times: «Ask less often?» with «Yes, less often» or «No, keep it»', go: 'f.datenfragen' },
    { text: 'A rule that asks less often says so, and «Back to standard» undoes it', go: { href: '#/me/abfragen', steps: [{ sel: '[data-datenfragen]' }] } },
  ],
  test: [
    'Skip a question from your data on three days: on the fourth the check asks whether to ask less often.',
    'Tap «Yes, less often»: Me › Your questions says that rule now asks only every 7 days.',
    'Tap «Back to standard» on that rule.',
  ],
  since: [],
  de: {
    'Fewer repeats in your data questions': 'Weniger Wiederholungen bei den Daten-Fragen',
    'Never two data questions from the same group on a day, and after three skips the check offers to ask less often.': 'Nie zwei Daten-Fragen aus derselben Gruppe am Tag, und nach dreimal Überspringen bietet der Check an, seltener zu fragen.',
    'Never two questions from your data of the same group on one day': 'Nie zwei Fragen aus deinen Daten aus derselben Gruppe an einem Tag',
    'Skipped three times: «Ask less often?» with «Yes, less often» or «No, keep it»': 'Dreimal übersprungen: «Soll ich sie seltener fragen?» mit «Ja, seltener» oder «Nein, so lassen»',
    'A rule that asks less often says so, and «Back to standard» undoes it': 'Eine Regel, die seltener fragt, sagt das, und «Zurück zum Standard» macht es rückgängig',
    'Skip a question from your data on three days: on the fourth the check asks whether to ask less often.': 'Überspringe eine Frage aus deinen Daten an drei Tagen: am vierten fragt der Check, ob er seltener fragen soll.',
    'Tap «Yes, less often»: Me › Your questions says that rule now asks only every 7 days.': 'Tippe auf «Ja, seltener»: Ich › Deine Abfragen sagt, dass diese Regel jetzt nur alle 7 Tage fragt.',
    'Tap «Back to standard» on that rule.': 'Tippe bei dieser Regel auf «Zurück zum Standard».',
  },
};
