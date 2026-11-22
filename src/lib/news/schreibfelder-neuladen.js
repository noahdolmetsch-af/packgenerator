// Durchklick Etappe 6 (Noah 06.11.2026 «4a»): a note being typed survives a reload
export default {
  title: 'Typed notes survive a reload',
  lead: 'A note you are writing stays when the page reloads, until you save it.',
  points: [
    { text: 'The new note in Notizen and the new planning note in Packen keep what you typed when the page reloads or the browser restarts the tab; saving it clears it', go: null },
  ],
  small: [],
  test: [
    'Open Notizen, type a few words in «Neue Notiz» and reload the page: the words are back, with the line «Dein Getipptes von vorhin ist wieder da.».',
    'Save the note and reload: the field is empty.',
  ],
  since: [],
  de: {
    'Typed notes survive a reload': 'Getippte Notizen überstehen das Neuladen',
    'A note you are writing stays when the page reloads, until you save it.': 'Eine Notiz, die du schreibst, bleibt beim Neuladen der Seite erhalten, bis du sie speicherst.',
    'The new note in Notizen and the new planning note in Packen keep what you typed when the page reloads or the browser restarts the tab; saving it clears it': 'Die neue Notiz in Notizen und die neue Planungsnotiz in Packen behalten, was du getippt hast, wenn die Seite neu lädt oder der Browser den Tab neu startet; mit dem Speichern ist sie weg',
    'Open Notizen, type a few words in «Neue Notiz» and reload the page: the words are back, with the line «Dein Getipptes von vorhin ist wieder da.».': 'Öffne Notizen, tippe ein paar Wörter in «Neue Notiz» und lade die Seite neu: Die Wörter sind wieder da, mit der Zeile «Dein Getipptes von vorhin ist wieder da.».',
    'Save the note and reload: the field is empty.': 'Speichere die Notiz und lade neu: Das Feld ist leer.',
  },
};
