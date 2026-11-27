// «Haken-Analysen an einem Ort» (Noah 27.11.2026 «1a 2a 3a 4a 5a», Thread «Abhaken auf einen Blick verbessern», Paket B)
export default {
  title: 'What movement does for you',
  lead: 'Auswerten › Woche now sets your active zone minutes of each week against your resting pulse, HRV or sleep, and shows Garmin and Fitbit pulses side by side.',
  points: [
    { text: 'Active zone minutes per week against your resting pulse, HRV or sleep, with one sentence about the week after', go: { href: '#/auswerten/woche', steps: [{ sel: '[data-gesundheit]' }] } },
    { text: 'Where Garmin and Fitbit both recorded a session, the two pulses stand side by side', where: 'Only with sessions that both recorded', go: { href: '#/auswerten/woche', steps: [{ sel: '[data-gesundheit]' }] } },
  ],
  small: [{ box: 'new', text: 'It is a pattern, never a cause: nothing is graded' }],
  test: [
    'Open Auswerten › Woche: under the week volume stands the card «What movement does for you».',
    'Tap «HRV», then «Sleep»: the line and the sentence change.',
  ],
  since: [],
  de: {
    'What movement does for you': 'Was Bewegung mit dir macht',
    'Auswerten › Woche now sets your active zone minutes of each week against your resting pulse, HRV or sleep, and shows Garmin and Fitbit pulses side by side.': 'Auswerten › Woche setzt jetzt deine Aktivzonen-Minuten jeder Woche gegen Ruhepuls, HRV oder Schlaf und zeigt die Pulse von Garmin und Fitbit nebeneinander.',
    'Active zone minutes per week against your resting pulse, HRV or sleep, with one sentence about the week after': 'Aktivzonen-Minuten pro Woche gegen Ruhepuls, HRV oder Schlaf, mit einem Satz zur Woche danach',
    'Where Garmin and Fitbit both recorded a session, the two pulses stand side by side': 'Wo Garmin und Fitbit dieselbe Einheit aufgezeichnet haben, stehen die zwei Pulse nebeneinander',
    'Only with sessions that both recorded': 'Nur bei Einheiten, die beide aufgezeichnet haben',
    'It is a pattern, never a cause: nothing is graded': 'Es ist ein Muster, nie eine Ursache: nichts wird bewertet',
    'Open Auswerten › Woche: under the week volume stands the card «What movement does for you».': 'Öffne Auswerten › Woche: unter dem Wochenpensum steht die Karte «Was Bewegung mit dir macht».',
    'Tap «HRV», then «Sleep»: the line and the sentence change.': 'Tippe «HRV», dann «Schlaf»: die Linie und der Satz ändern sich.',
  },
};
