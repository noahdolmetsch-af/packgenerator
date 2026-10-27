# Koppeln sagt, was wirklich passiert ist (und Test «Dokumente» ohne Fehler)

PR #333 · 27.10.2026 · Auftrag: Noah «3a» (Thread «Einzelideen Ich», Frage 3)

## Was ist neu
- **Koppeln:** Lief gerade ein Abgleich, als du auf «Koppeln» getippt hast, wartete das Feld nur auf diesen alten Abgleich und meldete dann «Gekoppelt», auch wenn der eigene erste Abgleich danach scheiterte (z. B. kein Netz). Jetzt wartet es auf den eigenen Abgleich und zeigt dessen Ergebnis oder Fehler (`src/lib/sync/auto.svelte.js`, `runSync`).
- **Test «Dokumente»** (`tests/e2e/daten-sicher.spec.js`): Das Start-Skript setzt Sprache und «Was ist neu gesehen» nur noch dort, wo es einen Speicher (localStorage) gibt. Das Fenster, in dem der Browser das PDF zeigt, hat keinen; das Skript brach dort ab («Cannot read properties of null (reading 'getItem')»), und die Fehlerprüfung wurde ab und zu rot.
- **Test «Koppeln»** (`tests/e2e/abgleich.spec.js:161`): unverändert aus #337 (wartet auf die laufende Runde, bevor er das Netz sperrt). Neu dazu der Unit-Test `tests/sync-auto.test.js` für den Koppeln-Fehler oben.

## Was fällt weg oder rutscht tiefer
- nichts

## Selbst entschieden
- Den Koppeln-Fehler in diesem PR behoben: gefunden, als der Test «Koppeln» hier zweimal gleich rot war. Den Test selbst hat inzwischen #337 auf main repariert; diese Fassung bleibt.
- Unit-Test `tests/sync-auto.test.js`: Ein Abgleich, um den während eines laufenden gebeten wird, startet danach, und wer wartet, bekommt sein Ergebnis (ohne die Korrektur rot).
- Die Fehlerprüfungen der Tests bleiben streng; behoben ist jeweils die Ursache.

## Entscheide (für decisions.md)
- 27.10.2026: Test «Dokumente» robust machen (Noah «3a»). Steht schon in decisions.md.

## Stand im Plan
- Unverändert.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Ich › Daten und Backup › Handy und Computer: mit einem Code koppeln, während das Handy kein Netz hat (Flugmodus). Das Feld sagt «Gerade kein Netz …» statt «Gekoppelt».
2. Mit Netz koppeln: «Gekoppelt. Ab jetzt haben beide Geräte dieselben Daten.» wie bisher.
