// «Nichts doppelt: Plan» (Noah 04.11.2026 «2a»): «Today by the plan» shows only what is still open
export default {
  title: 'Today by the plan shows only what is open',
  lead: 'What you did stands in «Active today» and in the day lines of «This week». The plan block keeps only what is still to do.',
  points: [{ text: '«Today by the plan» in «This week» no longer repeats what is done', go: { href: '#/', steps: [{ sel: '[data-section="week"]' }] } }],
  small: [],
  test: [
    'Open Today › «This week»: «Today by the plan» lists only entries that are still open (no struck-through ones).',
    'When everything of today is done the block says so in one line.',
  ],
  since: [],
  de: {
    'Today by the plan shows only what is open': 'Heute laut Plan zeigt nur, was noch offen ist',
    'What you did stands in «Active today» and in the day lines of «This week». The plan block keeps only what is still to do.': 'Was du gemacht hast, steht in «Aktiv heute» und in den Tageszeilen von «Diese Woche». Der Plan-Block behält nur, was noch ansteht.',
    '«Today by the plan» in «This week» no longer repeats what is done': '«Heute laut Plan» in «Diese Woche» wiederholt Erledigtes nicht mehr',
    'Open Today › «This week»: «Today by the plan» lists only entries that are still open (no struck-through ones).': 'Öffne Heute › «Diese Woche»: «Heute laut Plan» listet nur noch offene Einträge (keine durchgestrichenen).',
    'When everything of today is done the block says so in one line.': 'Ist alles von heute erledigt, sagt der Block das in einer Zeile.',
    'Everything in today\'s plan is done.': 'Alles aus dem Plan von heute ist erledigt.',
  },
};
