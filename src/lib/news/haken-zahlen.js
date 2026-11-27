// «Haken-Analysen an einem Ort» (Noah 27.11.2026 «1a 2a 3a 4a 5a», Thread «Abhaken auf einen Blick verbessern», Paket A)
export default {
  title: 'Day total and week volume',
  lead: 'Auswerten › Woche now has one period switch for all cards, and two new ones: the minutes of each day and the hours of each week.',
  points: [
    { text: 'One switch for the tick history, the day total and the week volume', go: { href: '#/auswerten/woche', steps: [{ sel: '[data-haken-zeitraum]' }] } },
    { text: 'The day total shows every day against your typical training day', go: { href: '#/auswerten/woche', steps: [{ sel: '[data-tagestotal]' }] } },
    { text: 'The week volume shows this week against last week and against your mean of 12 weeks', go: { href: '#/auswerten/woche', steps: [{ sel: '[data-wochenpensum]' }] } },
  ],
  small: [{ box: 'new', text: 'Measured and estimated minutes («ca.») are drawn apart' }],
  test: [
    'Open Auswerten › Woche: the switch «Period for everything here» stands on top.',
    'Tap «30 days»: the tick history, the day total and the week volume change together.',
    'Point at a bar of the week volume: the exact hours of that week stand above the chart.',
  ],
  since: [],
  de: {
    'Day total and week volume': 'Tagestotal und Wochenpensum',
    'Auswerten › Woche now has one period switch for all cards, and two new ones: the minutes of each day and the hours of each week.': 'Auswerten › Woche hat jetzt einen Zeitraum-Schalter für alle Karten und zwei neue Karten: die Minuten jedes Tages und die Stunden jeder Woche.',
    'One switch for the tick history, the day total and the week volume': 'Ein Schalter für Haken-Verlauf, Tagestotal und Wochenpensum',
    'The day total shows every day against your typical training day': 'Das Tagestotal zeigt jeden Tag gegen deinen typischen Trainingstag',
    'The week volume shows this week against last week and against your mean of 12 weeks': 'Das Wochenpensum zeigt diese Woche gegen die Vorwoche und gegen dein Mittel der 12 Wochen',
    'Measured and estimated minutes («ca.») are drawn apart': 'Gemessene und geschätzte Minuten («ca.») sind getrennt gezeichnet',
    'Open Auswerten › Woche: the switch «Period for everything here» stands on top.': 'Öffne Auswerten › Woche: oben steht der Schalter «Zeitraum für alles hier».',
    'Tap «30 days»: the tick history, the day total and the week volume change together.': 'Tippe «30 Tage»: Haken-Verlauf, Tagestotal und Wochenpensum ändern sich zusammen.',
    'Point at a bar of the week volume: the exact hours of that week stand above the chart.': 'Zeige auf einen Balken im Wochenpensum: die genauen Stunden der Woche stehen über dem Diagramm.',
  },
};
