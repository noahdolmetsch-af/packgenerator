// «Tourenvorschläge: Neuland» (Noah 24.11.2026 «1, 2, 3, 4, 5»): was für dich neu ist. Eine Datei für den ganzen PR.
export default {
  title: 'Tour suggestions: new ground',
  lead: 'The suggested tours show what is new for you: line, canton, passes and peaks.',
  points: [
    { text: 'The filter «New ground» sorts the tours newest first or keeps the ones that are mostly new, have a new pass or peak, or lie in a new canton; the card says what is new', go: { href: '#/trips/vorschlaege', steps: [{ sel: '[data-vs-neu-group]' }], where: 'Trips › Dreams › Tour suggestions, filters: the group «New ground».' } },
    { text: 'On the map of a tour the pieces you have ridden before are grey and the new ones keep their colour', go: { href: '#/trips/vorschlaege/sm-33', steps: [{ sel: '[data-vs-map]' }] } },
    { text: 'Passes and peaks on the way: which are new for you and which you have reached; Neuland counts them by itself once you have been there', go: { href: '#/trips/vorschlaege/sm-33', steps: [{ sel: '[data-vs-neu-sec]' }] } },
  ],
  small: [
    { box: 'new', text: 'A quiet goal of the month («3 tours with over 60 % new»): tick a tour by hand, change it or switch it off', go: null },
  ],
  test: ['Open Trips › Dreams › Tour suggestions: under the filters the group «New ground» has «Newest first», «Mostly new», «With a new pass or peak» and «New canton». Tap one: the list follows. Tap «Any»: all are back.', 'Open a tour: «New ground on this tour» shows the share of new line, the canton and the passes and peaks on the way. On the map the pieces you have ridden are grey.', 'Tap «Tick for the goal»: the line «Goal for this month» counts one more. Under the filters «Change goal» changes the number and the share, or switches the goal off.'],
  since: [],
  de: {
    'Tour suggestions: new ground': 'Tourenvorschläge: Neuland',
    'The suggested tours show what is new for you: line, canton, passes and peaks.': 'Die Tourenvorschläge zeigen, was für dich neu ist: Strecke, Kanton, Pässe und Gipfel.',
    'The filter «New ground» sorts the tours newest first or keeps the ones that are mostly new, have a new pass or peak, or lie in a new canton; the card says what is new': 'Der Filter «Neuland» stellt die Touren mit dem meisten Neuen zuerst oder behält die, die mindestens zur Hälfte neu sind, einen neuen Pass oder Gipfel haben oder in einem neuen Kanton liegen; die Karte sagt, was neu ist',
    'Trips › Dreams › Tour suggestions, filters: the group «New ground».': 'Touren › Träume › Tourenvorschläge, Filter: die Gruppe «Neuland».',
    'On the map of a tour the pieces you have ridden before are grey and the new ones keep their colour': 'Auf der Karte einer Tour sind die Stücke, die du schon gefahren bist, grau, und die neuen behalten ihre Farbe',
    'Passes and peaks on the way: which are new for you and which you have reached; Neuland counts them by itself once you have been there': 'Pässe und Gipfel auf dem Weg: welche neu für dich sind und welche du erreicht hast; Neuland zählt sie von selbst, sobald du dort warst',
    'A quiet goal of the month («3 tours with over 60 % new»): tick a tour by hand, change it or switch it off': 'Ein ruhiges Monatsziel («3 Touren mit über 60 % neu»): eine Tour von Hand abhaken, ändern oder ausschalten',
    'Open Trips › Dreams › Tour suggestions: under the filters the group «New ground» has «Newest first», «Mostly new», «With a new pass or peak» and «New canton». Tap one: the list follows. Tap «Any»: all are back.': 'Öffne Touren › Träume › Tourenvorschläge: unter den Filtern hat die Gruppe «Neuland» «Neuestes zuerst», «Mindestens zur Hälfte neu», «Mit neuem Pass oder Gipfel» und «Neuer Kanton». Tippe eines an: die Liste folgt. Tippe «Egal»: alle sind zurück.',
    'Open a tour: «New ground on this tour» shows the share of new line, the canton and the passes and peaks on the way. On the map the pieces you have ridden are grey.': 'Öffne eine Tour: «Neuland auf dieser Tour» zeigt den Anteil neuer Strecke, den Kanton und die Pässe und Gipfel auf dem Weg. Auf der Karte sind die Stücke, die du gefahren bist, grau.',
    'Tap «Tick for the goal»: the line «Goal for this month» counts one more. Under the filters «Change goal» changes the number and the share, or switches the goal off.': 'Tippe «Fürs Ziel abhaken»: die Zeile «Ziel im Monat» zählt eins mehr. Unter den Filtern ändert «Ziel ändern» die Zahl und den Anteil oder schaltet das Ziel aus.',
  },
};
