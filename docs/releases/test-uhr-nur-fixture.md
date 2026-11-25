# Test-Uhr: nur Specs mit der festen Uhr lesen den Testtag

PR #<Nummer> · 23.11.2026 · Auftrag: Noah «ja» (Thread «Wackel-Tests zuverlässig machen», Gesamtlösung zum Uhr-Fehler)

## Was ist neu
- Nichts in der App. Nur die Test-Uhr `tests/e2e/clock.js`.
- Bisher verschob sie `Date` im ganzen Node-Arbeiter auf einen Mittwoch der Monatsmitte und liess es nach jedem Test mit der festen Uhr so stehen. Jeder Spec ohne feste Uhr (rund 170 holen `test` direkt aus `@playwright/test`), der danach im selben Arbeiter lief, las den Testtag, seine Seite stand aber auf dem echten Tag. Folge: Tests wie PF13, Szenario 2 und «Fahrt beenden» waren nachts rot und beim zweiten Versuch (frischer Arbeiter) grün.
- Neu liest `Date.now()` und `new Date()` im Testcode die **echte** Zeit, ausser der Aufrufer sitzt unter einem Spec, der die feste Uhr einbindet (direkt oder über eine Hilfsdatei wie `gesamttest/lib.js`). Der erste Spec auf dem Weg nach oben im Aufrufstapel entscheidet; Hilfsdateien folgen dem Spec, der sie aufruft; Playwright selbst liest wie seit 21.11. die echte Zeit. Ist eine Datei nicht lesbar, bleibt die Verschiebung wie bisher.
- Neue Prüfung in `tests/clock-fixture.test.js`: ein Spec ohne feste Uhr liest die echte Zeit, einer mit fester Uhr (auch über eine Hilfsdatei) den Testtag, `new Date()` gleich. Sie ist mit der alten Uhr rot («pf.spec.js has no fixture: expected 259199999 to be less than 5000»).

## Was fällt weg oder rutscht tiefer
- nichts.

## Selbst entschieden
- `tests/e2e/realtime.js` (PR 1554) bleibt: es schadet nicht und `pf.spec` und `live-speichern` lesen dort ausdrücklich die echte Zeit. Aufräumen später.
- Der Spec-Pfad im Aufrufstapel entscheidet, nicht der Arbeiter: ein Test liest so überall dasselbe, egal wo er im Lauf steht.

## Entscheide (eigene Datei `docs/decisions/test-uhr-nur-fixture.md`)
- 23.11.2026: Noah «ja» zur Gesamtlösung.

## Stand im Plan (roadmap.md / vorhaben.md)
- keine Änderung.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Nichts zu prüfen in der App. In GitHub: alle `e2e`-Teile grün (die Uhr berührt alle Tests, darum läuft die volle Prüfung).
2. Nach der nächsten Nacht: die Wackel-Liste (Issue «Wackel-Tests: Ursache reparieren») nennt keine Tests mehr, die nur beim zweiten Versuch grün waren.
