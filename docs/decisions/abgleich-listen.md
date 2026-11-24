# Abgleich: Listen zusammenführen

23.11.2026 · Auftrag: Noah (Thread «Abgleich zwischen Handy und Computer sichern»): «ich dachte, dass alles immer automatisch, immer 1:1 gespiegelt wird, wenn es gekoppelt ist. Oder nach ein paar Minuten zumindest.»

- Die Erwartung stimmt und gilt: alles, was in der Datenbank liegt, geht in den Abgleich. Ausnahmen sind benannt und erklärt (`src/lib/sync/geraet.js`, `docs/abgleich.md`).
- Die Liste «Was mir gut tut» wird beim Abgleich zusammengeführt (Einträge und Haken beider Geräte bleiben), nicht mehr als Ganzes ersetzt. Verworfen: die ganze Liste in Einzel-Einträge einer Tabelle aufteilen (Schema-Änderung und Backup-Format, zu gross für den Fehler).
- Alles, was nur im Browser-Speicher liegt, bleibt auf dem Gerät und wird nicht abgeglichen; neue Stellen müssen in der Landkarte stehen (Test).
