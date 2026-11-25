# Wackel-Tests: die Test-Uhr stimmt auch nach einem anderen Spec im selben Arbeiter

PR #1783 · 21.11.2026 · Auftrag: Koordinator (rote e2e-Tests auf main blockieren #1297 und #1301), Thread «Wackel-Tests auf main reparieren»

## Was ist neu
- Nichts in der App. Nur Testcode: `tests/e2e/clock.js` und der Wächter `tests/clock-fixture.test.js`.
- Ursache: Die Test-Uhr (`clock.js`) schiebt «jetzt» im Testprozess auf einen festen Mittwoch in der Monatsmitte (2 bis 3 Tage zurück). Ein Spec mit eigener Browser-Uhr (`page.clock.install`) schreibt Playwright die Zeit «jetzt» in die Seite. Das war die verschobene Zeit, wenn vorher im selben Arbeiter ein Spec mit `clock.js` gelaufen war. Die Browser-Uhr ging dann 2 bis 3 Tage zu weit vor («heute» 12.10. statt 9.10.). 150 Specs setzen ihre Uhr selbst und importieren `test` direkt aus `@playwright/test`.
- Darum waren ruhetag, sporttasche, suche-sprache, tages-check-seiten, timer, Erholung, Erkenntnisse, Bedienung, app-wartung, alltag und weitere im vollen Lauf rot und einzeln grün. Welcher Spec es traf, hing davon ab, welcher davor im Arbeiter lief; die Zahl der Tage von der Uhrzeit und dem Tag des Laufs.
- Jetzt liest Playwright selbst (Aufrufe aus `node_modules/playwright*`) die echte Zeit; Specs und App sehen weiter den Testtag. Der Wächter `tests/clock-fixture.test.js` prüft das (er ist ohne den Fix rot).
- Nachgestellt: `a-einzeln.spec.js` und danach `ruhetag.spec.js` im selben Arbeiter (`--workers=1`) war rot, jetzt grün.

## Was fällt weg oder rutscht tiefer
- nichts.

## Selbst entschieden
- Der Fix steht an einer Stelle (`shiftDate` in `clock.js`), nicht in 150 Specs: ein Wechsel auf `import … from './clock.js'` hätte auch das Verhalten der Karten am Handy geändert (`cardsOpen`).
- `tippzahl.spec.js` ist hier nicht enthalten: Der Test ist echt rot (neue Seiten liegen zu tief), das repariert der Thread «Training erfassen». Beobachtung für später: er schaut die Links einer Seite zu früh an (Aktiv hat nach «settle» noch von 28 auf 49 Links gewachsen), darum wechselte die Menge der «zu tiefen» Seiten von Lauf zu Lauf. Der Patch dafür liegt unter `/mnt/project-files/notes/tippzahl-warten.patch`.
- Keine «Was ist neu»-Datei, weil nichts Sichtbares ändert.

## Entscheide (für decisions.md)
- keine neuen.

## Stand im Plan (roadmap.md / vorhaben.md)
- keine Änderung.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Nichts zu prüfen in der App. In GitHub: `e2e (phone)` zeigt für ruhetag, sporttasche, timer, suche-sprache, tages-check-seiten, erholung, erkenntnisse, bedienung grün, auch im vollen Lauf (Volle Prüfung).
