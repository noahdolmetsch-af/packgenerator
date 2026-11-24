# Test «Meilensteine» ohne doppelten Treffer

PR #? · 24.11.2026 · Auftrag: Bündler (main rot, Stau-Regel 2), Thread «Navigation ohne Sackgassen bauen»

## Was ist neu
- Nichts in der App sichtbar. `tests/e2e/hobby-activity.spec.js` sucht die Zeile «Zahlen und Stufen ändern» jetzt mit genauem Text (`exact: true`).
- Ursache: Seit der Änderung «Stufen ändern aus der Filterzeile» (#1677) nennt der Hilfesatz der Meilensteine die Karte «Zahlen und Stufen ändern» mit Namen. Die Suche nach Teiltext fand zwei Stellen (Satz und Karte), der Test brach mit «strict mode violation» ab. Die App ist richtig: der Satz soll den Weg nennen.

## Was fällt weg oder rutscht tiefer
- nichts

## Selbst entschieden
- Den Test eingegrenzt statt den Satz umzuformulieren: der Satz hilft Nutzern, die den Knopf nicht mehr neben den Filtern finden.
