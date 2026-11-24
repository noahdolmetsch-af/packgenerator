# Test «Ich-Ideen 36»: die Seite bekommt Zeit zum Öffnen, bevor geprüft wird

PR #<Nummer> · 24.11.2026 · Auftrag: Regel 3 (Thread «Wackel-Tests zuverlässig machen»; PR 1632 war damit wechselnd rot, `ich-ideen.spec.js:59` lokal 2 von 3 rot unter Last)

## Was ist neu
- Nichts in der App. Der Test lud die Seite nach dem Ausschalten neu und gab ihr nur 2 Sekunden, den Schalter zu zeigen; dann lud er sie gleich wieder neu. Auf einem ausgelasteten Rechner öffnete sich die Seite nie fertig (Bild: nur graue Platzhalter, 15 Sekunden lang).
- Jetzt wartet der Test nach jedem Neuladen bis zu 12 Sekunden, bis der Schalter da ist, und prüft dann in einer Sekunde, dass er aus ist. Wiederholt wird weiter (bis 45 Sekunden), falls der Schalter beim ersten Neuladen noch nicht gespeichert war.

## Was fällt weg oder rutscht tiefer
- nichts.

## Selbst entschieden
- Nichts gelockert: der Schalter muss nach dem Neuladen aus sein; nur das Warten auf das Öffnen der Seite ist länger.

## Entscheide
- keine.

## Stand im Plan (roadmap.md / vorhaben.md)
- keine Änderung.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. In GitHub: `e2e` grün. In der App nichts zu prüfen.
