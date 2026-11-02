// «Kochen» nach dem Training (Noah 29.10.2026 «a»): after a ride Kochen suggests protein and carbs
export default {
  title: 'Cooking after a ride',
  lead: 'After a longer ride, Cooking suggests the groups that fit: protein, and carbs after a long one.',
  points: [
    { text: 'Cooking shows a small card after a ride (today or yesterday) with the groups Protein bombs and Carbs', href: '#/me/alltag/kochen', go: 'f.cook' },
  ],
  small: [{ box: 'new', text: 'The card reads your rides, stores nothing and can be hidden for today', go: 'f.cook' }],
  test: ['Add a ride of 40 km for today in Touren or Velos.', 'Open Planen › Alltag › Kochen: the card «Du bist heute 40 km gefahren» is there.', 'Tap «Protein-Bomben»: the list shows that group.'],
  since: [],
  de: {
    'Cooking after a ride': 'Kochen nach der Fahrt',
    'After a longer ride, Cooking suggests the groups that fit: protein, and carbs after a long one.': 'Nach einer längeren Fahrt schlägt Kochen passende Gruppen vor: Eiweiss, nach einer langen auch Kohlenhydrate.',
    'Cooking shows a small card after a ride (today or yesterday) with the groups Protein bombs and Carbs': 'Kochen zeigt nach einer Fahrt (heute oder gestern) eine kleine Karte mit den Gruppen Protein-Bomben und Carbs',
    'The card reads your rides, stores nothing and can be hidden for today': 'Die Karte liest deine Fahrten, speichert nichts und lässt sich für heute ausblenden',
    'Add a ride of 40 km for today in Touren or Velos.': 'Lege in Touren oder Velos eine Fahrt von 40 km für heute an.',
    'Open Planen › Alltag › Kochen: the card «Du bist heute 40 km gefahren» is there.': 'Öffne Planen › Alltag › Kochen: die Karte «Du bist heute 40 km gefahren» ist da.',
    'Tap «Protein-Bomben»: the list shows that group.': 'Tippe «Protein-Bomben»: die Liste zeigt diese Gruppe.',
  },
};
