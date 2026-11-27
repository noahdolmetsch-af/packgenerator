// «Diktat: nichts geht verloren» (Noah 27.11.2026, Foto der Notiz mit laufender Aufnahme): Speichern und Stopp behalten das Gesprochene
export default {
  title: 'Dictation keeps every word',
  lead: 'What you say is in the note when you tap «Save» or «Stop», even while the microphone is still listening.',
  points: [
    { text: 'Tap «Save» while the microphone runs: the words just spoken land in the note, then it is saved', go: { href: '#/notes', steps: [{ sel: '[data-speak-field]' }] } },
    { text: 'The red «Write a few words» line goes away as soon as words come in', go: { href: '#/notes', steps: [{ sel: '[data-speak-field]' }] } },
  ],
  small: [{ box: 'new', text: 'A pause of the browser or a stop no longer drops the last sentence' }],
  test: [
    'Open Notes, tap the microphone and say a short sentence.',
    'While «Listening» still shows, tap «Save»: the note is in the list with your words.',
    'Tap the microphone, say a sentence and tap the stop square: the words stand in the field.',
  ],
  since: [],
  de: {
    'Dictation keeps every word': 'Diktat behält jedes Wort',
    'What you say is in the note when you tap «Save» or «Stop», even while the microphone is still listening.': 'Was du sagst, steht in der Notiz, wenn du «Speichern» oder «Stopp» tippst, auch wenn das Mikrofon noch zuhört.',
    'Tap «Save» while the microphone runs: the words just spoken land in the note, then it is saved': 'Tippe «Speichern», während das Mikrofon läuft: Die eben gesprochenen Wörter landen in der Notiz, dann wird sie gespeichert',
    'The red «Write a few words» line goes away as soon as words come in': 'Die rote Zeile «Schreib ein paar Worte» verschwindet, sobald Wörter ankommen',
    'A pause of the browser or a stop no longer drops the last sentence': 'Eine Pause des Browsers oder ein Stopp lässt den letzten Satz nicht mehr fallen',
    'Open Notes, tap the microphone and say a short sentence.': 'Öffne Notizen, tippe auf das Mikrofon und sage einen kurzen Satz.',
    'While «Listening» still shows, tap «Save»: the note is in the list with your words.': 'Solange «Hört zu» steht, tippe «Speichern»: Die Notiz steht mit deinen Wörtern in der Liste.',
    'Tap the microphone, say a sentence and tap the stop square: the words stand in the field.': 'Tippe auf das Mikrofon, sage einen Satz und tippe auf das Stopp-Quadrat: Die Wörter stehen im Feld.',
  },
};
