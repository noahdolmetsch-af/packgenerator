// «Ein Wochenziel statt zwei» (Noah 26.11.2026 «ja», Thread «Wochenplan-Vorschläge verlässlich machen»)
export default {
  title: 'One hours goal for the week',
  lead: 'Your weekly plan and your training goal no longer show two different hours: with a weekly plan, its hours count everywhere.',
  points: [
    { text: 'The hours of your weekly plan are the goal of the week: on Training, on the week pages, in the look back and on the page after a tick. Your training goal stays stored and counts again in weeks without a plan', go: { href: '#/flow/training', where: 'Training › Week › «Your training goal».' } },
    { text: 'A goal whose day has passed says «ended on …» instead of «0 weeks to go» and stops counting; nothing is deleted', go: { href: '#/flow/training', where: 'Training › Week › «Your training goal».' } },
  ],
  small: [
    { box: 'new', text: 'The goal form says that the hours of the weekly plan count while a plan is saved' },
  ],
  test: [
    'Open Training › Week. Under «Your training goal» the line reads «… h per week · from your weekly plan» and, for a goal with a day in the past, «ended on …».',
    'Open Training › Weekly plan and change the hours with plus. Go back to Training › Week: the goal a week and «This week … of … h» show the new hours.',
  ],
  since: [],
  de: {
    'One hours goal for the week': 'Ein Stundenziel für die Woche',
    'Your weekly plan and your training goal no longer show two different hours: with a weekly plan, its hours count everywhere.': 'Dein Wochenplan und dein Trainingsziel zeigen nicht mehr zwei verschiedene Stunden: mit einem Wochenplan zählen überall seine Stunden.',
    'The hours of your weekly plan are the goal of the week: on Training, on the week pages, in the look back and on the page after a tick. Your training goal stays stored and counts again in weeks without a plan': 'Die Stunden deines Wochenplans sind das Ziel der Woche: auf Training, auf den Wochenseiten, im Rückblick und auf der Seite nach dem Abhaken. Dein Trainingsziel bleibt gespeichert und zählt wieder in Wochen ohne Plan',
    'Training › Week › «Your training goal».': 'Training › Woche › «Dein Trainingsziel».',
    'A goal whose day has passed says «ended on …» instead of «0 weeks to go» and stops counting; nothing is deleted': 'Ein Ziel, dessen Tag vorbei ist, sagt «endete am …» statt «noch 0 Wochen» und zählt nicht mehr; nichts wird gelöscht',
    'The goal form says that the hours of the weekly plan count while a plan is saved': 'Das Formular des Ziels sagt, dass die Stunden des Wochenplans zählen, solange ein Plan gespeichert ist',
    'Open Training › Week. Under «Your training goal» the line reads «… h per week · from your weekly plan» and, for a goal with a day in the past, «ended on …».': 'Öffne Training › Woche. Unter «Dein Trainingsziel» steht «… Std. pro Woche · aus deinem Wochenplan» und, bei einem Ziel mit vergangenem Tag, «endete am …».',
    'Open Training › Weekly plan and change the hours with plus. Go back to Training › Week: the goal a week and «This week … of … h» show the new hours.': 'Öffne Training › Wochenplan und ändere die Stunden mit Plus. Geh zurück zu Training › Woche: Das Ziel pro Woche und «Diese Woche … von … Std.» zeigen die neuen Stunden.',
  },
};
