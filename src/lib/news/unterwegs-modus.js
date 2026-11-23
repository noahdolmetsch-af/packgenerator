// «Unterwegs-Modus» (Plan «ganze App», Schritt 7a, Noah 08.11.2026 «9 b»): Knopf auf «Meine Tour», nie von allein
export default {
  title: 'On-the-way mode',
  lead: 'On the card «My tour» you can switch on a mode that shows only what you need on the way.',
  points: [{ text: 'Tap «Switch on on-the-way mode»: the live map, a note with a photo and a breakdown note stand ready', go: { href: '#/', where: 'Shows on Today while a tour is planned: the quiet button at the bottom of the card «My tour».' } }],
  small: [{ box: 'new', text: 'It never starts by itself; you switch it off with one tap' }],
  test: [
    'Plan a tour. On Today in the card «My tour» tap «Switch on on-the-way mode».',
    'The card now shows «Open the live map», «Note with photo» and «Note a breakdown» instead of the packing steps.',
    'Tap «Switch off on-the-way mode»: the four phases and the next step are back.',
  ],
  since: [],
  de: {
    'On-the-way mode': 'Unterwegs-Modus',
    'On the card «My tour» you can switch on a mode that shows only what you need on the way.': 'Auf der Karte «Meine Tour» schaltest du einen Modus ein, der nur zeigt, was du unterwegs brauchst.',
    'Tap «Switch on on-the-way mode»: the live map, a note with a photo and a breakdown note stand ready': 'Tippe «Unterwegs-Modus einschalten»: Die Live-Karte, eine Notiz mit Foto und eine Panne-Notiz stehen bereit',
    'Shows on Today while a tour is planned: the quiet button at the bottom of the card «My tour».': 'Erscheint auf Heute, solange eine Tour geplant ist: der leise Knopf unten auf der Karte «Meine Tour».',
    'It never starts by itself; you switch it off with one tap': 'Er startet nie von allein; du schaltest ihn mit einem Tipp wieder aus',
    'Plan a tour. On Today in the card «My tour» tap «Switch on on-the-way mode».': 'Plane eine Tour. Tippe auf Heute in der Karte «Meine Tour» «Unterwegs-Modus einschalten».',
    'The card now shows «Open the live map», «Note with photo» and «Note a breakdown» instead of the packing steps.': 'Die Karte zeigt jetzt «Live-Karte öffnen», «Notiz mit Foto» und «Panne notieren» statt der Packschritte.',
    'Tap «Switch off on-the-way mode»: the four phases and the next step are back.': 'Tippe «Unterwegs-Modus ausschalten»: Die vier Phasen und der nächste Schritt sind wieder da.',
  },
};
