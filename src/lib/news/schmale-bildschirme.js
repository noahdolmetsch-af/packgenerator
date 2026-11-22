// Durchklick Etappe 6 (Noah 05.11.2026, Befunde E6-002 bis E6-004): small screens (320 px) and a race list at 390 px
export default {
  title: 'Small screens fit better',
  lead: 'Four pages no longer push the page wider or cut a button text on a small phone.',
  points: [
    { text: 'The race to-do rows (Papierkram, Material) put their buttons on a second line, and the words stay whole', go: null },
    { text: 'On the packing day the main button says «Fertig gepackt» in full', go: null },
    { text: 'The list «+ Wert» in Analyse and the time-zone rows keep to the screen width', go: null },
  ],
  small: [{ box: 'new', text: 'The «Alle»-Chips of Analyse stay on the page at 320 px', go: null }],
  test: [
    'Open a race › Vorbereiten, scroll to «Papierkram»: each row shows the name in full, the buttons sit on a line below.',
    'Open a trip › Packen (Tag), look at the main button at the bottom: «Fertig gepackt» is readable in full.',
    'Open Ich › Werkzeugkasten › Zeitzonen: the page does not move sideways.',
  ],
  since: [],
  de: {
    'Small screens fit better': 'Kleine Bildschirme passen besser',
    'Four pages no longer push the page wider or cut a button text on a small phone.': 'Vier Seiten schieben die Seite auf einem kleinen Handy nicht mehr breiter und schneiden keinen Knopftext mehr ab.',
    'The race to-do rows (Papierkram, Material) put their buttons on a second line, and the words stay whole': 'Die Aufgaben-Zeilen im Rennen (Papierkram, Material) setzen ihre Knöpfe in eine zweite Zeile, und die Wörter bleiben ganz',
    'On the packing day the main button says «Fertig gepackt» in full': 'Am Packtag steht auf dem Hauptknopf «Fertig gepackt» ganz',
    'The list «+ Wert» in Analyse and the time-zone rows keep to the screen width': 'Die Liste «+ Wert» in Analyse und die Zeilen der Zeitzonen bleiben in der Bildschirmbreite',
    'The «Alle»-Chips of Analyse stay on the page at 320 px': 'Die «Alle»-Chips in Analyse bleiben bei 320 px auf der Seite',
    'Open a race › Vorbereiten, scroll to «Papierkram»: each row shows the name in full, the buttons sit on a line below.': 'Öffne ein Rennen › Vorbereiten und scrolle zu «Papierkram»: Jede Zeile zeigt den Namen ganz, die Knöpfe stehen in einer Zeile darunter.',
    'Open a trip › Packen (Tag), look at the main button at the bottom: «Fertig gepackt» is readable in full.': 'Öffne eine Tour › Packen (Tag) und schau auf den Hauptknopf unten: «Fertig gepackt» ist ganz lesbar.',
    'Open Ich › Werkzeugkasten › Zeitzonen: the page does not move sideways.': 'Öffne Ich › Werkzeugkasten › Zeitzonen: Die Seite verschiebt sich nicht seitlich.',
  },
};
