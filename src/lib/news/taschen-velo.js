// «Neuer Schwung» Packen 3 (drawn bike with bags, Noah 27.10.2026 «1a 2a 3a», «alle anderen Vorschläge umsetzen»):
// on the packing day the bike with every bag at its place, filling as you pack
export default {
  title: 'Your bike while packing',
  lead: 'On the packing day your bike shows every bag at its place.',
  points: [{ text: 'Each bag fills from below as you pack; a full bag shows a tick', href: '#/pack?day', go: { href: '#/pack?day', where: 'Shows above the bag tiles on the packing day of a trip with bike bags.', play: 'pack' } }],
  small: [{ box: 'nicer', text: 'Tap a bag on the bike to open it', go: { href: '#/pack?day', where: 'Shows above the bag tiles on the packing day of a trip with bike bags.', play: 'pack' } }],
  test: ['Open a trip on its packing day and tap «Pack»: above the bag tiles stands your bike with the bags.', 'Tick an item: its bag on the bike fills a little.'],
  since: [],
  de: {
    'Your bike while packing': 'Dein Velo beim Packen',
    'On the packing day your bike shows every bag at its place.': 'Am Packtag zeigt dein Velo jede Tasche an ihrem Platz.',
    'Each bag fills from below as you pack; a full bag shows a tick': 'Jede Tasche füllt sich beim Packen von unten, eine volle zeigt einen Haken',
    'Tap a bag on the bike to open it': 'Tippe eine Tasche am Velo an, dann geht sie auf',
    'Open a trip on its packing day and tap «Pack»: above the bag tiles stands your bike with the bags.': 'Öffne eine Tour am Packtag und tippe «Packen»: Über den Taschen-Kacheln steht dein Velo mit den Taschen.',
    'Shows above the bag tiles on the packing day of a trip with bike bags.': 'Steht über den Taschen-Kacheln am Packtag einer Tour mit Velotaschen.',
    'Tick an item: its bag on the bike fills a little.': 'Hake ein Teil ab: Seine Tasche am Velo füllt sich ein Stück.',
  },
};
