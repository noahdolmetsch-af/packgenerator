// «Routinen unter Erholung» (Noah 03.11.2026): «Das tut mir gut» stands under Aktiv › Erholung
export default {
  title: 'The daily list is part of Recovery',
  lead: 'Under Active › Recovery you find «What does me good» with today\'s count, and its page opens inside Active.',
  points: [{ text: 'Recovery shows how many things of your daily list you ticked today', go: { href: '#/flow/rest', steps: [{ sel: '[data-rest-routine]' }] } }, { text: 'The list page now belongs to Active › Recovery, with the path back to Recovery', go: { href: '#/routine', where: 'Active › Recovery › «Your daily list».' } }],
  small: [{ box: 'new', text: 'The tile on Today leads to the same page' }],
  test: ['Open Active › Recovery: next to «Your daily list» stands «n of m ticked today».', 'Tap it: the list opens, the tab «Recovery» is lit.'],
  since: [],
  de: {
    'The daily list is part of Recovery': 'Die tägliche Liste gehört zur Erholung',
    'Under Active › Recovery you find «What does me good» with today\'s count, and its page opens inside Active.': 'Unter Aktiv › Erholung findest du «Das tut mir gut» mit dem Stand von heute, die Seite öffnet sich innerhalb von Aktiv.',
    'Recovery shows how many things of your daily list you ticked today': 'Erholung zeigt, wie viele Dinge deiner täglichen Liste du heute abgehakt hast',
    'The list page now belongs to Active › Recovery, with the path back to Recovery': 'Die Listenseite gehört jetzt zu Aktiv › Erholung, mit dem Pfad zurück zu Erholung',
    'Active › Recovery › «Your daily list».': 'Aktiv › Erholung › «Deine tägliche Liste».',
    'The tile on Today leads to the same page': 'Die Kachel auf Heute führt zur selben Seite',
    'Open Active › Recovery: next to «Your daily list» stands «n of m ticked today».': 'Öffne Aktiv › Erholung: Neben «Deine tägliche Liste» steht «n von m heute abgehakt».',
    'Tap it: the list opens, the tab «Recovery» is lit.': 'Tippe darauf: Die Liste öffnet sich, der Tab «Erholung» leuchtet.',
  },
};
