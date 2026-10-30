// «Jetzt laden» tat am Handy nichts (Noah 30.10.2026): the button now always shows «Loading…» and loads from a fresh address
export default {
  title: '«Load now» works again',
  lead: 'The button for a newer version now loads the app anew from the internet.',
  points: [{ text: '«Load now» shows «Loading…» at once and loads the newest version, your data stays', href: '#/me', go: { href: '#/me', steps: [{ sel: '[data-version-row]' }], where: 'Shows in Me under Help.' } }],
  small: [],
  test: ['Open Ich and scroll to «Help»: tap «Load newest».', 'The app loads anew, the version shown is the newest one, and your notes and lists are still there.'],
  since: [],
  de: {
    '«Load now» works again': '«Jetzt laden» funktioniert wieder',
    'The button for a newer version now loads the app anew from the internet.': 'Der Knopf für eine neuere Version lädt die App jetzt wirklich neu aus dem Internet.',
    '«Load now» shows «Loading…» at once and loads the newest version, your data stays': '«Jetzt laden» zeigt sofort «Lädt…» und holt die neueste Version, deine Daten bleiben',
    'Open Ich and scroll to «Help»: tap «Load newest».': 'Öffne Ich und scrolle zu «Hilfe»: Tippe auf «Neueste laden».',
    'The app loads anew, the version shown is the newest one, and your notes and lists are still there.': 'Die App lädt neu, die angezeigte Version ist die neueste, und deine Notizen und Listen sind noch da.',
  },
};
