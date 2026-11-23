// «Recovery Day» (Noah 22.11.2026 «Recovery Day ja»): a free day of TrainingPeaks keeps the day free in the weekly plan
export default {
  title: 'A Recovery Day from TrainingPeaks stays free',
  lead: 'When TrainingPeaks has a Recovery Day or a rest day, the weekly plan puts nothing else on that day.',
  points: [
    { text: 'A Recovery Day, Rest day or Ruhetag from TrainingPeaks (no duration) now keeps its day free in the weekly plan; the plan says so under the hours', go: { href: '#/flow/wochenplan', where: 'Training › Weekly plan, in a week with a free day from TrainingPeaks.' } },
    { text: 'What you fixed yourself on that day stays; only the free units of the plan move to other days', go: { href: '#/flow/wochenplan', where: 'Training › Weekly plan.' } },
  ],
  small: [{ box: 'new', text: 'The card «TrainingPeaks plan» says how many free days it found' }],
  test: [
    'Open Me › Connections › TrainingPeaks plan and fetch the plan: the result line names the free days («2 free days kept free»).',
    'Open Training › Weekly plan: under the hours it says that TrainingPeaks has a free day, and no free unit of the plan stands on that day.',
  ],
  since: [],
  de: {
    'A Recovery Day from TrainingPeaks stays free': 'Ein Recovery Day aus TrainingPeaks bleibt frei',
    'When TrainingPeaks has a Recovery Day or a rest day, the weekly plan puts nothing else on that day.': 'Hat TrainingPeaks einen Recovery Day oder einen Ruhetag, setzt der Wochenplan an diesem Tag nichts anderes ein.',
    'A Recovery Day, Rest day or Ruhetag from TrainingPeaks (no duration) now keeps its day free in the weekly plan; the plan says so under the hours': 'Ein Recovery Day, Rest day oder Ruhetag aus TrainingPeaks (ohne Dauer) hält seinen Tag im Wochenplan jetzt frei; der Plan sagt es unter den Stunden',
    'Training › Weekly plan, in a week with a free day from TrainingPeaks.': 'Training › Wochenplan, in einer Woche mit einem freien Tag aus TrainingPeaks.',
    'What you fixed yourself on that day stays; only the free units of the plan move to other days': 'Was du an diesem Tag selbst festgelegt hast, bleibt; nur die freien Einheiten des Plans rutschen auf andere Tage',
    'Training › Weekly plan.': 'Training › Wochenplan.',
    'The card «TrainingPeaks plan» says how many free days it found': 'Die Karte «TrainingPeaks-Plan» sagt, wie viele freie Tage sie gefunden hat',
    'Open Me › Connections › TrainingPeaks plan and fetch the plan: the result line names the free days («2 free days kept free»).': 'Öffne Ich › Verbindungen › TrainingPeaks-Plan und hole den Plan: Die Ergebniszeile nennt die freien Tage («2 freie Tage bleiben frei»).',
    'Open Training › Weekly plan: under the hours it says that TrainingPeaks has a free day, and no free unit of the plan stands on that day.': 'Öffne Training › Wochenplan: Unter den Stunden steht, dass TrainingPeaks einen freien Tag hat, und an diesem Tag steht keine freie Einheit des Plans.',
  },
};
