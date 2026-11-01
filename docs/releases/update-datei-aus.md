# Kein Download nach einem Update

PR folgt · 1.11.2026 · Auftrag: Noah 1.11.2026 (Chrome-Frage «Datei noch einmal herunterladen? 61,77 MB» am Handy, Antwort «1a»)

## Was ist neu
- Der Schalter «Backup-Datei vor jedem Update» (`src/lib/maintenance/settings.js`, `dl`) ist standardmässig **aus**. Ursache der Chrome-Frage war PR #505: nach jedem Update ging zehn Sekunden nach dem Start automatisch eine Backup-Datei in die Downloads.
- Die interne Sicherung «Vor Updates» (`snap`) bleibt an.

## Was fällt weg oder rutscht tiefer
- Die automatische Backup-Datei nach jedem Update fällt weg. Wer sie will, schaltet sie unter «Daten und Backup › Vor Updates» wieder ein.

## Selbst entschieden
- Ein bereits gespeichertes `dl: true` bleibt wirksam; nur der Standard ändert sich.

## Entscheide (für decisions.md)
- «Backup-Datei vor jedem Update» ist standardmässig aus (Noah 1.11.2026 «1a»).

## Stand im Plan
- keine Änderung.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. «Daten und Backup» öffnen, bei «Vor Updates» schauen.
2. Der Schalter «Vor jedem Update auch eine Backup-Datei speichern» ist aus.
