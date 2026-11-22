// «Verbesserungs-Logbuch» (Noah 21.11.2026 «freigabe»): «Auftrag kopieren», step 4 of 4
export default {
  title: 'Copy the order',
  lead: 'Make one text of your open log entries and paste it in the chat.',
  points: [
    { text: '«Copy the order» in the improvement log: the open entries as one text, sorted by page with its address, «Bothers me now» first', go: { href: '#/me/logbuch', steps: [{ sel: '[data-lb-copy]' }], where: 'Me › Improvement log › Order for the chat. The button shows once there are entries.' } },
    { text: 'Entries with a picture get a number; «Good as it is» stands apart as a plain note', go: 'f.logbuch' },
  ],
  small: [{ box: 'new', text: 'Nothing is sent from the app: you paste the text yourself', go: 'f.logbuch' }],
  test: ['Open Me › Improvement log with a few entries and tap «Copy the order».', 'Paste the text somewhere (a note, the chat): the pages come with their addresses, what bothers you now comes first.'],
  since: [],
  de: {
    'Copy the order': 'Auftrag kopieren',
    'Make one text of your open log entries and paste it in the chat.': 'Mach aus deinen offenen Logbuch-Einträgen einen Text und füge ihn im Chat ein.',
    '«Copy the order» in the improvement log: the open entries as one text, sorted by page with its address, «Bothers me now» first': '«Auftrag kopieren» im Verbesserungs-Logbuch: die offenen Einträge als ein Text, nach Seite mit Adresse sortiert, «Stört jetzt» zuerst',
    'Me › Improvement log › Order for the chat. The button shows once there are entries.': 'Ich › Verbesserungs-Logbuch › Auftrag für den Chat. Der Knopf erscheint, sobald es Einträge gibt.',
    'Entries with a picture get a number; «Good as it is» stands apart as a plain note': 'Einträge mit Bild bekommen eine Nummer; «Gut so» steht getrennt als reine Notiz',
    'Nothing is sent from the app: you paste the text yourself': 'Aus der App wird nichts gesendet: du fügst den Text selbst ein',
    'Open Me › Improvement log with a few entries and tap «Copy the order».': 'Öffne Ich › Verbesserungs-Logbuch mit ein paar Einträgen und tippe auf «Auftrag kopieren».',
    'Paste the text somewhere (a note, the chat): the pages come with their addresses, what bothers you now comes first.': 'Füge den Text irgendwo ein (Notiz, Chat): die Seiten kommen mit ihrer Adresse, was dich jetzt stört, steht zuerst.',
  },
};
