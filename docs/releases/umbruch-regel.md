# Lange Wörter brechen überall um

PR #<Nummer> · 05.11.2026 · Auftrag: Noah («2a» zu Frage 2 im Bericht Etappe 3; Thread «Durchklicken Etappe 3: Unterwegs und Wetter»)

## Was ist neu
- Eine Regel für alle Seiten: `overflow-wrap: break-word` steht jetzt auf `body` in `src/app.css`. Die Eigenschaft wird vererbt. Ein sehr langes Wort (Name, Notiz) bricht damit am Rand um und schiebt keine Seite mehr zur Seite, auch auf Seiten, die niemand einzeln angepasst hat.

## Was fällt weg oder rutscht tiefer
- nichts

## Selbst entschieden
- `break-word`, nicht `anywhere`: der Stil-Wächter (`tests/style-lint.test.js`) erlaubt `anywhere` nicht.
- Grenze: `break-word` ändert nicht die Mindestbreite eines Elements. Ein Kasten, der als Spalte eines Rasters oder als Flex-Kind wächst, braucht weiter `min-width: 0` oder `max-width: 100%` (so bei Teilen, Notfallkarte; dort in #951 und #964). Neue Fälle dieser Art fallen beim Durchklicken auf.
- Bestehende Stellen mit eigenem `overflow-wrap` bleiben, wie sie sind.
- Regressionstest: `tests/e2e/umbruch-regel.spec.js` (hängt je ein sehr langes Wort an Überschrift, Absatz, Liste und Text in einem Kasten an die Seite Touren und misst die Seitenbreite).

## Entscheide (für decisions.md)
- Lange Wörter: eine Regel auf `body` (Noah 05.11.2026 «2a»).

## Stand im Plan (roadmap.md / vorhaben.md)
- keine Änderung

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Öffne Touren › Packen und schreibe in einer Notiz ein sehr langes Wort ohne Leerzeichen.
2. Die Seite bleibt so breit wie der Bildschirm, das Wort bricht um.
3. Schau dich auf zwei, drei Seiten um: nichts sieht anders aus als vorher.
