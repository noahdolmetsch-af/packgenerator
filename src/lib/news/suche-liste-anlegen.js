// «Liste per Satz» (Noah 07.11.2026 «1b 2a 3a 4a 5a»): the search makes a list from a sentence, by rules, no AI
export default {
  title: 'Say a list, get a list',
  lead: 'Say or type «Create a to-do list: tidy up, wax the chain, sign up for the race» and the search makes the list.',
  points: [
    {
      text: 'A sentence with «list» and its points becomes a list in Calendar › Remember, with Undo',
      go: { href: '#/me/suche', steps: [{ sel: '[data-suche-more]' }], where: 'Me › Search, the example sentences. Try them in the search field at the top.' },
    },
  ],
  small: [],
  test: [
    'Tap the search field and type «Create a to-do list: tidy up, wax the chain, sign up for the race»: under «Do it now» a line offers the list with 3 points.',
    'Tap it: the list is made. «Open» shows the list, «Undo» takes it back.',
  ],
  since: [],
  de: {
    'Say a list, get a list': 'Liste sagen, Liste bekommen',
    'Say or type «Create a to-do list: tidy up, wax the chain, sign up for the race» and the search makes the list.': 'Sage oder tippe «Erstelle eine To-do-Liste: Aufräumen, Kette wachsen, Anmeldung fürs Rennen», und die Suche legt die Liste an.',
    'A sentence with «list» and its points becomes a list in Calendar › Remember, with Undo': 'Ein Satz mit «Liste» und ihren Punkten wird zu einer Liste in Kalender › Merken, mit Rückgängig',
    'Me › Search, the example sentences. Try them in the search field at the top.': 'Ich › Suche, die Beispielsätze. Probiere sie im Suchfeld oben aus.',
    'Tap the search field and type «Create a to-do list: tidy up, wax the chain, sign up for the race»: under «Do it now» a line offers the list with 3 points.': 'Tippe ins Suchfeld und schreibe «Erstelle eine To-do-Liste: Aufräumen, Kette wachsen, Anmeldung fürs Rennen»: unter «Jetzt erledigen» steht die Liste mit 3 Punkten.',
    'Tap it: the list is made. «Open» shows the list, «Undo» takes it back.': 'Tippe darauf: die Liste ist angelegt. «Öffnen» zeigt die Liste, «Rückgängig» nimmt sie zurück.',
  },
};
