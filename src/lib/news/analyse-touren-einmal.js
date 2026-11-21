// «Touren nur einmal» (Noah 08.11.2026 «ja 1-3», Vorschlag 1): the trips of a range were named twice on the page of a value
export default {
  title: 'Trips named once',
  lead: 'On the page of a value the trips of the range are listed once, under the course.',
  points: [{ text: 'The line «Trips in this time» under the title is gone; the list under the course shows the same trips with their mean', go: { href: '#/auswerten/analyse/cardioLoad', steps: [{ sel: '[data-trip-list]' }], where: 'Analyse › a value (e.g. Cardio load) › under the course, once a trip lies in the range.' } }],
  small: [],
  test: ['Open Analyse › Cardio load (3 months): under the title there is only the source line, no list of trips.', 'Under the course the card «Trips in this range» lists the trips; a finished trip opens its page.'],
  since: [],
  de: {
    'Trips named once': 'Touren nur einmal',
    'On the page of a value the trips of the range are listed once, under the course.': 'Auf der Seite eines Werts stehen die Touren des Zeitraums nur noch einmal, unter dem Verlauf.',
    'The line «Trips in this time» under the title is gone; the list under the course shows the same trips with their mean': 'Die Zeile «Touren in dieser Zeit» unter dem Titel ist weg; die Liste unter dem Verlauf zeigt dieselben Touren mit ihrem Schnitt',
    'Analyse › a value (e.g. Cardio load) › under the course, once a trip lies in the range.': 'Analyse › ein Wert (z. B. Cardio-Belastung) › unter dem Verlauf, sobald eine Tour im Zeitraum liegt.',
    'Open Analyse › Cardio load (3 months): under the title there is only the source line, no list of trips.': 'Öffne Analyse › Cardio-Belastung (3 Monate): unter dem Titel steht nur die Zeile mit der Quelle, keine Tour-Liste.',
    'Under the course the card «Trips in this range» lists the trips; a finished trip opens its page.': 'Unter dem Verlauf listet die Karte «Touren in diesem Zeitraum» die Touren; eine abgeschlossene Tour öffnet ihre Seite.',
  },
};
