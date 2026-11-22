// «Nachttemperatur» (Noah 06.11.2026 «1a und c 2a 3a 4a 5a», «push ja», PR 3): a push message in the evening about tonight's lowest temperature
export default {
  title: 'Night temperature in the evening',
  lead: 'A message on your phone at 19:00: how low it gets tonight, with a word on frost.',
  points: [
    { text: 'Every evening you get «Tonight down to 1 °C», with «Frost is possible» under 0 °C or the change against last night from 2 degrees', go: { href: '#/me/push', where: 'Me › Push messages: the switch «Night temperature in the evening» (off until you switch it on; needs your home place).' } },
    { text: 'A tap on the message opens the weather page with the card «Night temperature»', go: { href: '#/wetter', where: 'Weather › part «Now», card «Night temperature».' } },
  ],
  small: [{ box: 'new', text: 'The switch «Night temperature in the evening» is off until you switch it on' }],
  test: [
    'Open Me › Push messages: the switch «Night temperature in the evening» is at the end of the list and off.',
    'Switch it on: the setting stays after reloading the page.',
    'In the evening at 19:00 the message comes (push must be on and your home place set).',
  ],
  since: [],
  de: {
    'Night temperature in the evening': 'Nachttemperatur am Abend',
    'A message on your phone at 19:00: how low it gets tonight, with a word on frost.': 'Eine Nachricht aufs Handy um 19:00: wie tief es heute Nacht geht, mit einem Wort zu Frost.',
    'Every evening you get «Tonight down to 1 °C», with «Frost is possible» under 0 °C or the change against last night from 2 degrees': 'Jeden Abend bekommst du «Heute Nacht bis 1 °C», dazu «Frost möglich» unter 0 °C oder die Veränderung zu letzter Nacht ab 2 Grad',
    'Me › Push messages: the switch «Night temperature in the evening» (off until you switch it on; needs your home place).': 'Ich › Push-Erinnerungen: der Schalter «Nachttemperatur am Abend» (aus, bis du ihn einschaltest; braucht deinen Wohnort).',
    'A tap on the message opens the weather page with the card «Night temperature»': 'Ein Tipp auf die Nachricht öffnet die Wetterseite mit der Karte «Nachttemperatur»',
    'Weather › part «Now», card «Night temperature».': 'Wetter › Reiter «Jetzt», Karte «Nachttemperatur».',
    'The switch «Night temperature in the evening» is off until you switch it on': 'Der Schalter «Nachttemperatur am Abend» ist aus, bis du ihn einschaltest',
    'Open Me › Push messages: the switch «Night temperature in the evening» is at the end of the list and off.': 'Öffne Ich › Push-Erinnerungen: Der Schalter «Nachttemperatur am Abend» steht am Ende der Liste und ist aus.',
    'Switch it on: the setting stays after reloading the page.': 'Schalte ihn ein: Die Einstellung bleibt nach dem Neuladen der Seite.',
    'In the evening at 19:00 the message comes (push must be on and your home place set).': 'Am Abend um 19:00 kommt die Nachricht (Push muss an sein und der Wohnort gesetzt).',
  },
};
