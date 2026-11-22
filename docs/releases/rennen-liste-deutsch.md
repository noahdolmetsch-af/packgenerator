# Rennen-Liste auf Deutsch

PR #<Nummer> · 05.11.2026 · Auftrag: Noah (Durchklick Etappe 3, Befund E3-001; Thread «Durchklicken Etappe 3: Unterwegs und Wetter»)

## Was ist neu
- Auf Touren › Rennen hiess die erste Gruppe in der deutschen App «Coming». Sie heisst jetzt «Kommende», wie auf der Seite «Rennen detailliert planen».

## Was fällt weg oder rutscht tiefer
- nichts

## Selbst entschieden
- Nur den Titel der ersten Gruppe geändert. «Fertig» (zweite Gruppe) bleibt, weil Noah es so kennt; «Vorbei» steht nur auf der Seite «Rennen detailliert planen».
- Ursache: der Titel steht in einer Liste und geht dynamisch durch `t()`; der Wächter `tests/de-luecken.test.js` sieht solche Texte nicht. Regressionstest: `tests/e2e/rennen-liste-deutsch.spec.js`.

## Entscheide (für decisions.md)
- keine

## Stand im Plan (roadmap.md / vorhaben.md)
- keine Änderung

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Öffne Touren › Rennen.
2. Das Feld mit den kommenden Rennen heisst «Kommende».
