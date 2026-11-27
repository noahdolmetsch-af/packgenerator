# Test «size-guard»: Handbuch-Texte in einem Durchgang suchen

PR #NNNN · 27.11.2026 · Auftrag: Wackel-Wächter, PR 1826 meldete 30,9 s von 30 s Limit auch auf main

## Was ist neu
- Nichts Sichtbares geändert, nur Test für `tests/size-guard.test.js` («the handbook-only German is not used by any other place»).
- **Ursache:** Der Test suchte jeden der 1241 Handbuch-Texte mit einem eigenen `includes()` im gesamten Quelltext (28 MB): 27 Sekunden von 30 erlaubten. Auf einem langsamen oder belasteten Rechner reichte das Limit nicht, der Test wurde rot, ohne dass etwas kaputt war.
- **Fix:** Die Suche läuft in einem Durchgang mit einem Rolling-Hash (`foundIn`) und gibt für jeden Text dieselbe Antwort wie `includes()`. Jetzt 1,4 Sekunden. Das Limit von 30 Sekunden bleibt, es wurde nichts angehoben.
- **Geprüft:** Ein neuer Test vergleicht `foundIn` mit `includes()` (kurze Texte, Wiederholungen, leere Texte). Ein absichtlich eingebauter Verstoss (ein Handbuch-Text in `App.svelte`) macht den Wächter weiter rot, danach zurückgesetzt.

## Was fällt weg oder rutscht tiefer
- nichts.

## Selbst entschieden
- Die Regel des Wächters bleibt gleich (die ersten 24 Zeichen eines Textes dürfen ausserhalb des Handbuchs nicht vorkommen), nur die Suche ist schneller.

## Entscheide
- keine.

## Stand im Plan (roadmap.md / vorhaben.md)
- keine Änderung.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. In GitHub: «npm test» grün. In der App nichts zu prüfen.
