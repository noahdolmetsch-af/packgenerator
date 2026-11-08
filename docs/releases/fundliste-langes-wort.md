# Fundliste: langes Wort

Auftrag: Noah «Ok» (Thread «Prüfen roten Nacht-Rundgang»). Der Nacht-Rundgang vom 08.11.2026 war rot: `#/neuland` und `#/debrief` wurden mit einem sehr langen Namen 722 statt 390 px breit.

## Was ist neu
- Die Fundliste (Neuland › Fundliste, auch im Rückblick) bricht einen sehr langen Namen eines eigenen Eintrags um. Vorher schob er die Seite auf dem Handy seitlich.
- Technisch: die Textspalte der Zeile darf schmaler werden (`minmax(0, 1fr)`), das Wort bricht um (`overflow-wrap: break-word`).

## Was fällt weg oder rutscht tiefer
- nichts

## Selbst entschieden
- Nur die Fundliste angefasst. Die Funde auf `#/me/abfragen` (849 px) sind alt und kommen als eigener PR.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Neuland › «Eigenes Neuland hinzufügen»: Eintrag mit einem sehr langen Namen ohne Leerzeichen anlegen.
2. Neuland auf dem Handy öffnen: der Name bricht in der Fundliste um, die Seite wackelt nicht zur Seite.
