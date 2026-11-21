// Check-Fenster nur für heute (Noah 17.11.2026 «1-5a», Startseite ruhiger, Frage 2a): ab 11 Uhr «Noch offen von heute Morgen», nie Fragen von gestern
export default {
  title: 'The check window asks only about today',
  lead: 'In the afternoon it no longer says «Morning check», and questions from yesterday do not come back.',
  points: [{ text: 'From 11:00 the window is called «Open from this morning» and shows only what is still open from today', go: null }],
  small: [],
  test: [
    'Leave the morning questions open and look at Today after 11:00: the window says «Still open from this morning».',
    'A question you missed yesterday evening does not appear with «question from …» any more; it asks again at its time today.',
  ],
  since: [],
  de: {
    'The check window asks only about today': 'Das Check-Fenster fragt nur nach heute',
    'In the afternoon it no longer says «Morning check», and questions from yesterday do not come back.': 'Am Nachmittag steht dort nicht mehr «Morgen-Check», und Fragen von gestern kommen nicht zurück.',
    'From 11:00 the window is called «Open from this morning» and shows only what is still open from today': 'Ab 11 Uhr heisst das Fenster «Noch offen von heute Morgen» und zeigt nur, was von heute noch offen ist',
    'Leave the morning questions open and look at Today after 11:00: the window says «Still open from this morning».': 'Lass die Morgenfragen offen und schau nach 11 Uhr auf Heute: Das Fenster heisst «Noch offen von heute Morgen».',
    'A question you missed yesterday evening does not appear with «question from …» any more; it asks again at its time today.': 'Eine Frage, die du gestern Abend verpasst hast, erscheint nicht mehr mit «Frage von …»; sie fragt heute zu ihrer Zeit wieder.',
  },
};
