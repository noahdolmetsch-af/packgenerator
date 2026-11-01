# Backup-Datei am Handy wählen

PR folgt · 31.10.2026 · Auftrag: Noah 31.10.2026 (Thread «Backup-Datei am Handy importieren»)

## Was ist neu
- Der Knopf «Backup importieren» (`src/lib/DataPanel.svelte`) hat keinen `accept`-Filter mehr. Android-Dateiwähler graut sonst Dateien mit unbekanntem Typ aus (Gmail-Download kommt oft als `application/octet-stream`). Geprüft wird weiter am Inhalt (JSON, `validateBackup`), mit Vorschau vor dem Ersetzen.
- Eine Zeile erklärt: Anhang zuerst speichern (Gmail: Pfeil), dann unter «Downloads» wählen.

## Was fällt weg oder rutscht tiefer
- nichts.

## Selbst entschieden
- Kein Schema- oder Formatwechsel; der Import selbst bleibt unverändert.

## Entscheide (für decisions.md)
- keine.

## Stand im Plan (roadmap.md / vorhaben.md)
- AP26 (Geräte-Fortsetzung): Sync (Ich › Daten › Abgleich) existiert; diese Änderung hilft dem Notweg per Datei.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Ich › Daten: unter den Backup-Knöpfen steht die Zeile zu Mail-Anhängen.
2. Am Handy «Backup importieren» tippen: auch eine .json aus «Downloads» ist wählbar.
