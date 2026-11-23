// «Diagramme überall verbessern» (Noah 23.11.2026 «ja»): Antworten ausgewertet mit Verlauf und Wochentagen zum Antippen
export default {
  title: 'Answers as touch charts',
  lead: 'In «Your answers evaluated» the course and the weekdays show their numbers when you point or tap, with a sentence above the course.',
  points: [
    { text: 'Course and weekdays of an answer: numbers of a day when you point, a tap opens it, «As table»', go: { href: '#/flow/auswertung?what=answers', where: 'Auswerten › Fahrten › Your answers evaluated: point at the course.' } },
  ],
  small: [{ box: 'new', text: 'A weekday without an answer says «No data» instead of 0' }],
  test: [
    'Open «Your answers evaluated» and pick a question with a number: above the course stands a sentence.',
    'Point at the course, then tap a day: a window shows the answer, the mean over 7 days and how many answers.',
    'Under «Ø per weekday» tap a bar or choose «As table».',
  ],
  since: [],
  de: {
    'Answers as touch charts': 'Antworten zum Antippen',
    'In «Your answers evaluated» the course and the weekdays show their numbers when you point or tap, with a sentence above the course.': 'In «Deine Antworten ausgewertet» zeigen Verlauf und Wochentage ihre Zahlen beim Zeigen oder Tippen, mit einem Satz über dem Verlauf.',
    'Course and weekdays of an answer: numbers of a day when you point, a tap opens it, «As table»': 'Verlauf und Wochentage einer Antwort: die Zahlen eines Tages beim Zeigen, ein Tipp öffnet ihn, «Als Tabelle»',
    'Auswerten › Fahrten › Your answers evaluated: point at the course.': 'Auswerten › Fahrten › Deine Antworten ausgewertet: auf den Verlauf zeigen.',
    'A weekday without an answer says «No data» instead of 0': 'Ein Wochentag ohne Antwort sagt «Keine Daten» statt 0',
    'Open «Your answers evaluated» and pick a question with a number: above the course stands a sentence.': 'Öffne «Deine Antworten ausgewertet» und wähle eine Frage mit Zahl: über dem Verlauf steht ein Satz.',
    'Point at the course, then tap a day: a window shows the answer, the mean over 7 days and how many answers.': 'Zeig auf den Verlauf und tippe dann einen Tag: ein Fenster zeigt die Antwort, das Mittel über 7 Tage und die Zahl der Antworten.',
    'Under «Ø per weekday» tap a bar or choose «As table».': 'Tippe unter «Ø pro Wochentag» einen Balken oder wähle «Als Tabelle».',
  },
};
