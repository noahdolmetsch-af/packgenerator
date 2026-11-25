// «Termine ziehen» (Noah 24.11.2026 «wunsch hier und überall sonst wo sinnvoll: termine und trainings und aktivitäten können einfach per drag and drop verschoben, editiert, gelöscht werden», «1a 2b 3a 4a», «2+3 dazu»)
export default {
  title: 'Pull appointments to a new time',
  lead: 'Appointments, to-dos and training units can be pulled to another time or day, or moved with «Move …».',
  points: [
    { text: 'In the week of «Appointments and tasks» pull an appointment to a new time or day; your Google calendar changes too, and «Undo» writes it back', go: { href: '#/me/agenda', where: 'Planen › Appointments and tasks › Week, with your Google calendar connected: pull an appointment.' } },
    { text: 'In «Plan the week» and in the weekly plan pull a to-do, a training unit or a suggestion onto another day; on a phone press and hold first', go: { href: '#/week', where: 'Planen › Week: pull a to-do onto another day, or use «Move …» in the entry.' } },
    { text: '«Move all …» on a day moves everything that can move to another day at once; «Move …» can also make a copy', go: { href: '#/week', where: 'Planen › Week: «Move all …» stands under a day with two or more entries.' } },
  ],
  small: [{ box: 'new', text: 'Appointments of calendars you may not change, and of the app\'s own calendar, stay put and say why' }],
  test: [
    'Open Planen › Appointments and tasks, choose «Week» and pull an appointment to another hour: «Moved» appears with «Undo».',
    'Tap an appointment, then «Move …»: choose a day and a time and tap «Move».',
    'Open Planen › Week and pull a to-do onto another day; tap «Undo» to bring it back.',
  ],
  since: [],
  de: {
    'Pull appointments to a new time': 'Termine auf eine neue Zeit ziehen',
    'Appointments, to-dos and training units can be pulled to another time or day, or moved with «Move …».': 'Termine, To-dos und Trainingseinheiten lassen sich auf eine andere Zeit oder einen anderen Tag ziehen, oder mit «Verschieben …» umlegen.',
    'In the week of «Appointments and tasks» pull an appointment to a new time or day; your Google calendar changes too, and «Undo» writes it back': 'In der Woche von «Termine und Aufgaben» ziehst du einen Termin auf eine neue Zeit oder einen neuen Tag; dein Google Kalender ändert sich mit, und «Rückgängig» schreibt es zurück',
    'Planen › Appointments and tasks › Week, with your Google calendar connected: pull an appointment.': 'Planen › Termine und Aufgaben › Woche, mit verbundenem Google Kalender: Ziehe einen Termin.',
    'In «Plan the week» and in the weekly plan pull a to-do, a training unit or a suggestion onto another day; on a phone press and hold first': 'In «Woche planen» und im Wochenplan ziehst du ein To-do, eine Trainingseinheit oder einen Vorschlag auf einen anderen Tag; am Handy zuerst lange drücken',
    'Planen › Week: pull a to-do onto another day, or use «Move …» in the entry.': 'Planen › Woche: Ziehe ein To-do auf einen anderen Tag, oder nimm «Verschieben …» im Eintrag.',
    '«Move all …» on a day moves everything that can move to another day at once; «Move …» can also make a copy': '«Alles verschieben …» an einem Tag legt alles, was sich bewegen lässt, auf einmal auf einen anderen Tag; «Verschieben …» kann auch eine Kopie machen',
    'Planen › Week: «Move all …» stands under a day with two or more entries.': 'Planen › Woche: «Alles verschieben …» steht unter einem Tag mit zwei oder mehr Einträgen.',
    'Appointments of calendars you may not change, and of the app\'s own calendar, stay put and say why': 'Termine aus Kalendern, die du nicht ändern darfst, und aus dem eigenen Kalender der App bleiben stehen und sagen warum',
    'Open Planen › Appointments and tasks, choose «Week» and pull an appointment to another hour: «Moved» appears with «Undo».': 'Öffne Planen › Termine und Aufgaben, wähle «Woche» und ziehe einen Termin auf eine andere Stunde: «Verschoben» erscheint mit «Rückgängig».',
    'Tap an appointment, then «Move …»: choose a day and a time and tap «Move».': 'Tippe auf einen Termin, dann auf «Verschieben …»: Wähle Tag und Uhrzeit und tippe auf «Verschieben».',
    'Open Planen › Week and pull a to-do onto another day; tap «Undo» to bring it back.': 'Öffne Planen › Woche und ziehe ein To-do auf einen anderen Tag; tippe auf «Rückgängig», um es zurückzuholen.',
  },
};
