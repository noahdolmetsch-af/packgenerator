// «Kalender 1:1» Schritt 2 (Noah 28.10.2026 «und danach das wochenraster wie bei google»): the week grid
export default {
  title: 'Your calendar as a week',
  lead: 'Appointments and tasks now has a week view like Google, with the hours down the side.',
  points: [
    { text: 'Switch from «List» to «Week»: the days side by side, appointments as blocks in the colour of their calendar', go: { href: '#/me/agenda', steps: [{ sel: '[data-view="week"]' }] } },
    { text: 'Tap an empty place in the week to start a new appointment at that time', go: { href: '#/me/agenda', steps: [{ sel: '[data-view="week"]' }, { sel: '[data-week-grid]' }] } },
  ],
  small: [{ box: 'new', text: 'On the phone the week shows three days; the arrows move on' }],
  test: ['Open Planen › Termine and tap «Week»: your appointments stand as blocks on the days.', 'Tap a block: it opens below with «Change», «Duplicate» and «Delete».', 'Tap an empty place in a day: the new appointment form opens with that day and time.'],
  since: [],
  de: {
    'Your calendar as a week': 'Dein Kalender als Woche',
    'Appointments and tasks now has a week view like Google, with the hours down the side.': 'Termine und Aufgaben hat jetzt eine Wochenansicht wie Google, mit den Stunden am Rand.',
    'Switch from «List» to «Week»: the days side by side, appointments as blocks in the colour of their calendar': 'Wechsle von «Liste» zu «Woche»: die Tage nebeneinander, Termine als Blöcke in der Farbe ihres Kalenders',
    'Tap an empty place in the week to start a new appointment at that time': 'Tippe auf eine leere Stelle in der Woche, um dort einen neuen Termin zu beginnen',
    'On the phone the week shows three days; the arrows move on': 'Am Handy zeigt die Woche drei Tage; die Pfeile schalten weiter',
    'Open Planen › Termine and tap «Week»: your appointments stand as blocks on the days.': 'Öffne Planen › Termine und tippe auf «Woche»: deine Termine stehen als Blöcke auf den Tagen.',
    'Tap a block: it opens below with «Change», «Duplicate» and «Delete».': 'Tippe auf einen Block: er öffnet sich darunter mit «Ändern», «Duplizieren» und «Löschen».',
    'Tap an empty place in a day: the new appointment form opens with that day and time.': 'Tippe auf eine leere Stelle in einem Tag: das Formular für einen neuen Termin öffnet sich mit diesem Tag und dieser Zeit.',
  },
};
