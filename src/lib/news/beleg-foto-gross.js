// «Beleg direkt fotografieren» (Noah 1.11.2026): on a computer the receipt photo button in the workshop visit is big and green like on the phone
export default {
  title: 'Receipt photo is easy to find on a computer',
  lead: 'Logging a workshop visit on a computer now shows the receipt photo as the big green button, as on the phone.',
  points: [{ text: 'In «Log a workshop visit» on a computer the receipt photo is a big green button «Choose the receipt photo»', go: { href: '#/bikes?tab=shop', steps: [{ text: 'Log a workshop visit' }, { sel: '.pp.big' }] } }],
  small: [],
  test: ['On a computer open Bikes › Workshop › «Log a workshop visit»: a big green button «Choose the receipt photo» is at the top.', 'On the phone nothing changes: «Photograph the receipt» opens the camera.'],
  since: [],
  de: {
    'Receipt photo is easy to find on a computer': 'Das Beleg-Foto ist am Computer leicht zu finden',
    'Logging a workshop visit on a computer now shows the receipt photo as the big green button, as on the phone.': 'Beim Erfassen eines Werkstattbesuchs am Computer ist das Beleg-Foto jetzt der grosse grüne Knopf, wie am Handy.',
    'In «Log a workshop visit» on a computer the receipt photo is a big green button «Choose the receipt photo»': 'In «Werkstattbesuch erfassen» ist das Beleg-Foto am Computer ein grosser grüner Knopf «Beleg-Foto wählen»',
    'On a computer open Bikes › Workshop › «Log a workshop visit»: a big green button «Choose the receipt photo» is at the top.': 'Öffne am Computer Velos › Werkstatt › «Werkstattbesuch erfassen»: oben steht ein grosser grüner Knopf «Beleg-Foto wählen».',
    'On the phone nothing changes: «Photograph the receipt» opens the camera.': 'Am Handy ändert sich nichts: «Beleg fotografieren» öffnet die Kamera.',
  },
};
