// «Tippfehler-Frage» (Warteliste 6; Noah 22.11.2026 «1-5 a»): a quiet question under the weight field when a number looks like a slip
export default {
  title: 'A quiet question for slips',
  lead: 'When a number looks like a slip, a quiet line under the field asks: «Did you mean 70 kg?». Saving always works.',
  points: [
    { text: 'Weight: type 700 and a line asks «Did you mean 70 kg?»; «Yes» puts it in, «It is right» keeps it and the app does not ask about that value again', go: { href: '#/me/weight', where: 'Me › Weight › Enter weight: under the field, after you leave it.' } },
  ],
  small: [{ box: 'new', text: 'The hard limit for the weight is gone: the app only asks', go: null }],
  test: [
    'Open Me › Weight › Enter weight, type 700 and leave the field: the line asks «Did you mean 70 kg?».',
    'Tap «Yes, 70 kg»: the field shows 70. Type 300, leave the field and tap «It is right»: the line goes and does not come back for 300.',
  ],
  since: [],
  de: {
    'A quiet question for slips': 'Eine leise Frage bei Tippfehlern',
    'When a number looks like a slip, a quiet line under the field asks: «Did you mean 70 kg?». Saving always works.': 'Sieht eine Zahl nach einem Tippfehler aus, fragt eine leise Zeile unter dem Feld: «Meintest du 70 kg?». Speichern geht immer.',
    'Weight: type 700 and a line asks «Did you mean 70 kg?»; «Yes» puts it in, «It is right» keeps it and the app does not ask about that value again': 'Gewicht: 700 eintippen, und eine Zeile fragt «Meintest du 70 kg?»; «Ja» setzt es ein, «Stimmt so» behält den Wert und die App fragt für diesen Wert nicht wieder',
    'Me › Weight › Enter weight: under the field, after you leave it.': 'Ich › Gewicht › Gewicht eintragen: unter dem Feld, wenn du es verlässt.',
    'The hard limit for the weight is gone: the app only asks': 'Die harte Grenze beim Gewicht ist weg: die App fragt nur',
    'Open Me › Weight › Enter weight, type 700 and leave the field: the line asks «Did you mean 70 kg?».': 'Ich › Gewicht › Gewicht eintragen öffnen, 700 tippen und das Feld verlassen: die Zeile fragt «Meintest du 70 kg?».',
    'Tap «Yes, 70 kg»: the field shows 70. Type 300, leave the field and tap «It is right»: the line goes and does not come back for 300.': '«Ja, 70 kg» antippen: das Feld zeigt 70. 300 tippen, das Feld verlassen und «Stimmt so» antippen: die Zeile geht und kommt für 300 nicht wieder.',
  },
};
