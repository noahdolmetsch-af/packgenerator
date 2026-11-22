// «Leeres Handy erkennen» (Noah 22.11.2026 «2a», Thread «Sync»): Handy startete leer, weil der Browser die Daten geräumt hatte
export default {
  title: 'A new device can connect right at the start',
  lead: 'When the app starts empty, you can connect it with the code of your other device at once.',
  points: [{ text: 'The start window has a third choice: «I already use the app on another device»', go: { href: '#/', where: 'Only on a new or emptied device: the window at the first start.' } }],
  small: [{ box: 'nicer', text: 'It opens the field «Code from the other device»; your data comes from there and nothing is written over it' }],
  test: [
    'On a new or emptied device, open the app: the start window shows three choices.',
    'Tap «I already use the app on another device»: the field «Code from the other device» opens.',
    'Type the code of the computer and tap «Pair»: the data of the computer arrives.',
  ],
  since: [],
  de: {
    'A new device can connect right at the start': 'Ein neues Gerät verbindet sich gleich am Start',
    'When the app starts empty, you can connect it with the code of your other device at once.': 'Startet die App leer, verbindest du sie sofort mit dem Code deines anderen Geräts.',
    'The start window has a third choice: «I already use the app on another device»': 'Das Startfenster hat eine dritte Wahl: «Ich nutze die App schon auf einem anderen Gerät»',
    'Only on a new or emptied device: the window at the first start.': 'Nur auf einem neuen oder geleerten Gerät: das Fenster beim ersten Start.',
    'It opens the field «Code from the other device»; your data comes from there and nothing is written over it': 'Es öffnet das Feld «Code vom anderen Gerät»; deine Daten kommen von dort, und es wird nichts überschrieben',
    'On a new or emptied device, open the app: the start window shows three choices.': 'Öffne die App auf einem neuen oder geleerten Gerät: Das Startfenster zeigt drei Wahlen.',
    'Tap «I already use the app on another device»: the field «Code from the other device» opens.': 'Tippe «Ich nutze die App schon auf einem anderen Gerät»: Das Feld «Code vom anderen Gerät» öffnet sich.',
    'Type the code of the computer and tap «Pair»: the data of the computer arrives.': 'Tippe den Code vom Computer und tippe «Koppeln»: Die Daten vom Computer kommen.',
  },
};
