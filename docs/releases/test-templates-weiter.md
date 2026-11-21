# Test «Neue Vorlage in 3 Schritten»: der Knopf «Weiter» ist eindeutig

PR #? · 21.11.2026 · Auftrag: Noah «3a» (Thread «Prüfungen so einrichten, dass main grün bleibt»)

Kein sichtbarer Unterschied in der App, nur ein Test.

## Was ist neu
- `tests/e2e/templates.spec.js` klickt «Weiter» jetzt mit `exact: true`. Am Computer gibt es seit der Seitenleiste auch den Knopf «Weitere Orte»; «Weiter» passte auf beide («strict mode violation»), der Test war im Nachtlauf rot. Die App war in Ordnung.

## Was fällt weg oder rutscht tiefer
- nichts

## Selbst entschieden
- Nur diese zwei Zeilen im Test. Die zwei anderen roten Tests (`zoom-tourkopf`, PF16) sind kein Test-Fehler dieser Art und kommen getrennt.

## Entscheide (für decisions.md)
- keine

## Stand im Plan (roadmap.md / vorhaben.md)
- main bleibt grün: ein roter Test weniger.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Auf GitHub: im nächsten Nachtlauf (Actions › «Volle Prüfung») steht `templates.spec.js:89` nicht mehr unter «Neu rot».
