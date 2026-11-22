// «Eigene Wochenziele» (Noah 05.11.2026, Ideen für alle Bereiche, Aktiv 4b): small goals of your own for Monday to Sunday, a bar each
export default {
  title: 'Your own week goals',
  lead: 'On Active you can set a few goals for the week, like 2× meditation or 150 km, and see a bar fill from Monday to Sunday.',
  points: [{ text: '«My week goals» on Active: add a goal, change the number, put them in order, delete them', go: 'f.weekgoals' }],
  small: [{ box: 'new', text: 'The goals count the calendar week; the rings still count the last 7 days', go: null }],
  test: [
    'Open Active: «My week goals» sits next to «This week». Tap a suggestion or «Add a week goal».',
    'Tap «Change»: set another number, move a goal with the arrows or the handle, delete it and tap Undo.',
    'Tick a sport that has a goal: its bar fills.',
  ],
  since: ['f.weekgoals'],
  de: {
    'Your own week goals': 'Deine eigenen Wochenziele',
    'On Active you can set a few goals for the week, like 2× meditation or 150 km, and see a bar fill from Monday to Sunday.': 'Auf Aktiv setzt du dir ein paar Ziele für die Woche, zum Beispiel 2× Meditation oder 150 km, und siehst einen Balken von Montag bis Sonntag wachsen.',
    '«My week goals» on Active: add a goal, change the number, put them in order, delete them': '«Meine Wochenziele» auf Aktiv: Ziel hinzufügen, Zahl ändern, in Reihenfolge bringen, löschen',
    'The goals count the calendar week; the rings still count the last 7 days': 'Die Ziele zählen die Kalenderwoche; die Ringe zählen weiter die letzten 7 Tage',
    'Open Active: «My week goals» sits next to «This week». Tap a suggestion or «Add a week goal».': 'Öffne Aktiv: «Meine Wochenziele» steht neben «Diese Woche». Tippe auf einen Vorschlag oder auf «Wochenziel hinzufügen».',
    'Tap «Change»: set another number, move a goal with the arrows or the handle, delete it and tap Undo.': 'Tippe auf «Ändern»: andere Zahl setzen, ein Ziel mit den Pfeilen oder dem Griff verschieben, löschen und auf «Rückgängig» tippen.',
    'Tick a sport that has a goal: its bar fills.': 'Hake eine Sportart mit Ziel ab: Ihr Balken füllt sich.',
  },
};
