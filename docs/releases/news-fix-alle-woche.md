# News-Zeile «Alles, was du angelegt hast»: Ort ergänzt

PR folgt · 23.11.2026 · Auftrag: Bündler (Test `ausprobieren.spec` rot auf anderen PRs wegen der News-Zeile aus PR 1515)

## Was ist neu
- Die zweite Zeile der Neuigkeit «Alles, was du angelegt hast» im Wochenrückblick sagt jetzt mit `where`, wo man sie findet (Aktiv › Woche › Wochenrückblick, unter den Zahlen). Ohne Daten gibt es die geschlossene Zeile nicht, darum leuchtete im Test «Ausprobieren» nichts.

## Was fällt weg oder rutscht tiefer
- Nichts. Nur eine News-Datei, kein App-Code.

## Selbst entschieden
- Der Schritt `[data-alle-quiet]` bleibt (mit Daten leuchtet die Zeile), `where` fängt den Fall ohne Daten ab. Der deutsche Text für `where` stand schon in der Datei.
- Die Neuheit auf `/flow/form` (0.1110.0) gehört einem anderen PR und bleibt unberührt.

## Entscheide
- Keine.

## Stand im Plan (roadmap.md / vorhaben.md)
- Keine Änderung am Plan.
