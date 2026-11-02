// «Velo hinzufügen führt zurück» (Noah 1.11.2026 «4a»): from Care the app comes back after adding; the workshop visit without a bike leads to the bike form; one word «Beleg»
export default {
  title: 'Add a bike and come back',
  lead: 'Adding a bike from Care brings you back to Care. A workshop visit without a bike leads you to add one. A receipt is always called «Beleg».',
  points: [{ text: 'Care › «Add bike» opens the form and brings you back to Care after saving', go: { href: '#/bikes?tab=care', where: 'Bikes › Care while no bike exists: «Add bike».' } }],
  small: [{ box: 'new', text: 'A workshop visit without a bike says «Add a bike first» with a button' }],
  test: ['With no bike, open Bikes › Care and tap «Add bike»: the form opens. Save a bike: you are back in Care.', 'With no bike, start a workshop visit: it says to add a bike first and has a button for it.'],
  since: [],
  de: {
    'Add a bike and come back': 'Velo hinzufügen und zurückkehren',
    'Adding a bike from Care brings you back to Care. A workshop visit without a bike leads you to add one. A receipt is always called «Beleg».': 'Ein Velo aus der Pflege hinzufügen bringt dich zurück zur Pflege. Ein Werkstattbesuch ohne Velo führt dich zum Velo-Formular. Ein Beleg heisst überall «Beleg».',
    'Care › «Add bike» opens the form and brings you back to Care after saving': 'Pflege › «Velo hinzufügen» öffnet das Formular und bringt dich nach dem Speichern zurück zur Pflege',
    'Bikes › Care while no bike exists: «Add bike».': 'Velos › Pflege, solange kein Velo da ist: «Velo hinzufügen».',
    'A workshop visit without a bike says «Add a bike first» with a button': 'Ein Werkstattbesuch ohne Velo sagt «Erfasse zuerst ein Velo» und hat einen Knopf dafür',
    'With no bike, open Bikes › Care and tap «Add bike»: the form opens. Save a bike: you are back in Care.': 'Öffne ohne Velo Velos › Pflege und tippe «Velo hinzufügen»: das Formular öffnet sich. Speichere ein Velo: du bist zurück in der Pflege.',
    'With no bike, start a workshop visit: it says to add a bike first and has a button for it.': 'Starte ohne Velo einen Werkstattbesuch: er sagt, du sollst zuerst ein Velo erfassen, und hat einen Knopf dafür.',
  },
};
