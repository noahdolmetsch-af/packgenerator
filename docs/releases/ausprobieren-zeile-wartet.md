# Ausprobieren-Test: jede Zeile wartet auf ihre eigene «Neu hier»-Zeile

PR #<Nummer> · 21.11.2026 · Auftrag: Hinweis aus dem Thread «Training erfassen» (PR 1345 blieb dreimal an `ausprobieren.spec.js` «part 15» hängen), Thread «Wackel-Tests auf main reparieren»

## Was ist neu
- Nichts in der App, nur Testcode (`tests/e2e/ausprobieren.spec.js`) und der «Wo»-Satz einer alten News-Zeile (0.582.0).
- **Ursache:** Der Test tippt viele Zeilen von «Was ist neu» nacheinander in einer Seite. Zwischen den Zeilen wechselt nur der Teil nach `#` der Adresse, die Seite bleibt dieselbe. Die Zeile «Neu hier: …» (`.spot-note`) bleibt aber 8 Sekunden stehen. So bestand die nächste Zeile den Test sofort, mit der Zeile der vorigen. Bei den drei «Beat your ghost»-Zeilen sucht die App zuerst die Fahrten in der Datenbank und öffnet dann Training. Das ging dann noch während der nächsten Zeile und holte die Seite zu Training, kurz nachdem der Test nach «Was ist neu» gegangen war: «nothing lit on …» oder das Suchfeld kam nie. Auf einem langsamen Rechner (GitHub) trifft das öfter und an wechselnden Stellen, je nachdem wo ein Teil beginnt (ein PR mit News-Datei schiebt alle Zeilen um eine Stelle).
- **Fix:** Vor jedem Tippen entfernt der Test eine stehengebliebene «Neu hier»-Zeile. Jede Zeile muss ihre eigene Zeile oder ihren eigenen Glanz zeigen, wie es der Test immer sagen wollte. Nichts wird gelockert.
- **Zweite Ursache (der Fehler, der in CI immer wieder dieselbe Zeile traf):** Seit #1305 («Auswerten: fünf Reiter nach Frage») stehen auf dem Handy alle fünf Reiter von Auswerten nebeneinander, den Knopf «Alle n» (`nav.ptabs .pmore`) gibt es dort nicht mehr. Die alte News-Zeile 0.582.0 («Auf dem Handy zeigt «Alle n» in Auswerten die Seiten in drei Gruppen») zielte aber genau darauf: «nothing lit on /auswerten». Das war kein Wackler, sondern eine Folge von #1305. Die Zeile führt jetzt mit einem Satz («Wo») zu Auswerten und sagt, wie es jetzt aussieht (`src/lib/news/auswerten-gruppen.js`, Text und Deutsch). Der Test selbst bleibt unverändert streng.

## Was fällt weg oder rutscht tiefer
- nichts.

## Selbst entschieden
- Keine «Was ist neu»-Datei, weil nichts Sichtbares ändert; `docs/app-stand.md` bleibt.
- Der Test-Fix bleibt im Test. Ob die App eine Zeile aus einem früheren Tipp nach einem Seitenwechsel löschen soll, ist keine Fehlerbehebung (die Zeile ist nur 8 Sekunden da).

## Entscheide (für decisions.md)
- keine neuen.

## Stand im Plan (roadmap.md / vorhaben.md)
- keine Änderung.

## Prüfschritte (nach dem Merge)
1. In GitHub: «Volle Prüfung» (Nachtlauf) zeigt `ausprobieren.spec.js` in allen Teilen grün.
2. PRs mit News-Datei (zum Beispiel 1345) laufen im Handy-Test Teil 1 ohne «nothing lit».
