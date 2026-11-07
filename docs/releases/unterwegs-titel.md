# Unterwegs hat immer eine Überschrift

PR #<Nummer> · 05.11.2026 · Auftrag: Noah («3a» zu Frage 3 im Bericht Etappe 3; Thread «Durchklicken Etappe 3: Unterwegs und Wetter»)

## Was ist neu
- Unterwegs ohne laufende Tour (zum Beispiel vor der ersten Tour oder an einem Tag ohne Tour) begann mit dem Leerzustand, ohne Seitentitel. Jetzt steht oben die Überschrift «Unterwegs», darunter der Leerzustand wie bisher. Mit einer Tour ändert sich nichts.

## Was fällt weg oder rutscht tiefer
- nichts

## Selbst entschieden
- Die Überschrift kommt aus dem gemeinsamen Seitenkopf (`PageHead`), wie auf den anderen Seiten; kein eigener Text darunter.
- Regressionstest: `tests/e2e/unterwegs-titel.spec.js` (leere App, `#/ride`).

## Entscheide (für decisions.md)
- keine

## Stand im Plan (roadmap.md / vorhaben.md)
- keine Änderung

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Öffne Unterwegs an einem Tag, an dem keine Tour läuft.
2. Oben steht «Unterwegs», darunter «Keine Tour unterwegs heute» (oder «Noch keine Touren»).
