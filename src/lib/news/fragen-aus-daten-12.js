// «Fragen aus deinen Daten», Stufe 3, eigene Regeln (Noah 05.11.2026 «regeln im front end eingeben, ändern, löschen, neue erstellen»)
export default {
  title: 'Make your own rules',
  lead: 'Under Me › Your questions you can now create, change, rename, sort and delete the rules of «Questions from your data».',
  points: [
    { text: 'Create your own rule: «If the rain chance is over 50 percent (and …), ask my question»', go: { href: '#/me/abfragen', steps: [{ sel: '[data-rule-add]' }] } },
    { text: 'Rules of the app can be renamed, sorted and deleted too; «Deleted rules» brings them back', go: 'f.datenfragen' },
  ],
  test: [
    'Open Me › Your questions and tap «Create your own rule»: pick a value, «is over» or «is under», a number, and write your question.',
    'Tap «Sort, rename, delete»: move a rule with the arrows, rename it, delete it and tap «Undo».',
    'Open «Deleted rules» and bring a rule back.',
  ],
  since: [],
  de: {
    'Make your own rules': 'Eigene Regeln machen',
    'Under Me › Your questions you can now create, change, rename, sort and delete the rules of «Questions from your data».': 'Unter Ich › Deine Abfragen kannst du die Regeln von «Fragen aus deinen Daten» jetzt erstellen, ändern, umbenennen, sortieren und löschen.',
    'Create your own rule: «If the rain chance is over 50 percent (and …), ask my question»': 'Eigene Regel erstellen: «Wenn die Regenchance über 50 Prozent ist (und …), frage meine Frage»',
    'Rules of the app can be renamed, sorted and deleted too; «Deleted rules» brings them back': 'Auch die Regeln der App kannst du umbenennen, sortieren und löschen; unter «Gelöschte Regeln» holst du sie zurück',
    'Open Me › Your questions and tap «Create your own rule»: pick a value, «is over» or «is under», a number, and write your question.': 'Öffne Ich › Deine Abfragen und tippe auf «Eigene Regel erstellen»: Wähle einen Wert, «ist über» oder «ist unter», eine Zahl und schreibe deine Frage.',
    'Tap «Sort, rename, delete»: move a rule with the arrows, rename it, delete it and tap «Undo».': 'Tippe auf «Sortieren, umbenennen, löschen»: Verschiebe eine Regel mit den Pfeilen, benenne sie um, lösche sie und tippe auf «Rückgängig».',
    'Open «Deleted rules» and bring a rule back.': 'Öffne «Gelöschte Regeln» und hole eine Regel zurück.',
  },
};
