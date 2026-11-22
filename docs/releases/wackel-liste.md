# Wackel-Test-Liste: Tests, die nur beim zweiten Versuch grün sind, kommen auf eine Liste

Auftrag: Noah «2, 1, 4», Schritt 4 («jeder Test, der ohne Grund rot ist, wird innerhalb eines Tages repariert statt neu gestartet»), Thread «Prüfungen so einrichten, dass main grün bleibt»

Kein sichtbarer Unterschied in der App. Es ändert sich nur der Nachtlauf auf GitHub.

## Was ist neu
- **Die Nacht merkt sich Wackler.** Ein Test, der beim ersten Versuch rot und beim zweiten grün ist («flaky»), ging bisher unter (nur eine Zeile im Bericht, dann vergessen). Jetzt schreibt jeder Teil des Nachtlaufs die Namen seiner Wackler auf (`scripts/test-summary.mjs`, 5. Angabe), und der Bericht zählt die Nächte pro Test (`scripts/wackel-liste.mjs`). Die Liste lebt als Datei zwischen den Läufen (7 Tage).
- **Wer an zwei Nächten wackelt, ist ein Arbeitsauftrag.** Dann öffnet GitHub das Issue «Wackel-Tests: Ursache reparieren» (Label `wackel-test`) mit der Liste (Test, Nächte, seit wann). Ein Test, der nur einmal wackelt, wird nur beobachtet (steht im Bericht, kein Issue, keine Mail).
- **Mails sparsam:** Eine Mail kommt, wenn das Issue entsteht, und danach nur, wenn ein weiterer Test zum zweiten Mal wackelt. Jede Nacht wird die Liste im Issue stillschweigend aktualisiert. Wackelt keiner mehr (eine Woche nichts), schliesst sich das Issue.
- **Die Regel dazu:** Ein Wackler wird innerhalb eines Tages mit einem kleinen PR repariert (Ursache suchen: eine falsche Wartebedingung, eine Uhr, eine Reihenfolge), nicht neu gestartet und nicht ausgeschaltet. Heute so gefunden und repariert: S6 (Backup-Test), `templates` («Weiter»), PF16 («Vorhersage holen»), Zoom-Schrittbalken.

## Was fällt weg oder rutscht tiefer
- Nichts.

## Selbst entschieden
- **Nur die Nacht, nicht die PR-Läufe:** Die Nacht führt alle Tests aus und ist ruhig (kein Wettlauf um die Rechner). In PR-Läufen steht ein Wackler weiter nur im Bericht des Laufs. Falls das nicht reicht, kommt die Sammlung aus PR-Läufen als eigener PR.
- **Zwei Nächte statt einer** für das Issue: Ein einzelner Wackler unter Last (zum Beispiel `guard` unter drei Rechnern gleichzeitig) ist oft Zufall. Zwei Nächte sind ein Muster.
- **Eine Woche Ruhe** schliesst das Issue, 14 Tage ohne Wackeln nimmt einen Test von der Liste.
- Wer die Liste abarbeitet, ist heute dieser Thread bzw. der Thread, der die Seite des Tests baut. Soll das als täglicher Auftrag laufen, sag es; es braucht dann eine geplante Aufgabe.

## Entscheide (für decisions.md)
- 21.11.2026: Wackler werden gezählt und an der zweiten Nacht ein Arbeitsauftrag (Noah «4»).

## Stand im Plan (roadmap.md / vorhaben.md)
- Ziel «Eine App, die mich im Alltag unterstützt»: main bleibt grün. Noah «2, 1, 4»: Rundgang (#1353), Fehler-Melder (#1360), Wackel-Test-Liste (dieser PR). Danach: die 43 alten Tests prüfen (Noah «4a», nichts ohne dein ok löschen).

## Prüfschritte
Nichts Sichtbares. Nach dem Merge, am Morgen: Actions › «Volle Prüfung» › Zusammenfassung zeigt unten «Wackel-Tests» («Kein Test hat heute gewackelt» oder «Heute zum ersten Mal gewackelt …»). Ein Issue gibt es erst, wenn ein Test an der zweiten Nacht wackelt.
