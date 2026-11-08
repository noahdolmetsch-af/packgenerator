// «Analyse: Kacheln stimmen» (Noah 07.11.2026 «2a», Thread «UI-Test Analyse»): Aktivzonen pro Tag als Tagesschnitt, Velo mit Zeitraum
export default {
  title: 'Analysis: the tiles say what they show',
  lead: 'In the Analysis overview «Active zone minutes» is now the mean per day, and the bike tile names its period.',
  points: [{ text: '«Active zone minutes a day» shows the mean per day, not the total of the whole period', go: { href: '#/auswerten/analyse', steps: [{ sel: '[data-ov-box="azm"]' }], where: 'Auswerten › Analyse › Overview, the tiles at the top.' } }],
  small: [{ box: 'new', text: 'The bike tile says «in 30 days» (or the period you chose)', go: { href: '#/auswerten/analyse', steps: [{ sel: '[data-ov-box="km:bike"]' }], where: 'Auswerten › Analyse › Overview, the tiles at the top.' } }],
  test: ['Open Auswerten › Analyse › Overview: «Active zone minutes a day» shows a number like 35 min, with «mean of 30 days» under it.', 'Switch the period to 90 days: the bike tile says «in 90 days», the number grows, the active zone number stays about the same.'],
  since: [],
  de: {
    'Analysis: the tiles say what they show': 'Analyse: die Kacheln sagen, was sie zeigen',
    'In the Analysis overview «Active zone minutes» is now the mean per day, and the bike tile names its period.': 'Im Überblick der Analyse sind die Aktivzonen jetzt der Schnitt pro Tag, und die Velo-Kachel nennt ihren Zeitraum.',
    '«Active zone minutes a day» shows the mean per day, not the total of the whole period': '«Aktivzonen pro Tag» zeigt den Schnitt pro Tag, nicht die Summe des ganzen Zeitraums',
    'The bike tile says «in 30 days» (or the period you chose)': 'Die Velo-Kachel sagt «in 30 Tagen» (oder den gewählten Zeitraum)',
    'Auswerten › Analyse › Overview, the tiles at the top.': 'Auswerten › Analyse › Überblick, die Kacheln ganz oben.',
    'Open Auswerten › Analyse › Overview: «Active zone minutes a day» shows a number like 35 min, with «mean of 30 days» under it.': 'Öffne Auswerten › Analyse › Überblick: «Aktivzonen pro Tag» zeigt eine Zahl wie 35 min, darunter «Schnitt von 30 Tagen».',
    'Switch the period to 90 days: the bike tile says «in 90 days», the number grows, the active zone number stays about the same.': 'Stelle den Zeitraum auf 90 Tage: die Velo-Kachel sagt «in 90 Tagen», die Zahl wird grösser, die Aktivzonen-Zahl bleibt etwa gleich.',
  },
};
