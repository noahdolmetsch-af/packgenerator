// «Fitbit immer aktuell» (Noah 2.11.2026 «1a 2a 3a 4a 5a»): Stand, letzte Werte, schnellerer neuer Versuch
export default {
  title: 'Fitbit values stay current',
  lead: 'Heute shows when the Fitbit values were fetched and keeps the last ones when nothing new has come.',
  points: [
    { text: '«As of 07:42» under the Fitbit tiles, with «Try again now» after a failed fetch', href: '#/me/fitbit', go: { href: '#/', steps: [{ sel: '[data-section="body"]' }] } },
    { text: 'No new values yet: the last ones show, marked «from yesterday»', href: '#/me/fitbit', go: { href: '#/', steps: [{ sel: '[data-section="body"]' }] } },
  ],
  small: [{ box: 'new', text: 'The app checks again every 15 minutes while it is open, after a lost connection already after 2', go: null }],
  test: ['Open Heute and look under «Your body today».', 'The line «As of …» shows the time of the last fetch.'],
  since: [],
  de: {
    'Fitbit values stay current': 'Fitbit-Werte bleiben aktuell',
    'Heute shows when the Fitbit values were fetched and keeps the last ones when nothing new has come.': 'Heute zeigt, wann die Fitbit-Werte geholt wurden, und behält die letzten, wenn nichts Neues kommt.',
    '«As of 07:42» under the Fitbit tiles, with «Try again now» after a failed fetch': '«Stand 07:42» unter den Fitbit-Kacheln, nach einem Fehler mit «Jetzt nochmals versuchen»',
    'No new values yet: the last ones show, marked «from yesterday»': 'Noch nichts Neues: die letzten Werte stehen da, mit «von gestern»',
    'The app checks again every 15 minutes while it is open, after a lost connection already after 2': 'Die App prüft alle 15 Minuten neu, solange sie offen ist, nach einer Funkloch-Pause schon nach 2',
    'Open Heute and look under «Your body today».': 'Öffne Heute und schau unter «Dein Körper heute».',
    'The line «As of …» shows the time of the last fetch.': 'Die Zeile «Stand …» zeigt die Zeit des letzten Abrufs.',
  },
};
