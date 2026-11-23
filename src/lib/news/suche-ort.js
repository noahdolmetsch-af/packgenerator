// «Suche am Ort» (Warteliste 1, V2; Noah 22.11.2026 «2a», «3b»): ein Suchfeld oben auf Ich, Touren und Auswerten
export default {
  title: 'Search right where you are: Me, Trips and Analysis',
  lead: 'Ich, Touren and Auswerten have a search field of their own behind the title. On Touren four filter buttons narrow the rides.',
  points: [
    { text: 'On Me: «Find a setting» finds the functions under Me and leads to them; «Search everywhere» opens the big search', go: { href: '#/me', steps: [{ sel: '[data-suche-hier="me"]' }] } },
    { text: 'On Trips: «Find a trip or ride» with the buttons Year, Bike, Kind and Distance, and the sum under the field', go: { href: '#/trips', steps: [{ sel: '[data-suche-hier="trips"]' }] } },
    { text: 'On Analysis: «Find a value or question» finds the pages and charts of Analysis', go: { href: '#/auswerten', steps: [{ sel: '[data-suche-hier="auswerten"]' }] } },
  ],
  small: [],
  test: [
    'Open Me and type «backup» into the field behind the title: the functions appear, a tap leads to one.',
    'Open Trips, tap «Distance» and choose «over 80 km»: the hits and their sum show under the field.',
    'Open Analysis and type «resting»: the pages of Analysis appear; «Search everywhere» opens the big search.',
  ],
  since: [],
  de: {
    'Search right where you are: Me, Trips and Analysis': 'Suchen, wo du gerade bist: Ich, Touren und Auswerten',
    'Ich, Touren and Auswerten have a search field of their own behind the title. On Touren four filter buttons narrow the rides.': 'Ich, Touren und Auswerten haben hinter dem Titel ein eigenes Suchfeld. Auf Touren grenzen vier Filterknöpfe die Fahrten ein.',
    'On Me: «Find a setting» finds the functions under Me and leads to them; «Search everywhere» opens the big search': 'Auf Ich: «Einstellung suchen» findet die Funktionen unter Ich und führt hin; «Überall suchen» öffnet die grosse Suche',
    'On Trips: «Find a trip or ride» with the buttons Year, Bike, Kind and Distance, and the sum under the field': 'Auf Touren: «Tour oder Fahrt suchen» mit den Knöpfen Jahr, Velo, Art und Distanz und der Summe unter dem Feld',
    'On Analysis: «Find a value or question» finds the pages and charts of Analysis': 'Auf Auswerten: «Wert oder Frage suchen» findet die Seiten und Diagramme von Auswerten',
    'Open Me and type «backup» into the field behind the title: the functions appear, a tap leads to one.': 'Ich öffnen und «backup» ins Feld hinter dem Titel tippen: die Funktionen erscheinen, ein Tipp führt hin.',
    'Open Trips, tap «Distance» and choose «over 80 km»: the hits and their sum show under the field.': 'Touren öffnen, «Distanz» antippen und «über 80 km» wählen: die Treffer und ihre Summe stehen unter dem Feld.',
    'Open Analysis and type «resting»: the pages of Analysis appear; «Search everywhere» opens the big search.': 'Auswerten öffnen und «Ruhepuls» tippen: die Seiten von Auswerten erscheinen; «Überall suchen» öffnet die grosse Suche.',
  },
};
