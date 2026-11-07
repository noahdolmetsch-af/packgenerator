// «Quellen-Adresse prüfen» (Durchklick Etappe 3, E3-003): a single word or an address with a space is no news source
export default {
  title: 'Check the address of a source',
  lead: 'When you add a source to «Alerts and news», a single word or an address with a space is now refused.',
  points: [{ text: 'Adding a source in «Alerts and news» asks for a real web address (with a dot, without a space)', go: { href: '#/me/hinweise', where: 'Me › Alerts and news, at «Add source».' } }],
  small: [],
  test: ['Open Me › Alerts and news and tap «Add source».', 'Type a name and the address «hallo»: the message «This is not a web address.» appears and nothing is added.'],
  since: [],
  de: {
    'Check the address of a source': 'Adresse einer Quelle prüfen',
    'When you add a source to «Alerts and news», a single word or an address with a space is now refused.': 'Wenn du eine Quelle zu «Hinweise und News» hinzufügst, wird ein einzelnes Wort oder eine Adresse mit Leerzeichen jetzt abgelehnt.',
    'Adding a source in «Alerts and news» asks for a real web address (with a dot, without a space)': 'Beim Hinzufügen einer Quelle in «Hinweise und News» braucht es eine echte Webadresse (mit Punkt, ohne Leerzeichen)',
    'Me › Alerts and news, at «Add source».': 'Ich › Hinweise und News, bei «Quelle hinzufügen».',
    'Open Me › Alerts and news and tap «Add source».': 'Öffne Ich › Hinweise und News und tippe auf «Quelle hinzufügen».',
    'Type a name and the address «hallo»: the message «This is not a web address.» appears and nothing is added.': 'Schreibe einen Namen und die Adresse «hallo»: Die Meldung «Das ist keine Webadresse.» erscheint und nichts wird hinzugefügt.',
  },
};
