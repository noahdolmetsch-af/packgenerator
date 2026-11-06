# Lange Wörter brechen überall um

PR #<Nummer> · 05.11.2026 · Auftrag: Noah («2a» zu Frage 2 im Bericht Etappe 3; Thread «Durchklicken Etappe 3: Unterwegs und Wetter»)

## Was ist neu
- Eine Regel für alle Seiten: `overflow-wrap: break-word` steht jetzt auf `body` in `src/app.css`. Die Eigenschaft wird vererbt. Ein sehr langes Wort (Name, Notiz) bricht damit am Rand um und schiebt keine Seite mehr zur Seite, auch auf Seiten, die niemand einzeln angepasst hat.

- Vier enge Stellen, die der Layout-Wächter durch die neue Regel gefunden hat (dort lief ein Wort vorher still über den Rand und bricht jetzt mitten im Wort um), sind mitgerichtet:
  - «Strava verbinden» auf Ich: auf einem 320-px-Handy steht der Titel allein in einer Zeile, die zwei Knöpfe darunter (`StravaConnect.svelte`).
  - Erinnerung zum Essen auf Unterwegs: der Titel behält Platz für ein ganzes Wort, «Ausblenden» rutscht bei Bedarf darunter (`Essen.svelte`).
  - Skitouren, «Mehr»: die drei Zahlen rutschen bei wenig Platz auf zwei Spalten (`SkiHome.svelte`).
  - Auswertung, Gefühlt gegen gemessen: die Namensspalte war nur etwa 33 px breit, weil die Breite an der falschen Tabellenzeile stand; jetzt 72 px (`Auswertung.svelte`).

## Was fällt weg oder rutscht tiefer
- Strava-Karte auf einem 320-px-Handy: die Knöpfe stehen unter dem Titel statt daneben (nur bei sehr schmalen Bildschirmen).
- Skitouren «Mehr»: auf sehr schmalen Handys zwei statt drei Zahlen pro Zeile.

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
