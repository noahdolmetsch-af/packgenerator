// Tour nur einmal (Noah 17.11.2026 «1-5a», Startseite ruhiger, Entwurf A): wo «Meine Tour» steht, sagen Satz, Chip und «Dein Moment» nicht dasselbe nochmals
export default {
  title: 'Your tour once, not three times',
  lead: 'When «My tour» is on Today, the sentence under the greeting, the countdown chip and «Your moment» no longer repeat the same tour.',
  points: [{ text: 'Today names your next tour in one place: the card «My tour»', go: { href: '#/', steps: [{ sel: '[data-section="meinetour"]' }] , where: 'Shows on Today while a tour is planned: «My tour» at the top.' } }],
  small: [{ box: 'new', text: '«Fits now» (the suggestion of the month) sits in «My tour» when «Your moment» is away' }],
  test: [
    'Plan a tour for the next days and open Today: the card «My tour» is there.',
    'Under the greeting there is no countdown chip and no «… days until …» sentence; «Your moment» is not shown for the same tour.',
  ],
  since: [],
  de: {
    'Your tour once, not three times': 'Deine Tour nur einmal, nicht dreimal',
    'When «My tour» is on Today, the sentence under the greeting, the countdown chip and «Your moment» no longer repeat the same tour.': 'Wo «Meine Tour» auf Heute steht, wiederholen der Satz unter dem Gruss, der Chip mit dem Countdown und «Dein Moment» nicht mehr dieselbe Tour.',
    'Today names your next tour in one place: the card «My tour»': 'Heute nennt deine nächste Tour an einem Ort: in der Karte «Meine Tour»',
    'Shows on Today while a tour is planned: «My tour» at the top.': 'Erscheint auf Heute, solange eine Tour geplant ist: «Meine Tour» oben.',
    '«Fits now» (the suggestion of the month) sits in «My tour» when «Your moment» is away': '«Passt jetzt» (der Vorschlag des Monats) steht in «Meine Tour», wenn «Dein Moment» weg ist',
    'Plan a tour for the next days and open Today: the card «My tour» is there.': 'Plane eine Tour für die nächsten Tage und öffne Heute: Die Karte «Meine Tour» ist da.',
    'Under the greeting there is no countdown chip and no «… days until …» sentence; «Your moment» is not shown for the same tour.': 'Unter dem Gruss steht kein Chip mit dem Countdown und kein Satz «… Tage bis …»; «Dein Moment» erscheint nicht für dieselbe Tour.',
  },
};
