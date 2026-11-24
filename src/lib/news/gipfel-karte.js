// «Gipfel-Karte mit Lücken» (Noah 24.11.2026 «alle 1-5 zusammen», Gipfelbuch ausbauen, Idee 2)
export default {
  title: 'Map of summits and passes',
  lead: 'A map shows where you have been and which summits and passes near you are still open.',
  points: [
    { text: 'Summit book › «See them on the map»: your places strong, the six nearest open ones lighter, the rest grey', go: { href: '#/flow/gipfelbuch', steps: [{ sel: '[data-gb-map]' }] } },
    { text: 'Under the map «Open near you»: the distance, «Tours toward it» from the tour suggestions and «I was there»', go: { href: '#/flow/gipfelbuch/karte', where: 'Shows after you set your home place: tap «Set home place» on the map page.' } },
  ],
  small: [{ box: 'new', text: 'Filters for summits, passes and each collection; a switch between Switzerland and the Alps', go: { href: '#/flow/gipfelbuch/karte', steps: [{ sel: '[data-gk-chip]' }] } }],
  test: [
    'Open the summit book and tap «See them on the map» under «Collections».',
    'Set your home place if the page asks for it; the six nearest open places appear under the map.',
    'Tap «Tours toward it» at one of them: up to three tours of the suggestions that lead there, or a note that none does.',
    'Tap a filter, for example «Passes over 2000 m»: the map shows only those.',
  ],
  since: [],
  de: {
    'Map of summits and passes': 'Karte der Gipfel und Pässe',
    'A map shows where you have been and which summits and passes near you are still open.': 'Eine Karte zeigt, wo du warst und welche Gipfel und Pässe in deiner Nähe noch offen sind.',
    'Summit book › «See them on the map»: your places strong, the six nearest open ones lighter, the rest grey': 'Gipfelbuch › «Auf der Karte ansehen»: deine Orte kräftig, die sechs nächsten offenen heller, der Rest grau',
    'Under the map «Open near you»: the distance, «Tours toward it» from the tour suggestions and «I was there»': 'Unter der Karte «In deiner Nähe offen»: die Entfernung, «Touren dorthin» aus den Tourenvorschlägen und «Ich war da»',
    'Shows after you set your home place: tap «Set home place» on the map page.': 'Erscheint, sobald du deinen Wohnort festgelegt hast: tippe auf der Kartenseite auf «Wohnort setzen».',
    'Filters for summits, passes and each collection; a switch between Switzerland and the Alps': 'Filter für Gipfel, Pässe und jede Sammlung; ein Schalter zwischen Schweiz und Alpen',
    'Open the summit book and tap «See them on the map» under «Collections».': 'Öffne das Gipfelbuch und tippe unter «Sammlungen» auf «Auf der Karte ansehen».',
    'Set your home place if the page asks for it; the six nearest open places appear under the map.': 'Lege deinen Wohnort fest, wenn die Seite danach fragt; die sechs nächsten offenen Orte erscheinen unter der Karte.',
    'Tap «Tours toward it» at one of them: up to three tours of the suggestions that lead there, or a note that none does.': 'Tippe bei einem auf «Touren dorthin»: bis zu drei Touren der Vorschläge, die dorthin führen, oder ein Hinweis, dass keine dorthin führt.',
    'Tap a filter, for example «Passes over 2000 m»: the map shows only those.': 'Tippe einen Filter an, zum Beispiel «Pässe über 2000 m»: die Karte zeigt nur diese.',
  },
};
