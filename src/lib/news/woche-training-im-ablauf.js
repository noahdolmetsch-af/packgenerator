// «Planen als verbindende Mitte» (Noah 1.11.2026 «1a»): the training step of «Woche planen» adds a session itself, no detour to Aktiv
export default {
  title: 'Training in the weekly planning',
  lead: 'Add a training session right inside «Plan the week».',
  points: [{ text: 'Step «Training»: the button «Add training» keeps you in the flow; the session also shows in Aktiv › Training', href: '#/week/plan', go: 'f.weekplan' }],
  small: [],
  test: ['Planen › Woche › «Plan the week», step 2: tap «Add training», pick a day and minutes, save.', 'Active › Training: the same session is there.'],
  since: [],
  de: {
    'Training in the weekly planning': 'Training in der Wochenplanung',
    'Add a training session right inside «Plan the week».': 'Füg ein Training gleich in «Woche planen» hinzu.',
    'Step «Training»: the button «Add training» keeps you in the flow; the session also shows in Aktiv › Training': 'Schritt «Training»: Der Knopf «Training hinzufügen» lässt dich im Ablauf; die Einheit steht auch in Aktiv › Training',
    'Planen › Woche › «Plan the week», step 2: tap «Add training», pick a day and minutes, save.': 'Planen › Woche › «Woche planen», Schritt 2: «Training hinzufügen» antippen, Tag und Minuten wählen, speichern.',
    'Active › Training: the same session is there.': 'Aktiv › Training: Dieselbe Einheit steht dort.',
  },
};
