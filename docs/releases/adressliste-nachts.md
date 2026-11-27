# Eine Adressliste: Gesamttest-Seiten und Rundgang nachts über alle Seiten

PR #1843 · 26.11.2026 · Auftrag: Noah «1-8» zum Test-Plan «Tests auf den neuen App-Stand bringen», Schritt 3 (Thread «Gesamttest der ganzen App»)

## Was ist neu
- Nichts Sichtbares geändert, nur Tests und der Nachtlauf (keine App-Datei).
- **Gesamttest-Seiten** (`tests/e2e/gesamttest/alle-seiten.spec.js`, von PR 1689 übernommen und scharf gestellt): öffnet jede Adresse aus dem Code, die Runde 1 nicht kennt (heute 224), mit den grossen erfundenen Daten plus Fitbit-, Strava-, Flow- und Check-Schicht (`aktivLayer` in `tests/fixtures/gesamttest/make.mjs`). Bekannte Funde stehen je Seite und je Prüfung in `KNOWN` (die Prüfung wird gemessen und als «bekannt» vermerkt, nicht gefordert; die Zeile wird bei der Reparatur gelöscht). Prüft Konsolenfehler, Seitwärts-Scrollen, abgeschnitten, Wort mitten getrennt, Knopf ohne Namen, Englisch im Deutschen, Ladezeit und «Seite nicht gefunden». Handy 390 und 320, Computer 1366; Deutsch (Englisch von Hand mit `GTP_LANGS=de,en`).
- **Rundgang** startet mit allen Adressen der Liste und folgt danach den Links (Obergrenze 700 statt 400 je Gerät).
- **Eine Liste:** `adressen()` in `tests/e2e/wege-lib.js` (Quelltext der App, ohne Gäste-Seiten). Eine neue Seite wird so ohne Handarbeit mitgeprüft. `guard` prüft zusätzlich, dass jede Seite seiner Handliste noch in dieser Liste steht.
- **Nachtlauf:** der Auftrag «Gesamttest» hat 6 statt 2 Teile je Gerät (`volle-pruefung.yml`), die Zahl der erwarteten Listen im Bericht steigt von 24 auf 32 (Test `ci-image.test.js` angepasst).
- **Lokal auf main (27.11.2026, nach PR 1826):** Seitentest Computer 224 von 224 grün in 15 Min, Handy 224 Fälle in 19 Min: 222 wie erwartet, 2 Überraschungen (C9 trat einmal nicht auf, C11 ist neu), beide wackeln; darum gilt «bekannt» je Prüfung und nicht «Seite erwartet rot». Fünf Handy-Seiten haben bekannte Funde: C6 (lange Tournamen in Analyse-Listen abgeschnitten, 2 Seiten), C9 (Körperwerte bei 320 px zu breit nach Wechsel von 390, wackelt, 2 Seiten) und neu C11 (Ich › Alltag bei 320 px: «Einkaufsliste» mitten im Wort getrennt, wackelt). Rundgang Computer 700 Adressen in 7 Min, Handy 700 in 6 Min, beide ohne Fund. Der erste Fund des Rundgangs, C10 (Packen › Vorschlag auf Englisch), ist inzwischen repariert (PR «Packvorschlag auf Deutsch»).

## Was fällt weg oder rutscht tiefer
- nichts. Nichts Altes entfernt, nichts gelockert.

## Selbst entschieden
- Englisch im Seitentest nur von Hand (Zeit): die Deutsch-Läufe zeigen, ob eine Seite in Ordnung ist; Englisch bleibt per `GTP_LANGS`.
- `guard` bekommt keine zweite, grosse Liste: 204 weitere Adressen in jedem PR bei 3 Breiten zu messen wäre langsam und bräuchte eine neue Grundlinie von Hand. Er prüft dafür nur noch gegen die Liste, dass seine Seiten noch existieren; den Rest messen Gesamttest und Rundgang nachts.
- `functions` bleibt, wie es ist: es liest seine 16 Funktionen schon aus `src/lib/home/fnlist.js`.
- PR 1689 (der Vorläufer) ist damit überholt; sein Inhalt ist hier ohne GTP_ALLE-Sperre und mit angepasster Zählung (`kmBook`: mindestens 42 statt genau 42, die App legt beim Start 4 dazu).

## Entscheide (eigene Datei `docs/decisions/adressliste-nachts.md`)
- 26.11.2026: eine Adressliste für Gesamttest, Rundgang und guard (Noah «1-8»).

## Stand im Plan (roadmap.md / vorhaben.md)
- Test-Plan Schritt 3: erledigt mit diesem PR (Fenster-Test: eigener PR vorher).

## Prüfschritte (nach dem Merge)
1. Am Morgen nach der ersten Nacht: Bericht lesen. Der Gesamttest läuft jetzt in 12 statt 4 Teilen; jeder Teil soll unter 30 Minuten bleiben. Rot dürfen nur neue Funde sein, die bekannten stehen in `KNOWN`.
