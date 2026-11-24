// Fehler aus «Aktionen 3» (24.11.2026): der Hinweis mit zwei Tasten war auf dem Handy eine schmale Säule
export default {
  title: 'Notes with two buttons read well on a phone',
  lead: 'The note after saving an own question is no longer a thin column on a phone.',
  points: [
    { text: 'On a phone a note with two buttons keeps its text on one wide line, the buttons stand below', go: { href: '#/me/abfragen', where: 'Auswerten › Your questions: tap «Create your own question» and save one; the note shows at the bottom.' } },
  ],
  small: [],
  test: [
    'On a phone open Auswerten › Your questions, create an own question and save it: the note reads in one line of text with «Undo» and «Look at it» below.',
    'Tap «Look at it»: the page jumps to the new question.',
  ],
  since: [],
  de: {
    'Notes with two buttons read well on a phone': 'Hinweise mit zwei Tasten lesen sich auf dem Handy gut',
    'The note after saving an own question is no longer a thin column on a phone.': 'Der Hinweis nach dem Speichern einer eigenen Frage ist auf dem Handy keine schmale Säule mehr.',
    'On a phone a note with two buttons keeps its text on one wide line, the buttons stand below': 'Auf dem Handy behält ein Hinweis mit zwei Tasten seinen Text in einer breiten Zeile, die Tasten stehen darunter',
    'Auswerten › Your questions: tap «Create your own question» and save one; the note shows at the bottom.': 'Auswerten › Wi gaht\'s?: Tippe auf «Eigene Frage anlegen» und speichere eine; der Hinweis erscheint unten.',
    'On a phone open Auswerten › Your questions, create an own question and save it: the note reads in one line of text with «Undo» and «Look at it» below.': 'Öffne auf dem Handy Auswerten › Wi gaht\'s?, lege eine eigene Frage an und speichere sie: Der Hinweis liest sich als eine Zeile Text, darunter «Rückgängig» und «Ansehen».',
    'Tap «Look at it»: the page jumps to the new question.': 'Tippe auf «Ansehen»: Die Seite springt zur neuen Frage.',
  },
};
