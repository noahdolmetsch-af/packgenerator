# CI: Fehlerliste auch in der «Vollen Prüfung»

Auftrag: Noah «2a» (1.11.2026, Thread «Merge-Stau abbauen und Tests stabilisieren»), Folge zu #485

## Was ist neu
- Die «Volle Prüfung» (nachts und nach jeder Veröffentlichung) schreibt gescheiterte und wackelige Tests mit Namen in die Zusammenfassung des Laufs: bei den Browsertests (Handy und Computer) und beim Gesamttest. Gleiche Liste wie in den PRs seit #485.
- So sammelt sich die Wackler-Liste für Punkt 2a (eine Woche beobachten, dann die drei häufigsten beheben) auch aus den nächtlichen Läufen.
- Das Skript ändert das Ergebnis des Laufs nie.

## Was fällt weg oder rutscht tiefer
- nichts (nur CI, nichts in der App sichtbar)

## Selbst entschieden
- Nur der Schritt «Zusammenfassung» pro Job, sonst nichts am Workflow geändert.

## Stand im Plan
- Merge-Stau dauerhaft lösen: 2a läuft (Daten sammeln).

## Prüfschritte
Nichts in der App. Nach dem ersten Lauf der «Vollen Prüfung» unter Actions › Lauf › «Summary» nachsehen: Ein gescheiterter oder wackeliger Test steht dort mit Namen.
