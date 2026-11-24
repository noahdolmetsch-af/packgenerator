# Nachtlauf: jeden Morgen eine kurze Meldung, grün oder rot

PR #<Nummer> · 24.11.2026 · Auftrag: Noah «a-c alle», Punkt c «Nachtlauf» (Thread «Tests schneller machen»)

## Was ist neu
- Der Nachtlauf (`volle-pruefung.yml`: alle Browser-Tests auf Handy und Computer plus Gesamttest, jede Nacht auf main) schreibt am Ende **eine Zeile** in ein dauerhaftes Issue «Nacht-Meldung …» (Label `nacht-meldung`). Der Titel sagt «alles grün» oder «ROT» mit Datum. Der Text nennt bei Rot die roten Tests (die neuen zuerst, höchstens fünf), die Wackel-Tests, das Ergebnis des Rundgangs und den Link zum Lauf (`scripts/nacht-meldung.mjs`).
- Das Issue wird jede Nacht **überschrieben**, es gibt keinen Kommentar und damit keine Mail. Die Mail bei **neu** rot bleibt wie bisher (Issue «Volle Prüfung: ein Test ist rot»).
- Der Nachtlauf und der Rundgang starten jetzt **abends** (21:17 und 20:37 UTC). Die geplanten Läufe kamen bisher nicht um 02:07 und 01:37, sondern in den letzten 20 Nächten zwischen 08:39 und 10:31 UTC (einmal 12:21). Das Ergebnis lag deshalb erst mittags vor, nicht am Morgen.

## Was fällt weg oder rutscht tiefer
- nichts. Der Nachtlauf prüft dasselbe wie vorher, nur zu einer anderen Uhrzeit; er prüft main so, wie es am Abend steht.

## Selbst entschieden
- Der Nachtlauf lief schon jede Nacht (und ist seit Wochen jede Nacht rot gewesen, mit Vergleich zur Vorhernacht). Neu ist nur die Meldung und die Startzeit.
- Ein dauerhaftes Issue, das überschrieben wird, statt jeden Tag ein neues: so gibt es einen festen Ort zum Nachlesen (`GET /repos/…/issues?labels=nacht-meldung`, auch ohne Anmeldung) und keine Mail-Flut.
- Der Start am Abend ist ein Versuch: Zeigt die erste Nacht, dass GitHub auch dann Stunden später startet, bis nach 08:00, wird der Lauf stattdessen vom Wächter-Lauf (02:17 UTC, kam in den letzten Tagen pünktlich) angestossen. Das beurteile ich am 25.11. mit der ersten Morgenmeldung.
- Kosten: keine (öffentliches Repository, nur `GITHUB_TOKEN`). Wenn der Lauf wirklich am Abend startet, belegt er eine Stunde lang bis zu 18 der 20 Rechner. Abends nach 22 Uhr ist die Prüfung der PRs ruhiger, zu spüren wäre es sonst nur beim Warten.

## Entscheide (eigene Datei `docs/decisions/nacht-meldung.md`)
- 24.11.2026: Nachtlauf mit Morgenmeldung (Noah «a-c alle», Punkt c).

## Stand im Plan
- Stau-Regeln, Punkt «Nachtlauf als Netz»: Meldung eingerichtet, Startzeit wird nach der ersten Nacht bestätigt.

## Prüfschritte (nach dem Merge)
1. Am nächsten Morgen: in GitHub unter «Issues» das Issue «Nacht-Meldung …» öffnen (Label `nacht-meldung`): Titel mit Datum und «alles grün» oder «ROT», darunter eine Zeile.
2. In der Übersicht «Actions» › «Volle Prüfung» steht der Start der Nacht: er sollte vor 08:00 liegen.
