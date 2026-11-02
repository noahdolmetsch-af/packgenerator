# Fertig-Regel für neue Funktionen (Wegweiser 25)

PR #<Nummer> · 02.11.2026 · Auftrag: Noah «speichere schritt 1-26 als geplant, ich möchte alle umsetzen, freigabe» (Thread «Entdeckbarkeit versteckter Funktionen planen»)

## Was ist neu
- Neue Arbeitsregel in `CLAUDE.md` («Every PR») und `docs/arbeitsweise.md` (Punkt 13): Eine neue Funktion ist erst fertig, wenn sie fünf Teile hat: Seite (Katalog mit Anleitung und Beispiel), Absprung dort, wo man sie braucht, Inhalt («Gut zu wissen»), einen leeren Zustand, der erklärt und weiterführt, und einen nächsten Schritt nach der Haupthandlung.
- Die Regel nennt die Tests, die zwei der Teile schon prüfen (`absprung`, `wissen`).
- In der App ändert sich nichts.

## Was fällt weg oder rutscht tiefer
- nichts.

## Selbst entschieden
- Kein Test für leeren Zustand und nächsten Schritt: das lässt sich nicht sicher aus dem Code lesen. Schritt 26 misst es am Schluss mit dem Roboter.
- Fehlt einer Funktion ein Teil, steht der Grund im PR unter «Selbst entschieden», statt dass der PR stehen bleibt.
- Keine «Was ist neu»-Datei, weil sich in der App nichts ändert.

## Entscheide (für decisions.md)
- 02.11.2026: Fertig-Regel mit fünf Teilen für jede neue Funktion (Wegweiser Schritt 25).

## Stand im Plan (roadmap.md / vorhaben.md)
- Vorhaben 17 Wegweiser statt Katalog: Schritt 25 gebaut.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Auf GitHub `CLAUDE.md` öffnen, Abschnitt «Every PR»: die Zeile «Fertig-Regel» steht dort.
2. `docs/arbeitsweise.md` öffnen: Punkt 13 «Fertig-Regel» erklärt sie auf Deutsch.
