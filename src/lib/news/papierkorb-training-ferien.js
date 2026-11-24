// «Zuletzt gelöscht» für Training und Ferien der Woche (Noah 23.11.2026 «1a», Folge von «Zuletzt gelöscht für To-dos und Mein Tag»)
export default {
  title: 'Recently deleted holds training and holidays too',
  lead: 'A training session you leave out and a stay away you delete wait 30 days as well.',
  points: [
    { text: 'Leave out a training session or delete a stay in Holidays and time away: it stands in Me › Data › «Recently deleted» under «Week», «Back» puts it and the entries it made back', go: 'f.trash' },
    { text: 'Deleting a stay away now offers «Undo» for a few seconds, like everything else', go: 'f.trash' },
  ],
  small: [{ box: 'new', text: 'The filter above the list has a new kind: Week', go: 'f.trash' }],
  test: ['Open Week › Holidays and time away, enter a stay, open it and delete it: «Undo» shows for a few seconds.', 'Open Me › Data › «Recently deleted»: the stay stands there as «Week»; tap «Back».', 'The stay is in the list again, with the entries it made.'],
  since: [],
  de: {
    'Recently deleted holds training and holidays too': '«Zuletzt gelöscht» hält auch Training und Ferien',
    'A training session you leave out and a stay away you delete wait 30 days as well.': 'Eine Trainingseinheit, die du weglässt, und ein Aufenthalt weg, den du löschst, warten auch 30 Tage.',
    'Leave out a training session or delete a stay in Holidays and time away: it stands in Me › Data › «Recently deleted» under «Week», «Back» puts it and the entries it made back': 'Lass eine Trainingseinheit weg oder lösche einen Aufenthalt in Ferien und Abwesenheit: er steht in Ich › Daten › «Zuletzt gelöscht» unter «Woche», «Zurück» bringt ihn und die Einträge, die er gemacht hat, zurück',
    'Deleting a stay away now offers «Undo» for a few seconds, like everything else': 'Beim Löschen eines Aufenthalts gibt es jetzt ein paar Sekunden «Rückgängig», wie bei allem anderen',
    'The filter above the list has a new kind: Week': 'Der Filter über der Liste hat eine neue Art: Woche',
    'Open Week › Holidays and time away, enter a stay, open it and delete it: «Undo» shows for a few seconds.': 'Öffne Woche › Ferien und Abwesenheit, trage einen Aufenthalt ein, öffne ihn und lösche ihn: «Rückgängig» zeigt sich ein paar Sekunden.',
    'Open Me › Data › «Recently deleted»: the stay stands there as «Week»; tap «Back».': 'Öffne Ich › Daten › «Zuletzt gelöscht»: der Aufenthalt steht dort als «Woche»; tippe «Zurück».',
    'The stay is in the list again, with the entries it made.': 'Der Aufenthalt ist wieder in der Liste, mit den Einträgen, die er gemacht hat.',
  },
};
