// «Persönliche Experimente» (Noah 05.11.2026 «a», Persönliches Lernen Idee 2, Teil 2): simpler form, rides compared ride against ride
export default {
  title: 'Experiments: a simpler form and a fairer comparison',
  lead: 'The form of a new try now starts with a plain question about your rides, such as «Do my rides feel easier?». A try that measures a ride value compares ride against ride instead of day against day: only rides of a similar length and climb count, every ride shows as a dot, and nothing is said before each side has five rides.',
  points: [
    { text: 'Rides are compared with similar rides, shown as dots, and judged only from five rides on each side', go: { href: '#/me/ruhig/versuche', steps: [{ sel: '[data-exp-metric]' }], where: 'Ich › Ruhig › Versuche, a try with a ride value.' } },
    { text: 'The form starts with four plain questions; dates, the value and «Show the cadence too» sit under «More settings»', go: { href: '#/me/ruhig/versuche', steps: [{ sel: '[data-exp-q]' }], where: 'Ich › Ruhig › Versuche, the form of a new try.' } },
  ],
  small: [{ box: 'fixed', text: 'The form is shorter: one question, one line, one button' }],
  test: [
    'Open Ich › Ruhig › Versuche and tap «Do my rides feel easier?».',
    'The question and 14 days are filled in. Write what you change, for example pedal 5 rpm faster, and start the try.',
    'On the card of a try with rides, you see how many rides fit and a dot for every ride, before and during.',
  ],
  since: [],
  de: {
    'Experiments: a simpler form and a fairer comparison': 'Experimente: einfacheres Formular und fairerer Vergleich',
    'The form of a new try now starts with a plain question about your rides, such as «Do my rides feel easier?». A try that measures a ride value compares ride against ride instead of day against day: only rides of a similar length and climb count, every ride shows as a dot, and nothing is said before each side has five rides.': 'Das Formular eines neuen Versuchs beginnt jetzt mit einer einfachen Frage zu deinen Fahrten, zum Beispiel «Fühlen sich meine Fahrten leichter an?». Ein Versuch mit einem Fahrt-Wert vergleicht Fahrt gegen Fahrt statt Tag gegen Tag: Es zählen nur Fahrten ähnlicher Länge und mit ähnlich vielen Höhenmetern, jede Fahrt erscheint als Punkt, und vor fünf Fahrten je Seite wird nichts gesagt.',
    'Rides are compared with similar rides, shown as dots, and judged only from five rides on each side': 'Fahrten werden mit ähnlichen Fahrten verglichen, als Punkte gezeigt und erst ab fünf Fahrten je Seite beurteilt',
    'Ich › Ruhig › Versuche, a try with a ride value.': 'Ich › Ruhig › Versuche, ein Versuch mit einem Fahrt-Wert.',
    'The form starts with four plain questions; dates, the value and «Show the cadence too» sit under «More settings»': 'Das Formular beginnt mit vier einfachen Fragen; Datum, Wert und «Kadenz gleich mitzeigen» stehen unter «Mehr Einstellungen»',
    'Ich › Ruhig › Versuche, the form of a new try.': 'Ich › Ruhig › Versuche, das Formular eines neuen Versuchs.',
    'The form is shorter: one question, one line, one button': 'Das Formular ist kürzer: eine Frage, eine Zeile, ein Knopf',
    'Open Ich › Ruhig › Versuche and tap «Do my rides feel easier?».': 'Öffne Ich › Ruhig › Versuche und tippe auf «Fühlen sich meine Fahrten leichter an?».',
    'The question and 14 days are filled in. Write what you change, for example pedal 5 rpm faster, and start the try.': 'Frage und 14 Tage sind schon eingetragen. Schreibe, was du änderst, zum Beispiel 5 U/min schneller treten, und starte den Versuch.',
    'On the card of a try with rides, you see how many rides fit and a dot for every ride, before and during.': 'Auf der Karte eines Versuchs mit Fahrten siehst du, wie viele Fahrten passen, und für jede Fahrt einen Punkt, davor und währenddessen.',
  },
};
