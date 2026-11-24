// «Velos: Pflege vor den Taschen» (Noah 23.11.2026 «1-5 a», Punkt 2): on a phone care comes first, the Garmin pages are one row in «More»
export default {
  title: 'Bikes: care before the bags',
  lead: 'On a phone «Care and parts» of the chosen bike now stands right under the drawing, before the bags. The four small Garmin page pictures are one row in «More».',
  points: [{ text: 'On Bikes, «Care and parts» comes before «Bags»; the Garmin pages are one row in «More»', go: { href: '#/bikes', steps: [{ sel: '[data-garmin-row]' }], where: 'Bikes › Setup, on a phone: «More» at the bottom, the row «Garmin pages».' } }],
  small: [],
  test: ['Open Bikes on a phone and scroll to the bike below the cards: under the drawing stands «Care and parts», then «Bags».', 'At the bottom, in «More», tap «Garmin pages»: the Garmin pages of the bike open.', 'On a computer nothing changes: care stays in the right column, the Garmin card under it.'],
  since: [],
  de: {
    'Bikes: care before the bags': 'Velos: Pflege vor den Taschen',
    'On a phone «Care and parts» of the chosen bike now stands right under the drawing, before the bags. The four small Garmin page pictures are one row in «More».': 'Am Handy steht «Pflege und Teile» des gewählten Velos jetzt gleich unter der Zeichnung, vor den Taschen. Die vier kleinen Garmin-Bilder sind eine Zeile in «Mehr».',
    'On Bikes, «Care and parts» comes before «Bags»; the Garmin pages are one row in «More»': 'Bei Velos steht «Pflege und Teile» vor den «Taschen»; die Garmin-Seiten sind eine Zeile in «Mehr»',
    'Bikes › Setup, on a phone: «More» at the bottom, the row «Garmin pages».': 'Velos › Setup, am Handy: «Mehr» ganz unten, die Zeile «Garmin-Seiten».',
    'Open Bikes on a phone and scroll to the bike below the cards: under the drawing stands «Care and parts», then «Bags».': 'Öffne Velos am Handy und scrolle zum Velo unter den Karten: unter der Zeichnung steht «Pflege und Teile», dann «Taschen».',
    'At the bottom, in «More», tap «Garmin pages»: the Garmin pages of the bike open.': 'Ganz unten in «Mehr» tippe «Garmin-Seiten»: die Garmin-Seiten des Velos öffnen sich.',
    'On a computer nothing changes: care stays in the right column, the Garmin card under it.': 'Am Computer ändert sich nichts: die Pflege bleibt in der rechten Spalte, die Garmin-Karte darunter.',
  },
};
