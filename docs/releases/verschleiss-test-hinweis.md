# Verschleiss: der Test nimmt das «Rückgängig» des Entfernens, nicht das des Speicherns

PR #<Nummer> · 24.11.2026 · Auftrag: Noah «beheben» (Thread «Wackel-Tests zuverlässig machen», `verschleiss.spec.js:106`, auf main 5 von 6 rot)

## Was ist neu
- Nichts in der App. Nur der Test. Nach «Besuch entfernen» liegt der Besuch erst im Papierkorb (PR 1629), dann erscheint der Hinweis «… entfernt · Rückgängig». Der Test las die Datenbank (Besuch weg) und klickte sofort «Rückgängig»; da stand noch der Hinweis «Werkstattbesuch gespeichert» obenauf, dessen «Rückgängig» nichts mehr bewirkt. Der Zähler blieb bei 1800 statt 2600.
- Neu wartet der Test auf den Hinweis des Entfernens und klickt dessen «Rückgängig». Geprüft wird dasselbe (Besuch und Zählerpunkt kommen zusammen zurück).

## Was fällt weg oder rutscht tiefer
- nichts.

## Selbst entschieden
- Die App bleibt: dass der Hinweis einen Augenblick nach dem Entfernen erscheint, ist in Ordnung (der Papierkorb wird zuerst geschrieben).
- Nichts gelockert.

## Entscheide
- keine.

## Stand im Plan (roadmap.md / vorhaben.md)
- keine Änderung.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. In GitHub: `e2e` grün. In der App nichts zu prüfen.
