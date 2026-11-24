# Test-Uhr: nur Specs mit der festen Uhr lesen den Testtag

23.11.2026 · Auftrag: Noah «ja» (Thread «Wackel-Tests zuverlässig machen»; Frage: Gesamtlösung für den Uhr-Fehler, der rund 170 weitere Tests treffen kann)

- `tests/e2e/clock.js` gibt den verschobenen Testtag nur Specs, die die feste Uhr einbinden (direkt oder über eine Hilfsdatei); alle anderen lesen die echte Zeit. Das setzt den Vorschlag in `docs/decisions/wackel-tests-ursachen.md` um (dort noch «nicht entschieden»; hier entschieden).
