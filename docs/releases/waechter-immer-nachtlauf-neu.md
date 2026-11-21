# Prüfungen: Wächter bei jedem PR, Nachtlauf meldet nur Neues, mehr Teile, Backup-Test repariert

PR #1329 · 21.11.2026 · Auftrag: Noah «d plus b» und «1a 2a 3a 4a» (Thread «Prüfungen so einrichten, dass main grün bleibt»)

Kein sichtbarer Unterschied in der App. Es ändern sich nur die Prüfungen auf GitHub.

## Was ist neu
- **d) Wächter bei jedem PR:** Ein PR mit App-Code führt jetzt immer vier app-weite Wächter-Tests mit aus, nicht nur die Tests seiner eigenen Seiten: `tippzahl` (jede Funktion höchstens 3 Taps von Heute), `functions` (alle 16 Funktionen erreichbar, Seite ohne Fehler), `heimat` (jede Funktion sichtbar auf ihrer Seite), `tote-knoepfe` (kein Knopf ohne Reaktion). `guard` und `flow` liefen schon immer mit. Grund: `tippzahl` wurde nach #1302 rot und blieb es unbemerkt, weil jeder PR nur seine eigenen Tests lief. Liste: `CORE_SPECS` in `scripts/ci-scope.mjs`.
- **b) Nachtlauf meldet nur Neues:** Den Nachtlauf der vollen Prüfung gab es schon (`volle-pruefung.yml`). Er war aber seit dem 3.11. jede Nacht rot; im einen alten Issue (#756) standen 21 Kommentare, und ein neuer Fehler ging zwischen den alten unter. Jetzt schreibt jeder Teil die Namen seiner roten Tests auf, und der Bericht vergleicht mit der Nacht davor (`scripts/nacht-vergleich.mjs`). Ein Kommentar mit Mail kommt nur noch, wenn etwas **neu** rot ist (beim ersten Vergleich einmal, danach nur Neues). Die Verdächtigen sind die PRs seit der letzten Nacht, nicht seit dem letzten grünen Lauf (der war 18 Tage her, «232 weitere»). Ein Teil, der das Zeitlimit erreicht, steht jetzt auch unter «Rot» (mit «Zeitlimit»).

- **Nachtlauf in 7 statt 5 Teilen (Noah «1a»):** In der Nacht auf den 21.11. brachen zwei von zehn Browser-Teilen nach 45 Minuten ab; ihre Tests wurden nie geprüft. Mit 7 Teilen je Handy und Computer ist jeder Teil kürzer. Kein Test fällt weg.
- **Backup-Test «Sichern, ersetzen, wieder sichern, zusammenführen» (Gesamttest S6) wieder grün (Noah «2a»):** Er war im Nachtlauf vom 21.11. rot (Handy und Computer). Die App war in Ordnung, es ging nichts verloren. Zwei Fehler im Test selbst: (1) Er machte seine «gespeicherten Daten» zu früh, bevor die App ihre eigenen Zeilen fertig geschrieben hatte (Meditations-Vorlagen, Sprüche-Gedächtnis von Heute); die Sicherung enthielt sie, der Vergleich nicht. Jetzt wartet der Test, bis sich die Daten nicht mehr ändern, und vergleicht erst dann. (2) Heute merkt sich bei jedem Anzeigen den zuletzt gezeigten Spruch (`home.spruch`, `recent`, seit #1246); zwei Sicherungen nacheinander sind darum in dieser einen Liste verschieden. Der Test lässt diese Liste beim Vergleich der beiden Sicherungen weg, alles andere (Ton, ausgeschaltete Sprüche) wird weiter verglichen.

## Was fällt weg oder rutscht tiefer
- Nichts in der App.
- Der Nachtlauf kommentiert nicht mehr jede Nacht, wenn alles beim Alten rot ist (vorher: jede Nacht ein Kommentar mit derselben Liste). Neu rot kommt weiter sofort, grün schliesst das Issue wie bisher.

## Selbst entschieden
- Die vier Wächter laufen mit den Handy-Tests (nach Noahs «ok»-Label), nicht schon vorher: sie laufen nur auf dem Handy. Vor dem «ok» läuft weiter der Wächter auf dem Computer (`guard`).
- `seitengroesse` (Seitengrösse, Computer) gehört in dieselbe Liste, ist aber heute auf main rot (`#/me/abfragen`: 3719 statt 2420 Elemente). Er kommt in den Computer-Check jedes PRs, sobald main darauf wieder grün ist, sonst würde jeder PR rot.
- Die 43 Browser-Tests mit Namen aus der Anfangszeit (v0510, sn2plus …) bleiben, bis Noah die Liste im Projektordner geprüft hat (Noah «4a»); nichts gelöscht.
- Ein PR, der nur Doku, News-Dateien oder deutsche Texte ändert, führt weiter keinen Browser-Test aus (nichts, das die App verändert).
- Die Nacht-Liste hält 7 Tage (Artefakt `rot-liste`, wenige Zeilen), damit ein ausgefallener Lauf den Vergleich nicht kaputt macht. Kein Geld, kein Secret.
- `docs/app-stand.md` bleibt unverändert: es steht dort nur, was die App kann; die Prüfungen stehen in `docs/technik-handbuch.md` (angepasst).

## Entscheide (für decisions.md)
- 21.11.2026: Die app-weiten Wächter laufen bei jedem App-PR mit (Noah «d plus b»; Grund: unbemerkt rotes `tippzahl` auf main).
- 21.11.2026: Der Nachtlauf meldet nur neu Rotes (Noah «d plus b»; Grund: 18 Nächte Dauer-Rot, neue Fehler gingen unter).

## Stand im Plan (roadmap.md / vorhaben.md)
- Ziel «Eine App, die mich im Alltag unterstützt»: main bleibt grün. Danach in dieser Reihenfolge (Noah «2, 1, 4»): Rundgang auf der echten Seite, Fehler-Melder in der App, Wackel-Test-Liste.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Auf GitHub unter Actions den nächsten PR mit App-Änderung ansehen: im Handy-Test stehen jetzt auch `tippzahl`, `functions`, `heimat`, `tote-knoepfe`.
2. Am Morgen nach dem Merge: Actions › «Volle Prüfung» › Zusammenfassung. Oben steht «Erster Vergleich …». Am Morgen danach nur noch «Neu rot …» oder «Nichts Neues rot».
