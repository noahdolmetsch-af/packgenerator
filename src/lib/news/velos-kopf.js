// «Velos: Seitenkopf schlanker, ein ruhiger Knopf» (Noah 23.11.2026 «ja»): on a phone one small row, the workshop button is quiet
export default {
  title: 'Bikes: a slimmer head and one quiet button',
  lead: 'On a phone «Belongs to …» and «What you can do here» are now one small row under the title, so your bikes come higher up. On each bike card only the work you do most stays loud.',
  points: [{ text: 'On Bikes, «Belongs to …» and «What you can do here» share one row; «Log a workshop visit» is a quiet button', go: { href: '#/bikes', steps: [{ sel: '[data-card-visit]' }], where: 'Bikes › Setup: the small row under the title and the buttons on each bike card.' } }],
  small: [],
  test: ['Open Bikes on a phone: under the title stands one row with «What you can do here» and «Belongs to …» side by side.', 'Tap «Belongs to …»: the chips open under the row. Tap «What you can do here»: the help window opens.', 'On a bike card «Log a workshop visit» is a quiet button, not a green one.'],
  since: [],
  de: {
    'Bikes: a slimmer head and one quiet button': 'Velos: ein schlankerer Kopf und ein ruhiger Knopf',
    'On a phone «Belongs to …» and «What you can do here» are now one small row under the title, so your bikes come higher up. On each bike card only the work you do most stays loud.': 'Am Handy sind «Gehört zu …» und «Was du hier tun kannst» jetzt eine kleine Zeile unter dem Titel, damit deine Velos weiter oben stehen. Auf jeder Velo-Karte bleibt nur das Wichtigste laut.',
    'On Bikes, «Belongs to …» and «What you can do here» share one row; «Log a workshop visit» is a quiet button': 'Bei Velos teilen sich «Gehört zu …» und «Was du hier tun kannst» eine Zeile; «Werkstattbesuch erfassen» ist ein ruhiger Knopf',
    'Bikes › Setup: the small row under the title and the buttons on each bike card.': 'Velos › Setup: die kleine Zeile unter dem Titel und die Knöpfe auf jeder Velo-Karte.',
    'Open Bikes on a phone: under the title stands one row with «What you can do here» and «Belongs to …» side by side.': 'Öffne Velos am Handy: unter dem Titel steht eine Zeile mit «Was du hier tun kannst» und «Gehört zu …» nebeneinander.',
    'Tap «Belongs to …»: the chips open under the row. Tap «What you can do here»: the help window opens.': 'Tippe «Gehört zu …»: die Chips öffnen sich unter der Zeile. Tippe «Was du hier tun kannst»: das Hilfefenster öffnet sich.',
    'On a bike card «Log a workshop visit» is a quiet button, not a green one.': 'Auf einer Velo-Karte ist «Werkstattbesuch erfassen» ein ruhiger Knopf, kein grüner.',
  },
};
