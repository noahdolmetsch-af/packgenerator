// «Kursblick» Entscheidung (Noah 23.11.2026 «1, 3 und 4 zusammen», «ok freigabe»): trend, position and an own buying rule for gold
export default {
  title: 'Kursblick: the tab «Decision» for gold',
  lead: 'Kursblick now shows the trend of gold, where the price stands in five years, and lets you write your own buying rule.',
  points: [
    { text: 'New tab «Decision»: a traffic light for the trend (the price against the mean of the last 50 and 200 days) and where the price stands in the last five years', go: { href: '#/kurse/entscheidung', steps: [{ sel: '[data-trend]' }] } },
    { text: 'Your own buying rule: an amount a month, and a factor when the trend is red or the price is very expensive; it suggests an amount for this month', go: { href: '#/kurse/entscheidung', steps: [{ sel: '[data-regel]' }] } },
    { text: 'A look back over the last 60 months: your rule against paying the same amount every month', go: { href: '#/kurse/entscheidung', steps: [{ sel: '[data-regel]' }] } },
  ],
  small: [{ box: 'new', text: 'Only observations and your own rule: no prediction, no advice, and the rule stays on your devices' }],
  test: ['Open Kursblick › «Decision»: the trend shows green, yellow or red, with a sentence.', 'Write an amount, for example 500, under «My buying rule»: a suggestion for this month and a look back appear.', 'Change «When the trend is red» to «Double»: the suggestion and the look back follow, and after a reload your rule is still there.'],
  since: [],
  de: {
    'Kursblick: the tab «Decision» for gold': 'Kursblick: der Reiter «Entscheidung» für Gold',
    'Kursblick now shows the trend of gold, where the price stands in five years, and lets you write your own buying rule.': 'Kursblick zeigt jetzt den Trend von Gold, wo der Preis in fünf Jahren steht, und lässt dich deine eigene Kaufregel schreiben.',
    'New tab «Decision»: a traffic light for the trend (the price against the mean of the last 50 and 200 days) and where the price stands in the last five years': 'Neuer Reiter «Entscheidung»: eine Ampel für den Trend (der Preis gegen das Mittel der letzten 50 und 200 Tage) und wo der Preis in den letzten fünf Jahren steht',
    'Your own buying rule: an amount a month, and a factor when the trend is red or the price is very expensive; it suggests an amount for this month': 'Deine eigene Kaufregel: ein Betrag pro Monat und ein Faktor, wenn der Trend rot oder der Preis sehr teuer ist; sie schlägt dir einen Betrag für diesen Monat vor',
    'A look back over the last 60 months: your rule against paying the same amount every month': 'Ein Rückblick auf die letzten 60 Monate: deine Regel gegen «jeden Monat gleich viel»',
    'Only observations and your own rule: no prediction, no advice, and the rule stays on your devices': 'Nur Beobachtungen und deine eigene Regel: keine Vorhersage, keine Beratung, und die Regel bleibt auf deinen Geräten',
    'Open Kursblick › «Decision»: the trend shows green, yellow or red, with a sentence.': 'Öffne Kursblick › «Entscheidung»: Der Trend zeigt grün, gelb oder rot, mit einem Satz.',
    'Write an amount, for example 500, under «My buying rule»: a suggestion for this month and a look back appear.': 'Schreib unter «Meine Kaufregel» einen Betrag, zum Beispiel 500: Ein Vorschlag für diesen Monat und ein Rückblick erscheinen.',
    'Change «When the trend is red» to «Double»: the suggestion and the look back follow, and after a reload your rule is still there.': 'Stell «Wenn der Trend rot ist» auf «Das Doppelte»: Vorschlag und Rückblick folgen, und nach dem Neuladen ist deine Regel noch da.',
  },
};
