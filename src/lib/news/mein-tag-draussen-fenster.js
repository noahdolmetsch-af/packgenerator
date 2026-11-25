// «Mein Tag» (Noah 25.11.2026 «1-3», Idee 1): the free, dry window for the daily goal of the challenge «Outdoors»
export default {
  title: 'When do I get my 90 minutes?',
  lead: '«My day» shows where the minutes of your daily goal outdoors fit: free in your calendar, dry, before sunset.',
  points: [
    { text: 'A dashed block in the timeline shows the best window for the minutes still missing today (or the whole goal on a later day); «Plan it» sets it as your own date, with Undo', go: 'f.meintag' },
    { text: 'When no free dry window is long enough, a line says so and names the longest free and dry stretch', go: 'f.meintag' },
  ],
  test: ['Open «My day» today while the challenge «Outdoors» runs and today\'s goal is not reached: a dashed block shows a time and «Plan it».', 'Tap «Plan it»: the block becomes your own date; tap «Undo»: the suggestion is back.', 'Open a later day: the block shows the whole goal, in a dry free window.'],
  de: {
    'When do I get my 90 minutes?': 'Wann schaffe ich meine 90 Minuten?',
    '«My day» shows where the minutes of your daily goal outdoors fit: free in your calendar, dry, before sunset.': '«Mein Tag» zeigt, wo die Minuten deines Tagesziels draussen hinpassen: frei in deinem Kalender, trocken, vor Sonnenuntergang.',
    'A dashed block in the timeline shows the best window for the minutes still missing today (or the whole goal on a later day); «Plan it» sets it as your own date, with Undo': 'Ein gestrichelter Block in der Zeitleiste zeigt das beste Fenster für die Minuten, die heute noch fehlen (an einem späteren Tag für das ganze Ziel); «Einplanen» legt ihn als eigenen Termin an, mit Rückgängig',
    'When no free dry window is long enough, a line says so and names the longest free and dry stretch': 'Ist kein freies, trockenes Fenster lang genug, sagt das eine Zeile und nennt das längste freie, trockene Stück',
    'Open «My day» today while the challenge «Outdoors» runs and today\'s goal is not reached: a dashed block shows a time and «Plan it».': 'Öffne «Mein Tag» heute, solange die Challenge «Draussen» läuft und das Tagesziel noch nicht erreicht ist: ein gestrichelter Block zeigt eine Zeit und «Einplanen».',
    'Tap «Plan it»: the block becomes your own date; tap «Undo»: the suggestion is back.': 'Tippe auf «Einplanen»: der Block wird dein eigener Termin; tippe auf «Rückgängig»: der Vorschlag ist wieder da.',
    'Open a later day: the block shows the whole goal, in a dry free window.': 'Öffne einen späteren Tag: der Block zeigt das ganze Ziel in einem trockenen, freien Fenster.',
  },
};
