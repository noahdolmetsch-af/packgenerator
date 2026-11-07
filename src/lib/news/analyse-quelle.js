// «Quelle zum Antippen» (UI-Prüfung 07.11.2026, Noah «alle Vorschläge», Rang 2): the page of one value names its source and leads to it
export default {
  title: 'Where a value comes from',
  lead: 'Under the title of every value in Analyse, a line names the source. A tap opens it, and past trips in that time are listed.',
  points: [{ text: 'Open a value in Analyse: «Source: Fitbit ›» leads to the Fitbit page', go: { href: '#/auswerten/analyse/rhr', steps: [{ sel: '[data-source]' }], where: 'Analyse › any value, right under the title.' } }],
  small: [],
  test: ['Open Analyse › All values › Resting pulse: under the title it says «Source: Fitbit ›».', 'Tap it: the Fitbit page opens. On your own entries (for example weight) the line is not there.'],
  since: [],
  de: {
    'Where a value comes from': 'Woher ein Wert kommt',
    'Under the title of every value in Analyse, a line names the source. A tap opens it, and past trips in that time are listed.': 'Unter dem Titel jedes Werts in der Analyse nennt eine Zeile die Quelle. Ein Tipp öffnet sie, vergangene Touren in dieser Zeit stehen auch da.',
    'Open a value in Analyse: «Source: Fitbit ›» leads to the Fitbit page': 'Öffne einen Wert in der Analyse: «Quelle: Fitbit ›» führt zur Fitbit-Seite',
    'Analyse › any value, right under the title.': 'Analyse › ein beliebiger Wert, direkt unter dem Titel.',
    'Open Analyse › All values › Resting pulse: under the title it says «Source: Fitbit ›».': 'Öffne Analyse › Alle Werte › Ruhepuls: unter dem Titel steht «Quelle: Fitbit ›».',
    'Tap it: the Fitbit page opens. On your own entries (for example weight) the line is not there.': 'Tippe darauf: die Fitbit-Seite öffnet sich. Bei eigenen Einträgen (zum Beispiel Gewicht) fehlt die Zeile.',
  },
};
