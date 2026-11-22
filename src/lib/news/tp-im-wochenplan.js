// «TrainingPeaks im Wochenplan» (Noah 22.11.2026 «1a 2a 3a 4a»): the weekly plan knows the sessions from TrainingPeaks
export default {
  title: 'The weekly plan knows TrainingPeaks',
  lead: 'Sessions from TrainingPeaks count towards your hours; the weekly plan only plans the rest.',
  points: [
    { text: 'A bike session from TrainingPeaks replaces «Bike outdoors» or «Bike indoors» in the weekly plan, a run replaces «Run outdoors», strength replaces «Gym»', go: { href: '#/flow/wochenplan', where: 'Training › Weekly plan, in a week that has sessions from TrainingPeaks.' } },
    { text: 'The weekly plan says what it replaced: «Replaced by TrainingPeaks»', go: { href: '#/flow/wochenplan', where: 'Training › Weekly plan, under the days of a week with TrainingPeaks.' } },
    { text: '«What does not fit» also looks at TrainingPeaks: hard days in a row, too many sessions in a day, overlaps', go: { href: '#/flow/wochenplan', where: 'Training › Weekly plan, under «What does not fit».' } },
  ],
  small: [{ box: 'new', text: 'TrainingPeaks stays on its day; the plan plans around it' }],
  test: [
    'Connect your TrainingPeaks link (Me › Connections › TrainingPeaks plan) and open Training › Weekly plan.',
    'Under the days: a line «Replaced by TrainingPeaks» names the units that fell away.',
    'The line «Plan: … h of … h» now includes what TrainingPeaks brings.',
    'Remove the TrainingPeaks link: the units come back.',
  ],
  since: [],
  de: {
    'The weekly plan knows TrainingPeaks': 'Der Wochenplan kennt TrainingPeaks',
    'Sessions from TrainingPeaks count towards your hours; the weekly plan only plans the rest.': 'Einheiten aus TrainingPeaks zählen auf deine Stunden; der Wochenplan plant nur den Rest.',
    'A bike session from TrainingPeaks replaces «Bike outdoors» or «Bike indoors» in the weekly plan, a run replaces «Run outdoors», strength replaces «Gym»': 'Eine Velo-Einheit aus TrainingPeaks ersetzt im Wochenplan «Velo draussen» oder «Velo drinnen», ein Lauf ersetzt «Laufen draussen», Kraft ersetzt «Gym»',
    'Training › Weekly plan, in a week that has sessions from TrainingPeaks.': 'Training › Wochenplan, in einer Woche mit Einheiten aus TrainingPeaks.',
    'The weekly plan says what it replaced: «Replaced by TrainingPeaks»': 'Der Wochenplan sagt, was er ersetzt hat: «Ersetzt durch TrainingPeaks»',
    'Training › Weekly plan, under the days of a week with TrainingPeaks.': 'Training › Wochenplan, unter den Tagen einer Woche mit TrainingPeaks.',
    '«What does not fit» also looks at TrainingPeaks: hard days in a row, too many sessions in a day, overlaps': '«Was nicht passt» schaut auch auf TrainingPeaks: harte Tage am Stück, zu viele Einheiten an einem Tag, Überschneidungen',
    'Training › Weekly plan, under «What does not fit».': 'Training › Wochenplan, unter «Was nicht passt».',
    'TrainingPeaks stays on its day; the plan plans around it': 'TrainingPeaks bleibt an seinem Tag; der Plan plant darum herum',
    'Connect your TrainingPeaks link (Me › Connections › TrainingPeaks plan) and open Training › Weekly plan.': 'Verbinde deinen TrainingPeaks-Link (Ich › Verbindungen › TrainingPeaks-Plan) und öffne Training › Wochenplan.',
    'Under the days: a line «Replaced by TrainingPeaks» names the units that fell away.': 'Unter den Tagen nennt eine Zeile «Ersetzt durch TrainingPeaks» die Einheiten, die weggefallen sind.',
    'The line «Plan: … h of … h» now includes what TrainingPeaks brings.': 'Die Zeile «Plan: … Std von … Std» enthält jetzt, was TrainingPeaks bringt.',
    'Remove the TrainingPeaks link: the units come back.': 'Nimm den TrainingPeaks-Link heraus: Die Einheiten kommen zurück.',
  },
};
