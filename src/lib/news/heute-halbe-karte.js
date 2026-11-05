// «Heute auf dem Handy» (Frontend-Durchklick Etappe 1, Noah 05.11.2026): a half-width card alone in its row stretches to the row
export default {
  title: 'No half-empty rows on Today',
  lead: 'On the phone a small card of Today no longer sits alone with an empty half beside it.',
  points: [
    { text: 'A card like «Today\'s check» fills the whole row when no other small card stands beside it', go: null },
  ],
  small: [{ box: 'fixed', text: 'Its text no longer wraps into a narrow column' }],
  test: [
    'Open Today on the phone and look at the area «Now».',
    'A small card that stands alone now uses the full width; two small cards still sit side by side.',
  ],
  since: [],
  de: {
    'No half-empty rows on Today': 'Keine halb leeren Zeilen auf Heute',
    'On the phone a small card of Today no longer sits alone with an empty half beside it.': 'Auf dem Handy steht eine kleine Karte von Heute nicht mehr allein neben einer leeren Hälfte.',
    'A card like «Today\'s check» fills the whole row when no other small card stands beside it': 'Eine Karte wie «Heute-Check» nimmt die ganze Zeile, wenn keine andere kleine Karte daneben steht',
    'Its text no longer wraps into a narrow column': 'Ihr Text bricht nicht mehr in eine schmale Spalte um',
    'Open Today on the phone and look at the area «Now».': 'Öffne Heute auf dem Handy und schau den Bereich «Jetzt» an.',
    'A small card that stands alone now uses the full width; two small cards still sit side by side.': 'Eine kleine Karte, die allein steht, nutzt jetzt die ganze Breite; zwei kleine Karten stehen weiter nebeneinander.',
  },
};
