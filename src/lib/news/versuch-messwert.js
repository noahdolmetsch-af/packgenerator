// «Eigene Experimente mit Messwert» (Noah 03.11.2026, Cockpit-Idee 6): a try can measure one value
export default {
  title: 'Experiments with a value',
  lead: 'A try can now measure one value, for example sleep or resting pulse. The look back shows the mean during the try against the days before, with the range, and says plainly when the difference is within the normal swing.',
  points: [
    { text: 'A new try: pick «Measure it with a value» (sleep, resting pulse, HRV, how you feel …)', go: { href: '#/me/ruhig/versuche', steps: [{ sel: '[data-exp-metric]' }], where: 'Ich › Ruhig › Versuche, the form of a new try.' } },
    { text: 'On every day of the try the card shows: before, during, the difference and an honest word on it', go: { href: '#/me/ruhig/versuche', steps: [{ sel: '[data-exp-q]' }], where: 'Ich › Ruhig › Versuche; the comparison appears on a try that has a value.' } },
  ],
  small: [{ box: 'new', text: '«Try again» keeps the value' }],
  test: [
    'Open Ich › Ruhig › Versuche and write a question, then pick a value under «Measure it with a value».',
    'Start the experiment with a start date a week ago: the card shows the values before and during the try.',
    'Read the line below: it says higher, lower or «no clear difference», and that it is a hint, not proof.',
  ],
  since: [],
  de: {
    'Experiments with a value': 'Experimente mit Messwert',
    'A try can now measure one value, for example sleep or resting pulse. The look back shows the mean during the try against the days before, with the range, and says plainly when the difference is within the normal swing.': 'Ein Versuch kann jetzt einen Wert messen, zum Beispiel Schlaf oder Ruhepuls. Der Rückblick zeigt den Mittelwert während des Versuchs gegen die Tage davor, mit Spannweite, und sagt klar, wenn der Unterschied innerhalb der normalen Schwankung liegt.',
    'A new try: pick «Measure it with a value» (sleep, resting pulse, HRV, how you feel …)': 'Neuer Versuch: wähle «Mit einem Wert messen» (Schlaf, Ruhepuls, HRV, wie es dir geht …)',
    'Ich › Ruhig › Versuche, the form of a new try.': 'Ich › Ruhig › Versuche, das Formular eines neuen Versuchs.',
    'On every day of the try the card shows: before, during, the difference and an honest word on it': 'An jedem Tag des Versuchs zeigt die Karte: davor, währenddessen, den Unterschied und ein ehrliches Wort dazu',
    'Ich › Ruhig › Versuche; the comparison appears on a try that has a value.': 'Ich › Ruhig › Versuche; der Vergleich erscheint bei einem Versuch mit Wert.',
    '«Try again» keeps the value': '«Nochmal versuchen» behält den Wert',
    'Open Ich › Ruhig › Versuche and write a question, then pick a value under «Measure it with a value».': 'Öffne Ich › Ruhig › Versuche und schreibe eine Frage, wähle dann unter «Mit einem Wert messen» einen Wert.',
    'Start the experiment with a start date a week ago: the card shows the values before and during the try.': 'Starte den Versuch mit einem Startdatum vor einer Woche: die Karte zeigt die Werte vor und während des Versuchs.',
    'Read the line below: it says higher, lower or «no clear difference», and that it is a hint, not proof.': 'Lies die Zeile darunter: sie sagt höher, tiefer oder «kein klarer Unterschied» und dass es ein Hinweis ist, kein Beweis.',
  },
};
