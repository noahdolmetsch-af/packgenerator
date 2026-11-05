// «Persönliche Experimente» (Noah 05.11.2026 «a», Persönliches Lernen Idee 2, Teil 2): simpler form, rides compared ride against ride
export default {
  title: 'Experiments: a simpler form and a fairer comparison',
  lead: 'A try that measures a ride value now compares ride against ride instead of day against day. Only rides of a similar length and climb count, every ride shows as a dot, and nothing is said before each side has five rides. In the form, the cadence is one tick instead of a second list.',
  points: [
    { text: 'Rides are compared with similar rides, shown as dots, and judged only from five rides on each side', go: { href: '#/me/ruhig/versuche', steps: [{ sel: '[data-exp-metric]' }], where: 'Ich › Ruhig › Versuche, a try with a ride value.' } },
    { text: 'The form has one value and the line «Show the cadence too»', go: { href: '#/me/ruhig/versuche', steps: [{ sel: '[data-exp-q]' }], where: 'Ich › Ruhig › Versuche, the form of a new try.' } },
  ],
  small: [{ box: 'fixed', text: 'The cadence example explains what «5 rpm faster» means' }],
  test: [
    'Open Ich › Ruhig › Versuche and tap the example «Do I ride more comfortably with a higher cadence?».',
    'The form shows one value and the tick «Show the cadence too». Start the try.',
    'On the card of a try with rides, you see how many rides fit and a dot for every ride, before and during.',
  ],
  since: [],
  de: {
    'Experiments: a simpler form and a fairer comparison': 'Experimente: einfacheres Formular und fairerer Vergleich',
    'A try that measures a ride value now compares ride against ride instead of day against day. Only rides of a similar length and climb count, every ride shows as a dot, and nothing is said before each side has five rides. In the form, the cadence is one tick instead of a second list.': 'Ein Versuch mit einem Fahrt-Wert vergleicht jetzt Fahrt gegen Fahrt statt Tag gegen Tag. Es zählen nur Fahrten ähnlicher Länge und mit ähnlich vielen Höhenmetern, jede Fahrt erscheint als Punkt, und vor fünf Fahrten je Seite wird nichts gesagt. Im Formular ist die Kadenz ein Häkchen statt einer zweiten Liste.',
    'Rides are compared with similar rides, shown as dots, and judged only from five rides on each side': 'Fahrten werden mit ähnlichen Fahrten verglichen, als Punkte gezeigt und erst ab fünf Fahrten je Seite beurteilt',
    'Ich › Ruhig › Versuche, a try with a ride value.': 'Ich › Ruhig › Versuche, ein Versuch mit einem Fahrt-Wert.',
    'The form has one value and the line «Show the cadence too»': 'Das Formular hat einen Wert und die Zeile «Kadenz gleich mitzeigen»',
    'Ich › Ruhig › Versuche, the form of a new try.': 'Ich › Ruhig › Versuche, das Formular eines neuen Versuchs.',
    'The cadence example explains what «5 rpm faster» means': 'Das Kadenz-Beispiel erklärt, was «5 U/min schneller» heisst',
    'The form shows one value and the tick «Show the cadence too». Start the try.': 'Das Formular zeigt einen Wert und das Häkchen «Kadenz gleich mitzeigen». Starte den Versuch.',
    'On the card of a try with rides, you see how many rides fit and a dot for every ride, before and during.': 'Auf der Karte eines Versuchs mit Fahrten siehst du, wie viele Fahrten passen, und für jede Fahrt einen Punkt, davor und währenddessen.',
  },
};
