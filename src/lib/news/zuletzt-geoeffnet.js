// «Quick Links» Schritt 4 (Noah 28.10.2026 «6a 7a», «20: 30 Tage»): opened lately, suggest pinning, tidy up
export default {
  title: 'Opened lately in Quick Links',
  lead: 'Quick Links remembers what you opened and keeps itself tidy.',
  points: [{ text: 'Quick Links shows the pages you opened lately, each with a pin', href: '#/quick', go: 'f.quicklinks' }],
  small: [
    { box: 'new', text: 'A page you open on 3 days in two weeks is suggested for pinning', go: 'f.quicklinks' },
    { box: 'new', text: 'A pin you have not opened for 30 days: unpin or keep, your choice', go: 'f.quicklinks' },
  ],
  test: [
    'Open Trips, then Quick Links: «Opened lately» shows Trips.',
    'Tap «Pin» next to it: Trips is in your first group.',
  ],
  since: [],
  de: {
    'Opened lately in Quick Links': 'Zuletzt geöffnet in Quick Links',
    'Quick Links remembers what you opened and keeps itself tidy.': 'Quick Links merkt sich, was du geöffnet hast, und bleibt aufgeräumt.',
    'Quick Links shows the pages you opened lately, each with a pin': 'Quick Links zeigt die zuletzt geöffneten Seiten, jede mit Pin',
    'A page you open on 3 days in two weeks is suggested for pinning': 'Eine Seite, die du an 3 Tagen in zwei Wochen öffnest, wird zum Anpinnen vorgeschlagen',
    'A pin you have not opened for 30 days: unpin or keep, your choice': 'Ein Pin, den du 30 Tage nicht geöffnet hast: lösen oder behalten, wie du willst',
    'Open Trips, then Quick Links: «Opened lately» shows Trips.': 'Öffne Touren, dann Quick Links: «Zuletzt geöffnet» zeigt Touren.',
    'Tap «Pin» next to it: Trips is in your first group.': 'Tippe daneben auf «Anpinnen»: Touren steht in deiner ersten Gruppe.',
  },
};
