# Stand und Plan nachgeführt (Wochenbrief 15.11.)

PR · 15.11.2026 · Auftrag: Noah «2a» (Thread «Bauen: Wochenbrief am Sonntag»)

## Was ist neu
- `docs/stand-und-plan.md` ist auf den 15.11.2026 nachgeführt: Abschnitt 1 (offene PRs) neu nach GitHub, Erledigtes aus Abschnitt 2 als «online» markiert, Abschnitt 3 («Was auf dich wartet») neu.

- CI-Reparatur: `main` war seit dem 12.11. rot, weil Dependabot (#1259) `@playwright/test` auf 1.65.0 hob, die Browser-Image-Tags in `.github/workflows/deploy.yml` und `volle-pruefung.yml` aber auf 1.64.1 blieben (`tests/ci-image.test.js`). Die vier Tags stehen jetzt auf `v1.65.0-noble`.

## Was fällt weg oder rutscht tiefer
- Die lange Tabelle der PRs vom 7.11. (fast alle inzwischen gemergt) fällt weg.

## Selbst entschieden
- Die offenen PRs mit Label «ok» stehen in einer eigenen Tabelle, weil sie seit 5. bis 8.11. nicht gemergt sind (Ursache nicht geprüft).
- Die CI-Reparatur steht in diesem PR, weil dieser Zweig der einzige ist, auf dem ich arbeiten darf; sie ist eine eigene Zeile im Commit und lässt sich allein zurücknehmen.
- Keine Versionsnummer, keine privaten Daten.

## Entscheide (für decisions.md)
- keine

## Stand im Plan (roadmap.md / vorhaben.md)
- keine Änderung

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Nichts in der App; die Datei steht auf GitHub unter docs/stand-und-plan.md.
