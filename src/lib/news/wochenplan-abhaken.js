// «Wochenplan» (Noah 09.11.2026 «bau los», Teil 3): abhaken, Heute dran, vergangene Wochen, Strava-Vorschlag
export default {
  title: 'Tick off your weekly plan',
  lead: 'Tick the units you did, see what is up today, and look back at past weeks.',
  points: [
    { text: 'Each unit of this week has a tick; «This week so far» counts them', go: 'f.wochenplan' },
    { text: 'On Today, «Up now» names the next unit of the day, with «Done ✓»', go: 'f.wochenplan' },
    { text: 'Past weeks stay as they were; Strava only suggests, you tick', go: 'f.wochenplan' },
  ],
  small: [{ box: 'new', text: 'Under «Choose rows» you can switch off the row «Unit of the weekly plan»' }],
  test: [
    'Open Active › Weekly plan and tick a unit of this week: «This week so far» goes up. Untick it: it goes down.',
    'Open Today: under «Up now» stands the next open unit of the day. Tap «Done ✓», then «Undo» in the message: it is open again.',
    'On the weekly plan, open «Past weeks» at the end: a week that is over shows its units as they were.',
  ],
  de: {
    'Tick off your weekly plan': 'Hake deinen Wochenplan ab',
    'Tick the units you did, see what is up today, and look back at past weeks.': 'Hake die Einheiten ab, die du gemacht hast, sieh, was heute dran ist, und schau auf vergangene Wochen zurück.',
    'Each unit of this week has a tick; «This week so far» counts them': 'Jede Einheit dieser Woche hat ein Häkchen; «Diese Woche bisher» zählt sie',
    'On Today, «Up now» names the next unit of the day, with «Done ✓»': 'Auf Heute nennt «Jetzt dran» die nächste Einheit des Tages, mit «Erledigt ✓»',
    'Past weeks stay as they were; Strava only suggests, you tick': 'Vergangene Wochen bleiben, wie sie waren; Strava schlägt nur vor, du hakst ab',
    'Under «Choose rows» you can switch off the row «Unit of the weekly plan»': 'Unter «Zeilen wählen» kannst du die Zeile «Einheit des Wochenplans» abschalten',
    'Open Active › Weekly plan and tick a unit of this week: «This week so far» goes up. Untick it: it goes down.': 'Öffne Aktiv › Wochenplan und hake eine Einheit dieser Woche ab: «Diese Woche bisher» steigt. Nimm das Häkchen weg: Es sinkt wieder.',
    'Open Today: under «Up now» stands the next open unit of the day. Tap «Done ✓», then «Undo» in the message: it is open again.': 'Öffne Heute: Unter «Jetzt dran» steht die nächste offene Einheit des Tages. Tippe «Erledigt ✓», dann «Rückgängig» in der Meldung: Sie ist wieder offen.',
    'On the weekly plan, open «Past weeks» at the end: a week that is over shows its units as they were.': 'Öffne im Wochenplan am Ende «Vergangene Wochen»: Eine Woche, die vorbei ist, zeigt ihre Einheiten, wie sie waren.',
  },
};
