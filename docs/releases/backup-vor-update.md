# Backup-Datei vor jedem Update

Auftrag: Noah 31.10.2026 «1a und b 2a» (Thread «Automatisches Backup bei Updates behalten»), Teil 3 von 3.

## Was ist neu
- Nach einem Update (wenn die App die Kopie «vor dem Update» anlegt) speichert sie dieselben Daten auch als Backup-Datei im Download-Ordner (`downloadBackup`, verschlüsselt, wenn die Sperre an ist).
- Schalter in Ich › App-Wartung: «Vor jedem Update auch eine Backup-Datei speichern», standardmässig an.

## Was fällt weg oder rutscht tiefer
- nichts.

## Selbst entschieden
- Teil 2 (b, Sicherung im Browser-Speicher) gibt es schon seit 13.10. (BF4, «Backup vor jedem Update», letzte 3 Kopien). Dafür kein neuer PR.
- Kein Download im Demo-Modus und nicht bei der ersten Installation (keine Daten).
- Der Browser kann das automatische Herunterladen blockieren (v.a. am Handy). Dann passiert nichts weiter; die Kopie im Browser-Speicher bleibt.
- Kein Schema-Wechsel; die Einstellung liegt im bestehenden Eintrag `maintenance`.

## Entscheide (für decisions.md)
- 31.10.2026: Backup vor Updates: Heute-Hinweis (1a), Browser-Kopie existiert (b), Download-Datei (2a).

## Stand im Plan (roadmap.md / vorhaben.md)
- Ziel Alltag (Daten sicher): Teil 3 von 3.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Ich › App-Wartung: Der Schalter «Vor jedem Update auch eine Backup-Datei speichern» ist an.
2. Nach dem nächsten Update liegt eine pack-generator-….json im Download-Ordner.
