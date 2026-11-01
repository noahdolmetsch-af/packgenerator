// Roboter-Test 1.11.2026 (Noah «mache einen kompletten UI-Test», «1a 2a 3a 4a 5a»): small display errors found by the robot
export default {
  title: 'Small display errors fixed',
  lead: 'A robot walked through every page; the small errors it found are gone.',
  points: [
    { text: 'In Analyse, the line «highest» shows the day or trip name instead of «{day}»', go: null },
    { text: 'The quick links on Today wrap onto a second line instead of ending in «…»', go: null },
    { text: 'When the map pictures do not load, the map says so', go: null },
  ],
  small: [
    { box: 'new', text: 'Trip bands in Analyse show the trip name again', go: null },
    { box: 'new', text: 'The two «Velo» layer chips in Analyse say which one is the km', go: null },
    { box: 'new', text: '«Try again» for ozone and pollen shows «Loading …» and then what happened', go: null },
    { box: 'new', text: 'The notes in My webcams have the same size as everywhere', go: null },
    { box: 'new', text: 'A few small links in Analyse, Aktiv and Today are easier to hit', go: null },
  ],
  test: [
    'Open Analyse, then «SpO2»: under the course «highest» shows a day, never «{day}».',
    'On Today (phone) open «Open quickly»: «Was ziehe ich an?» is readable in two lines.',
    'Open a trip with a map without internet: a line says the map picture is not loading.',
  ],
  since: [],
  de: {
    'Small display errors fixed': 'Kleine Anzeigefehler behoben',
    'A robot walked through every page; the small errors it found are gone.': 'Ein Roboter ist durch jede Seite gegangen; die kleinen Fehler, die er gefunden hat, sind weg.',
    'In Analyse, the line «highest» shows the day or trip name instead of «{day}»': 'In Analyse zeigt «höchster» den Tag oder den Tournamen statt «{day}»',
    'The quick links on Today wrap onto a second line instead of ending in «…»': 'Die Schnellzugriffe auf Heute brechen in eine zweite Zeile um, statt mit «…» zu enden',
    'When the map pictures do not load, the map says so': 'Wenn die Kartenbilder nicht laden, sagt die Karte das',
    'Trip bands in Analyse show the trip name again': 'Tour-Bänder in Analyse zeigen wieder den Tournamen',
    'The two «Velo» layer chips in Analyse say which one is the km': 'Die zwei «Velo»-Chips in Analyse sagen, welcher die km sind',
    '«Try again» for ozone and pollen shows «Loading …» and then what happened': '«Nochmals» bei Ozon und Pollen zeigt «Lädt …» und danach, was passiert ist',
    'The notes in My webcams have the same size as everywhere': 'Die Hinweise in Meine Webcams haben dieselbe Grösse wie überall',
    'A few small links in Analyse, Aktiv and Today are easier to hit': 'Ein paar kleine Links in Analyse, Aktiv und Heute sind leichter zu treffen',
    'Open Analyse, then «SpO2»: under the course «highest» shows a day, never «{day}».': 'Öffne Analyse, dann «SpO2»: unter dem Verlauf zeigt «höchster» einen Tag, nie «{day}».',
    'On Today (phone) open «Open quickly»: «Was ziehe ich an?» is readable in two lines.': 'Öffne auf Heute (Handy) «Schnell öffnen»: «Was ziehe ich an?» ist in zwei Zeilen lesbar.',
    'Open a trip with a map without internet: a line says the map picture is not loading.': 'Öffne eine Tour mit Karte ohne Internet: Eine Zeile sagt, dass das Kartenbild nicht lädt.',
  },
};
