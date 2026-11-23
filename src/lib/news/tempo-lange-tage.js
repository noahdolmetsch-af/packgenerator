// «Lange Tage» (Noah 21.11.2026 «1a», Vorschlag S1): the riding-hours guess knows that you get slower on long days
export default {
  title: 'Long days take longer',
  lead: 'The guess for the riding hours of a long day now counts how much slower your long rides were.',
  points: [
    { text: 'From a day of 80 km, the hours include how much longer your long rides took than your shorter ones', go: { href: '#/trips', steps: [{ sel: '[data-tired]' }], where: 'Trips › a trip with a long route › Route' } },
  ],
  small: [{ box: 'new', text: 'It is only a guess for the riding hours; you can still change them' }],
  test: ['Open a trip with a GPX route of 80 km or more a day, after at least 3 long and 5 shorter rides: under the route a line says how much longer long rides took.', 'The riding hours above are higher than for a short route with the same pace.'],
  since: [],
  de: {
    'Long days take longer': 'Lange Tage dauern länger',
    'The guess for the riding hours of a long day now counts how much slower your long rides were.': 'Die Schätzung der Fahrzeit für einen langen Tag zählt jetzt mit, wie viel langsamer deine langen Fahrten waren.',
    'From a day of 80 km, the hours include how much longer your long rides took than your shorter ones': 'Ab einem Tag von 80 km steckt in den Stunden, wie viel länger deine langen Fahrten dauerten als deine kürzeren',
    'Trips › a trip with a long route › Route': 'Touren › eine Tour mit langer Route › Route',
    'It is only a guess for the riding hours; you can still change them': 'Es ist nur eine Schätzung für die Fahrzeit; du kannst sie weiter ändern',
    'Open a trip with a GPX route of 80 km or more a day, after at least 3 long and 5 shorter rides: under the route a line says how much longer long rides took.': 'Öffne eine Tour mit GPX-Route ab 80 km am Tag, nach mindestens 3 langen und 5 kürzeren Fahrten: Unter der Route sagt eine Zeile, wie viel länger lange Fahrten dauerten.',
    'The riding hours above are higher than for a short route with the same pace.': 'Die Fahrzeit darüber ist höher als bei einer kurzen Route mit gleichem Tempo.',
  },
};
