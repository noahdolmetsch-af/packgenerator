# Test: Gruppen-Server ohne Zufalls-Treffer

Auftrag: Koordinator, Wackler-Liste 2a (Thread «Merge-Stau abbauen und Tests stabilisieren»)

## Was ist neu
- `tests/group-server.test.js`: der Test «an event group» sucht im verschlüsselten Text nicht mehr nach «Col» (drei Buchstaben, die im Zufallstext zufällig vorkommen können), sondern nach dem ganzen Klartext `test_data_gtp_ Col` und `test_data_gtp_ Pumpe`. Er prüft weiter dasselbe: der Klartext darf nicht im Speicher stehen.

## Was fällt weg oder rutscht tiefer
- nichts (nur Test, nichts sichtbar)

## Selbst entschieden
- Die Prüfung wird nicht lockerer: im Klartext stehen die Wörter immer ganz.

## Stand im Plan
- Merge-Stau dauerhaft lösen: Wackler behoben (2a).

## Prüfschritte
Nichts Sichtbares. CI zeigt grün.
