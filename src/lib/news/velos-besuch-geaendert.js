// «Velos-Übersicht» + Prüfbericht (Noah 1.11.2026): after a visit saved from a bike card, a line names what it changed
export default {
  title: 'What a workshop visit changed',
  lead: 'After you save a workshop visit from a bike card, a line says which counters it reset.',
  points: [{ text: 'After saving a visit from a bike card, a line «Changed:» names what was reset, e.g. «Chain: starts again at 0 km»', go: { href: '#/bikes', steps: [{ sel: '[data-card-visit]' }] } }],
  small: [],
  test: ['On Bikes tap «Log a workshop visit» on a card, tick «Chain replaced», name the shop and save.', 'Under the cards a line says «Changed: Chain: starts again at 0 km».'],
  since: [],
  de: {
    'What a workshop visit changed': 'Was ein Werkstattbesuch geändert hat',
    'After you save a workshop visit from a bike card, a line says which counters it reset.': 'Nach dem Speichern eines Werkstattbesuchs von einer Velo-Karte sagt eine Zeile, welche Zähler zurückgesetzt wurden.',
    'After saving a visit from a bike card, a line «Changed:» names what was reset, e.g. «Chain: starts again at 0 km»': 'Nach dem Speichern eines Besuchs von einer Velo-Karte nennt eine Zeile «Geändert:», was zurückgesetzt wurde, z. B. «Kette: beginnt wieder bei 0 km»',
    'On Bikes tap «Log a workshop visit» on a card, tick «Chain replaced», name the shop and save.': 'Tippe bei Velos auf einer Karte «Werkstattbesuch erfassen», wähle «Kette ersetzt», nenne die Werkstatt und speichere.',
    'Under the cards a line says «Changed: Chain: starts again at 0 km».': 'Unter den Karten sagt eine Zeile «Geändert: Kette: beginnt wieder bei 0 km».',
  },
};
