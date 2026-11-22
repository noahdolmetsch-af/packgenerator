// «Werkstatt-Quittung:» ohne Text (Noah 05.11.2026, Jetzt dran «1a»): a note with only the start of a label is no note
export default {
  title: 'No empty notes',
  lead: 'A quick note with only «Workshop receipt:» and nothing after it is not saved any more.',
  points: [{ text: 'Today no longer shows a learning that is only a label like «Workshop receipt:»', go: null }],
  small: [
    { box: 'fixed', text: 'A new note for a receipt waits for your words or a photo before it is saved', go: null },
    { box: 'new', text: 'Old empty learnings stay in the list of learnings, where you can delete them', go: null },
  ],
  test: [
    'Open New › Note + photo, choose «Workshop receipt» and tap «Save» without writing more: it asks for a few words or a photo.',
    'Write a few words after «Workshop receipt:» and save: the note is in the Inbox.',
  ],
  since: [],
  de: {
    'No empty notes': 'Keine leeren Notizen mehr',
    'A quick note with only «Workshop receipt:» and nothing after it is not saved any more.': 'Eine Schnellnotiz nur mit «Werkstatt-Quittung:» und nichts danach wird nicht mehr gespeichert.',
    'Today no longer shows a learning that is only a label like «Workshop receipt:»': 'Heute zeigt keinen Lernpunkt mehr, der nur aus einem Stichwort wie «Werkstatt-Quittung:» besteht',
    'A new note for a receipt waits for your words or a photo before it is saved': 'Eine neue Notiz für einen Beleg wartet auf deine Worte oder ein Foto, bevor sie gespeichert wird',
    'Old empty learnings stay in the list of learnings, where you can delete them': 'Alte leere Lernpunkte bleiben in der Liste der Lernpunkte, dort kannst du sie löschen',
    'Open New › Note + photo, choose «Workshop receipt» and tap «Save» without writing more: it asks for a few words or a photo.': 'Öffne Neu › Notiz + Foto, wähle «Werkstatt-Quittung» und tippe auf «Speichern», ohne mehr zu schreiben: Die App bittet um ein paar Worte oder ein Foto.',
    'Write a few words after «Workshop receipt:» and save: the note is in the Inbox.': 'Schreib ein paar Worte hinter «Werkstatt-Quittung:» und speichere: Die Notiz liegt im Eingang.',
  },
};
