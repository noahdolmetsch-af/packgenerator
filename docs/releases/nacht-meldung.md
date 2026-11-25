# Nachtlauf: Morgenmeldung, Start am Abend, Teil 1 nicht mehr zu gross; «Ausprobieren» im PR kürzer

PR #<Nummer> · 24.11.2026 · Auftrag: Noah «a-c alle», Punkt c «Nachtlauf» (Thread «Tests schneller machen»), dazu die Meldung des Wackel-Threads über Teil 1

## Was ist neu
- Der Nachtlauf (`volle-pruefung.yml`: alle Browser-Tests auf Handy und Computer plus Gesamttest, jede Nacht auf main) schreibt am Ende **eine Zeile** in ein dauerhaftes Issue «Nacht-Meldung …» (Label `nacht-meldung`). Der Titel sagt «alles grün» oder «ROT» mit Datum. Der Text nennt bei Rot die roten Tests (die neuen zuerst, höchstens fünf), die Wackel-Tests, das Ergebnis des Rundgangs und den Link zum Lauf (`scripts/nacht-meldung.mjs`).
- Das Issue wird jede Nacht **überschrieben**, es gibt keinen Kommentar und damit keine Mail. Die Mail bei **neu** rot bleibt wie bisher (Issue «Volle Prüfung: ein Test ist rot»).
- Der Nachtlauf und der Rundgang starten jetzt **abends** (21:17 und 20:37 UTC). Die geplanten Läufe kamen bisher nicht um 02:07 und 01:37, sondern in den letzten 20 Nächten zwischen 08:39 und 10:31 UTC (einmal 12:21). Das Ergebnis lag deshalb erst mittags vor, nicht am Morgen.

- **Teil 1 des Nachtlaufs läuft nicht mehr ins Zeitlimit.** Er wurde seit Tagen (auf Handy und Computer) nach 45 Minuten abgebrochen, bevor er die Liste der roten Tests schrieb; deshalb konnte der Nachtlauf nie grün werden. Ursache: Playwright 1.65 schneidet die Teile nur nach der Zahl der Tests, Stück für Stück in der Reihenfolge der Dateien. «Ausprobieren» (`tests/e2e/ausprobieren.spec.js`: 85 Tests, jeder tippt 20 Zeilen von «Was ist neu», gemessen 1 bis 1,5 Minuten pro Test) liegt in einem Block ganz in Teil 1, das sind etwa 60 Minuten Arbeit bei 45 Minuten Limit. Die übrigen Teile brauchten 16 bis 31 Minuten.
- **Neu:** Die 7 Teile lassen «Ausprobieren» weg (`E2E_SKIP_AUSPROBIEREN`, `playwright.config.js`) und haben jetzt je rund 315 statt 328 Tests. «Ausprobieren» läuft als eigener Auftrag `ausprobieren` mit je 3 Teilen auf Handy und Computer (rund 28 Tests pro Teil, geschätzt 15 bis 25 Minuten). Der Bericht zählt den Auftrag mit (rot, wieder grün, Liste der roten Tests: jetzt 24 statt 18 Listen).

- **«Ausprobieren» im PR, wenn die Technik geändert wird** (Noah «a» auf der Karte vom 25.11.2026 01:03): Ein PR, der ändert, worauf die Zeilen laufen (Update-Liste, Go-Karte, `src/lib/know/`, den Ausprobieren-Test selbst, die Testhelfer, die «Was ist neu»-Seiten), tippt nicht mehr alle rund 1400 Zeilen, sondern die **neuesten 200 plus die Zeilen seiner eigenen News-Dateien**. Das sind 10 bis 11 statt 85 Teile (`scripts/ci-scope.mjs`, `NEWEST_LINES`; der Test liest den Wert `newest:200` aus `NEWS_ONLY`). Den Rest prüft der Nachtlauf. Das ändert Noahs Regel vom 03.11.2026 («bei geänderter Technik alle Zeilen»). Grund: PR 1640 («Frag Gemini», ändert `src/lib/know/`) lief dreimal ins Zeitlimit von Teil 1, weil alle 85 Teile in Teil 1 lagen.

## Was fällt weg oder rutscht tiefer
- Ein PR, der die Technik von «Ausprobieren» ändert, prüft nur noch die neuesten 200 und die eigenen Zeilen; die älteren Zeilen prüft erst der Nachtlauf (alter Weg: alle Zeilen im PR, neuer Weg: 200 + eigene im PR, alle in der Nacht).
- Sonst nichts. Der Nachtlauf prüft dasselbe wie vorher, nur zu einer anderen Uhrzeit; er prüft main so, wie es am Abend steht.

## Selbst entschieden
- Der Nachtlauf lief schon jede Nacht (und ist seit Wochen jede Nacht rot gewesen, mit Vergleich zur Vorhernacht). Neu ist nur die Meldung und die Startzeit.
- Ein dauerhaftes Issue, das überschrieben wird, statt jeden Tag ein neues: so gibt es einen festen Ort zum Nachlesen (`GET /repos/…/issues?labels=nacht-meldung`, auch ohne Anmeldung) und keine Mail-Flut.
- Der Start am Abend ist ein Versuch: Zeigt die erste Nacht, dass GitHub auch dann Stunden später startet, bis nach 08:00, wird der Lauf stattdessen vom Wächter-Lauf (02:17 UTC, kam in den letzten Tagen pünktlich) angestossen. Das beurteile ich am 25.11. mit der ersten Morgenmeldung.
- Kein Limit eines Tests wurde erhöht und kein Test gelockert: alle 85 Teile tippen weiter alle Zeilen, mit ihrem Limit von 5 Minuten pro Teil. Es gibt nur mehr Rechner für denselben Test (6 zusätzliche Aufträge, der Nachtlauf hat jetzt 24 statt 18).
- Die PR-Läufe sind davon nicht betroffen (sie tippen nur die Zeilen der eigenen News-Dateien).
- Kosten: keine (öffentliches Repository, nur `GITHUB_TOKEN`). Wenn der Lauf wirklich am Abend startet, belegt er eine Stunde lang bis zu 18 der 20 Rechner. Abends nach 22 Uhr ist die Prüfung der PRs ruhiger, zu spüren wäre es sonst nur beim Warten.

## Entscheide (eigene Datei `docs/decisions/nacht-meldung.md`)
- 24.11.2026: Nachtlauf mit Morgenmeldung (Noah «a-c alle», Punkt c).

## Stand im Plan
- Stau-Regeln, Punkt «Nachtlauf als Netz»: Meldung eingerichtet, Startzeit wird nach der ersten Nacht bestätigt.

## Prüfschritte (nach dem Merge)
1. Am nächsten Morgen: in GitHub unter «Issues» das Issue «Nacht-Meldung …» öffnen (Label `nacht-meldung`): Titel mit Datum und «alles grün» oder «ROT», darunter eine Zeile.
2. In der Übersicht «Actions» › «Volle Prüfung» steht der Start der Nacht: er sollte vor 08:00 liegen.
3. Im selben Lauf: «e2e-part (phone, 1)» und «e2e-part (desktop, 1)» laufen nicht mehr ins Zeitlimit (Abbruch nach 45 Minuten), und die sechs Aufträge «ausprobieren» sind fertig.
