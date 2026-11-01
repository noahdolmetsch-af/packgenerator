// Roboter-Test 1.11.2026 (Noah «mache einen kompletten UI-Test»): two small display errors found by the robot
export default {
  title: 'Two small display errors fixed',
  lead: 'A robot walked through every page; the first two small errors are gone.',
  points: [
    { text: 'In Analyse, the line «highest» shows the day or trip name instead of «{day}»', go: null },
    { text: 'The quick links on Today wrap onto a second line instead of ending in «…»', go: null },
  ],
  small: [{ box: 'new', text: 'Trip bands in Analyse show the trip name again', go: null }],
  test: [
    'Open Analyse, then «SpO2»: under the course «highest» shows a day, never «{day}».',
    'On Today (phone) open «Open quickly»: «Was ziehe ich an?» is readable in two lines.',
  ],
  since: [],
  de: {
    'Two small display errors fixed': 'Zwei kleine Anzeigefehler behoben',
    'A robot walked through every page; the first two small errors are gone.': 'Ein Roboter ist durch jede Seite gegangen; die ersten zwei kleinen Fehler sind weg.',
    'In Analyse, the line «highest» shows the day or trip name instead of «{day}»': 'In Analyse zeigt «höchster» den Tag oder den Tournamen statt «{day}»',
    'The quick links on Today wrap onto a second line instead of ending in «…»': 'Die Schnellzugriffe auf Heute brechen in eine zweite Zeile um, statt mit «…» zu enden',
    'Trip bands in Analyse show the trip name again': 'Tour-Bänder in Analyse zeigen wieder den Tournamen',
    'Open Analyse, then «SpO2»: under the course «highest» shows a day, never «{day}».': 'Öffne Analyse, dann «SpO2»: unter dem Verlauf zeigt «höchster» einen Tag, nie «{day}».',
    'On Today (phone) open «Open quickly»: «Was ziehe ich an?» is readable in two lines.': 'Öffne auf Heute (Handy) «Schnell öffnen»: «Was ziehe ich an?» ist in zwei Zeilen lesbar.',
  },
};
