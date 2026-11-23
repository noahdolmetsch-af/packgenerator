// «Warteliste» (Noah 22.11.2026, ein PR statt vieler): search, packing in steps, «Your suggestion», clearer page starts and small fixes. One file for the whole PR (one version).
export default {
  title: 'The waiting list: search, packing and small things',
  lead: 'The search finds more and sits on Me, Trips and Analysis; the packing list goes step by step; a new page suggests your list.',
  points: [
    { text: 'Search: rides, places, learnings, bike care, training and tasks are found, and Me, Trips and Analysis have a search field of their own behind the title', go: { href: '#/me', steps: [{ sel: '[data-suche-hier="me"]' }] } },
    { text: 'Packing: the list can go step by step with «Next», Trips shows the next tours as cards, and «Suggestion in a minute» opens «Your suggestion»', go: { href: '#/trips', steps: [{ sel: '[data-pack-cards]' }] } },
    { text: 'Today: «n things are up today» is tappable and jumps to «Up now»', go: { href: '#/', steps: [{ sel: '[data-say-jump]' }], where: 'Today, under the greeting (on a day with things to do).' } },
  ],
  small: [
    { box: 'new', text: 'The row «Belongs to …» is a closed line behind the title; «Back» names where you came from', go: { href: '#/trips', steps: [{ sel: '[data-card-line="gd:trips"]' }], where: 'Trips, the closed line behind the title.' } },
    { box: 'new', text: 'What is new shows the day with the weekday and the time, and a picture you can open', go: { href: '#/me/news', steps: [{ sel: '[data-version]' }] } },
    { box: 'new', text: 'Own to-dos in the week say «Remove» (it asks first), and Mail shows its state in Connections', go: null },
  ],
  test: [
    'Open Me and type «backup» into the field behind the title: the functions appear, a tap leads to one.',
    'Open Trips: the next tours stand as cards. Tap «Continue with …» on one: the packing list opens in Steps.',
    'Tap «New trip», then «Suggestion in a minute»: the trip is made and «Your suggestion» opens.',
    'Open Heute and tap «n things are up today» under the greeting: the page jumps to the list «Up now».',
  ],
  since: ['f.packvorschlag'],
  de: {
    'The waiting list: search, packing and small things': 'Die Warteliste: Suche, Packen und Kleines',
    'The search finds more and sits on Me, Trips and Analysis; the packing list goes step by step; a new page suggests your list.': 'Die Suche findet mehr und steht auf Ich, Touren und Auswerten; die Packliste geht Schritt für Schritt; eine neue Seite schlägt deine Liste vor.',
    'Search: rides, places, learnings, bike care, training and tasks are found, and Me, Trips and Analysis have a search field of their own behind the title': 'Suche: Fahrten, Orte, Erkenntnisse, Velopflege, Training und Aufgaben werden gefunden, und Ich, Touren und Auswerten haben hinter dem Titel ein eigenes Suchfeld',
    'Packing: the list can go step by step with «Next», Trips shows the next tours as cards, and «Suggestion in a minute» opens «Your suggestion»': 'Packen: die Liste geht Schritt für Schritt mit «Weiter», Touren zeigt die nächsten Touren als Karten, und «Vorschlag in einer Minute» öffnet «Dein Vorschlag»',
    'Today: «n things are up today» is tappable and jumps to «Up now»': 'Heute: «n Dinge sind heute dran» ist tippbar und springt zu «Jetzt dran»',
    'Today, under the greeting (on a day with things to do).': 'Heute, unter dem Gruss (an einem Tag mit Dingen zu tun).',
    'The row «Belongs to …» is a closed line behind the title; «Back» names where you came from': 'Die Zeile «Gehört zu …» ist eine geschlossene Zeile hinter dem Titel; «Zurück» nennt die Herkunft',
    'Trips, the closed line behind the title.': 'Touren, die geschlossene Zeile hinter dem Titel.',
    'What is new shows the day with the weekday and the time, and a picture you can open': 'Was ist neu zeigt den Tag mit Wochentag und Uhrzeit und ein Bild zum Öffnen',
    'Own to-dos in the week say «Remove» (it asks first), and Mail shows its state in Connections': 'Eigene To-dos in der Woche sagen «Entfernen» (mit Frage), und Mail zeigt in den Verbindungen seinen Stand',
    'Open Me and type «backup» into the field behind the title: the functions appear, a tap leads to one.': 'Ich öffnen und «backup» in das Feld hinter dem Titel tippen: die Funktionen erscheinen, ein Tipp führt zu einer.',
    'Open Trips: the next tours stand as cards. Tap «Continue with …» on one: the packing list opens in Steps.': 'Touren öffnen: die nächsten Touren stehen als Karten. «Weiter mit …» auf einer antippen: die Packliste öffnet sich in Schritten.',
    'Tap «New trip», then «Suggestion in a minute»: the trip is made and «Your suggestion» opens.': '«Neue Tour» antippen, dann «Vorschlag in einer Minute»: die Tour wird angelegt und «Dein Vorschlag» öffnet sich.',
    'Open Heute and tap «n things are up today» under the greeting: the page jumps to the list «Up now».': 'Heute öffnen und unter dem Gruss «n Dinge sind heute dran» antippen: die Seite springt zur Liste «Jetzt dran».',
  },
};
