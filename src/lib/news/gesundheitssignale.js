// «Gesundheitssignale» (Noah 03.11.2026, Idee 3 der Cockpit-Ideen): your range and what stands out, on the page of a Fitbit value
export default {
  title: 'Your range and what stands out',
  lead: 'On the page of resting pulse, HRV or sleep you now see your own range and the days that stand out.',
  points: [
    { text: 'Your range: the middle 80 % of your last 60 days, not a textbook value', go: { href: '#/auswerten/analyse/rhr', steps: [{ sel: '[data-signals]' }], where: 'Auswerten › Analyse › Resting pulse, under the chart.' } },
    { text: '«What stands out» lists 3 or more days in a row above or below your range; a tap opens the day', go: { href: '#/auswerten/analyse/rhr', steps: [{ sel: '[data-signals]' }], where: 'Auswerten › Analyse › Resting pulse, under the chart.' } },
    { text: 'The source and the time of the last fetch stand in the same place', go: { href: '#/auswerten/analyse/rhr', steps: [{ sel: '[data-signals]' }], where: 'Auswerten › Analyse › Resting pulse, under the chart.' } },
  ],
  small: [{ box: 'new', text: 'Body values: a link «Your range and what stands out» on the tabs for heart, HRV and sleep' }],
  test: [
    'Open Active › Body values › Heart and tap «Your range and what stands out».',
    'Under the chart: your range, and either a list of days that stand out or «Nothing stands out».',
    'Tap a line of the list: that day opens with all its values.',
  ],
  since: [],
  de: {
    'Your range and what stands out': 'Deine Bandbreite und was auffällt',
    'On the page of resting pulse, HRV or sleep you now see your own range and the days that stand out.': 'Auf der Seite von Ruhepuls, HRV oder Schlaf siehst du jetzt deine eigene Bandbreite und die Tage, die auffallen.',
    'Your range: the middle 80 % of your last 60 days, not a textbook value': 'Deine Bandbreite: die mittleren 80 % deiner letzten 60 Tage, kein Lehrbuchwert',
    '«What stands out» lists 3 or more days in a row above or below your range; a tap opens the day': '«Was auffällt» nennt 3 oder mehr Tage in Folge über oder unter deiner Bandbreite; ein Tipp öffnet den Tag',
    'The source and the time of the last fetch stand in the same place': 'Die Quelle und die Zeit des letzten Abrufs stehen am selben Ort',
    'Auswerten › Analyse › Resting pulse, under the chart.': 'Auswerten › Analyse › Ruhepuls, unter dem Diagramm.',
    'Body values: a link «Your range and what stands out» on the tabs for heart, HRV and sleep': 'Körperwerte: ein Link «Deine Bandbreite und was auffällt» auf den Reitern Herz, HRV und Schlaf',
    'Open Active › Body values › Heart and tap «Your range and what stands out».': 'Öffne Aktiv › Körperwerte › Herz und tippe auf «Deine Bandbreite und was auffällt».',
    'Under the chart: your range, and either a list of days that stand out or «Nothing stands out».': 'Unter dem Diagramm: deine Bandbreite und entweder eine Liste der auffälligen Tage oder «Nichts fällt auf».',
    'Tap a line of the list: that day opens with all its values.': 'Tippe auf eine Zeile der Liste: der Tag öffnet sich mit allen Werten.',
  },
};
