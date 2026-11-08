// «Leere Reiter erklären» (Noah 07.11.2026 «3 ja», UI-Test der Analyse-Seite): a tab without data says why and offers the next step
export default {
  title: 'Analyse: empty tabs explain themselves',
  lead: 'A tab in Analyse without data no longer stays blank: it says why and has buttons to connect Fitbit or Strava, add a bike or tick in Aktiv.',
  points: [
    { text: 'Overview without data says why and offers «Open Aktiv» and «Connect Fitbit»', go: { href: '#/auswerten/analyse', steps: [{ sel: '[data-empty]' }], where: 'Auswerten › Analyse › Overview (with a fresh app or an empty period).' } },
    { text: '«Bikes» without a bike explains what you will see and has «Add a bike» and «Connect Strava»', go: { href: '#/auswerten/analyse', steps: [{ sel: '[data-empty]' }], where: 'Auswerten › Analyse › Bikes.' } },
    { text: '«All values» without data has the buttons «Connect Fitbit» and «Connect Strava»', go: { href: '#/auswerten/analyse', steps: [{ sel: '[data-empty]' }], where: 'Auswerten › Analyse › All values.' } },
  ],
  small: [],
  test: [
    'Open Auswerten › Analyse › Overview with a period in which nothing is recorded: a text says why it is empty.',
    'Tap «Connect Fitbit»: the page for the connection opens.',
    'Open the tab «Bikes» without a bike: it says what you will see and offers «Add a bike».',
  ],
  since: [],
  de: {
    'Analyse: empty tabs explain themselves': 'Analyse: leere Reiter erklären sich',
    'A tab in Analyse without data no longer stays blank: it says why and has buttons to connect Fitbit or Strava, add a bike or tick in Aktiv.': 'Ein Reiter in der Analyse ohne Daten bleibt nicht mehr leer: Er sagt warum und hat Knöpfe, um Fitbit oder Strava zu verbinden, ein Velo anzulegen oder in Aktiv abzuhaken.',
    'Overview without data says why and offers «Open Aktiv» and «Connect Fitbit»': 'Die Übersicht ohne Daten sagt warum und bietet «Aktiv öffnen» und «Fitbit verbinden»',
    'Auswerten › Analyse › Overview (with a fresh app or an empty period).': 'Auswerten › Analyse › Übersicht (bei frischer App oder leerem Zeitraum).',
    '«Bikes» without a bike explains what you will see and has «Add a bike» and «Connect Strava»': '«Velos» ohne Velo erklärt, was du sehen wirst, und hat «Velo anlegen» und «Strava verbinden»',
    'Auswerten › Analyse › Bikes.': 'Auswerten › Analyse › Velos.',
    '«All values» without data has the buttons «Connect Fitbit» and «Connect Strava»': '«Alle Werte» ohne Daten hat die Knöpfe «Fitbit verbinden» und «Strava verbinden»',
    'Auswerten › Analyse › All values.': 'Auswerten › Analyse › Alle Werte.',
    'Open Auswerten › Analyse › Overview with a period in which nothing is recorded: a text says why it is empty.': 'Öffne Auswerten › Analyse › Übersicht mit einem Zeitraum, in dem nichts aufgezeichnet ist: Ein Text sagt, warum sie leer ist.',
    'Tap «Connect Fitbit»: the page for the connection opens.': 'Tippe auf «Fitbit verbinden»: Die Seite für die Verbindung öffnet sich.',
    'Open the tab «Bikes» without a bike: it says what you will see and offers «Add a bike».': 'Öffne den Reiter «Velos» ohne Velo: Er sagt, was du sehen wirst, und bietet «Velo anlegen».',
  },
};
