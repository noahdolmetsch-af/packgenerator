// «Haken zuerst» (Noah 19.11.2026 «1-5a», Thread «Training erfassen vereinfachen», T2): one tap ticks, the page «Geschafft» opens, duration and feeling are optional
export default {
  title: 'Tick first, details later',
  lead: 'One tap on a tile of Active ticks it and shows what you did; how long and how it was you can add if you like.',
  points: [
    { text: 'A tap on a tile in «Heute abhaken» on Active ticks it and opens «Geschafft» at once', go: 'f.geschafft' },
    { text: 'There you can choose the duration (30, 45, 60, 90 min) and how it was (light, good, hard); both are optional and a second tap takes them back', go: 'f.geschafft' },
  ],
  small: [{ box: 'new', text: 'Long press and the three dots on a tile still open the sheet for place, amount and stopwatch', go: 'f.geschafft' }],
  test: ['On Active tap a tile such as «Liegestütze»: the page «Geschafft» opens.', 'Tap «45 Min» and «gut», then tap «gut» again: it is gone; «Rückgängig» takes the tick back.'],
  since: [],
  de: {
    'Tick first, details later': 'Erst abhaken, Einzelheiten später',
    'One tap on a tile of Active ticks it and shows what you did; how long and how it was you can add if you like.': 'Ein Tipp auf eine Kachel von Aktiv hakt ab und zeigt, was du gemacht hast; wie lange und wie es war, kannst du ergänzen, wenn du magst.',
    'A tap on a tile in «Heute abhaken» on Active ticks it and opens «Geschafft» at once': 'Ein Tipp auf eine Kachel in «Heute abhaken» auf Aktiv hakt ab und öffnet gleich «Geschafft»',
    'There you can choose the duration (30, 45, 60, 90 min) and how it was (light, good, hard); both are optional and a second tap takes them back': 'Dort wählst du die Dauer (30, 45, 60, 90 Min) und wie es war (leicht, gut, hart); beides ist freiwillig und ein zweiter Tipp nimmt es zurück',
    'Long press and the three dots on a tile still open the sheet for place, amount and stopwatch': 'Langes Drücken und die drei Punkte auf einer Kachel öffnen weiter das Blatt für Ort, Menge und Stoppuhr',
    'On Active tap a tile such as «Liegestütze»: the page «Geschafft» opens.': 'Tippe auf Aktiv auf eine Kachel wie «Liegestütze»: die Seite «Geschafft» öffnet sich.',
    'Tap «45 Min» and «gut», then tap «gut» again: it is gone; «Rückgängig» takes the tick back.': 'Tippe «45 Min» und «gut», dann noch einmal «gut»: es ist weg; «Rückgängig» nimmt das Abhaken zurück.',
  },
};
