// «Weg zum Ziel»: Startvorschlag bei offenem Zeitraum (Noah 05.11.2026 «4a», Entwurf G3)
export default {
  title: 'Way to the goal: a dry start',
  lead: 'A way without a start day can name a period and gets a suggestion for a start day with dry weather.',
  points: [
    { text: 'In a way without a start day, name a period: the app looks in the forecast for 3 dry days in a row and suggests «Set start Thu 11.06.». You can ask for another window or say no thanks', go: { href: '#/trips/weg', where: 'Trips › Way to the goal, in a way without a start day.' } },
  ],
  test: ['Open Trips › Way to the goal, in a way without a start day: the card «While the start day is open» offers «Find a dry start».', 'Name a period within the next two weeks: the card suggests a start day with dry weather, or says why it has none.'],
  since: [],
  de: {
    'Way to the goal: a dry start': 'Weg zum Ziel: ein trockener Start',
    'A way without a start day can name a period and gets a suggestion for a start day with dry weather.': 'Ein Weg ohne Starttag kann einen Zeitraum nennen und bekommt einen Vorschlag für einen Starttag mit trockenem Wetter.',
    'In a way without a start day, name a period: the app looks in the forecast for 3 dry days in a row and suggests «Set start Thu 11.06.». You can ask for another window or say no thanks': 'Nenne bei einem Weg ohne Starttag einen Zeitraum: Die App sucht in der Vorhersage 3 trockene Tage hintereinander und schlägt «Start Do 11.06. setzen» vor. Du kannst ein anderes Fenster wünschen oder Nein danke sagen',
    'Trips › Way to the goal, in a way without a start day.': 'Touren › Weg zum Ziel, in einem Weg ohne Starttag.',
    'Open Trips › Way to the goal, in a way without a start day: the card «While the start day is open» offers «Find a dry start».': 'Öffne Touren › Weg zum Ziel, in einem Weg ohne Starttag: Die Karte «Solange der Starttag offen ist» bietet «Trockenen Start finden».',
    'Name a period within the next two weeks: the card suggests a start day with dry weather, or says why it has none.': 'Nenne einen Zeitraum in den nächsten zwei Wochen: Die Karte schlägt einen Starttag mit trockenem Wetter vor oder sagt, warum sie keinen hat.',
  },
};
