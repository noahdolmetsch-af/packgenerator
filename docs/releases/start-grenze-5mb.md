# Start-Grenze auf 5,0 MB

PR (diese Änderung) · 04.11.2026 · Auftrag: Noah, Entscheid zur Karte «Start-Grenze erreicht» (Thread «Prüfen: Warum die Tests langsam sind»)

## Was ist neu
- Der Build bricht erst ab, wenn der Start über 5,0 MB JavaScript lädt (vorher 4,5 MB).
- Damit baut `main` wieder und geht online; offene PRs bauen wieder grün, sobald sie `main` einmal eingemerged haben.
- In der App ändert sich nichts.

## Was fällt weg oder rutscht tiefer
- nichts

## Selbst entschieden
- Genau 5,0 MB (rund 10 % Luft über dem heutigen Start von 4,50 MB), eine runde Zahl.
- Die Warnung bei 90 % (Test-Plan Punkt 1) folgt als eigener PR und braucht diese neue Grenze.

## Entscheide (für decisions.md)
- 04.11.2026: Start-Grenze 5,0 MB (steht in `docs/decisions.md`).

## Stand im Plan
- Tempo: «Texte pro Seite laden» bleibt der eigentliche Hebel (spart etwa 0,3 bis 0,5 s beim Start) und wird als Nächstes geplant.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Unter Actions läuft «Build and deploy» auf `main` grün durch.
2. Die Seite ist online (Ich › Was ist neu zeigt die neue Nummer).
