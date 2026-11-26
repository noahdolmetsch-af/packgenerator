# Tests: die Landkarte

Noah «1-8» 26.11.2026 (Thread «Tests auf den neuen App-Stand bringen»): Die Tests wurden Bauschritt für Bauschritt geschrieben, nicht nach dem Alltag. Diese Seite sagt, welche Testarten es gibt, in welche **vier Etagen** sie gehören, welche **Bereiche** sie abdecken und wie wir sie Schritt für Schritt auf den heutigen Stand bringen. Der Plan mit Zahlen und Begründung steht im Thread; die Regeln für das Arbeiten mit Tests stehen in `docs/regeln.md` (Block 7) und `CLAUDE.md`.

**Die Zahlen** (Dateien, Fälle, alte Namen, feste Wartezeiten) stehen absichtlich nicht hier, sie ändern sich mit jedem PR. Sie kommen aus dem Skript:

```
node scripts/test-landkarte.mjs            # Tabelle je Bereich
node scripts/test-landkarte.mjs --liste    # jede Datei mit Bereich, Etage und Merkmalen
node scripts/test-landkarte.mjs --json     # alles als JSON
```

Das Skript ändert und löscht nichts. Es ordnet jede Datei in `tests/*.test.js` und `tests/e2e/**/*.spec.js` einem Bereich zu, zuerst nach dem Dateinamen, sonst nach der Adresse (`#/trips …`), die sie am häufigsten öffnet. Was es nicht zuordnen kann, steht unter «Sonstiges»; dafür bekommt es später eine Zeile in `AREAS` (`scripts/test-landkarte.mjs`).

## Die vier Etagen

| Etage | Was | Prüft vor allem | Wo | Wann |
| --- | --- | --- | --- | --- |
| 1 Alltagswege | je ein Test pro Weg, den Noah wirklich geht (Heute, Mein Tag, Wi gaht's, Packen, Gipfelbuch …) | Klarheit: der Weg gelingt, ohne zu stecken, mit Absprung am Ende | kommt mit Schritt 2 | jeder PR; nachts zu vier Tageszeiten |
| 2 Wächter | prüfen die ganze App: `guard`, `flow`, `tippzahl`, `functions`, `heimat`, `tote-knoepfe`, `seitengroesse`, `fenster-nie-abgeschnitten`, `wege-waechter`, `a11y`, dazu Gesamttest, Nacht-Rundgang, Live-Check | Klarheit und Auffindbarkeit für jede Seite: ein Titel, nie abgeschnitten, höchstens 3 Tipps, kein toter Knopf | `tests/e2e/` | die ersten sechs in jedem PR; alles nachts |
| 3 Bereichstests | Browser-Tests je Bereich der App | was ein Bereich leistet, am Ergebnis gemessen | `tests/e2e/*.spec.js` | im PR die Dateien der geänderten Seite; nachts alle |
| 4 Unit-Tests | Rechenlogik, Daten, Regel-Wächter (App-Stand, Gruppen, Regeln-Doku) | Richtigkeit der Zahlen und Daten | `tests/*.test.js` | jeder PR |

## Die Bereiche

Jede Test-Datei gehört zu genau einem Bereich. Die Bereiche folgen den Zeilen in `docs/app-stand.md`:

- Tests, Regeln und Doku
- Sprache, Wissen und Neuigkeiten
- Assistent und KI
- Erinnerungen und Push
- Mein Tag
- Heute
- Wi gaht's und Fragen
- Packen
- Kleider
- Gipfelbuch und Rückblick
- Unterwegs und Karte
- Touren
- Auswerten und Analyse
- Training, Woche und Challenge
- Velos und Pflege
- Material
- Wetter
- Rennen
- Suche und Finden
- Ich, Daten und Sicherung
- Verbindungen
- Kurse und Bezahlen
- Notizen, Dokumente und Eingang
- Neuland, Träume und Abenteuer
- Gruppen, Freunde und Mini-Apps
- Kochen und Alltag
- Aussehen und Bedienung
- Ganze App (Gesamttest, Nacht-Rundgang, Live-Check)
- Sonstiges (noch nicht zugeordnet)

## Was die Merkmale bedeuten

- **Alt:** der Dateiname stammt aus der Zeit der Bauschritte (`v0510`, `ap21`, `pf`, `sn5plus` …) oder der Kopf der Datei nennt eine Version wie «v0.49.0». Solche Dateien sagen nicht, welcher Teil der App geprüft wird; sie kommen zuerst an die Reihe (Schritt 6).
- **Feste Wartezeiten:** Aufrufe von `waitForTimeout`. Die Regel lautet: auf den Zustand warten, nie auf Zeit. Die Zahl soll nur sinken (Schritt 4).
- **Liest Quelltext:** ein Unit-Test, der den Quelltext der App als Text liest und mit Mustern darin sucht. Bricht bei einer Umbenennung, auch wenn die App heil ist. Gute Wächter (App-Stand, Gruppen, Regeln-Doku) bleiben; die übrigen werden durch Verhaltens-Tests ersetzt, wo das geht.

## Der Plan (Noah «1-8» 26.11.2026)

Jeder Schritt ist ein eigener PR. Bis Schritt 6 wird nichts Altes entfernt. **Regel 6 bleibt:** Kein Test wird gelockert oder übersprungen; ein alter Test geht erst, wenn ein neuer dieselbe Aussage mindestens so scharf prüft und Noah für den Bereich Ja gesagt hat.

| Nr. | Schritt | Stand |
| --- | --- | --- |
| 1 | Test-Landkarte (diese Seite und das Skript) | dieser PR |
| 2 | Alltagswege: zuerst Heute, Mein Tag, Wi gaht's, Packen, Gipfelbuch, dann die übrigen sieben; je Weg ein PR, nur neue Tests | offen |
| 3 | Eine Adressliste aus der App für alle Wächter; Fenster-Test mit vier Uhrzeiten in den Nachtlauf | offen |
| 4 | Hürden: keine neuen festen Wartezeiten, Bereich im Kopf jeder Datei, Skript «welche Tests nennen diese Seite» | offen |
| 5 | PR-Auswahl: gemeinsame Teile (Seitenleiste, Fenster-System, Kopf) lösen Wächter und abhängige Bereichstests aus | offen |
| 6 | Bereich für Bereich zusammenführen, mit Tabelle «alt → neu»; Noah gibt jeden Bereich mit Knopf frei | offen |
| 7 | Der Design-Blick von impeccable täglich als nächtlicher Bericht im Repo (kein Rot) | offen |
| 8 | Die Test-Regeln in `docs/regeln.md` (Block 7) mit Datum und Quelle eintragen | offen |

Entscheide dazu: `docs/decisions/tests-neu-aufsetzen.md`.
