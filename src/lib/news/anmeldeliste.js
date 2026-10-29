// Mini-Tools «Anmeldeliste mit Warteliste» (Noah 28.10.2026 «1b 2a 3a», idea 4)
export default {
  title: 'Sign-up list',
  lead: 'A ride or an evening with a number of places; who comes too late waits and moves up.',
  points: [{ text: 'Me › Mini tools › Sign-up list: set the places, send the link', href: '#/me/mini', go: 'f.minilist' }],
  small: [
    { box: 'new', go: 'f.minilist', text: 'People see their place or their place on the waiting list and can sign off' },
    { box: 'new', go: 'f.minilist', text: 'You can take someone off the list, with Undo' },
  ],
  test: [
    'Open Me › Mini tools › Sign-up list, write a title, set 2 places and tap «Make the link».',
    'Open the link in three private windows and sign up three times: the third is on the waiting list.',
    'Sign off in the first window: the third moves up. In the app «Look for new answers» shows it.',
  ],
  since: ['f.minilist'],
  de: {
    'Sign-up list': 'Anmeldeliste',
    'A ride or an evening with a number of places; who comes too late waits and moves up.': 'Eine Ausfahrt oder ein Abend mit festen Plätzen; wer zu spät ist, wartet und rückt nach.',
    'Me › Mini tools › Sign-up list: set the places, send the link': 'Ich › Mini-Tools › Anmeldeliste: Plätze einstellen, Link schicken',
    'People see their place or their place on the waiting list and can sign off': 'Die Leute sehen ihren Platz oder ihren Platz auf der Warteliste und können sich abmelden',
    'You can take someone off the list, with Undo': 'Du kannst jemanden von der Liste nehmen, mit Rückgängig',
    'Open Me › Mini tools › Sign-up list, write a title, set 2 places and tap «Make the link».': 'Öffne Ich › Mini-Tools › Anmeldeliste, schreib einen Titel, stell 2 Plätze ein und tipp «Link machen».',
    'Open the link in three private windows and sign up three times: the third is on the waiting list.': 'Öffne den Link in drei privaten Fenstern und melde dich dreimal an: die dritte Anmeldung ist auf der Warteliste.',
    'Sign off in the first window: the third moves up. In the app «Look for new answers» shows it.': 'Melde dich im ersten Fenster ab: die dritte rückt nach. In der App zeigt «Neue Antworten holen» das an.',
  },
};
