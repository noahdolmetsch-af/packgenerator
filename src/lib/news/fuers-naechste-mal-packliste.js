// «Fürs nächste Mal › In Packliste übernehmen» (Noah 05.11.2026 «8b»): the notes go onto the next trip's list
export default {
  title: 'Notes straight onto the packing list',
  lead: 'On «For next time» a tap puts a note on the packing list of your next trip.',
  points: [
    {
      text: 'Tap the list symbol next to a note, or «Put all on the packing list»',
      go: { href: '#/me/frei/naechstes', where: 'Free time › For next time, as soon as you have kept a note. Pick the trip above the notes.' },
    },
  ],
  small: [{ box: 'new', text: '«Just came along» never takes something off: it leaves a note «Leave it at home» on the trip, and Undo brings everything back' }],
  test: [
    'Open Free time › For next time and keep a note («Note it» under a pile).',
    'Tap the list symbol next to the note: the toast says what went onto the list of the next trip.',
    'Tap «To the packing list»: the thing is there, not yet packed. Undo in the toast takes it off again.',
  ],
  since: [],
  de: {
    'Notes straight onto the packing list': 'Notizen direkt auf die Packliste',
    'On «For next time» a tap puts a note on the packing list of your next trip.': 'Auf «Fürs nächste Mal» setzt ein Tippen eine Notiz auf die Packliste deiner nächsten Tour.',
    'Tap the list symbol next to a note, or «Put all on the packing list»': 'Tippe auf das Listen-Zeichen neben einer Notiz oder auf «Alles auf die Packliste»',
    'Free time › For next time, as soon as you have kept a note. Pick the trip above the notes.': 'Freie Zeit › Fürs nächste Mal, sobald du eine Notiz gemerkt hast. Die Tour wählst du über den Notizen.',
    '«Just came along» never takes something off: it leaves a note «Leave it at home» on the trip, and Undo brings everything back': '«Mitgefahren» nimmt nie etwas weg: Es legt eine Notiz «Daheim lassen» bei der Tour ab, und «Rückgängig» bringt alles zurück',
    'Open Free time › For next time and keep a note («Note it» under a pile).': 'Öffne Freie Zeit › Fürs nächste Mal und merke eine Notiz («Notieren» unter einem Stapel).',
    'Tap the list symbol next to the note: the toast says what went onto the list of the next trip.': 'Tippe auf das Listen-Zeichen neben der Notiz: Die Meldung sagt, was auf die Liste der nächsten Tour kam.',
    'Tap «To the packing list»: the thing is there, not yet packed. Undo in the toast takes it off again.': 'Tippe auf «Zur Packliste»: Das Ding ist da, noch nicht gepackt. «Rückgängig» in der Meldung nimmt es wieder weg.',
  },
};
