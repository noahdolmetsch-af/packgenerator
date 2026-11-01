# Test «Backup-Rundlauf» wartet auf die Flow-Namen

Auftrag: Noah «1a» (Thread «Merge-Stau abbauen und Tests stabilisieren»). Nichts Sichtbares in der App.

## Was ist neu
- Der Gesamttest wartet am Ende von `start()`, bis Heute die Flow-Namen, Favoriten und den Spaziergang gespeichert hat (Einstellung `flow.seed2`).
- Ursache: Heutes «Im Flow»-Karte ergänzt die Aktivitäten (Spitzname, Favorit, Kachelzeile) erst nach dem ersten Besuch, und nach dem Moment, in dem S6 seine Momentaufnahme macht. Die Sicherung danach enthielt dadurch mehr Felder als die Momentaufnahme («export = stored data» rot).
- Die App ist in Ordnung: Sicherung und gespeicherte Daten stimmen überein, sobald die Karte fertig ist.

## Was fällt weg oder rutscht tiefer
- nichts

## Selbst entschieden
- Kein Test gelockert, es wird nur auf einen Zustand gewartet statt eine Differenz zu erlauben. Alle elf Szenarien laufen lokal (S8 hat seinen eigenen Fix).

## Entscheide (für decisions.md)
- keine

## Stand im Plan (roadmap.md / vorhaben.md)
- Tests stabilisieren: S6 behoben.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Nichts in der App prüfen. Der Gesamttest «Volle Prüfung» ist danach bei S6 grün.
