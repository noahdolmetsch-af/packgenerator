// «Pfad auf jeder Seite» Schritt 4 (Noah 28.10.2026 «1a und c und d alle»): Standard or from me, in Lists and types
export default {
  title: 'Standard or from me',
  lead: 'In Lists and types you can look at a list by who made its entries.',
  points: [
    { text: 'As soon as you changed a list, buttons appear above it: All, Standard, Adapted by me, New from me, each with its number', go: { href: '#/me/lists?noteTopics', steps: [{ sel: 'main ul.rows' }] } },
    { text: 'A hidden Standard entry now counts as adapted by you', go: { href: '#/me/lists?noteTopics' } },
  ],
  small: [{ box: 'new', text: 'Reordering works in the view «All»; «Back to Standard» stays below the list' }],
  test: ['Open Me › Lists and types › Note topics and add an own topic: the buttons All, Standard and New from me appear above the list.', 'Tap «New from me»: only your own topic stays. Tap «All» to see everything again.'],
  since: [],
  de: {
    'Standard or from me': 'Standard oder von mir',
    'In Lists and types you can look at a list by who made its entries.': 'In Listen und Typen kannst du eine Liste danach ansehen, wer ihre Einträge gemacht hat.',
    'As soon as you changed a list, buttons appear above it: All, Standard, Adapted by me, New from me, each with its number': 'Sobald du eine Liste geändert hast, erscheinen darüber Knöpfe: Alle, Standard, Von mir geändert, Neu von mir, jeder mit seiner Zahl',
    'A hidden Standard entry now counts as adapted by you': 'Ein ausgeblendeter Standard-Eintrag zählt jetzt als von dir geändert',
    'Reordering works in the view «All»; «Back to Standard» stays below the list': 'Das Umsortieren geht in der Ansicht «Alle»; «Auf Standard zurücksetzen» bleibt unter der Liste',
    'Open Me › Lists and types › Note topics and add an own topic: the buttons All, Standard and New from me appear above the list.': 'Öffne Ich › Listen und Typen › Themen der Notizen und füge ein eigenes Thema hinzu: Die Knöpfe Alle, Standard und Neu von mir erscheinen über der Liste.',
    'Tap «New from me»: only your own topic stays. Tap «All» to see everything again.': 'Tippe auf «Neu von mir»: Nur dein eigenes Thema bleibt. Tippe auf «Alle», um wieder alles zu sehen.',
  },
};
