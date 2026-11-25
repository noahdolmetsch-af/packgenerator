# CI: schwere PRs laufen nur am Schluss voll

PR #1783 · 24.11.2026 · Auftrag: Noah «a» (Thread «Tests schneller machen», Stau-Regel 5)

## Was ist neu
- PRs, die Daten, Backup, Sync, Speicher, `api/`, Build- oder Workflow-Dateien (oder etwas nicht Erkanntes) ändern, heissen in der CI «schwer» (`scripts/ci-scope.mjs`, Ausgabe `schwer=yes`).
- Mit dem Label `ok` laufen sie nur noch die **schnelle Stufe**: der Kern, die Specs ihrer Seiten und die Daten-Specs (Backup, Abgleich, Papierkorb, Import …, nach Dateiname, rund 20 Specs). Das sind 1 bis 2 Teile statt 5.
- Die **volle Prüfung** (alle fünf Teile) startet mit dem Label `voll`. Claude setzt es direkt vor dem Merge, also einmal statt bei jedem Push.
- `e2e (phone)` bleibt für einen schweren PR rot («Schwerer PR … Label «voll» setzen»), bis `voll` drauf ist und der volle Lauf grün war. Ohne volle Prüfung kann nichts Schweres gemerged werden.
- Leichte PRs ändern sich nicht.

## Was fällt weg oder rutscht tiefer
- Ein schwerer PR bekommt mit `ok` allein nicht mehr automatisch die volle Prüfung. Alter Weg: `ok` → alle fünf Teile bei jedem Push. Neuer Weg: `ok` → schnelle Stufe, `voll` → alle fünf Teile.
- Sicherheit: gleich. Gemerged wird weiter nur nach einem grünen vollen Lauf auf dem letzten Stand.

## Selbst entschieden
- Messung (24.11., 98 PR-Läufe): etwa jeder vierte PR war schwer und brauchte 165 bis 216 Rechner-Minuten, ein PR («Papierkorb») fünfmal. Das waren etwa 80 % der Rechnerzeit.
- Die Daten-Specs werden nach Dateiname gewählt (`DATA_SPEC_NAME`), nicht nach Inhalt: Inhalt traf die Hälfte aller Specs, weil jeder Test die Datenbank füllt.
- Das Gate liegt im bestehenden Job `e2e (phone)` (eine kurze Prüfung nach den Teilen), nicht in einem neuen Job vor den Teilen, damit die Teile nicht später starten.
- Ein Push nach `voll` startet alle fünf Teile wieder (der Stand hat sich geändert). Darum: erst pushen, dann `voll` setzen.
- Dependabot-PRs ändern sich nicht (sie haben kein `ok`, `e2e (phone)` läuft dort nicht).

## Entscheide (eigene Datei `docs/decisions/ci-voll-nur-am-schluss.md`)
- 24.11.2026: Option A «Volle Prüfung nur einmal pro schwerem PR, am Schluss» (Noah «a»).

## Stand im Plan
- Stau-Regel 5 «Tests schneller machen»: Schritt 2 von 2 (Schritt 1: Aufzeichnung nur beim Wiederholen).

## Prüfschritte (nach dem Merge)
1. Einen PR mit einer Änderung an `package.json` öffnen und `ok` setzen: es laufen nur 1 bis 2 Handy-Teile, `e2e (phone)` ist rot mit dem Hinweis auf `voll`.
2. `voll` setzen: es laufen alle fünf Teile, danach ist `e2e (phone)` grün.
3. Ein PR nur mit einer Seite (zum Beispiel `src/pages/Lend.svelte`) und `ok`: wie bisher, `e2e (phone)` wird nach dem Lauf grün.
