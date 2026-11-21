// «Auswerten aufräumen» (Noah 07.11.2026 «1b 2a 3a 4a 5a»), Teil 1: «Im Fokus» ohne leere Sportarten, Zeitraum unter den Kacheln
export default {
  title: 'Analysis: clearer periods',
  lead: '«In focus» no longer shows a sport with 0:00:00, and the tiles of the overview say which days they count.',
  points: [
    {
      text: '«In focus» shows only sports with an activity in the last 7 days; otherwise one line says when the last one was',
      go: { href: '#/auswerten', steps: [{ text: 'In focus' }] },
    },
    {
      text: 'The tiles for resting pulse, active zone minutes and calories name their day or period',
      go: { href: '#/auswerten', steps: [{ sel: '[data-overview]' }], where: 'Analysis › Overview, under each tile; the tiles show once there is data.' },
    },
  ],
  small: [],
  test: [
    'Open Analysis › Overview: under the calories tile stands the day it counts, e.g. «yesterday».',
    'The tile «Active zone minutes» says «since Monday» with the days it adds up.',
    'With no ride in the last 7 days, «In focus» shows one line with the day of the last activity instead of an empty sport.',
  ],
  since: [],
  de: {
    'Analysis: clearer periods': 'Auswerten: Zeiträume klarer',
    '«In focus» no longer shows a sport with 0:00:00, and the tiles of the overview say which days they count.': '«Im Fokus» zeigt keine Sportart mehr mit 0:00:00, und die Kacheln der Übersicht sagen, welche Tage sie zählen.',
    '«In focus» shows only sports with an activity in the last 7 days; otherwise one line says when the last one was': '«Im Fokus» zeigt nur Sportarten mit einer Aktivität in den letzten 7 Tagen; sonst sagt eine Zeile, wann die letzte war',
    'In focus': 'Im Fokus',
    'Analysis › Overview, under each tile; the tiles show once there is data.': 'Auswerten › Übersicht, unter jeder Kachel; die Kacheln erscheinen, sobald es Daten gibt.',
    'The tiles for resting pulse, active zone minutes and calories name their day or period': 'Die Kacheln für Ruhepuls, Aktivzonenminuten und Kalorien nennen ihren Tag oder Zeitraum',
    'Open Analysis › Overview: under the calories tile stands the day it counts, e.g. «yesterday».': 'Öffne Auswerten › Übersicht: Unter der Kachel «Kalorien» steht der Tag, den sie zählt, z. B. «gestern».',
    'The tile «Active zone minutes» says «since Monday» with the days it adds up.': 'Die Kachel «Aktivzonenminuten» sagt «seit Montag» mit den Tagen, die sie zusammenzählt.',
    'With no ride in the last 7 days, «In focus» shows one line with the day of the last activity instead of an empty sport.': 'Gab es in den letzten 7 Tagen keine Fahrt, zeigt «Im Fokus» eine Zeile mit dem Tag der letzten Aktivität statt einer leeren Sportart.',
  },
};
