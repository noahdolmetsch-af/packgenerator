# Test «Seitwärts scrollen»: ein Test pro Breite

PR #<Nummer> · 23.11.2026 · Auftrag: Noah «beheben» (Thread «Wackel-Tests zuverlässig machen»; blockierte die PRs 1595 und 1596)

## Was ist neu
- Nichts in der App. Nur der Test `tests/e2e/a11y.spec.js` («no core view scrolls sideways at 320 and 390 px», Handy) war in der CI rot, oft auch im zweiten Versuch, bei PR 1595 und 1596.
- Ursache: Der Test prüfte beide Breiten (320 und 390) mit elf Seiten, zwei Fenstern und der Packseite in einem Durchlauf. Das dauert lokal 49 s und in der CI 84 bis 96 s, die Grenze pro Test ist 90 s. Wer gerade am Warten war, bekam die Schuld («Test timeout … waiting for … Mehr … stable»), jedes Mal eine andere Zeile. Kein Fehler der App: 1595 und 1596 laufen lokal grün.
- Jetzt gibt es zwei Tests, einen pro Breite, mit denselben Prüfungen. Lokal je 27 s, in der CI je rund 50 s.
- Zum Nachlesen: derselbe Test war schon vorher durch die zu breite Karte «Bereit zur Abfahrt?» rot (PR 1611, behoben); `v0471.spec.js:90` (43.99994 statt 44 px) kam von derselben Karte und ist seit 1611 in der CI grün.

## Was fällt weg oder rutscht tiefer
- nichts. Es fällt keine Prüfung weg; die Schleife über 320 und 390 ist nur auf zwei Tests verteilt.

## Selbst entschieden
- Geteilt statt die Zeitgrenze zu erhöhen: die Prüfungen bleiben so streng wie vorher.
- Keine «Was ist neu»-Datei und kein Entscheid: nichts Sichtbares, nichts, was später gilt.

## Stand im Plan (roadmap.md / vorhaben.md)
- keine Änderung.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Nichts zu prüfen in der App. In GitHub: im Lauf von «Build and deploy» sind beide Tests «no core view scrolls sideways at 320 px» und «… at 390 px» (Handy) grün.
