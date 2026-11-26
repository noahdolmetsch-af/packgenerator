// «Standardwoche im Wochenplan» (Noah 26.11.2026, Thread «Wochenplan-Vorschläge verlässlich machen»)
export default {
  title: 'Your standard week in the weekly plan',
  lead: 'The weekly plan has a new view, «Standard week»: your normal week at a glance, with fixed places and wishes for every kind of unit.',
  points: [
    { text: 'See your normal week as a list (phone) or a grid (computer). Every place is fixed, a wish or chosen by the app. Tap a place to set the day, the time and how firm it is; on a computer pull it to another day', go: { href: '#/flow/wochenplan?view=std', where: 'Training › Weekly plan › «Standard week».' } },
    { text: 'A wish is a place the app uses when it is free, and says so when it had to take another one: «Ice hockey on Sunday, or Saturday morning»', go: { href: '#/flow/wochenplan?view=std', where: 'Training › Weekly plan › «Standard week», tap a place › «Wish».' } },
    { text: 'What you moved last week comes back next week, marked «like last week». One tap on «Back to the standard week» takes it away', go: { href: '#/flow/wochenplan', where: 'Training › Weekly plan › «Week», above the days.' } },
  ],
  small: [
    { box: 'new', text: 'The hours and the number per kind of unit stand above the standard week and say whether the week holds them' },
    { box: 'new', text: 'The card «Units per week» now only counts; the fixed days and times moved into the standard week' },
  ],
  test: [
    'Open Training › Weekly plan and tap «Standard week». Tap the ice hockey on Sunday, choose «Wish», pick Saturday and tap «Done»: the ice hockey is a wish on Saturday morning.',
    'Open «Week», tap «Move» on the gym on Wednesday and choose Friday. Tap «Next week»: the gym stands on Friday again, marked «like last week». Tap «Back to the standard week»: it is on Wednesday again.',
  ],
  since: [],
  de: {
    'Your standard week in the weekly plan': 'Deine Standardwoche im Wochenplan',
    'The weekly plan has a new view, «Standard week»: your normal week at a glance, with fixed places and wishes for every kind of unit.': 'Der Wochenplan hat eine neue Ansicht, «Standardwoche»: deine normale Woche auf einen Blick, mit festen Plätzen und Wünschen für jede Art von Einheit.',
    'See your normal week as a list (phone) or a grid (computer). Every place is fixed, a wish or chosen by the app. Tap a place to set the day, the time and how firm it is; on a computer pull it to another day': 'Sieh deine normale Woche als Liste (Handy) oder Raster (Computer). Jeder Platz ist fix, ein Wunsch oder von der App gewählt. Tipp auf einen Platz, um Tag, Zeit und Festigkeit zu setzen; am Computer zieh ihn auf einen anderen Tag',
    'Training › Weekly plan › «Standard week».': 'Training › Wochenplan › «Standardwoche».',
    'A wish is a place the app uses when it is free, and says so when it had to take another one: «Ice hockey on Sunday, or Saturday morning»': 'Ein Wunsch ist ein Platz, den die App nimmt, wenn er frei ist, und sie sagt es, wenn sie einen anderen nehmen musste: «Eishockey am Sonntag, oder am Samstagmorgen»',
    'Training › Weekly plan › «Standard week», tap a place › «Wish».': 'Training › Wochenplan › «Standardwoche», Tipp auf einen Platz › «Wunsch».',
    'What you moved last week comes back next week, marked «like last week». One tap on «Back to the standard week» takes it away': 'Was du letzte Woche verschoben hast, kommt nächste Woche wieder, markiert «wie letzte Woche». Ein Tipp auf «Zurück zur Standardwoche» nimmt es weg',
    'Training › Weekly plan › «Week», above the days.': 'Training › Wochenplan › «Woche», über den Tagen.',
    'The hours and the number per kind of unit stand above the standard week and say whether the week holds them': 'Die Stunden und die Anzahl pro Art von Einheit stehen über der Standardwoche und sagen, ob die Woche sie hält',
    'The card «Units per week» now only counts; the fixed days and times moved into the standard week': 'Die Karte «Einheiten pro Woche» zählt jetzt nur noch; die festen Tage und Zeiten sind in die Standardwoche umgezogen',
    'Open Training › Weekly plan and tap «Standard week». Tap the ice hockey on Sunday, choose «Wish», pick Saturday and tap «Done»: the ice hockey is a wish on Saturday morning.': 'Öffne Training › Wochenplan und tippe «Standardwoche». Tippe das Eishockey am Sonntag, wähle «Wunsch», nimm Samstag und tippe «Fertig»: Das Eishockey ist ein Wunsch am Samstagmorgen.',
    'Open «Week», tap «Move» on the gym on Wednesday and choose Friday. Tap «Next week»: the gym stands on Friday again, marked «like last week». Tap «Back to the standard week»: it is on Wednesday again.': 'Öffne «Woche», tippe beim Gym am Mittwoch auf «Verschieben» und wähle Freitag. Tippe «Nächste Woche»: Das Gym steht wieder am Freitag, markiert «wie letzte Woche». Tippe «Zurück zur Standardwoche»: Es ist wieder am Mittwoch.',
  },
};
