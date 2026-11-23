// «Sofort ein Bild» (Noah 23.11.2026 «Mach die App 5 mal schneller»): the start shows a quiet frame at once
export default {
  title: 'A picture at once',
  lead: 'When the app starts, a quiet frame in your colours shows at once instead of an empty screen.',
  points: [
    { text: 'The start shows the frame of Today after a fraction of a second, then the real content', go: { href: '#/', where: 'Close the app fully and open it again: the frame shows first, then Today fills in.' } },
    { text: 'The speed meter now also shows «Content shown»', go: { href: '#/me/data', where: 'Ich › Daten › Speed meter: switch it on, reload, look at the line.' } },
  ],
  small: [{ box: 'new', text: 'The frame follows your colour world and light or dark' }],
  test: ['Close the app fully and open it again: first a quiet frame, then Today.', 'Ich › Daten › Speed meter: switch it on, reload the app and copy the line: «Start» is short, «Content shown» is the time of the real content.'],
  since: [],
  de: {
    'A picture at once': 'Sofort ein Bild',
    'When the app starts, a quiet frame in your colours shows at once instead of an empty screen.': 'Beim Start zeigt die App sofort ein ruhiges Gerüst in deinen Farben statt eines leeren Bildschirms.',
    'The start shows the frame of Today after a fraction of a second, then the real content': 'Der Start zeigt nach einem Bruchteil einer Sekunde das Gerüst von Heute, dann den echten Inhalt',
    'Close the app fully and open it again: the frame shows first, then Today fills in.': 'Schliesse die App ganz und öffne sie neu: zuerst erscheint das Gerüst, dann füllt sich Heute.',
    'The speed meter now also shows «Content shown»': 'Der Tempo-Messer zeigt jetzt auch «Inhalt da»',
    'Ich › Daten › Speed meter: switch it on, reload, look at the line.': 'Ich › Daten › Tempo-Messer: einschalten, neu laden, die Zeile ansehen.',
    'The frame follows your colour world and light or dark': 'Das Gerüst folgt deiner Farbwelt und Hell oder Dunkel',
    'Close the app fully and open it again: first a quiet frame, then Today.': 'Schliesse die App ganz und öffne sie neu: zuerst ein ruhiges Gerüst, dann Heute.',
    'Ich › Daten › Speed meter: switch it on, reload the app and copy the line: «Start» is short, «Content shown» is the time of the real content.': 'Ich › Daten › Tempo-Messer: einschalten, die App neu laden und die Zeile kopieren: «Start» ist kurz, «Inhalt da» ist die Zeit des echten Inhalts.',
  },
};
