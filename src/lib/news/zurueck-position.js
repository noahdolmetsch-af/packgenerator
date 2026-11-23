// «Zurück an dieselbe Stelle» (thread «Navigation ohne Sackgassen», Noah 23.11.2026 «ja», Punkte 4 und 5)
export default {
  title: 'Back takes you to the same place',
  lead: 'After «Back» a long page is where you left it, and a link can open a section.',
  points: [
    { text: 'Open a link from a long page and go back: you are at the same place again, no longer at the top', go: { href: '#/me/look', where: 'Me › Appearance: scroll down, open another page, tap Back.' } },
    { text: 'A link can name a section: the page opens with it in view and lights it for a moment', go: { href: '#/me/look?at=look-ops', where: 'Me › Appearance opens at «Handling».' } },
  ],
  small: [{ box: 'new', text: 'A step forward still opens a page at the top' }],
  test: [
    'Open Me › Appearance, scroll far down, tap a link to another page and tap Back: you are at the same place.',
    'Tap a link to a page: it opens at the top.',
    'Open the address …#/me/look?at=look-ops: the section lights up and is in view.',
  ],
  since: [],
  de: {
    'Back takes you to the same place': 'Zurück bringt dich an dieselbe Stelle',
    'After «Back» a long page is where you left it, and a link can open a section.': 'Nach «Zurück» steht eine lange Seite dort, wo du sie verlassen hast, und ein Link kann einen Abschnitt öffnen.',
    'Open a link from a long page and go back: you are at the same place again, no longer at the top': 'Öffne einen Link auf einer langen Seite und geh zurück: Du bist wieder an derselben Stelle, nicht mehr oben',
    'Me › Appearance: scroll down, open another page, tap Back.': 'Ich › Darstellung: nach unten scrollen, eine andere Seite öffnen, auf Zurück tippen.',
    'A link can name a section: the page opens with it in view and lights it for a moment': 'Ein Link kann einen Abschnitt nennen: Die Seite öffnet mit ihm im Bild und lässt ihn kurz leuchten',
    'Me › Appearance opens at «Handling».': 'Ich › Darstellung öffnet bei «Bedienung».',
    'A step forward still opens a page at the top': 'Ein Schritt vorwärts öffnet eine Seite weiter oben wie bisher',
    'Open Me › Appearance, scroll far down, tap a link to another page and tap Back: you are at the same place.': 'Öffne Ich › Darstellung, scrolle weit nach unten, tippe auf einen Link zu einer anderen Seite und dann auf Zurück: Du bist an derselben Stelle.',
    'Tap a link to a page: it opens at the top.': 'Tippe auf einen Link zu einer Seite: Sie öffnet oben.',
    'Open the address …#/me/look?at=look-ops: the section lights up and is in view.': 'Öffne die Adresse …#/me/look?at=look-ops: Der Abschnitt leuchtet auf und ist im Bild.',
  },
};
