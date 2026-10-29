// «Neuer Schwung» B13 «Wischen in Listen» (Noah 27.10.2026 «ich möchte b13 bis b24 alle umsetzen. … 4a»): the
// same swipe in every list, first in Notizen: right = pin or done, left = into the trash, each with Undo
export default {
  title: 'Swipe in Notes',
  lead: 'On the phone a swipe pins a note or puts it into the trash.',
  points: [
    { text: 'Swipe a note to the right to pin it, to the left to put it into the trash; «Undo» brings it back', go: { href: '#/notes', where: 'On the phone: swipe a note sideways.' } },
    { text: 'A due reminder: swipe it to the right and it is done; the note stays', go: { href: '#/notes', where: 'On the phone: swipe a due reminder to the right.' } },
  ],
  small: [{ box: 'nicer', text: 'A long swipe does it at once; a short one shows the button first' }],
  test: ['On the phone open Planen › Notizen and swipe a note to the right: it moves up to «Angeheftet».', 'Swipe another note a little to the left and tap «Löschen»; «Rückgängig» at the bottom brings it back.'],
  since: [],
  de: {
    'Swipe in Notes': 'Wischen in Notizen',
    'On the phone a swipe pins a note or puts it into the trash.': 'Am Handy heftet ein Wisch eine Notiz an oder legt sie in den Papierkorb.',
    'Swipe a note to the right to pin it, to the left to put it into the trash; «Undo» brings it back': 'Eine Notiz nach rechts wischen heftet sie an, nach links legt sie in den Papierkorb; «Rückgängig» holt sie zurück',
    'A due reminder: swipe it to the right and it is done; the note stays': 'Eine fällige Erinnerung nach rechts wischen: sie ist erledigt, die Notiz bleibt',
    'A long swipe does it at once; a short one shows the button first': 'Ein langer Wisch erledigt es sofort, ein kurzer zeigt zuerst den Knopf',
    'On the phone open Planen › Notizen and swipe a note to the right: it moves up to «Angeheftet».': 'Öffne am Handy Planen › Notizen und wische eine Notiz nach rechts: sie rutscht hoch zu «Angeheftet».',
    'Swipe another note a little to the left and tap «Löschen»; «Rückgängig» at the bottom brings it back.': 'Wische eine andere Notiz ein Stück nach links und tippe «Löschen»; «Rückgängig» unten holt sie zurück.',
    'On the phone: swipe a note sideways.': 'Am Handy: eine Notiz zur Seite wischen.',
    'On the phone: swipe a due reminder to the right.': 'Am Handy: eine fällige Erinnerung nach rechts wischen.',
    '«{name}» is pinned.': '«{name}» ist angeheftet.',
    '«{name}» is no longer pinned.': '«{name}» ist nicht mehr angeheftet.',
    '«{name}» is in the trash.': '«{name}» liegt im Papierkorb.',
    'Reminder done. The note stays.': 'Erinnerung erledigt. Die Notiz bleibt.',
  },
};
