// To-dos und Notizen verbessern (Noah 05.11.2026 «f1-f3, n1-n3 alle. in einem PR»): quick line, words for the date, swipe and sort, steps, belongs to, one search, a note beside the list
export default {
  title: 'Better to-dos and notes',
  lead: 'Write a to-do in one line, with the date in your own words.',
  points: [
    { text: 'Remember: the top line takes «Oil the chain tomorrow 6 pm, every Sunday» and finds date, time and repeat itself', href: '#/calendar', go: 'f.todoquick' },
    { text: 'A to-do can have steps («3 of 6») and belong to a trip, a bike or a note; they show it too', href: '#/calendar', go: 'f.todosteps' },
    { text: 'Swipe, sort and search: to-dos by swipe or arrows, one search for to-dos and notes, a note beside the list on a wide screen', href: '#/calendar', go: 'f.todosort' },
  ],
  small: [
    { box: 'new', text: 'Today, Tomorrow and Weekend are one tap under the line; «More …» opens the full window', go: 'f.todoquick' },
    { box: 'new', text: 'Tap «Sort» in Remember to move to-dos with arrows or the handle', go: 'f.todosort' },
  ],
  test: [
    'Planen › Merken: type «Kette ölen morgen 18 Uhr, jeden Sonntag» in the top line. Under it «Morgen», «18:00» and «Jede Woche» appear; tap «Hinzufügen».',
    'Open the to-do, add two steps and pick a trip under «Gehört zu»; save. The list shows «0 von 2 erledigt», and the trip shows the to-do.',
    'Tap «Sortieren»: arrows and a handle appear at every to-do. On a phone swipe a to-do left: «Morgen».',
  ],
  since: ['f.todoquick', 'f.todosteps', 'f.todosort'],
  de: {
    'Better to-dos and notes': 'Bessere To-dos und Notizen',
    'Write a to-do in one line, with the date in your own words.': 'Schreibe ein To-do in einer Zeile, mit dem Datum in deinen Worten.',
    'Remember: the top line takes «Oil the chain tomorrow 6 pm, every Sunday» and finds date, time and repeat itself': 'Merken: Die obere Zeile nimmt «Kette ölen morgen 18 Uhr, jeden Sonntag» und findet Datum, Uhrzeit und Wiederholung selbst',
    'A to-do can have steps («3 of 6») and belong to a trip, a bike or a note; they show it too': 'Ein To-do kann Schritte haben («3 von 6») und zu einer Tour, einem Velo oder einer Notiz gehören; sie zeigen es auch',
    'Swipe, sort and search: to-dos by swipe or arrows, one search for to-dos and notes, a note beside the list on a wide screen': 'Wischen, sortieren, suchen: To-dos per Wisch oder Pfeil, eine Suche für To-dos und Notizen, am grossen Bildschirm eine Notiz neben der Liste',
    'Today, Tomorrow and Weekend are one tap under the line; «More …» opens the full window': 'Heute, Morgen und Wochenende sind ein Tipp unter der Zeile; «Mehr …» öffnet das ganze Fenster',
    'Tap «Sort» in Remember to move to-dos with arrows or the handle': 'Tippe in Merken auf «Sortieren», um To-dos mit Pfeilen oder Griff zu verschieben',
    'Planen › Merken: type «Kette ölen morgen 18 Uhr, jeden Sonntag» in the top line. Under it «Morgen», «18:00» and «Jede Woche» appear; tap «Hinzufügen».': 'Planen › Merken: Schreibe «Kette ölen morgen 18 Uhr, jeden Sonntag» in die obere Zeile. Darunter erscheinen «Morgen», «18:00» und «Jede Woche»; tippe «Hinzufügen».',
    'Open the to-do, add two steps and pick a trip under «Gehört zu»; save. The list shows «0 von 2 erledigt», and the trip shows the to-do.': 'Öffne das To-do, füge zwei Schritte hinzu und wähle unter «Gehört zu» eine Tour; speichere. Die Liste zeigt «0 von 2 erledigt», und die Tour zeigt das To-do.',
    'Tap «Sortieren»: arrows and a handle appear at every to-do. On a phone swipe a to-do left: «Morgen».': 'Tippe «Sortieren»: Bei jedem To-do erscheinen Pfeile und ein Griff. Am Handy: To-do nach links wischen ergibt «Morgen».',
  },
};
