# CI: volle Prüfung nur einmal pro schwerem PR, am Schluss

24.11.2026 · Auftrag: Noah «a» (Thread «Tests schneller machen»)

Auf den Vorschlag mit drei Optionen (A volle Prüfung nur am Schluss, B Tests billiger, C volle Prüfung erst nach dem Merge) antwortete Noah «a».

- **Entscheid:** Ein schwerer PR (Daten, Backup, Sync, Speicher, `api/`, Build- und Workflow-Dateien, nicht Erkanntes) läuft mit `ok` nur die schnelle Stufe. Die volle Prüfung startet mit dem Label `voll`, das Claude direkt vor dem Merge setzt. Ohne sie bleibt `e2e (phone)` rot.
- **Grund:** Etwa jeder vierte PR war schwer und verbrauchte etwa 80 % der Rechnerzeit; ein PR lief fünfmal voll. GitHub erlaubt nur 20 Rechner gleichzeitig, darum warteten alle bis zu 45 Minuten.
- **Bleibt:** Regel 3 (volle Prüfung für Daten, Backup, Sync, `api/` vor dem Merge) gilt unverändert, nur der Zeitpunkt wandert ans Ende.
- **Abgelehnt (nicht gewählt):** Option C, die volle Prüfung erst nach dem Merge (Fehler wären erst auf `main` aufgefallen).
