// «Bild bearbeiten» (Noah 28.10.2026 «1a 2a 3a 4a 5a», thread «Screenshot-Werkzeug im Werkzeugkasten»):
// a new tool: screenshots chosen, turned, cut, drawn and written on, one PDF or single pictures
export default {
  title: 'Edit a picture',
  lead: 'A new tool for screenshots in the Toolbox.',
  points: [
    {
      text: 'Cut, draw, highlight and write on screenshots, then one PDF of all pages',
      href: '#/me/tools/markup',
      go: 'f.markup',
    },
  ],
  small: [
    {
      box: 'new',
      text: 'Turn or remove a page, put the pages in order with arrows or by dragging',
      go: 'f.markup',
    },
    { box: 'new', text: 'Single pictures instead of a PDF, as you choose', go: 'f.markup' },
  ],
  test: [
    'On the phone take a screenshot, then open Trips › Toolbox › «Edit a picture» and tap «Choose pictures»: pick two screenshots.',
    'At page 1 tap the pen, draw a line and save; tap the frame symbol and cut the edges.',
    'Choose «One PDF» and tap «Save or share»: one PDF with 2 pages, the line and the cut are in it.',
  ],
  since: ['f.markup'],
  de: {
    'A new tool for screenshots in the Toolbox.': 'Ein neues Werkzeug für Screenshots im Werkzeugkasten.',
    'Cut, draw, highlight and write on screenshots, then one PDF of all pages': 'Screenshots zuschneiden, bemalen, markieren und beschriften, dann ein PDF aus allen Seiten',
    'Turn or remove a page, put the pages in order with arrows or by dragging': 'Seite drehen oder entfernen, Seiten mit Pfeilen oder Ziehen ordnen',
    'Single pictures instead of a PDF, as you choose': 'Einzelne Bilder statt PDF, wie du willst',
    'On the phone take a screenshot, then open Trips › Toolbox › «Edit a picture» and tap «Choose pictures»: pick two screenshots.':
      'Mach am Handy einen Screenshot, öffne dann Touren › Werkzeugkasten › «Bild bearbeiten» und tippe «Bilder auswählen»: zwei Screenshots wählen.',
    'At page 1 tap the pen, draw a line and save; tap the frame symbol and cut the edges.': 'Bei Seite 1 auf den Stift tippen, einen Strich zeichnen und sichern; auf das Rahmen-Symbol tippen und die Ränder zuschneiden.',
    'Choose «One PDF» and tap «Save or share»: one PDF with 2 pages, the line and the cut are in it.': '«Ein PDF» wählen und «Speichern oder teilen» tippen: ein PDF mit 2 Seiten, Strich und Zuschnitt sind drin.',
  },
};
