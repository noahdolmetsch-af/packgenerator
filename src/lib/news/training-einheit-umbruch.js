// «Lange Namen brechen um» (Noah 17.11.2026 «alle umsetzen 1-10», UI-Test der Seite Training, Fund 7)
export default {
  title: 'Long session names wrap',
  lead: 'In the week of Training a long session name no longer ends in «…»: it wraps onto a second line.',
  points: [
    { text: 'Training › Woche: a long session name wraps instead of being cut off', go: { href: '#/flow/training', steps: [{ sel: '[data-planned]' }], where: 'Training, in the tab «Week», on a day with a planned session.' } },
  ],
  small: [],
  test: [
    'Open Aktiv › Training, tap a planned session and give it a long name, for example «Lockere Grundlagenfahrt mit Kaffeepause am Hügel».',
    'Save: the name stands in full on the day, on two lines if needed, no «…».',
  ],
  since: [],
  de: {
    'Long session names wrap': 'Lange Einheiten-Namen brechen um',
    'In the week of Training a long session name no longer ends in «…»: it wraps onto a second line.': 'In der Woche von Training endet ein langer Name einer Einheit nicht mehr mit «…», er bricht auf eine zweite Zeile um.',
    'Training › Woche: a long session name wraps instead of being cut off': 'Training › Woche: ein langer Name einer Einheit bricht um, statt abgeschnitten zu werden',
    'Training, in the tab «Week», on a day with a planned session.': 'Training, im Reiter «Woche», an einem Tag mit geplanter Einheit.',
    'Open Aktiv › Training, tap a planned session and give it a long name, for example «Lockere Grundlagenfahrt mit Kaffeepause am Hügel».': 'Öffne Aktiv › Training, tippe eine geplante Einheit an und gib ihr einen langen Namen, zum Beispiel «Lockere Grundlagenfahrt mit Kaffeepause am Hügel».',
    'Save: the name stands in full on the day, on two lines if needed, no «…».': 'Speichere: der Name steht ganz am Tag, wenn nötig auf zwei Zeilen, ohne «…».',
  },
};
