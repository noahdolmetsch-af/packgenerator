# Wächter: langsames Gemini ist kein Alarm mehr

PR #? · 28.10.2026 · Auftrag: Noah «2a» (Thread «Offene GitHub-Issues prüfen»)

## Was ist neu
- Antwortet Gemini (Gratis-Stufe von Google) nicht innerhalb von 15 Sekunden, meldet der Server-Check
  «Gemini ist gerade langsam» als ok (Code «busy»), so wie bei «gerade ausgelastet». Der Wächter öffnet
  dafür kein Issue mehr (vorher #289 mehrmals am Tag).
- Ein falscher Schlüssel, ein fehlendes Modell oder eine leere Antwort bleiben Fehler.

## Was fällt weg oder rutscht tiefer
- Die Fehlermeldung «gemini: timeout» im Wächter-Issue. Sie steht jetzt als «langsam» in der Server-Antwort.

## Selbst entschieden
- Nur Gemini, alle anderen Prüfungen melden eine Zeitüberschreitung weiter als Fehler.

## Entscheide (für decisions.md)
- 28.10.2026: Langsames Gemini zählt als ausgelastet, nicht als Fehler (Noah «2a»).

## Stand im Plan (roadmap.md / vorhaben.md)
- unverändert

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Nichts in der App zu sehen.
2. Nach dem nächsten Wächter-Lauf (alle 3 Stunden): GitHub › Issues, «Wächter: Server braucht Hilfe»
   ist geschlossen oder nennt Gemini nicht mehr.
