# Langer Titel beim Teilen

PR #<Nummer> · 05.11.2026 · Auftrag: Noah (Durchklick Etappe 3, Befund E3-002; Thread «Durchklicken Etappe 3: Unterwegs und Wetter»)

## Was ist neu
- Ein Titel aus einem sehr langen Wort (ohne Leerzeichen) schob unter Ich › Ruhig und persönlich › Teilen mit Vorschau die Kontrolle «Prüfe, was mitgeht» und damit die ganze Seite nach rechts. Er bricht jetzt am Rand um.

## Was fällt weg oder rutscht tiefer
- nichts

## Selbst entschieden
- `overflow-wrap: break-word` und `min-width: 0` auf der Hinweisbox `.rh-note` (`src/lib/ruhig/ruhig.css`; der Stil-Wächter erlaubt kein `anywhere`), damit auch andere Texte dort (Fehler, Meldungen) nie breiter als der Bildschirm werden. Titel und Taschennamen der geteilten Seite selbst brechen schon um (geprüft).
- Regressionstest: `tests/e2e/teilen-langer-titel.spec.js` (vorher rot: Seite 1223 px breit auf 390 px).

## Entscheide (für decisions.md)
- keine

## Stand im Plan (roadmap.md / vorhaben.md)
- keine Änderung

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Öffne Ich › Ruhig und persönlich › Teilen mit Vorschau.
2. Schreibe bei «Titel, den die andere Person sieht» ein sehr langes Wort ohne Leerzeichen und tippe daneben.
3. Die Seite bleibt so breit wie der Bildschirm, der Titel bricht in «Prüfe, was mitgeht» um.
