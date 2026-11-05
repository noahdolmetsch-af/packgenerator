// «Suche tippt flüssig» (Noah 05.11.2026 «a», Thread «Verzögerung bei Eingaben und Tabs»)
export default {
  title: 'Search in Gear types smoothly',
  lead: 'The letters show at once; the list updates a moment after the last letter.',
  points: [{ text: 'Gear: type in the search field, the letters no longer wait for the list', go: { href: '#/gear', steps: [{ sel: 'input[type="search"]' }] } }],
  small: [{ box: 'new', text: 'The × of the search field and Enter still update the list at once' }],
  test: ['Open Gear and type a word in the search field: every letter shows at once, the list follows right after you stop.', 'Tap the × in the search field: the whole list is back at once.'],
  since: [],
  de: {
    'Search in Gear types smoothly': 'Die Suche im Material tippt flüssig',
    'The letters show at once; the list updates a moment after the last letter.': 'Die Buchstaben erscheinen sofort; die Liste folgt einen Moment nach dem letzten Buchstaben.',
    'Gear: type in the search field, the letters no longer wait for the list': 'Material: Im Suchfeld tippen, die Buchstaben warten nicht mehr auf die Liste',
    'The × of the search field and Enter still update the list at once': 'Das × im Suchfeld und die Eingabetaste ändern die Liste weiterhin sofort',
    'Open Gear and type a word in the search field: every letter shows at once, the list follows right after you stop.': 'Öffne Material und tippe ein Wort ins Suchfeld: Jeder Buchstabe erscheint sofort, die Liste folgt gleich nach dem Tippen.',
    'Tap the × in the search field: the whole list is back at once.': 'Tippe auf das × im Suchfeld: Die ganze Liste ist sofort wieder da.',
  },
};
