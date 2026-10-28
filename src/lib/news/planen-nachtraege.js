// «Nachträge Planen» (Noah 27.10.2026 «1b 2b 3a»): the plant passport's hint can set the watering interval in one
// tap; photos and notes get a matter suggestion too, not only mails
export default {
  title: 'Plants and matters, one step further',
  lead: 'A tip can now become the new watering interval, and receipts find their matter.',
  points: [
    { text: 'Plant passport: «Water every N days» right under the hint, with Undo', href: '#/calendar/pflanzen', go: 'f.plantpass' },
    { text: 'Matters: photos and notes get a suggestion too, by number, amount or words', href: '#/inbox/vorgaenge', go: 'f.doubleinbox' },
  ],
  small: [],
  test: ['Planen › Merken › Pflanzenpass: after two observations «Volle Sonne» and «Trocknet schnell aus» the button «Alle N Tage giessen» shows under the hint; tap it, then «Rückgängig».', 'Eingang › Vorgänge: a photo or note with the booking number of a matter shows under «Mail als Vorgang» with «In …».'],
  since: [],
  de: {
    'Plants and matters, one step further': 'Pflanzen und Vorgänge, einen Schritt weiter',
    'A tip can now become the new watering interval, and receipts find their matter.': 'Ein Hinweis wird jetzt zum neuen Giess-Rhythmus, und Quittungen finden ihren Vorgang.',
    'Plant passport: «Water every N days» right under the hint, with Undo': 'Pflanzenpass: «Alle N Tage giessen» direkt unter dem Hinweis, mit Rückgängig',
    'Matters: photos and notes get a suggestion too, by number, amount or words': 'Vorgänge: Auch Fotos und Notizen bekommen einen Vorschlag, nach Nummer, Betrag oder Wörtern',
    'Planen › Merken › Pflanzenpass: after two observations «Volle Sonne» and «Trocknet schnell aus» the button «Alle N Tage giessen» shows under the hint; tap it, then «Rückgängig».': 'Planen › Merken › Pflanzenpass: Nach zwei Beobachtungen «Volle Sonne» und «Trocknet schnell aus» steht unter dem Hinweis der Knopf «Alle N Tage giessen»; tippe darauf, dann «Rückgängig».',
    'Eingang › Vorgänge: a photo or note with the booking number of a matter shows under «Mail als Vorgang» with «In …».': 'Eingang › Vorgänge: Ein Foto oder eine Notiz mit der Buchungsnummer eines Vorgangs steht unter «Mail als Vorgang» mit «In …».',
  },
};
