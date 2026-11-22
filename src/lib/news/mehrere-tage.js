// «Mehrere Tage in einem Rutsch» (Noah 21.11.2026, Thread «Training erfassen vereinfachen»): the tick window ticks the same activity for several days at once
export default {
  title: 'Tick off several days',
  lead: 'Did the same training on several days and forgot to tick? One tap ticks them all, each on its own day.',
  points: [
    { text: 'In the tick window tap «Several days in one go» and switch on the days (today, yesterday, the day before, «Other day»)', go: { href: '#/flow', steps: [{ sel: '[data-more="yoga"]' }, { sel: '[data-multi]' }] } },
    { text: 'Every day gets its own entry; it counts on that day in the weekly goals and in Analysis', go: { href: '#/flow', steps: [{ sel: '[data-more="yoga"]' }, { sel: '[data-multi]' }] } },
  ],
  small: [],
  test: ['On Active tap «•••» on the tile «Yoga», tap «Several days in one go», switch off «Today», switch on «Yesterday» and «Day before», tap «Tick off»: the message says «2 days ticked».', 'Tap «Undo» in the message: both entries are gone.'],
  since: [],
  de: {
    'Tick off several days': 'Mehrere Tage abhaken',
    'Did the same training on several days and forgot to tick? One tap ticks them all, each on its own day.': 'Dasselbe Training an mehreren Tagen gemacht und nicht abgehakt? Ein Tipp hakt alle ab, jeden an seinem Tag.',
    'In the tick window tap «Several days in one go» and switch on the days (today, yesterday, the day before, «Other day»)': 'Tippe im Abhak-Fenster auf «Mehrere Tage in einem Rutsch» und schalte die Tage ein (heute, gestern, vorgestern, «Anderer Tag»)',
    'Every day gets its own entry; it counts on that day in the weekly goals and in Analysis': 'Jeder Tag bekommt seinen eigenen Eintrag; er zählt an diesem Tag in den Wochenzielen und in Auswerten',
    'On Active tap «•••» on the tile «Yoga», tap «Several days in one go», switch off «Today», switch on «Yesterday» and «Day before», tap «Tick off»: the message says «2 days ticked».': 'Tippe auf Aktiv bei der Kachel «Yoga» auf «•••», tippe «Mehrere Tage in einem Rutsch», schalte «Heute» aus, «Gestern» und «Vorgestern» ein und tippe «Abhaken»: Die Meldung sagt «2 Tage abgehakt».',
    'Tap «Undo» in the message: both entries are gone.': 'Tippe in der Meldung auf «Rückgängig»: Beide Einträge sind weg.',
  },
};
