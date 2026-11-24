// «Sammlungen und Namen im Gipfelbuch» (Noah 24.11.2026 «alle 1-5 zusammen», Gipfelbuch ausbauen, Ideen 1 und 4)
export default {
  title: 'Summit book: names and collections',
  lead: 'The summit book names the passes and summits on your rides and keeps lists to collect.',
  points: [
    { text: 'In «Found in your rides» a pass or summit now comes with its name; one tap puts it in the book', go: { href: '#/flow/gipfelbuch', where: 'Shows when a ride with a route went over a pass or a summit of the list.' } },
    { text: 'Below the places: «Collections» with all four-thousanders, passes over 2000 m and the Zürich house mountains; it only says how many you have', go: { href: '#/flow/gipfelbuch', steps: [{ sel: '[data-gb-colls]' }] } },
    { text: 'Your own list: «New list» with a name and the places, one per line; change or delete it any time', go: { href: '#/flow/gipfelbuch', steps: [{ sel: '[data-gb-list-new]' }] } },
  ],
  small: [{ box: 'new', text: 'A list can be hidden and shown again; «I was there» puts a place of a list in the book' }],
  test: [
    'Open the summit book and scroll down to «Collections».',
    'Open «Passes over 2000 m»: the number says how many of them you have; no goal, no bar.',
    'Tap «I was there» at a pass, pick the day and save: the pass is in the book and the number goes up by one.',
    'Tap «New list», name it, type two places and save; delete the list again and tap «Undo».',
  ],
  since: [],
  de: {
    'Summit book: names and collections': 'Gipfelbuch: Namen und Sammlungen',
    'The summit book names the passes and summits on your rides and keeps lists to collect.': 'Das Gipfelbuch nennt die Pässe und Gipfel auf deinen Fahrten und führt Listen zum Sammeln.',
    'In «Found in your rides» a pass or summit now comes with its name; one tap puts it in the book': 'Unter «Gefunden in deinen Fahrten» steht ein Pass oder Gipfel jetzt mit Namen; ein Tipp trägt ihn ins Buch ein',
    'Shows when a ride with a route went over a pass or a summit of the list.': 'Erscheint, sobald eine Fahrt mit Strecke über einen Pass oder Gipfel der Liste führte.',
    'Below the places: «Collections» with all four-thousanders, passes over 2000 m and the Zürich house mountains; it only says how many you have': 'Unter den Orten: «Sammlungen» mit allen Viertausendern, Pässen über 2000 m und den Zürcher Hausbergen; es steht nur da, wie viele du hast',
    'Your own list: «New list» with a name and the places, one per line; change or delete it any time': 'Deine eigene Liste: «Neue Liste» mit Namen und den Orten, einer pro Zeile; du änderst oder löschst sie jederzeit',
    'A list can be hidden and shown again; «I was there» puts a place of a list in the book': 'Eine Liste lässt sich ausblenden und wieder zeigen; «Ich war da» trägt einen Ort der Liste ins Buch ein',
    'Open the summit book and scroll down to «Collections».': 'Öffne das Gipfelbuch und scrolle zu «Sammlungen».',
    'Open «Passes over 2000 m»: the number says how many of them you have; no goal, no bar.': 'Öffne «Pässe über 2000 m»: die Zahl sagt, wie viele du davon hast; kein Ziel, kein Balken.',
    'Tap «I was there» at a pass, pick the day and save: the pass is in the book and the number goes up by one.': 'Tippe bei einem Pass auf «Ich war da», wähle den Tag und speichere: der Pass ist im Buch und die Zahl steigt um eins.',
    'Tap «New list», name it, type two places and save; delete the list again and tap «Undo».': 'Tippe auf «Neue Liste», gib ihr einen Namen, tippe zwei Orte und speichere; lösche die Liste wieder und tippe auf «Rückgängig».',
  },
};
