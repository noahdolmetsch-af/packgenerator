// «Die App wertet selbst aus» (Noah 27.11.2026 «1b 2a 3b 4a 5b», Thread «Abhaken auf einen Blick verbessern»)
export default {
  title: 'The app evaluates your ticks',
  lead: 'After a tick you read what it means for this activity, and Auswerten › Woche tells you about your day and your week.',
  points: [
    { text: 'After a tick, a card on the page «Done» says what it means: a series, a long pause, how often this week', go: { href: '#/flow', steps: [{ sel: '[data-act]' }] } },
    { text: 'Choose the kind of each sport (strength, endurance …), in the sport or for all at once', go: { href: '#/auswerten/woche', steps: [{ sel: '[data-tagwoche]' }] } },
    { text: 'On Auswerten › Woche: your day and your week against your usual, and your resting pulse and sleep after hard days', go: { href: '#/auswerten/woche', steps: [{ sel: '[data-tagwoche]' }] } },
  ],
  small: [{ box: 'new', text: 'Where minutes are missing, the ticks are counted. Nothing is graded.' }],
  test: [
    'Tick a sport on Active: the page «Done» opens with the card «What this tick says» on top.',
    'Open Auswerten › Woche: on top stands «Your day and your week»; tap «choose now» in the row «Mix» and set the kind of two sports.',
  ],
  since: [],
  de: {
    'The app evaluates your ticks': 'Die App wertet deine Haken aus',
    'After a tick you read what it means for this activity, and Auswerten › Woche tells you about your day and your week.': 'Nach einem Haken liest du, was er für diese Aktivität heisst, und Auswerten › Woche erzählt dir von deinem Tag und deiner Woche.',
    'After a tick, a card on the page «Done» says what it means: a series, a long pause, how often this week': 'Nach einem Haken sagt eine Karte auf der Seite «Geschafft», was er heisst: eine Serie, eine lange Pause, wie oft diese Woche',
    'Choose the kind of each sport (strength, endurance …), in the sport or for all at once': 'Wähle die Art jeder Sportart (Kraft, Ausdauer …), in der Sportart oder für alle auf einmal',
    'On Auswerten › Woche: your day and your week against your usual, and your resting pulse and sleep after hard days': 'In Auswerten › Woche: dein Tag und deine Woche gegen dein Übliches, und dein Ruhepuls und Schlaf nach harten Tagen',
    'Where minutes are missing, the ticks are counted. Nothing is graded.': 'Wo Minuten fehlen, werden die Haken gezählt. Nichts wird bewertet.',
    'Tick a sport on Active: the page «Done» opens with the card «What this tick says» on top.': 'Hake eine Sportart auf Aktiv ab: die Seite «Geschafft» öffnet sich oben mit der Karte «Was dieser Haken sagt».',
    'Open Auswerten › Woche: on top stands «Your day and your week»; tap «choose now» in the row «Mix» and set the kind of two sports.': 'Öffne Auswerten › Woche: oben steht «Dein Tag und deine Woche»; tippe in der Zeile «Mischung» auf «jetzt wählen» und setze die Art von zwei Sportarten.',
  },
};
