// «Spielerplus-Kalender» (Noah 06.11.2026 «1a 2a 3a 4a 5a», dazu «anderes Eishockey-Team»): the team dates of Spielerplus in the app
export default {
  title: 'Spielerplus dates in the app',
  lead: 'Paste the calendar link of your team once: its training and game dates show in the week, on Today and on the Ice hockey page.',
  points: [
    { text: 'Add the calendar link of a team (several teams work)', go: 'f.spielerplus' },
    { text: 'The dates stand in «Plan the week» with the word «Spielerplus»; a tap opens Spielerplus to sign up', go: { href: '#/week', where: 'Plan › Week, on the day of the training, once a Spielerplus calendar is added.' } },
  ],
  small: [
    { box: 'new', text: 'Today shows a training of the day under «Due today»' },
    { box: 'new', text: 'The link stays on this device and is shown hidden; teams can be renamed, switched off and removed with Undo' },
  ],
  test: [
    'Open Me › Connections and find the card «Spielerplus calendar».',
    'Paste the calendar link of your team, give it a name and tap «Test and add»: the number of dates found shows.',
    'Open Plan › Week: the dates of your team stand there; «Sign up ›» opens Spielerplus in a new tab.',
  ],
  since: ['f.spielerplus'],
  de: {
    'Spielerplus dates in the app': 'Spielerplus-Termine in der App',
    'Paste the calendar link of your team once: its training and game dates show in the week, on Today and on the Ice hockey page.': 'Füge den Kalender-Link deines Teams einmal ein: Seine Trainings- und Spieltermine erscheinen in der Woche, auf Heute und auf der Eishockey-Seite.',
    'Add the calendar link of a team (several teams work)': 'Kalender-Link eines Teams hinzufügen (mehrere Teams gehen)',
    'The dates stand in «Plan the week» with the word «Spielerplus»; a tap opens Spielerplus to sign up': 'Die Termine stehen in «Woche planen» mit dem Wort «Spielerplus»; ein Tipp öffnet Spielerplus zum Anmelden',
    'Plan › Week, on the day of the training, once a Spielerplus calendar is added.': 'Planen › Woche, am Tag des Trainings, sobald ein Spielerplus-Kalender hinzugefügt ist.',
    'Today shows a training of the day under «Due today»': 'Heute zeigt ein Training des Tages unter «Heute fällig»',
    'The link stays on this device and is shown hidden; teams can be renamed, switched off and removed with Undo': 'Der Link bleibt auf diesem Gerät und wird verborgen angezeigt; Teams lassen sich umbenennen, ausschalten und mit Rückgängig entfernen',
    'Open Me › Connections and find the card «Spielerplus calendar».': 'Öffne Ich › Verbindungen und such die Karte «Spielerplus-Kalender».',
    'Paste the calendar link of your team, give it a name and tap «Test and add»: the number of dates found shows.': 'Füge den Kalender-Link deines Teams ein, gib ihm einen Namen und tippe «Testen und hinzufügen»: Die Zahl der gefundenen Termine erscheint.',
    'Open Plan › Week: the dates of your team stand there; «Sign up ›» opens Spielerplus in a new tab.': 'Öffne Planen › Woche: Dort stehen die Termine deines Teams; «Anmelden ›» öffnet Spielerplus in einem neuen Tab.',
  },
};
