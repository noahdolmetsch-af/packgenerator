// «Challenge zählt Meditation von selbst» (Noah 24.11.2026 «1-5a»/«ja», Schritt 2 der Meditationsseite)
export default {
  title: 'Meditation counts for your challenge by itself',
  lead: 'A challenge can now «belong to Meditation»: every meditation session counts toward its daily goal, and a session that reaches the goal ticks the day.',
  points: [
    { text: 'The challenge «30 days of meditation» counts every session by itself, so you no longer tick it off after a session', go: { href: '#/flow/act/meditation', where: 'Meditation, under the duration buttons: Start the challenge.' } },
    { text: 'Any challenge in minutes can get «Belongs to: Meditation» in its window (pencil on the card), and it can be taken off again', go: { href: '#/flow/challenges', where: 'Challenges, the pencil on a challenge in minutes.' } },
  ],
  small: [{ box: 'new', text: 'Minutes you add by hand still count on top; taking back the tick takes away only the minutes added by hand' }, { box: 'new', text: 'With the phone reminder on, a day that the sessions reached sends no reminder' }],
  test: ['Open Meditation and start the challenge «30 days of meditation» (the box «Belongs to: Meditation» is ticked).', 'Meditate for a few minutes, or add a session; the card shows «{n} min from meditation» and the minutes count toward the goal.', 'With a session of 10 minutes or more the day is ticked by itself («Ticked by itself»).'],
  since: [],
  de: {
    'Meditation counts for your challenge by itself': 'Meditation zählt von selbst für deine Challenge',
    'A challenge can now «belong to Meditation»: every meditation session counts toward its daily goal, and a session that reaches the goal ticks the day.': 'Eine Challenge kann jetzt «zur Meditation gehören»: Jede Meditationssitzung zählt zum Tagesziel, und eine Sitzung, die das Ziel erreicht, hakt den Tag ab.',
    'The challenge «30 days of meditation» counts every session by itself, so you no longer tick it off after a session': 'Die Challenge «30 Tage Meditation» zählt jede Sitzung von selbst, du hakst sie nach einer Sitzung nicht mehr ab',
    'Meditation, under the duration buttons: Start the challenge.': 'Meditation, unter den Dauer-Knöpfen: die Challenge starten.',
    'Any challenge in minutes can get «Belongs to: Meditation» in its window (pencil on the card), and it can be taken off again': 'Jede Challenge in Minuten kann im Fenster (Stift auf der Karte) «Gehört zu: Meditation» bekommen, und es lässt sich wieder abstellen',
    'Challenges, the pencil on a challenge in minutes.': 'Challenges, der Stift an einer Challenge in Minuten.',
    'Minutes you add by hand still count on top; taking back the tick takes away only the minutes added by hand': 'Minuten von Hand zählen weiter dazu; «Abhaken zurücknehmen» nimmt nur die Minuten von Hand weg',
    'With the phone reminder on, a day that the sessions reached sends no reminder': 'Bei eingeschalteter Handy-Erinnerung schickt ein Tag, den die Sitzungen erreicht haben, keine Erinnerung',
    'Open Meditation and start the challenge «30 days of meditation» (the box «Belongs to: Meditation» is ticked).': 'Öffne Meditation und starte die Challenge «30 Tage Meditation» (das Kästchen «Gehört zu: Meditation» ist angehakt).',
    'Meditate for a few minutes, or add a session; the card shows «{n} min from meditation» and the minutes count toward the goal.': 'Meditiere ein paar Minuten oder trage eine Sitzung nach; die Karte zeigt «{n} Min aus der Meditation», und die Minuten zählen zum Ziel.',
    'With a session of 10 minutes or more the day is ticked by itself («Ticked by itself»).': 'Mit einer Sitzung von 10 Minuten oder mehr ist der Tag von selbst abgehakt («Von selbst abgehakt»).',
  },
};
