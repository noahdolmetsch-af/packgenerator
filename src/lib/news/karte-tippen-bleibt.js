// «Karte: Getipptes bleibt» (11.11.2026, Fund beim Tempo-Thread): the contact card no longer loses a name typed before the stored card arrives
export default {
  title: 'Contact card keeps what you type',
  lead: 'If you start typing on your contact card while it is still loading, your words stay.',
  points: [{ text: 'A name typed on the contact card is no longer wiped when the saved card arrives a moment later', go: null }],
  small: [{ box: 'new', text: 'Contact card: typing right after opening is safe' }],
  test: ['Open Ich › Freunde › Karte and type your first name at once: it stays.', 'Reload the page: your card is still there with the name.'],
  since: [],
  de: {
    'Contact card keeps what you type': 'Die Kontaktkarte behält, was du tippst',
    'If you start typing on your contact card while it is still loading, your words stay.': 'Wenn du auf deiner Kontaktkarte zu tippen beginnst, während sie noch lädt, bleibt dein Text.',
    'A name typed on the contact card is no longer wiped when the saved card arrives a moment later': 'Ein auf der Kontaktkarte getippter Name wird nicht mehr gelöscht, wenn die gespeicherte Karte einen Moment später ankommt',
    'Contact card: typing right after opening is safe': 'Kontaktkarte: Tippen gleich nach dem Öffnen geht sicher',
    'Open Ich › Freunde › Karte and type your first name at once: it stays.': 'Öffne Ich › Freunde › Karte und tippe gleich deinen Vornamen: er bleibt.',
    'Reload the page: your card is still there with the name.': 'Lade die Seite neu: deine Karte ist noch da, mit dem Namen.',
  },
};
