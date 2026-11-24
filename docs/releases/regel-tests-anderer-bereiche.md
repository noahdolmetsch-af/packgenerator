# Regeln R31 und R32: Tests anderer Bereiche, ausführlichere Antworten

PR (Nummer steht im PR) · 24.11.2026 · Auftrag: Noah «a» (R31) und «ich möchte, dass du ab sofort mehr antwortest» (R32) (Thread «Regeln und Anweisungen auf neuen Stand bringen»)

## Was ist neu
- `docs/regeln.md`: neue Regel R31. Wer eine Seite umbaut, sucht vor dem PR alle Tests, die diese Seite antippen (auch aus anderen Bereichen), und lässt sie lokal laufen.
- `docs/regeln.md`: neue Regel R32. Antworten an Noah sind ab sofort ausführlicher (was passiert ist, warum, was es für ihn bedeutet, nächster Schritt); R4 verweist darauf.
- `CLAUDE.md`: Verweis auf R31 im Abschnitt «Tests», und der Satz zur Antwortlänge am Anfang folgt R32.
- `tests/regeln-doku.test.js`: die Regeln müssen lückenlos nummeriert sein, aber nicht mehr in der Reihenfolge der Datei.
- Nur Doku und ein Doku-Test, nichts sichtbar in der App.

## Was fällt weg oder rutscht tiefer
- nichts

## Selbst entschieden
- R31 steht bei den Test-Regeln (Abschnitt 5) und trägt trotzdem die Nummer 31, damit keine bestehende Nummer sich ändert. Der Formtest prüft deshalb die Nummern, nicht ihre Reihenfolge.
- Keine «Was ist neu»-Datei: nichts sichtbar.

## Entscheide (eigene Datei `docs/decisions/<name>.md`)
- 24.11.2026: Tests anderer Bereiche lokal laufen lassen – siehe `docs/decisions/regel-tests-anderer-bereiche.md`

## Stand im Plan (roadmap.md / vorhaben.md)
- unverändert

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Nichts zu prüfen in der App. Auf GitHub `docs/regeln.md` öffnen: R31 steht bei den Test-Regeln.
