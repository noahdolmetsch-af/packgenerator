# Test «Bereiche von Heute»: auf die neue Reihenfolge warten

Auftrag: Koordinator, 1.11.2026 (Thread «Merge-Stau abbauen und Tests stabilisieren»), Punkt 2a (Wackler beheben)

## Was ist neu
- `heute-bereiche-anpassen.spec.js` wartete nach «Dein Körper nach oben» nur darauf, dass beide Bereiche irgendwo in der Liste stehen (immer wahr), und prüfte die Reihenfolge sofort. In CI war die Liste manchmal noch nicht umgestellt.
- Jetzt wartet der Test, bis die ersten zwei Bereiche «Körper, Jetzt» sind.

## Was fällt weg oder rutscht tiefer
- nichts (nur Tests, nichts in der App sichtbar)

## Selbst entschieden
- Nur die Prüfung geändert, nichts gelockert: derselbe Soll-Wert, mit Warten.

## Stand im Plan
- Merge-Stau dauerhaft lösen: Wackler beheben.

## Prüfschritte
Nichts Sichtbares. CI zeigt grün.
