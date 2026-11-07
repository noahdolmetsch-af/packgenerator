# Wächter «Fehlendes Deutsch»

PR #907 · 05.11.2026 · Auftrag: Noah «1a» (Idee 1 aus dem Bericht zu Etappe 1 des Frontend-Durchklicks)

Idee aus den Funden E1-002 bis E1-004: Texte ohne deutschen Eintrag fielen nur auf, wenn jemand auf der deutschen Seite an die Stelle klickte. `tests/de-luecken.test.js` liest den Quelltext, findet jeden Text in `t('…')` und `tn(n, '…', '…')` und meldet jeden ohne Eintrag in `src/lib/i18n/de/*.js` mit Datei und Zeile. Nicht erfasst: Texte aus Vorlagen mit `${…}` und berechnete Texte (der Gesamttest schaut weiter auf englische Wörter in der deutschen Oberfläche).

## Was ist neu
- Ein Test. Keine Änderung in der App.

## Was fällt weg oder rutscht tiefer
- nichts

## Selbst entschieden
- Vier Texte stehen in der Liste `KNOWN` und bleiben bewusst englisch: der Platzhalter «English text», die Zeichen «Ø {v} {unit}» und «max {v} {unit}», der Name «KI-Helfer». Die Liste darf nur kürzer werden; ein Eintrag mit deutschem Text lässt den zweiten Test rot werden.
- Eine Zeile in CLAUDE.md bei «Every PR» nennt den Test.

## Entscheide (für decisions.md)
- keine

## Stand im Plan (roadmap.md / vorhaben.md)
- keine Änderung
