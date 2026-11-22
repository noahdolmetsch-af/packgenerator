// «KI entfernen, Schritt 3» (Noah 20.11.2026 «a»): keine KI-Schritte im Kompass, kein KI-Knopf bei «Bereit für morgen?», keine Online-Erkennung bei Packliste per Foto
export default {
  title: 'No more AI steps, tips or photo recognition online',
  lead: 'Compass, «Ready for tomorrow?» and the packing list by photo work without Claude.',
  points: [
    { text: 'Compass: you type the steps of a goal yourself; the button «Suggest steps» is gone', go: { href: '#/me/compass', where: 'Me › Compass: add steps under a goal.' } },
    { text: '«Ready for tomorrow?» shows the hints from weather, list and parts due; no button for the AI helper', go: null },
    { text: 'Packing list by photo recognises on the device only; the photo never leaves your phone', go: { href: '#/me/tools/packphoto', where: 'Toolbox › Packing list by photo.' } },
  ],
  small: [],
  test: [
    'Open Me › Compass and a goal: under «Add steps» there is only the button «Add steps», no «Suggest steps».',
    'Open Packing for a trip that starts tomorrow: «Ready for tomorrow?» lists its hints, no button «Ask the AI helper for tomorrow».',
    'Open Toolbox › Packing list by photo: there is no switch «KI-Helfer (online)», only the device recognises.',
  ],
  since: [],
  de: {
    'No more AI steps, tips or photo recognition online': 'Keine KI-Schritte, -Tipps oder Online-Fotoerkennung mehr',
    'Compass, «Ready for tomorrow?» and the packing list by photo work without Claude.': 'Kompass, «Bereit für morgen?» und die Packliste per Foto arbeiten ohne Claude.',
    'Compass: you type the steps of a goal yourself; the button «Suggest steps» is gone': 'Kompass: Du tippst die Schritte eines Ziels selbst; den Knopf «Schritte vorschlagen» gibt es nicht mehr',
    'Me › Compass: add steps under a goal.': 'Ich › Kompass: unter einem Ziel Schritte hinzufügen.',
    '«Ready for tomorrow?» shows the hints from weather, list and parts due; no button for the AI helper': '«Bereit für morgen?» zeigt die Hinweise aus Wetter, Liste und fälligen Teilen; kein Knopf für den KI-Helfer',
    'Packing list by photo recognises on the device only; the photo never leaves your phone': 'Packliste per Foto erkennt nur auf dem Gerät; das Foto verlässt dein Handy nie',
    'Toolbox › Packing list by photo.': 'Werkzeugkasten › Packliste per Foto.',
    'Open Me › Compass and a goal: under «Add steps» there is only the button «Add steps», no «Suggest steps».': 'Öffne Ich › Kompass und ein Ziel: unter «Schritte hinzufügen» gibt es nur den Knopf «Schritte hinzufügen», kein «Schritte vorschlagen».',
    'Open Packing for a trip that starts tomorrow: «Ready for tomorrow?» lists its hints, no button «Ask the AI helper for tomorrow».': 'Öffne Packen für eine Tour, die morgen startet: «Bereit für morgen?» zeigt die Hinweise, es gibt keinen Knopf «KI-Helfer für morgen fragen».',
    'Open Toolbox › Packing list by photo: there is no switch «KI-Helfer (online)», only the device recognises.': 'Öffne Werkzeugkasten › Packliste per Foto: es gibt keinen Schalter «KI-Helfer (online)», nur das Gerät erkennt.',
  },
};
