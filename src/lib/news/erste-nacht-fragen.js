// «Erste Nacht › Nach der Nacht» (Noah 05.11.2026 «7a»): three questions and the take-over onto the packing list
export default {
  title: 'First night: three questions afterwards',
  lead: 'After the night: how you slept, whether you were cold, what was missing. One tap puts it on the packing list of a real trip.',
  points: [
    {
      text: 'In «First night» step 4 asks about sleep, cold and what was missing',
      go: { href: '#/me/frei/nacht', steps: [{ sel: '[data-night-step="after"]' }, { sel: '[data-night-three]' }] },
    },
    {
      text: '«Put it on the packing list»: missing things become items, cold or a bad night a planning note',
      go: { href: '#/me/frei/nacht', where: 'Free time › First night › 4. After the night, below the three questions.' },
    },
  ],
  small: [{ box: 'nicer', text: 'The trip choice in step 2 shows the trip names again' }],
  test: [
    'Open Free time › First night, tap step 4 «After the night» and answer the three questions.',
    'Pick a trip under «Onto the packing list» and tap «Put it on the packing list».',
    'Tap «To the packing list»: the missing things are on the list, the notes are under the planning notes. Undo in the toast takes it all back.',
  ],
  since: [],
  de: {
    'First night: three questions afterwards': 'Erste Nacht: drei Fragen danach',
    'After the night: how you slept, whether you were cold, what was missing. One tap puts it on the packing list of a real trip.': 'Nach der Nacht: wie du geschlafen hast, ob dich gefroren hat, was gefehlt hat. Ein Tippen setzt es auf die Packliste einer echten Tour.',
    'In «First night» step 4 asks about sleep, cold and what was missing': 'In «Erste Nacht» fragt Schritt 4 nach Schlaf, Kälte und was gefehlt hat',
    '«Put it on the packing list»: missing things become items, cold or a bad night a planning note': '«Auf die Packliste setzen»: Fehlendes wird zu Dingen, Kälte oder eine schlechte Nacht zu einer Planungs-Notiz',
    'Free time › First night › 4. After the night, below the three questions.': 'Freie Zeit › Erste Nacht › 4. Nach der Nacht, unter den drei Fragen.',
    'The trip choice in step 2 shows the trip names again': 'Die Tourwahl in Schritt 2 zeigt wieder die Namen der Touren',
    'Open Free time › First night, tap step 4 «After the night» and answer the three questions.': 'Öffne Freie Zeit › Erste Nacht, tippe Schritt 4 «Nach der Nacht» und beantworte die drei Fragen.',
    'Pick a trip under «Onto the packing list» and tap «Put it on the packing list».': 'Wähle unter «Auf die Packliste» eine Tour und tippe «Auf die Packliste setzen».',
    'Tap «To the packing list»: the missing things are on the list, the notes are under the planning notes. Undo in the toast takes it all back.': 'Tippe «Zur Packliste»: Das Fehlende steht auf der Liste, die Notizen bei den Planungs-Notizen. «Rückgängig» in der Meldung nimmt alles zurück.',
  },
};
