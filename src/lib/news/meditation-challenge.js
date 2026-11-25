// «Meditation: Starten zuerst, Challenge darunter» (Noah 24.11.2026 «1-5a»): the start on top, the challenge under the durations
export default {
  title: 'Meditation: start first, challenge underneath',
  lead: 'On the page Meditation the big start button is on top. Right under the durations you find the challenge «30 days of meditation».',
  points: [
    { text: 'The start button sits at the top of the timer card, the clock below the durations', go: { href: '#/flow/act/meditation', steps: [{ sel: '[data-start]' }], where: 'Week › Everyday › Meditation, the card Timer.' } },
    { text: 'Under the durations: the row «Challenge: 30 days of meditation» with «Start», or its card with «Tick off» while it runs', go: { href: '#/flow/act/meditation', steps: [{ sel: '[data-med-challenge]' }], where: 'Week › Everyday › Meditation, under the durations.' } },
  ],
  small: [{ box: 'new', text: 'The challenge stays changeable: the pencil opens the same window as under Challenges' }],
  test: [
    'Open Week › Everyday › Meditation: the big start button is at the top of the card Timer.',
    'Under the durations tap «Start» at the row «Challenge: 30 days of meditation» and save the window.',
    'The row becomes the card with «Day 1 of 30» and the button «Tick off».',
  ],
  since: [],
  de: {
    'Meditation: start first, challenge underneath': 'Meditation: Starten zuerst, Challenge darunter',
    'On the page Meditation the big start button is on top. Right under the durations you find the challenge «30 days of meditation».': 'Auf der Seite Meditation steht der grosse Startknopf zuoberst. Direkt unter den Dauern findest du die Challenge «30 Tage Meditation».',
    'The start button sits at the top of the timer card, the clock below the durations': 'Der Startknopf steht zuoberst in der Timer-Karte, die Uhr unter den Dauern',
    'Week › Everyday › Meditation, the card Timer.': 'Woche › Alltag › Meditation, die Karte Timer.',
    'Under the durations: the row «Challenge: 30 days of meditation» with «Start», or its card with «Tick off» while it runs': 'Unter den Dauern: die Zeile «Challenge: 30 Tage Meditation» mit «Starten», oder ihre Karte mit «Abhaken», solange sie läuft',
    'Week › Everyday › Meditation, under the durations.': 'Woche › Alltag › Meditation, unter den Dauern.',
    'The challenge stays changeable: the pencil opens the same window as under Challenges': 'Die Challenge bleibt änderbar: der Stift öffnet dasselbe Fenster wie unter Challenges',
    'Open Week › Everyday › Meditation: the big start button is at the top of the card Timer.': 'Öffne Woche › Alltag › Meditation: der grosse Startknopf steht zuoberst in der Karte Timer.',
    'Under the durations tap «Start» at the row «Challenge: 30 days of meditation» and save the window.': 'Tippe unter den Dauern in der Zeile «Challenge: 30 Tage Meditation» auf «Starten» und speichere das Fenster.',
    'The row becomes the card with «Day 1 of 30» and the button «Tick off».': 'Die Zeile wird zur Karte mit «Tag 1 von 30» und dem Knopf «Abhaken».',
  },
};
