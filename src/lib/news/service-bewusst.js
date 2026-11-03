// «Service bewusst wählen» (Noah 1.11.2026 «2a»): the whole-bike service is no longer preselected
export default {
  title: 'Choose the whole-bike service on purpose',
  lead: 'A workshop visit no longer resets the bike counter by itself. Before saving, the app lists what will be reset.',
  points: [{ text: '«Service of the whole bike» is off at first, and the window says which counters saving resets', go: { href: '#/bikes?tab=care', where: 'Bikes › Care › New › Workshop visit, under «What was done?».' } }],
  small: [],
  test: ['Open Bikes › Care › New › Workshop visit: «Service of the whole bike» is not ticked.', 'Add a part as «replaced»: the list says it starts again at 0 km. Tick the whole bike: the list adds the bike counter.'],
  since: [],
  de: {
    'Choose the whole-bike service on purpose': 'Service am ganzen Velo bewusst wählen',
    'A workshop visit no longer resets the bike counter by itself. Before saving, the app lists what will be reset.': 'Ein Werkstattbesuch setzt den Velo-Zähler nicht mehr von selbst zurück. Vor dem Speichern zeigt die App, was zurückgesetzt wird.',
    '«Service of the whole bike» is off at first, and the window says which counters saving resets': '«Service am ganzen Velo» ist zuerst aus, und das Fenster sagt, welche Zähler das Speichern zurücksetzt',
    'Bikes › Care › New › Workshop visit, under «What was done?».': 'Velos › Pflege › Neu › Werkstattbesuch, unter «Was wurde gemacht?».',
    'Open Bikes › Care › New › Workshop visit: «Service of the whole bike» is not ticked.': 'Öffne Velos › Pflege › Neu › Werkstattbesuch: «Service am ganzen Velo» ist nicht angehakt.',
    'Add a part as «replaced»: the list says it starts again at 0 km. Tick the whole bike: the list adds the bike counter.': 'Füge ein Teil als «ersetzt» hinzu: die Liste sagt, dass es wieder bei 0 km startet. Hake das ganze Velo an: die Liste nennt auch den Velo-Zähler.',
  },
};
