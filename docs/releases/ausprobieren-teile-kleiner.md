# Test «Ausprobieren»: kleinere Teile

PR #<Nummer> · 24.11.2026 · Auftrag: Bündler (hielt PR 1614 in Teil 1 auf); Thread «Wackel-Tests zuverlässig machen»

## Was ist neu
- Nichts in der App. Nur der Test `tests/e2e/ausprobieren.spec.js` («every line of What is new goes to its exact place, part N»).
- Ursache: Der Test tippt jede Zeile von «Was ist neu» einmal (heute rund 1400) und teilt sie in Teile zu 40 Zeilen. Jede Zeile braucht mindestens 4 bis 5 Sekunden, weil das Leuchten (3 s) zu Ende sein muss, bevor die nächste Zeile kommt. Ein Teil dauerte lokal bis 2 Minuten und auf den ausgelasteten CI-Rechnern 4 bis 5 Minuten. Teil 34 und 35 liefen in die 300-Sekunden-Grenze eines Teils.
- Jetzt sind es Teile zu 20 Zeilen. Jede Zeile wird weiter einmal getippt, die Prüfungen sind dieselben. Lokal 25 bis 90 Sekunden je Teil, auf der CI also rund die Hälfte der Grenze. Die 300 Sekunden bleiben.
- Wann der Test alle Zeilen tippt: nachts und wenn ein PR Dateien ändert, auf denen die Zeilen laufen (`scripts/ci-scope.mjs`: `src/lib/know/`, Neuheiten-Seite, `clock.js`, `settle.js`, `gesamttest/lib.js`). Sonst nur die eigenen Zeilen des PR.

## Was fällt weg oder rutscht tiefer
- nichts. Keine Zeile fällt weg; die Zahl der Teile verdoppelt sich, die Gesamtzeit steigt um den Start jedes Teils (rund 10 s mehr je Teil).

## Selbst entschieden
- Teile verkleinert statt die Zeitgrenze zu erhöhen.
- Keine «Was ist neu»-Datei und kein Entscheid: nichts Sichtbares, nichts, was später gilt.

## Stand im Plan (roadmap.md / vorhaben.md)
- keine Änderung.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Nichts zu prüfen in der App. In GitHub: im nächsten Lauf, der alle Zeilen tippt (Nachtlauf), sind alle Teile «every line of What is new goes to its exact place, part N» grün und keiner läuft länger als etwa 150 Sekunden.

## Nachtrag 24.11.2026: der letzte Teil läuft in der CI in die 5 Minuten
- Der letzte Teil (72, die ältesten Zeilen) lief in der CI dreimal in die 5-Minuten-Grenze, lokal je 20 bis 50 s grün, auch nach dem linearen Neuaufbau des Zweigs. Ursache unbekannt.
- Der Test schreibt deshalb vor jeder Zeile ihren Namen ins Log (`part N: Version «Zeile»`), und die Klicks auf die Version und auf die Zeile haben ein eigenes Limit von 30 s. Bleibt eine Zeile hängen, steht sie im Log und im Fehler («the update … could not be opened» / «the line was not found»), statt dass der Teil stumm 5 Minuten wartet. Geprüft wird dasselbe wie vorher, nichts gelockert.
