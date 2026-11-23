// «Wetterseite aufräumen» (Noah 23.11.2026 «ja»; Thread «Wetter besser machen»)
export default {
  title: 'The weather page, tidied up',
  lead: 'One rain time for the whole page, a short answer at the top and charts you can read.',
  points: [
    { text: 'Rain starts at the same time everywhere: on the tour card, on Today, in «The next hours» and under the rain bars', go: { href: '#/wetter', steps: [{ sel: '[data-wx-answer]' }], where: 'Weather › Now, at the top: it shows as soon as the weather service has answered.' } },
    { text: 'A short answer at the top: «Today: rain from 07:00, 3–5 °C. Take rain gear.»', go: { href: '#/wetter', steps: [{ sel: '[data-wx-answer]' }], where: 'Weather › Now, at the top: it shows as soon as the weather service has answered.' } },
    { text: 'The rain bars and the lake chart have an axis with values; point at a bar or a day, or tap it, for its number', go: { href: '#/wetter?tab=radar', steps: [{ sel: '[data-wx-r24]' }] } },
  ],
  small: [
    { box: 'new', text: 'Empty things are gone: no row of dashes for the fog line, and pollen and ozone sit in a closed line', go: { href: '#/wetter', steps: [{ sel: '[data-wx-air-fold]' }] } },
    { box: 'new', text: 'When 2, 4, 6 and 8 hours say the same, «The next hours» says it once; the place shows as «Zürich»; «−0» is a 0', go: { href: '#/wetter', steps: [{ sel: '[data-wx-hours]' }], where: 'Weather › Now, «The next hours»: shows as soon as the weather service has answered.' } },
  ],
  test: ['Open Weather: at the top one short answer says when it rains and what to take.', 'Compare the rain time on the tour card, in «Today» and under «Rain in the next 3 hours»: it is the same time.', 'Open «Radar and cameras» and point at a bar of «Rain in the next 24 hours»: the hour and its rain show above the chart.'],
  de: {
    'Weather › Now, at the top: it shows as soon as the weather service has answered.': 'Wetter › Jetzt, ganz oben: sie erscheint, sobald der Wetterdienst geantwortet hat.',
    'Weather › Now, «The next hours»: shows as soon as the weather service has answered.': 'Wetter › Jetzt, «Die nächsten Stunden»: erscheint, sobald der Wetterdienst geantwortet hat.',
    'The weather page, tidied up': 'Die Wetterseite, aufgeräumt',
    'One rain time for the whole page, a short answer at the top and charts you can read.': 'Eine Regenzeit für die ganze Seite, eine Kurzantwort oben und Diagramme, die man lesen kann.',
    'Rain starts at the same time everywhere: on the tour card, on Today, in «The next hours» and under the rain bars': 'Der Regen beginnt überall zur gleichen Zeit: auf der Tourkarte, bei Heute, in «Die nächsten Stunden» und unter den Regenbalken',
    'A short answer at the top: «Today: rain from 07:00, 3–5 °C. Take rain gear.»': 'Eine Kurzantwort ganz oben: «Heute: Regen ab 07:00, 3–5 °C. Regenzeug einpacken.»',
    'The rain bars and the lake chart have an axis with values; point at a bar or a day, or tap it, for its number': 'Die Regenbalken und das Seediagramm haben eine Achse mit Werten; zeige auf einen Balken oder Tag oder tippe ihn an, dann steht seine Zahl da',
    'Empty things are gone: no row of dashes for the fog line, and pollen and ozone sit in a closed line': 'Leeres ist weg: keine Reihe Striche bei der Nebelgrenze, und Pollen und Ozon stehen in einer geschlossenen Zeile',
    'When 2, 4, 6 and 8 hours say the same, «The next hours» says it once; the place shows as «Zürich»; «−0» is a 0': 'Sagen 2, 4, 6 und 8 Stunden dasselbe, steht es in «Die nächsten Stunden» nur einmal; der Ort heisst «Zürich»; aus «−0» wird 0',
    'Open Weather: at the top one short answer says when it rains and what to take.': 'Öffne Wetter: ganz oben sagt eine Kurzantwort, wann es regnet und was du mitnimmst.',
    'Compare the rain time on the tour card, in «Today» and under «Rain in the next 3 hours»: it is the same time.': 'Vergleiche die Regenzeit auf der Tourkarte, in «Heute» und unter «Regen in den nächsten 3 Stunden»: es ist dieselbe Zeit.',
    'Open «Radar and cameras» and point at a bar of «Rain in the next 24 hours»: the hour and its rain show above the chart.': 'Öffne «Radar und Kameras» und zeige auf einen Balken von «Regen in den nächsten 24 Stunden»: die Stunde und ihr Regen stehen über dem Diagramm.',
  },
};
