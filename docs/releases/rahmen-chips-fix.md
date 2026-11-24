# Rahmen-Chips: Reparatur (Main wieder grün)

PR (offen) · 24.11.2026 · Reparatur zu «Rahmen: Chips in einer Zeile» (Noah «1-5a»)

## Was ist neu
- Nichts für die Nutzer. Die weiche Kante der Chip-Zeile nutzt jetzt ein Farbtoken (`var(--ink)`) statt `#000`, und der Absprung der News-Zeile hat einen Schritt (`[data-subtabs]`). Damit laufen `style-lint.test.js` und `newsgo.test.js` wieder.

## Was fällt weg oder rutscht tiefer
- nichts

## Beitrag zu den Hauptzielen
- **Klarheit und Auffindbarkeit:** main bleibt grün, damit die Änderungen von Noah ohne Stau online gehen.

## Selbst entschieden
- Die Tests bleiben, wie sie sind; geändert ist nur der Code.

## Stand im Plan (roadmap.md / vorhaben.md)
- keine Änderung
