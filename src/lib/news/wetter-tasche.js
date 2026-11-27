// Packvorschläge nach Wetter und Lieblingsteilen pro Tasche (Noah 24.11.2026 «1-5», Thread «Packen nach Taschen am Bike ausbauen»)
export default {
  title: 'Weather suggestions per bag',
  lead: 'Under a bag the app names what the weather still asks for there, and it prefers your favourites.',
  points: [{ text: 'Under a bag title: «For the weather, still to pack here: …»; a tap packs the piece (Undo), the × stops the suggestion; a favourite among alternatives is taken first', go: null }],
  test: ['Open a planned tour with rain and no rain jacket on the list.', 'Under the title of the bag the jacket usually goes into, the line «For the weather, still to pack here» names it; tap the name: it is in the bag, «Undo» takes it out.'],
  de: {
    'Weather suggestions per bag': 'Wettervorschläge pro Tasche',
    'Under a bag the app names what the weather still asks for there, and it prefers your favourites.': 'Unter einer Tasche nennt die App, was das Wetter dort noch verlangt, und sie bevorzugt deine Lieblingsteile.',
    'Under a bag title: «For the weather, still to pack here: …»; a tap packs the piece (Undo), the × stops the suggestion; a favourite among alternatives is taken first': 'Unter dem Titel einer Tasche: «Fürs Wetter noch in diese Tasche: …»; ein Tipp packt das Teil (Rückgängig), das × schlägt es nicht mehr vor; ein Lieblingsteil unter Alternativen kommt zuerst',
    'Open a planned tour with rain and no rain jacket on the list.': 'Öffne eine geplante Tour mit Regen, auf deren Liste noch keine Regenjacke liegt.',
    'Under the title of the bag the jacket usually goes into, the line «For the weather, still to pack here» names it; tap the name: it is in the bag, «Undo» takes it out.': 'Unter dem Titel der Tasche, in die die Jacke sonst kommt, nennt die Zeile «Fürs Wetter noch in diese Tasche» sie; tippe auf den Namen: sie liegt in der Tasche, «Rückgängig» nimmt sie heraus.',
  },
};
