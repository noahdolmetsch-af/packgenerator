// «A5 für den Druck» (Noah 10.11.2026 «gerne»): der Flyer als druckfertiges PDF für die Druckerei
export default {
  title: 'The flyer as a PDF for the print shop',
  lead: 'Tennis › Flyer has a new format «A5 for printing»: a PDF with 3 mm bleed that you can upload to an online print shop.',
  points: [
    { text: 'New format «A5 for printing»: 300 dpi, A5 portrait plus 3 mm bleed on every side, saved as a PDF', go: { href: '#/me/tennis/flyer', steps: [{ text: 'Flyer' }], where: 'Tennis › Flyer, part «Language and format».' } },
    { text: 'The other formats stay as they are: 16:9, A4 portrait and square are still pictures', go: null },
  ],
  small: [],
  test: [
    'Open Tennis › Flyer, part «Language and format»: switch on «A5 for printing». The preview of this format is taller than A5, because it shows the bleed.',
    'Press «Save»: next to the pictures a PDF arrives (file name with «a5»). Open it: one page, the flyer fills the whole page.',
  ],
  since: [],
  de: {
    'The flyer as a PDF for the print shop': 'Der Flyer als PDF für die Druckerei',
    'Tennis › Flyer has a new format «A5 for printing»: a PDF with 3 mm bleed that you can upload to an online print shop.': 'Tennis › Flyer hat ein neues Format «A5 für den Druck»: ein PDF mit 3 mm Beschnitt, das du bei einer Online-Druckerei hochladen kannst.',
    'New format «A5 for printing»: 300 dpi, A5 portrait plus 3 mm bleed on every side, saved as a PDF': 'Neues Format «A5 für den Druck»: 300 dpi, A5 hoch plus 3 mm Beschnitt an jeder Seite, gespeichert als PDF',
    'Tennis › Flyer, part «Language and format».': 'Tennis › Flyer, Teil «Sprache und Format».',
    'The other formats stay as they are: 16:9, A4 portrait and square are still pictures': 'Die anderen Formate bleiben, wie sie sind: 16:9, A4 hoch und Quadrat sind weiterhin Bilder',
    'Open Tennis › Flyer, part «Language and format»: switch on «A5 for printing». The preview of this format is taller than A5, because it shows the bleed.': 'Öffne Tennis › Flyer, Teil «Sprache und Format»: schalte «A5 für den Druck» ein. Die Vorschau dieses Formats ist etwas grösser als A5, weil sie den Beschnitt zeigt.',
    'Press «Save»: next to the pictures a PDF arrives (file name with «a5»). Open it: one page, the flyer fills the whole page.': 'Drücke «Speichern»: neben den Bildern kommt ein PDF (Dateiname mit «a5»). Öffne es: eine Seite, der Flyer füllt die ganze Seite.',
  },
};
