# Ein Name für das Backup

Auftrag: Noah «namen ok» (08.11.2026), Namensliste `docs/namen.md` Zeile 7. Erste Umbenennung nach Bereich; die weiteren Zeilen folgen in eigenen kleinen PRs.

## Was ist neu
- «Backup prüfen» statt «Sicherung prüfen» (Knopf, Karte, Handbuch-Schritte, Beispiel «Dieses Backup ist gut»).
- «Backup speichern» statt «Jetzt sichern» (Statuszeile) und «Backup herunterladen» (Knopf in «Neu beginnen», Hinweis nach einem Speicherfehler, Schritte beim Umziehen auf ein anderes Gerät).
- «Backup-Datei» statt «Sicherungsdatei» (Prüf-Texte, Platz-Hinweis).
- Handbuch `docs/handbuch.md`: dieselben Wörter.

## Was fällt weg oder rutscht tiefer
- Die Wörter «Sicherung», «Sicherungsdatei», «Jetzt sichern», «Backup herunterladen» und «Jetzt speichern» als Knopf- und Seitentexte.

## Selbst entschieden
- Die Statuszeile und der grosse Knopf auf «Daten und Backup» heissen nun beide «Backup speichern» (gleiche Sache, gleicher Name; beide tun dasselbe).
- Nur deutsche Texte; die englischen Schlüssel bleiben (keine Funktion, kein Link ändert sich).
- Alte «Was ist neu»-Einträge, die das alte Wort nennen, bleiben, wie sie waren: sie beschreiben den damaligen Stand.
- Kein Eingriff in api/, Backup-Format oder Speicherstruktur.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Ich › Daten und Backup: die Knöpfe heissen «Backup speichern», «Backup importieren», «Backup prüfen».
2. «Backup prüfen» antippen, eine Backup-Datei wählen: «Dieses Backup ist gut.»
