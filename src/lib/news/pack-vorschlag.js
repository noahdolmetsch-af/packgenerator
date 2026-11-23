// «Dein Vorschlag» (Warteliste 4; Noah 22.11.2026 «1b», «5a»): the list of a trip as an offer, and the button «Suggestion in a minute»
export default {
  title: 'Your suggestion for the packing list',
  lead: 'A new page shows the list of your tour as an offer: weight step by step, what was left out, what is missing and how it compares with last time.',
  points: [
    { text: 'In «New trip» the button «Suggestion in a minute» makes the trip and shows «Your suggestion»; «Take over the list» opens the packing list in Steps', go: { href: '#/pack/vorschlag', where: 'Trips › New trip, at the top of the window.' } },
    { text: '«Left out» lists what you took off the list, with «+ Take along anyway»; «You are missing» names the gaps of your onion; «Like last time?» compares with the most alike earlier trip', go: null },
  ],
  small: [],
  test: [
    'Tap «New trip» on Trips, then «Suggestion in a minute»: the trip is made and «Your suggestion» opens.',
    'Tap «Change» at a step: the packing list opens in Steps at that step.',
    'Under «Like last time?» tap «Compare»: it shows what is only on this list and what only on the last one.',
  ],
  since: ['f.packvorschlag'],
  de: {
    'Your suggestion for the packing list': 'Dein Vorschlag für die Packliste',
    'A new page shows the list of your tour as an offer: weight step by step, what was left out, what is missing and how it compares with last time.': 'Eine neue Seite zeigt die Liste deiner Tour als Angebot: Gewicht Schritt für Schritt, was weggelassen wurde, was fehlt und wie es sich zu letztes Mal verhält.',
    'In «New trip» the button «Suggestion in a minute» makes the trip and shows «Your suggestion»; «Take over the list» opens the packing list in Steps': 'In «Neue Tour» macht der Knopf «Vorschlag in einer Minute» die Tour und zeigt «Dein Vorschlag»; «Liste übernehmen» öffnet die Packliste in Schritten',
    'Trips › New trip, at the top of the window.': 'Touren › Neue Tour, oben im Fenster.',
    '«Left out» lists what you took off the list, with «+ Take along anyway»; «You are missing» names the gaps of your onion; «Like last time?» compares with the most alike earlier trip': '«Weggelassen» nennt, was du von der Liste genommen hast, mit «+ trotzdem mitnehmen»; «Das fehlt dir» nennt die Lücken deiner Zwiebel; «Wie letztes Mal?» vergleicht mit der ähnlichsten früheren Tour',
    'Tap «New trip» on Trips, then «Suggestion in a minute»: the trip is made and «Your suggestion» opens.': '«Neue Tour» auf Touren antippen, dann «Vorschlag in einer Minute»: die Tour ist gemacht und «Dein Vorschlag» öffnet.',
    'Tap «Change» at a step: the packing list opens in Steps at that step.': '«Ändern» bei einem Schritt antippen: die Packliste öffnet in Schritten bei diesem Schritt.',
    'Under «Like last time?» tap «Compare»: it shows what is only on this list and what only on the last one.': 'Unter «Wie letztes Mal?» «Vergleichen» antippen: es zeigt, was nur auf dieser Liste steht und was nur auf der letzten.',
  },
};
