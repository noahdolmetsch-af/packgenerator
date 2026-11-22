# Bausteine öffnet schneller

PR #<Nummer> · 05.11.2026 · Auftrag: Noah «Idee A: Tempo-Runde für Seiten» (Thread «Umsetzen Tempo-Runde für Seiten»)

## Was ist neu
- Material › Bausteine: Das Feld «n leere Bausteine» (unter «Je nach Lage») baut seine Karten erst beim Öffnen. Bisher waren es zugeklappt schon rund 400 Elemente.
- Gemessen (Handy-Ansicht, Prozessor 4× langsamer, 700 Testteile): Elemente 2057 → 1657 (−19 %), still nach 0.27 s statt 0.35 s, blockiert 0.13 s statt 0.17 s.

## Was fällt weg oder rutscht tiefer
- nichts. (Beim Aufklappen erscheinen die Karten einen Augenblick später als vorher; danach bleiben sie.)

## Selbst entschieden
- Der Inhalt bleibt nach dem ersten Öffnen stehen.
- Die einzelnen Baustein-Karten (jede ein eigenes Feld) bleiben, wie sie sind: ihr Inhalt ist klein.

## Entscheide (für decisions.md)
- keine neuen.

## Stand im Plan (roadmap.md / vorhaben.md)
- Tempo-Runde für Seiten (Idee A, «Neuer Schwung»): Schritt 3 (Bausteine). Bericht: notes/tempo-runde-2026-11-05/README.md.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Material › Bausteine öffnen: die gefüllten Bausteine von «Je nach Lage» sind gleich da.
2. Die Zeile «n leere Bausteine» antippen: die leeren Bausteine erscheinen und lassen sich wie bisher füllen.
