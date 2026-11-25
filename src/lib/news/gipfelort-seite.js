// «Gipfelbuch ausbauen» (Noah 24.11.2026 «alle 1-5 zusammen» und «1-5a»): Ort-Seite, Namen, Sammlungen, Karte, neues Design in einem PR
export default {
  title: 'The summit book grows',
  lead: 'Every place has its own page, passes and summits come with their names, and a map shows what is still open near you.',
  points: [
    { text: 'Every place has its own page: all visits as a timeline with temperature and the time up, a note and your own photos', go: { href: '#/flow/gipfelbuch', where: 'Shows after you have a place in the summit book: tap it, then «Open the page of this place».' } },
    { text: 'Passes and summits on your rides come with their names, rides over the same place are one line; «Collections» count what you have, no goal, no bar, and your own lists work too', go: { href: '#/flow/gipfelbuch', where: 'Shows when a ride with a route went over a pass or a summit of the list; the collections are under «Collections» above the places.' } },
    { text: 'The summit map shows the real map around you with your places and the open ones near you, each with «Tours ›» and «I was there»', go: { href: '#/flow/gipfelbuch/karte', where: 'Shows after you set your home place: tap «Map» in the summit book.' } },
  ],
  small: [{ box: 'new', text: 'The overview is calmer: three numbers on top, a switch «List · Map · Collections», the suggestions in one line' }],
  test: [
    'Open the summit book: three numbers, the switch «List · Map · Collections» and one line with the suggestions from your rides.',
    'Tap a place, then «Open the page of this place»; tap «Note» on a visit, type a few words and save.',
    'Tap «Collections» and open «Passes over 2000 m»: the number says how many of them you have.',
    'Tap «Map»: the real map shows the places near you; tap «I was there» at an open one, pick the day and save.',
  ],
  since: [],
  de: {
    'The summit book grows': 'Das Gipfelbuch wächst',
    'Every place has its own page, passes and summits come with their names, and a map shows what is still open near you.': 'Jeder Ort hat eine eigene Seite, Pässe und Gipfel kommen mit Namen, und eine Karte zeigt, was in deiner Nähe noch offen ist.',
    'Every place has its own page: all visits as a timeline with temperature and the time up, a note and your own photos': 'Jeder Ort hat eine eigene Seite: alle Besuche als Zeitleiste mit Temperatur und Zeit hoch, eine Notiz und eigene Fotos',
    'Shows after you have a place in the summit book: tap it, then «Open the page of this place».': 'Erscheint, sobald du einen Ort im Gipfelbuch hast: tippe ihn an, dann «Seite dieses Ortes öffnen».',
    'Passes and summits on your rides come with their names, rides over the same place are one line; «Collections» count what you have, no goal, no bar, and your own lists work too': 'Pässe und Gipfel auf deinen Fahrten kommen mit Namen, Fahrten über denselben Ort sind eine Zeile; «Sammlungen» zählen, was du hast, ohne Ziel und ohne Balken, und eigene Listen gehen auch',
    'Shows when a ride with a route went over a pass or a summit of the list; the collections are under «Collections» above the places.': 'Erscheint, sobald eine Fahrt mit Strecke über einen Pass oder Gipfel der Liste führte; die Sammlungen stehen unter «Sammlungen» im Gipfelbuch.',
    'The summit map shows the real map around you with your places and the open ones near you, each with «Tours ›» and «I was there»': 'Die Gipfel-Karte zeigt die echte Karte um dich mit deinen Orten und den offenen in deiner Nähe, je mit «Touren ›» und «Ich war da»',
    'Shows after you set your home place: tap «Map» in the summit book.': 'Erscheint, sobald du deinen Wohnort festgelegt hast: tippe im Gipfelbuch auf «Karte».',
    'The overview is calmer: three numbers on top, a switch «List · Map · Collections», the suggestions in one line': 'Die Übersicht ist ruhiger: drei Zahlen oben, ein Schalter «Liste · Karte · Sammlungen», die Vorschläge in einer Zeile',
    'Open the summit book: three numbers, the switch «List · Map · Collections» and one line with the suggestions from your rides.': 'Öffne das Gipfelbuch: drei Zahlen, der Schalter «Liste · Karte · Sammlungen» und eine Zeile mit den Vorschlägen aus deinen Fahrten.',
    'Tap a place, then «Open the page of this place»; tap «Note» on a visit, type a few words and save.': 'Tippe einen Ort an, dann «Seite dieses Ortes öffnen»; tippe bei einem Besuch auf «Notiz», schreibe ein paar Worte und speichere.',
    'Tap «Collections» and open «Passes over 2000 m»: the number says how many of them you have.': 'Tippe auf «Sammlungen» und öffne «Pässe über 2000 m»: die Zahl sagt, wie viele du davon hast.',
    'Tap «Map»: the real map shows the places near you; tap «I was there» at an open one, pick the day and save.': 'Tippe auf «Karte»: die echte Karte zeigt die Orte in deiner Nähe; tippe bei einem offenen auf «Ich war da», wähle den Tag und speichere.',
  },
};
