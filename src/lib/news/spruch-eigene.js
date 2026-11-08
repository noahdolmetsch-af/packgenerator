// «Spruch zum Einstieg» PR 4 (Noah 07.11.2026 «bau spruch pr3 und 4»): write your own sayings
export default {
  title: 'Your own sayings',
  lead: 'In «All sayings» you can write your own sayings. They come with the others.',
  points: [
    { text: 'Write your own sayings in «All sayings» on the tile «Saying»: pick a tone, change or delete them any time, with Undo', go: { href: '#/', steps: [{ sel: '[data-spruch-all]' }] } },
  ],
  small: [
    { box: 'new', text: 'Your own sayings stay on this device and in your backup, and show as written' },
  ],
  test: [
    'Open Today, tap «All sayings» on the tile «Saying», write a saying under «Own sayings» and tap «Add».',
    'Close the window and tap «New saying» until yours comes: it shows as you wrote it, with the tag «Own».',
  ],
  de: {
    'Your own sayings': 'Deine eigenen Sprüche',
    'In «All sayings» you can write your own sayings. They come with the others.': 'In «Alle Sprüche» kannst du eigene Sprüche schreiben. Sie kommen mit den anderen.',
    'Write your own sayings in «All sayings» on the tile «Saying»: pick a tone, change or delete them any time, with Undo': 'Schreib eigene Sprüche in «Alle Sprüche» auf der Kachel «Spruch»: Ton wählen, jederzeit ändern oder löschen, mit Rückgängig',
    'Your own sayings stay on this device and in your backup, and show as written': 'Deine eigenen Sprüche bleiben auf diesem Gerät und in deinem Backup und erscheinen so, wie du sie schreibst',
    'Open Today, tap «All sayings» on the tile «Saying», write a saying under «Own sayings» and tap «Add».': 'Öffne Heute, tippe auf der Kachel «Spruch» auf «Alle Sprüche», schreib unter «Eigene Sprüche» einen Spruch und tippe auf «Hinzufügen».',
    'Close the window and tap «New saying» until yours comes: it shows as you wrote it, with the tag «Own».': 'Schliesse das Fenster und tippe auf «Neuer Spruch», bis deiner kommt: er erscheint so, wie du ihn geschrieben hast, mit dem Etikett «Eigene».',
  },
};
