// «Velos-Übersicht» Schritt 2 (Noah 1.11.2026): log a workshop visit or a problem straight from a bike's card
export default {
  title: 'Log care and problems from the bike card',
  lead: 'The cards on Bikes now have the two quick jobs: log a workshop visit and log a problem.',
  points: [{ text: 'Each bike card on Bikes has «Log a workshop visit» and «Log a problem», for that bike', go: { href: '#/bikes', steps: [{ sel: '[data-card-problem]' }] } }],
  small: [],
  test: ['Open Bikes and tap «Log a problem» on a card: the window opens for that bike.', 'Save it: a line says «Saved in Bike care.» with «Open».'],
  since: [],
  de: {
    'Log care and problems from the bike card': 'Pflege und Probleme direkt auf der Velo-Karte erfassen',
    'The cards on Bikes now have the two quick jobs: log a workshop visit and log a problem.': 'Die Karten bei Velos haben jetzt die zwei schnellen Aufgaben: Werkstattbesuch erfassen und Problem erfassen.',
    'Each bike card on Bikes has «Log a workshop visit» and «Log a problem», for that bike': 'Jede Velo-Karte bei Velos hat «Werkstattbesuch erfassen» und «Problem erfassen», für dieses Velo',
    'Open Bikes and tap «Log a problem» on a card: the window opens for that bike.': 'Öffne Velos und tippe auf einer Karte «Problem erfassen»: das Fenster öffnet sich für dieses Velo.',
    'Save it: a line says «Saved in Bike care.» with «Open».': 'Speichere es: eine Zeile sagt «In der Velopflege gespeichert.» mit «Öffnen».',
  },
};
