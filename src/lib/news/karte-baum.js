// «Karte der App» als Baum (Noah 24.11.2026 «ich bin total unzufrieden», Wahl «a»): Ort, Reiter, Seiten statt einer Punktewolke
export default {
  title: 'The map of the app as a tree',
  lead: 'The map now shows how the app is built: places, their tabs, and the pages under each tab.',
  points: [
    { text: 'Tap a place to see its tabs, tap a tab to see its pages', go: { href: '#/me/karte', steps: [{ sel: '[data-am-place="week"] > summary' }], where: 'Me › Map of the app.' } },
    { text: 'Every place names its tabs in one line, so you see the structure before you open anything', go: { href: '#/me/karte', steps: [{ sel: '[data-am-tabs]' }], where: 'Me › Map of the app.' } },
  ],
  small: [{ box: 'new', text: 'The dots stay: filled if you opened the page, a ring if never, a star if new' }, { box: 'new', text: 'Pages that fit no tab stand under «Further pages»; windows under «Windows and actions»' }],
  test: ['Open Me › Map of the app: the places stand closed, each with its tabs in one line.', 'Tap «Plan»: its four tabs appear; tap a tab: its pages appear.', 'Tap «Never opened»: every place opens and only the pages you have not opened stay.'],
  since: [],
  de: {
    'The map of the app as a tree': 'Die Karte der App als Baum',
    'The map now shows how the app is built: places, their tabs, and the pages under each tab.': 'Die Karte zeigt jetzt, wie die App aufgebaut ist: Orte, ihre Reiter und die Seiten unter jedem Reiter.',
    'Tap a place to see its tabs, tap a tab to see its pages': 'Tippe auf einen Ort, um seine Reiter zu sehen, und auf einen Reiter, um seine Seiten zu sehen',
    'Me › Map of the app.': 'Ich › Karte der App.',
    'Every place names its tabs in one line, so you see the structure before you open anything': 'Jeder Ort nennt seine Reiter in einer Zeile, so siehst du den Aufbau, bevor du etwas öffnest',
    'The dots stay: filled if you opened the page, a ring if never, a star if new': 'Die Punkte bleiben: gefüllt, wenn du die Seite geöffnet hast, ein Ring, wenn noch nie, ein Stern, wenn neu',
    'Pages that fit no tab stand under «Further pages»; windows under «Windows and actions»': 'Seiten, die zu keinem Reiter passen, stehen unter «Weitere Seiten», Fenster unter «Fenster und Aktionen»',
    'Open Me › Map of the app: the places stand closed, each with its tabs in one line.': 'Öffne Ich › Karte der App: die Orte stehen zugeklappt, jeder mit seinen Reitern in einer Zeile.',
    'Tap «Plan»: its four tabs appear; tap a tab: its pages appear.': 'Tippe auf «Woche»: ihre vier Reiter erscheinen; tippe auf einen Reiter: seine Seiten erscheinen.',
    'Tap «Never opened»: every place opens and only the pages you have not opened stay.': 'Tippe auf «Noch nie geöffnet»: jeder Ort klappt auf und nur die Seiten bleiben, die du noch nicht geöffnet hast.',
  },
};
