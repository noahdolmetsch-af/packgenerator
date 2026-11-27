// «Haken-Analysen an einem Ort» (Noah 27.11.2026 «1a 2a 3a 4a 5a», Thread «Abhaken auf einen Blick verbessern», Pakete A und B und die Schritte Haken-Verlauf und Was auffällt, in einem PR gebündelt: Noah «a» 27.11.2026)
export default {
  title: 'Your ticks and your health at one place',
  lead: 'Auswerten › Woche now shows when you ticked what, how much you do per day and week, what stands out and what movement does for your resting pulse and sleep.',
  points: [
    { text: 'One switch for the tick history, the day total and the week volume (10 days, 30 days, 3 months, year)', go: { href: '#/auswerten/woche', steps: [{ sel: '[data-haken-zeitraum]' }] } },
    { text: '«What stands out» lists a series, a gap or what you often tick together, each with its reason; on Today one quiet line shows the most useful one', go: { href: '#/auswerten/woche', steps: [{ sel: '[data-haken-hinweise]' }] } },
    { text: 'Active zone minutes per week against your resting pulse, HRV or sleep; where Garmin and Fitbit both recorded a session, the two pulses stand side by side', where: 'Only with sessions that both recorded', go: { href: '#/auswerten/woche', steps: [{ sel: '[data-gesundheit]' }] } },
  ],
  small: [
    { box: 'new', text: 'Measured and estimated minutes («ca.») are drawn apart; nothing is graded' },
    { box: 'new', text: 'Switch the line on Today off under Me › Look › Suggestions › Performance tips' },
  ],
  test: [
    'Open Auswerten › Woche: the switch «Period for everything here» stands on top, under it the tick history.',
    'Tap «30 days»: the tick history, the day total and the week volume change together.',
    'Further down, «What stands out» lists up to five hints, each with «Why: …».',
    'Tap «HRV», then «Sleep» in «What movement does for you»: the line and the sentence change.',
  ],
  since: [],
  de: {
    'Your ticks and your health at one place': 'Deine Haken und deine Gesundheit an einem Ort',
    'Auswerten › Woche now shows when you ticked what, how much you do per day and week, what stands out and what movement does for your resting pulse and sleep.': 'Auswerten › Woche zeigt jetzt, wann du was abgehakt hast, wie viel du pro Tag und Woche machst, was auffällt und was Bewegung mit deinem Ruhepuls und Schlaf macht.',
    'One switch for the tick history, the day total and the week volume (10 days, 30 days, 3 months, year)': 'Ein Schalter für Haken-Verlauf, Tagestotal und Wochenpensum (10 Tage, 30 Tage, 3 Monate, Jahr)',
    '«What stands out» lists a series, a gap or what you often tick together, each with its reason; on Today one quiet line shows the most useful one': '«Was auffällt» nennt eine Serie, eine Lücke oder was du oft zusammen abhakst, jedes mit seinem Grund; auf Heute zeigt eine ruhige Zeile das Nützlichste',
    'Active zone minutes per week against your resting pulse, HRV or sleep; where Garmin and Fitbit both recorded a session, the two pulses stand side by side': 'Aktivzonen-Minuten pro Woche gegen Ruhepuls, HRV oder Schlaf; wo Garmin und Fitbit dieselbe Einheit aufgezeichnet haben, stehen die zwei Pulse nebeneinander',
    'Only with sessions that both recorded': 'Nur bei Einheiten, die beide aufgezeichnet haben',
    'Measured and estimated minutes («ca.») are drawn apart; nothing is graded': 'Gemessene und geschätzte Minuten («ca.») sind getrennt gezeichnet; nichts wird bewertet',
    'Switch the line on Today off under Me › Look › Suggestions › Performance tips': 'Schalte die Zeile auf Heute aus unter Ich › Aussehen › Vorschläge › Leistungstipps',
    'Open Auswerten › Woche: the switch «Period for everything here» stands on top, under it the tick history.': 'Öffne Auswerten › Woche: oben steht der Schalter «Zeitraum für alles hier», darunter der Haken-Verlauf.',
    'Tap «30 days»: the tick history, the day total and the week volume change together.': 'Tippe «30 Tage»: Haken-Verlauf, Tagestotal und Wochenpensum ändern sich zusammen.',
    'Further down, «What stands out» lists up to five hints, each with «Why: …».': 'Weiter unten listet «Was auffällt» bis zu fünf Hinweise, jeder mit «Warum: …».',
    'Tap «HRV», then «Sleep» in «What movement does for you»: the line and the sentence change.': 'Tippe in «Was Bewegung mit dir macht» auf «HRV», dann auf «Schlaf»: die Linie und der Satz ändern sich.',
  },
};
