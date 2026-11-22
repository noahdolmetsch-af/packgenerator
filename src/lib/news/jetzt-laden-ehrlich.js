// «Jetzt laden» tat auf Noahs Handy wieder nichts (07.11.2026): the bar and the button in Ich now say honestly when loading did not work
export default {
  title: '«Load now» tells when it did not work',
  lead: 'If the newest version cannot be loaded, the app now says so and what to do, instead of staying silent.',
  points: [
    { text: 'The bar «Load now» and «Load newest» in Me tell you when nothing happened after a few seconds, and offer «Try again»', href: '#/me', go: { href: '#/me', steps: [{ sel: '[data-version-row]' }], where: 'Shows in Me under Help.' } },
    { text: 'After loading anew, the app checks that the newest version really arrived, and says so if not', href: '#/me', go: { href: '#/me', steps: [{ sel: '[data-version-row]' }], where: 'Shows in Me under Help.' } },
  ],
  small: [],
  test: ['Open Me and scroll to the line «Version … on this device»: tap «Load newest».', 'The app loads anew and shows the newest version; your notes and lists are still there.', 'If the newest version cannot be loaded, a text tells you to close the app completely and open it again.'],
  since: [],
  de: {
    '«Load now» tells when it did not work': '«Jetzt laden» sagt, wenn es nicht geklappt hat',
    'If the newest version cannot be loaded, the app now says so and what to do, instead of staying silent.': 'Lässt sich die neueste Version nicht laden, sagt die App das jetzt und nennt den Weg, statt still zu bleiben.',
    'The bar «Load now» and «Load newest» in Me tell you when nothing happened after a few seconds, and offer «Try again»': 'Der Balken «Jetzt laden» und «Neueste laden» in Ich sagen dir, wenn nach ein paar Sekunden nichts passiert ist, und bieten «Nochmal versuchen» an',
    'After loading anew, the app checks that the newest version really arrived, and says so if not': 'Nach dem Neuladen prüft die App, ob die neueste Version wirklich da ist, und sagt es, wenn nicht',
    'Open Me and scroll to the line «Version … on this device»: tap «Load newest».': 'Öffne Ich und scrolle zur Zeile «Version … auf diesem Gerät»: Tippe auf «Neueste laden».',
    'The app loads anew and shows the newest version; your notes and lists are still there.': 'Die App lädt neu und zeigt die neueste Version; deine Notizen und Listen sind noch da.',
    'If the newest version cannot be loaded, a text tells you to close the app completely and open it again.': 'Lässt sich die neueste Version nicht laden, steht ein Text da: App ganz schliessen und neu öffnen.',
  },
};
