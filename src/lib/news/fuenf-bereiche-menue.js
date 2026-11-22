// «Neue Ordnung» Schritt V4a (Noah 21.11.2026 «1a 2a 3a 4a 5a», «V4 ok»): five places, Woche = Planen + Aktiv, Auswerten has its own slot
export default {
  title: 'Five places: Week and Analysis',
  lead: 'The menu has five places: Today, Week, Trips, Bikes and gear, Analysis. Week brings Plan and Active together.',
  points: [
    { text: '«Week» has four tabs: Week, Training, Notes, Everyday; the pages of Active are chips under «Training»', go: { href: '#/flow', steps: [{ sel: '[data-place="week"]' }], where: 'Week › Training: plans, tick off, sports and recovery.' } },
    { text: '«Analysis» has its own place in the bar; the switch Active | Analysis is gone', go: { href: '#/auswerten', steps: [{ sel: '[data-place="analysis"]' }], where: 'Analysis in the bar below or in the sidebar.' } },
  ],
  small: [],
  test: [
    'Look at the bar below: Today, Week, Trips, Bikes and gear, Analysis.',
    'Tap Week, then the tab Training: Weekly plan, Tick off today, My sports and Recovery are chips there.',
    'Tap Analysis: it has its own place, with no switch on top.',
  ],
  since: [],
  de: {
    'Five places: Week and Analysis': 'Fünf Bereiche: Woche und Auswerten',
    'The menu has five places: Today, Week, Trips, Bikes and gear, Analysis. Week brings Plan and Active together.': 'Das Menü hat fünf Bereiche: Heute, Woche, Touren, Velos und Material, Auswerten. Woche vereint Planen und Aktiv.',
    '«Week» has four tabs: Week, Training, Notes, Everyday; the pages of Active are chips under «Training»': '«Woche» hat vier Reiter: Woche, Training, Notizen, Alltag; die Seiten von Aktiv sind Chips unter «Training»',
    'Week › Training: plans, tick off, sports and recovery.': 'Woche › Training: Pläne, Abhaken, Sportarten und Erholung.',
    '«Analysis» has its own place in the bar; the switch Active | Analysis is gone': '«Auswerten» hat einen eigenen Platz in der Leiste; der Schalter Aktiv | Auswerten fällt weg',
    'Analysis in the bar below or in the sidebar.': 'Auswerten in der Leiste unten oder in der Seitenleiste.',
    'Look at the bar below: Today, Week, Trips, Bikes and gear, Analysis.': 'Schau auf die Leiste unten: Heute, Woche, Touren, Velos und Material, Auswerten.',
    'Tap Week, then the tab Training: Weekly plan, Tick off today, My sports and Recovery are chips there.': 'Tippe Woche, dann den Reiter Training: Wochenplan, Heute abhaken, Meine Sportarten und Erholung stehen dort als Chips.',
    'Tap Analysis: it has its own place, with no switch on top.': 'Tippe Auswerten: es hat einen eigenen Platz, ohne Schalter oben.',
  },
};
