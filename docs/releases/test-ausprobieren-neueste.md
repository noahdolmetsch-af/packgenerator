# Test «Ausprobieren»: neueste Version ohne festen Ort

Auftrag: Koordinator, 1.11.2026 (Thread «Merge-Stau abbauen und Tests stabilisieren»), Punkt 2a (Wackler beheben)

## Was ist neu
- `ausprobieren.spec.js` tippte zuerst «Ausprobieren» bei der neuesten Version und erwartete «Neu hier: …». Seit #512 (nur Anzeigefehler, alle Zeilen ohne festen Ort) gibt es dort nichts anzuspringen, der Test war auf main und in allen PRs rot.
- Der erste Schritt läuft jetzt nur, wenn die neueste Version eine Zeile mit festem Ort hat. Alle Zeilen mit festem Ort werden weiterhin einzeln getippt und geprüft.

## Was fällt weg oder rutscht tiefer
- nichts (nur Tests, nichts in der App sichtbar)

## Selbst entschieden
- Den Schritt bedingt gemacht statt die App zu ändern: ein Fehlerbehebungs-Release ohne festen Ort hat nichts zum Anspringen.

## Stand im Plan
- Merge-Stau dauerhaft lösen: Wackler beheben.

## Prüfschritte
Nichts Sichtbares. CI zeigt grün.
