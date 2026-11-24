// «Visionen» (Noah 04./05.11.2026, «4a» 23.11.2026, Thread «Wi gaht's? um Träume und Visionen erweitern»): a monthly question with the visions of the notes
export default {
  title: 'Visions, once a month',
  lead: 'Once a month «Wi gaht\'s?» asks which vision you moved closer to and offers the visions from your notes.',
  points: [
    { text: 'A monthly question about your visions, with the notes of the template «Vision» as one-tap answers', go: { href: '#/me/abfragen', steps: [{ sel: '[data-links]' }], where: 'Wi gaht\'s? on the 1st of the month in the evening: under the question about your visions.' } },
  ],
  small: [{ box: 'fixed', text: 'No visions yet: the question says where to write one' }],
  test: [
    'Write a note with the template «Vision».',
    'On the 1st of the month open Today › Wi gaht\'s? in the evening: your vision is offered under the question.',
    'Tap it: the title is in the field.',
  ],
  since: [],
  de: {
    'Visions, once a month': 'Visionen, einmal im Monat',
    'Once a month «Wi gaht\'s?» asks which vision you moved closer to and offers the visions from your notes.': 'Einmal im Monat fragt «Wi gaht\'s?», welcher Vision du näher gekommen bist, und bietet die Visionen aus deinen Notizen an.',
    'A monthly question about your visions, with the notes of the template «Vision» as one-tap answers': 'Eine Monatsfrage zu deinen Visionen, mit den Notizen der Vorlage «Vision» zum Antippen',
    'Wi gaht\'s? on the 1st of the month in the evening: under the question about your visions.': '«Wi gaht\'s?» am 1. des Monats am Abend: unter der Frage zu deinen Visionen.',
    'No visions yet: the question says where to write one': 'Noch keine Visionen: die Frage sagt, wo du eine schreibst',
    'Write a note with the template «Vision».': 'Schreibe eine Notiz mit der Vorlage «Vision».',
    'On the 1st of the month open Today › Wi gaht\'s? in the evening: your vision is offered under the question.': 'Öffne am 1. des Monats Heute › «Wi gaht\'s?» am Abend: deine Vision steht unter der Frage.',
    'Tap it: the title is in the field.': 'Tippe sie an: der Titel steht im Feld.',
  },
};
