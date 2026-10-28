// Live Navigation (Noah 28.10.2026 «a Einklappen, Beenden extra»): the X no longer ends the way to a goal.
export default {
  title: 'Fold the goal box in',
  lead: 'The X on the box «To …» folds it to one line. Ending the navigation is its own button, with Undo.',
  points: [{ text: 'Tap the one line to open the box again', href: '#/live' }],
  small: [{ box: 'nicer', text: '«End navigation» can be undone' }],
  test: ['Live map: ride to a goal, tap the X on the box: it shrinks to one line.', 'Tap the line, then «Navigation beenden»: the box goes, «Rückgängig» brings it back.'],
  since: [],
  de: {
    'Fold the goal box in': 'Ziel-Kasten einklappen',
    'The X on the box «To …» folds it to one line. Ending the navigation is its own button, with Undo.': 'Das X am Kasten «Zu …» klappt ihn auf eine Zeile zu. Die Navigation beenden ist ein eigener Knopf, mit Rückgängig.',
    'Tap the one line to open the box again': 'Die Zeile antippen öffnet den Kasten wieder',
    '«End navigation» can be undone': '«Navigation beenden» lässt sich rückgängig machen',
    'Live map: ride to a goal, tap the X on the box: it shrinks to one line.': 'Live-Karte: zu einem Ziel fahren, das X am Kasten antippen: er wird zu einer Zeile.',
    'Tap the line, then «Navigation beenden»: the box goes, «Rückgängig» brings it back.': 'Die Zeile antippen, dann «Navigation beenden»: der Kasten geht weg, «Rückgängig» holt ihn zurück.',
  },
};
