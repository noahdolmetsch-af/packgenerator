// «Diagramme überall verbessern» (Noah 23.11.2026 «ja»): the weekly goal of the active zone minutes as a dashed line in Body values
export default {
  title: 'Your weekly goal over the active zone minutes',
  lead: 'The daily bars of the active zone minutes in the body values show one seventh of your weekly goal as a dashed line.',
  points: [
    { text: 'A dashed line «Weekly goal ÷ 7» over the daily bars of the active zone minutes (the goal is the one you set in Active, 150 minutes if you did not)', go: { href: '#/flow/stats/azm', where: 'Auswerten › Body › Body values › Active zone minutes: range «4 wk.».' } },
  ],
  test: [
    'Open Body values, the tab «Active zone minutes» and the range «4 wk.»: a dashed line «Weekly goal ÷ 7: 21 min» runs over the daily bars.',
    'Switch to the range «1 y»: the bars are monthly sums and the line is gone.',
  ],
  since: [],
  de: {
    'Your weekly goal over the active zone minutes': 'Dein Wochenziel über den Aktivzonenminuten',
    'The daily bars of the active zone minutes in the body values show one seventh of your weekly goal as a dashed line.': 'Die Tagesbalken der Aktivzonenminuten in den Körperwerten zeigen einen Siebtel deines Wochenziels als gestrichelte Linie.',
    'A dashed line «Weekly goal ÷ 7» over the daily bars of the active zone minutes (the goal is the one you set in Active, 150 minutes if you did not)': 'Eine gestrichelte Linie «Wochenziel ÷ 7» über den Tagesbalken der Aktivzonenminuten (das Ziel ist das, das du in Aktiv gesetzt hast, sonst 150 Minuten)',
    'Auswerten › Body › Body values › Active zone minutes: range «4 wk.».': 'Auswerten › Körper › Körperwerte › Aktivzonenminuten: Zeitraum «4 Wo.».',
    'Open Body values, the tab «Active zone minutes» and the range «4 wk.»: a dashed line «Weekly goal ÷ 7: 21 min» runs over the daily bars.': 'Öffne die Körperwerte, den Reiter «Aktivzonenminuten» und den Zeitraum «4 Wo.»: eine gestrichelte Linie «Wochenziel ÷ 7: 21 Min.» läuft über den Tagesbalken.',
    'Switch to the range «1 y»: the bars are monthly sums and the line is gone.': 'Wechsle auf den Zeitraum «1 J»: die Balken sind Monatssummen und die Linie ist weg.',
  },
};
