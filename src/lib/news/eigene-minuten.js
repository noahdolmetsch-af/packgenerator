// «Eigene Dauer» (Noah 21.11.2026, Thread «Training erfassen vereinfachen»): next to the duration buttons there is always a field for your own minutes
export default {
  title: 'Your own length in minutes',
  lead: 'Next to the buttons for how long (30, 45, 60, 90) there is now a field where you type your own minutes.',
  points: [
    { text: 'On «Geschafft» a field «Own length» takes whole minutes from 1 to 1440; Enter or «Set» saves, and the minutes show at the top and count in «This week»', go: 'f.geschafft' },
    { text: 'The buttons stay as they are; a length you typed that is none of them stands in the field', go: 'f.geschafft' },
  ],
  small: [],
  test: ['On Active tap a tile such as «Liegestütze», then type 75 in the field «Eigene Dauer» and tap «Setzen»: the top shows 75 Min.', 'Type 7,5 and press Enter: the field says whole minutes from 1; the 75 stays.'],
  since: [],
  de: {
    'Your own length in minutes': 'Deine eigene Dauer in Minuten',
    'Next to the buttons for how long (30, 45, 60, 90) there is now a field where you type your own minutes.': 'Neben den Knöpfen für die Dauer (30, 45, 60, 90) steht jetzt ein Feld, in das du deine eigenen Minuten schreibst.',
    'On «Geschafft» a field «Own length» takes whole minutes from 1 to 1440; Enter or «Set» saves, and the minutes show at the top and count in «This week»': 'Auf «Geschafft» nimmt das Feld «Eigene Dauer» ganze Minuten von 1 bis 1440; Enter oder «Setzen» speichert, und die Minuten stehen oben und zählen in «Diese Woche»',
    'The buttons stay as they are; a length you typed that is none of them stands in the field': 'Die Knöpfe bleiben wie sie sind; eine getippte Dauer, die keiner von ihnen ist, steht im Feld',
    'On Active tap a tile such as «Liegestütze», then type 75 in the field «Eigene Dauer» and tap «Setzen»: the top shows 75 Min.': 'Tippe auf Aktiv auf eine Kachel wie «Liegestütze», schreibe dann 75 ins Feld «Eigene Dauer» und tippe «Setzen»: oben steht 75 Min.',
    'Type 7,5 and press Enter: the field says whole minutes from 1; the 75 stays.': 'Schreibe 7,5 und drücke Enter: das Feld sagt «Ganze Minuten von 1 bis 1440»; die 75 bleibt.',
  },
};
