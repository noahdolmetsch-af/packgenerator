/** German texts: v0.36.0 "Import prüfen" (the safe gear import). Keys are the English texts. */
export default {
  // The page (pages/GearImport.svelte)
  'Check import': 'Import prüfen',
  'More for Gear': 'Mehr zur Ausrüstung',
  'No import is waiting. Choose a gear list (a JSON file of the kind "gear-import"); nothing goes into your gear before you check it here.':
    'Es wartet kein Import. Wähle eine Ausrüstungsliste (eine JSON-Datei der Art «gear-import»); nichts kommt in deine Ausrüstung, bevor du es hier geprüft hast.',
  'Choose file': 'Datei wählen',
  'Gear list': 'Ausrüstungsliste',
  'chosen {when}': 'gewählt {when}',
  'nothing applied yet': 'noch nichts übernommen',
  'Apply all safe ones': 'Alle sicheren übernehmen',
  'Takes "Already there" and "New"': 'Übernimmt «Schon da» und «Neu»',
  'and {n} decided item': 'und {n} entschiedenes Teil',
  'and {n} decided items': 'und {n} entschiedene Teile',
  'A backup comes first; you can undo it.': 'Vorher wird eine Sicherung angelegt; du kannst es rückgängig machen.',
  '{n} unsure item stays here until you decide.': '{n} unsicheres Teil bleibt hier, bis du entscheidest.',
  '{n} unsure items stay here until you decide.': '{n} unsichere Teile bleiben hier, bis du entscheidest.',
  'Already there': 'Schon da',
  'Your item stays as it is. Only empty fields are filled; notes and areas are added.':
    'Dein Teil bleibt, wie es ist. Nur leere Felder werden ergänzt; Notizen und Reisearten kommen dazu.',
  '{n} item without anything new': '{n} Teil ohne Neues',
  '{n} items without anything new': '{n} Teile ohne Neues',
  'Learnings: {add} new, {upd} completed. They keep their original date.': 'Learnings: {add} neu, {upd} ergänzt. Sie behalten ihr ursprüngliches Datum.',
  Unsure: 'Unsicher',
  '{a} of {b} decided': '{a} von {b} entschieden',
  'Maybe already in your gear. Tap the item it is, or "New item".': 'Vielleicht schon in deiner Ausrüstung. Tippe auf das Teil, das es ist, oder auf «Neues Teil».',
  'two lines point to the same item': 'zwei Zeilen zeigen auf dasselbe Teil',
  'What is {name}?': 'Was ist {name}?',
  'Same as {name}': 'Dasselbe Teil: {name}',
  'New item': 'Neues Teil',
  'No category': 'Keine Kategorie',
  '{n} line without a name is skipped.': '{n} Zeile ohne Namen wird übersprungen.',
  '{n} lines without a name are skipped.': '{n} Zeilen ohne Namen werden übersprungen.',
  'Not in the import': 'Nicht im Import',
  'In your gear, but not in the list. Archived items move to Gear → Gone; past trips stay complete. Nothing is deleted.':
    'In deiner Ausrüstung, aber nicht in der Liste. Archivierte Teile kommen zu Ausrüstung → Weg; vergangene Touren bleiben vollständig. Nichts wird gelöscht.',
  Archive: 'Archivieren',
  'Archive selected': 'Auswahl archivieren',
  'Archive {name}': '{name} archivieren',
  'Archive {n} item': '{n} Teil archivieren',
  'Archive {n} items': '{n} Teile archivieren',
  '{n} item archived (Gear → Gone).': '{n} Teil archiviert (Ausrüstung → Weg).',
  '{n} items archived (Gear → Gone).': '{n} Teile archiviert (Ausrüstung → Weg).',
  'Discard import': 'Import verwerfen',
  'Discard this import? Nothing in your gear changes.': 'Diesen Import verwerfen? In deiner Ausrüstung ändert sich nichts.',
  'Import applied {when}.': 'Import übernommen {when}.',
  '{enriched} completed, {added} new, {learn} learnings. A backup was made first.': '{enriched} ergänzt, {added} neu, {learn} Learnings. Vorher wurde eine Sicherung angelegt.',
  'To the gear': 'Zur Ausrüstung',
  'Keep, forget the backup': 'Behalten, Sicherung vergessen',
  'Changes made after the import are undone too. Undo anyway?': 'Auch Änderungen nach dem Import werden zurückgenommen. Trotzdem rückgängig machen?',
  'Undone: everything is as before the import. The list waits here again.': 'Rückgängig gemacht: alles ist wie vor dem Import. Die Liste wartet wieder hier.',

  // The fields an item gets (gearimport.js FIELD_NAMES)
  'Source ID': 'Quell-ID',
  'Body zone': 'Körperzone',
  'From °C': 'Ab °C',
  'To °C': 'Bis °C',
  Temperature: 'Temperatur',
  Rule: 'Regel',

  // The file (gearimport.js validateGearImport)
  'This is not a gear import file.': 'Das ist keine Ausrüstungsliste zum Importieren.',
  'The file has no version.': 'Die Datei hat keine Version.',
  'The learnings in the file are not a list.': 'Die Learnings in der Datei sind keine Liste.',

  // Your data (DataPanel)
  'a gear list with {items} items and {learnings} learnings. Nothing is changed yet: check it first.':
    'eine Ausrüstungsliste mit {items} Teilen und {learnings} Learnings. Noch ist nichts geändert: prüfe sie zuerst.',
  Later: 'Später',
  'The list waits under Gear → ••• → Check import.': 'Die Liste wartet unter Ausrüstung → ••• → Import prüfen.',

  // The new areas (domains.js)
  Cycling: 'Velo',
  Hiking: 'Wandern',
  Everyday: 'Alltag',

  // Learnings from the import (Debrief)
  'From the import': 'Aus dem Import',

  // What is new (whatsnew.js, 0.36.0)
  '"Check import": your reviewed gear list waits on its own page; nothing goes into Gear before you check it.':
    '«Import prüfen»: deine geprüfte Ausrüstungsliste wartet auf einer eigenen Seite; nichts kommt in die Ausrüstung, bevor du sie prüfst.',
  'One button takes the safe ones; unsure items are decided with one tap. A backup comes first, "Undo" puts it back.':
    'Ein Knopf übernimmt die sicheren Teile; unsichere entscheidest du mit einem Tipp. Vorher wird gesichert, «Rückgängig» stellt alles wieder her.',
  'Items the list does not name can be archived: they move to Gone, past trips stay complete.':
    'Teile, die nicht in der Liste stehen, kannst du archivieren: Sie kommen zu «Weg», vergangene Touren bleiben vollständig.',
  'New areas for your items: Cycling, Hiking and Everyday.': 'Neue Reisearten für deine Teile: Velo, Wandern und Alltag.',
};
