# PR-Auswahl: gemeinsame Teile lösen die Wächter und ihre abhängigen Tests aus

PR #<Nummer> · 26.11.2026 · Auftrag: Noah «1-8» (26.11.2026 07:43), Schritt 5 des Test-Plans «Tests auf den neuen App-Stand bringen» (Thread «Tests schneller machen»)

Nichts Sichtbares geändert, nur die Auswahl der Browser-Tests in einem PR (`scripts/ci-scope.mjs`).

## Was ist neu
- Ändert ein PR einen **gemeinsamen Teil** der App, laufen jetzt zusätzlich zum Kern die Wächter, die jede Seite und jedes Fenster ansehen (`fenster-nie-abgeschnitten`, `wege-waechter`, `a11y`, `daumen`, `seitengroesse`, `bedienregeln`) und alle Tests, die in ihrem Text nennen, was dieser Teil zeichnet. Gemeinsame Teile sind:
  - **nav**: Seitenleiste, Reiter, Mini-Leiste, Ort-Leiste, Seitenkopf, Brotkrumen und ihre Hilfsdateien (`src/lib/nav/…`, `PageHead`, `PathHead`, `Crumbs`, `Pfad`);
  - **fenster**: das Fenster-System (`Form`, Lösch-, Umbenennen-, Verschieben-Fenster, fester Fuss `daumen.css`, Hintergrund und Zurück-Taste, die Fenster in `src/lib/flow/`);
  - **stil**: `src/app.css` (nur die Wächter).
- Wie die abhängigen Tests gefunden werden: aus den Test-Dateien selbst, nicht aus einer von Hand gepflegten Liste. Ein Test zählt, wenn sein Text zum Teil passt (zum Beispiel `ptabs`, `.sheet`, `daumen`) oder wenn er eine **schmale Hilfsdatei** einbindet, die so etwas enthält (`placetab.js`, `newbutton.js`). Hilfsdateien, die fast jeder Test einbindet (`settle.js`, `clock.js`; Grenze 60 Tests, `HELPER_MAX`), zählen nicht, sonst liefe alles.
- Beispiel Seitenleiste: rund 70 Tests (vier Teile) statt dem Kern allein. Beispiel Fenster-System: rund 50 Tests (drei Teile). Beide Teile zusammen: höchstens fünf Teile wie bisher.
- Der Lauf zeigt in der Ausgabe `shared=nav,fenster`, welche Teile er erkannt hat.

## Warum
Die 20 roten Tests der Nacht auf den 26.11. kamen fast alle von bewussten Umbauten an gemeinsamen Teilen: Seitenleiste (PR 1759, fünf Tests: `ausstattung`, `taschen-setups`, `setup-rig`, `velos-material-bereich`, `head`), fester Fenster-Fuss (PR 1762, `daumen`). Die PRs liefen nur den Kern, weil die Landkarte (`ci-map.mjs`) eine Datei, die jede Seite lädt, nicht eingrenzen kann. Die abhängigen Tests anderer Bereiche wurden erst nachts rot. Ein Test (`tests/ci-scope.test.js`) prüft, dass diese Tests mit der neuen Auswahl im PR gelaufen wären.

## Was fällt weg oder rutscht tiefer
- Nichts. Es laufen im PR mehr Tests, nie weniger; ein PR mit gemeinsamem Teil braucht dafür etwa 5 bis 10 Minuten länger. Die Auswahl für alle anderen PRs bleibt gleich.

## Selbst entschieden
- Der Teil **stil** (`app.css`) zieht nur die Wächter nach, keine Tests nach Text: ein Wort wie `.side` im Test sagt über eine globale Stilregel nichts aus.
- `seitengroesse` und `bedienregeln` zählen zu den Wächtern, weil sie über viele Seiten laufen.
- Heute noch **nicht** erfasst: `App.svelte` (Seiten-Liste) und die Dateien der Anfangsladung; sie bleiben beim Kern. Eine neue Seite in `PAGES` soll nicht jedes Mal die Seitenleisten-Tests starten.
- Schritt 2 des Plans (Alltagswege in jeden PR) braucht hier nichts: die Dateien kommen als Kern-Dateien in `CORE_SPECS`, sobald sie fertig sind.

## Entscheide (eigene Datei `docs/decisions/pr-auswahl-gemeinsame-teile.md`)
- 26.11.2026: Test-Plan Schritt 5 (Noah «1-8»).

## Stand im Plan
- Test-Plan «Tests auf den neuen App-Stand bringen», Schritt 5: umgesetzt. Die Regel für `docs/regeln.md` Block 7 trägt der Regeln-Thread nach dem Merge ein.
