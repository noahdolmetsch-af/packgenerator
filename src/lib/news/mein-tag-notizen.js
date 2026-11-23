// «Mein Tag» (Noah 23.11.2026 «dreimal ja»): step 3b, open points of notes as to-dos, only on a tap
export default {
  title: 'To-dos from your notes',
  lead: 'The tab «To-dos» on «My day» offers the open points of your notes. You decide which one becomes a to-do.',
  points: [
    { text: 'Open «To-dos» on «My day» and the fold «Open points in your notes»: every open tick of a kept note is listed', go: 'f.meintodos' },
    { text: 'Tap «Make a to-do»: it joins the list and remembers its note; «Undo» takes it back', go: 'f.meintodos' },
  ],
  test: ['Write a note with a tick list, for example «Gas» and «Riegel», and keep it.', 'Open Plan › Week › «My day» › «To-dos» and open «Open points in your notes».', 'Tap «Make a to-do» next to «Gas»: it appears in the list and leaves the fold.'],
  de: {
    'To-dos from your notes': 'To-dos aus deinen Notizen',
    'The tab «To-dos» on «My day» offers the open points of your notes. You decide which one becomes a to-do.': 'Der Reiter «To-dos» auf «Mein Tag» bietet die offenen Punkte deiner Notizen an. Du entscheidest, welcher ein To-do wird.',
    'Open «To-dos» on «My day» and the fold «Open points in your notes»: every open tick of a kept note is listed': 'Öffne auf «Mein Tag» «To-dos» und den Abschnitt «Offene Punkte in deinen Notizen»: jeder offene Haken einer behaltenen Notiz steht dort',
    'Tap «Make a to-do»: it joins the list and remembers its note; «Undo» takes it back': 'Tippe «To-do machen»: es kommt in die Liste und merkt sich seine Notiz; «Rückgängig» nimmt es zurück',
    'Write a note with a tick list, for example «Gas» and «Riegel», and keep it.': 'Schreib eine Notiz mit Haken-Liste, zum Beispiel «Gas» und «Riegel», und behalte sie.',
    'Open Plan › Week › «My day» › «To-dos» and open «Open points in your notes».': 'Öffne Planen › Woche › «Mein Tag» › «To-dos» und «Offene Punkte in deinen Notizen».',
    'Tap «Make a to-do» next to «Gas»: it appears in the list and leaves the fold.': 'Tippe bei «Gas» «To-do machen»: es steht in der Liste und verschwindet aus dem Abschnitt.',
  },
};
