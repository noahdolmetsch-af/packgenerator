// «Planen als verbindende Mitte» (Noah 1.11.2026 «3a»): every day of the week has «+ Einplanen»; an empty week shows «Plan the week» on top
export default {
  title: 'Plan straight into a day',
  lead: 'Every day of the week has an «Add to plan» button.',
  points: [{ text: 'Planen › Woche: «Add to plan» in each day; with an empty week «Plan the week» stands on top', href: '#/week', go: 'f.weekplan' }],
  small: [],
  test: ['Planen › Woche: tap «Add to plan» in a day; the form opens with that day.', 'In an empty week «Plan the week» stands above the days.'],
  since: [],
  de: {
    'Plan straight into a day': 'Direkt in einen Tag einplanen',
    'Every day of the week has an «Add to plan» button.': 'Jeder Tag der Woche hat einen Knopf «Einplanen».',
    'Planen › Woche: «Add to plan» in each day; with an empty week «Plan the week» stands on top': 'Planen › Woche: «Einplanen» in jedem Tag; bei leerer Woche steht «Woche planen» oben',
    'Planen › Woche: tap «Add to plan» in a day; the form opens with that day.': 'Planen › Woche: In einem Tag «Einplanen» antippen; das Formular öffnet sich mit diesem Tag.',
    'In an empty week «Plan the week» stands above the days.': 'Bei leerer Woche steht «Woche planen» über den Tagen.',
  },
};
