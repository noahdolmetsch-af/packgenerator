// Idee A2 «Erinnerung zur Zeit, wann du es machst» (Noah 27.10.2026 «alle umsetzen 1a 2a 3a 4a 5a»)
export default {
  title: 'Reminder at your time',
  lead: 'The evening reminder learns when you really do the check.',
  points: [{ text: 'From 3 evenings the app offers to move the reminder to your usual time', href: '#/me/push', go: 'f.remindtime' }],
  small: [{ box: 'new', text: '«No, thanks» keeps the time; «Move it» comes with Undo', go: null }],
  test: [
    'Open the evening-before check on the evening before a trip on three evenings at about the same time.',
    'Then Gepackt and Me › Reminders on the phone show «Move the reminder to …?».',
  ],
  since: ['f.remindtime'],
  de: {
    'Reminder at your time': 'Erinnerung zu deiner Zeit',
    'The evening reminder learns when you really do the check.': 'Die Abend-Erinnerung lernt, wann du den Check wirklich machst.',
    'From 3 evenings the app offers to move the reminder to your usual time': 'Ab 3 Abenden schlägt die App vor, die Erinnerung auf deine übliche Zeit zu legen',
    '«No, thanks» keeps the time; «Move it» comes with Undo': '«Nein, danke» lässt die Zeit; «Verschieben» mit Rückgängig',
    'Open the evening-before check on the evening before a trip on three evenings at about the same time.': 'Öffne den Abend-Check am Vorabend einer Tour an drei Abenden etwa zur gleichen Zeit.',
    'Then Gepackt and Me › Reminders on the phone show «Move the reminder to …?».': 'Dann zeigen «Gepackt» und Ich › Erinnerungen aufs Handy «Erinnerung auf … verschieben?».',
  },
};
