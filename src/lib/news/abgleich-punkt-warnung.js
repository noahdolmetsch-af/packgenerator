// «Abgleich-Punkt und Warnung» (Noah 21.11.2026 «1-5a», Punkte 1 und 2): the sync is never silent again
export default {
  title: 'A dot says how the sync stands',
  lead: 'A small dot at «Me» is green when the sync is in step and orange when it is off, behind or has no second device. Today names it.',
  points: [
    { text: 'The dot at «Me»: green = in step, orange = off or behind', go: { href: '#/', steps: [{ sel: '[data-sync-dot]' }], where: 'Shows at the round «Me» button (top right on the phone, bottom left on the computer) once this device has data.' } },
    { text: 'Today says «Sync is off» or «3 changes are not sent yet», with a button', go: { href: '#/', where: 'Shows in «Important today» only when the sync is off or changes did not go out.' } },
  ],
  small: [],
  test: [
    'Look at the round «Me» button: a small dot sits at its corner.',
    'With the sync off, Today shows the line «Sync is off» with «Switch on».',
  ],
  since: [],
  de: {
    'A dot says how the sync stands': 'Ein Punkt zeigt, wie es um den Abgleich steht',
    'A small dot at «Me» is green when the sync is in step and orange when it is off, behind or has no second device. Today names it.': 'Ein kleiner Punkt bei «Ich» ist grün, wenn der Abgleich aktuell ist, und orange, wenn er aus ist, hinterherhinkt oder noch kein zweites Gerät hat. Heute sagt es.',
    'The dot at «Me»: green = in step, orange = off or behind': 'Der Punkt bei «Ich»: grün = aktuell, orange = aus oder hinterher',
    'Shows at the round «Me» button (top right on the phone, bottom left on the computer) once this device has data.': 'Erscheint am runden «Ich»-Knopf (am Handy oben rechts, am Computer unten links), sobald dieses Gerät Daten hat.',
    'Today says «Sync is off» or «3 changes are not sent yet», with a button': 'Heute sagt «Abgleich ist aus» oder «3 Änderungen noch nicht gesendet», mit einem Knopf',
    'Shows in «Important today» only when the sync is off or changes did not go out.': 'Erscheint in «Wichtig heute» nur, wenn der Abgleich aus ist oder Änderungen nicht rausgegangen sind.',
    'Look at the round «Me» button: a small dot sits at its corner.': 'Schau auf den runden «Ich»-Knopf: An seiner Ecke sitzt ein kleiner Punkt.',
    'With the sync off, Today shows the line «Sync is off» with «Switch on».': 'Bei ausgeschaltetem Abgleich zeigt Heute die Zeile «Abgleich ist aus» mit «Einschalten».',
  },
};
