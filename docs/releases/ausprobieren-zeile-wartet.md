# Ausprobieren-Test: jede Zeile wartet auf ihre eigene «Neu hier»-Zeile

PR #<Nummer> · 21.11.2026 · Auftrag: Hinweis aus dem Thread «Training erfassen» (PR 1345 blieb dreimal an `ausprobieren.spec.js` «part 15» hängen), Thread «Wackel-Tests auf main reparieren»

## Was ist neu
- Nichts in der App; nur Testcode (`tests/e2e/ausprobieren.spec.js`).
- **Ursache:** Der Test tippt viele Zeilen von «Was ist neu» nacheinander in einer Seite. Zwischen den Zeilen wechselt nur der Teil nach `#` der Adresse, die Seite bleibt dieselbe. Die Zeile «Neu hier: …» (`.spot-note`) bleibt aber 8 Sekunden stehen. So bestand die nächste Zeile den Test sofort, mit der Zeile der vorigen. Bei den drei «Beat your ghost»-Zeilen sucht die App zuerst die Fahrten in der Datenbank und öffnet dann Training. Das ging dann noch während der nächsten Zeile und holte die Seite zu Training, kurz nachdem der Test nach «Was ist neu» gegangen war: «nothing lit on …» oder das Suchfeld kam nie. Auf einem langsamen Rechner (GitHub) trifft das öfter und an wechselnden Stellen, je nachdem wo ein Teil beginnt (ein PR mit News-Datei schiebt alle Zeilen um eine Stelle).
- **Fix:** Vor jedem Tippen entfernt der Test eine stehengebliebene «Neu hier»-Zeile. Jede Zeile muss ihre eigene Zeile oder ihren eigenen Glanz zeigen, wie es der Test immer sagen wollte. Nichts wird gelockert.
- **Zweite Ursache (der Fehler, der in CI immer dieselbe Zeile traf):** Seit #1305 («Auswerten: fünf Reiter nach Frage») stehen auf dem Handy alle fünf Reiter von Auswerten nebeneinander, den Knopf «Alle n» (`nav.ptabs .pmore`) gibt es dort nicht mehr. Die alte News-Zeile 0.582.0 zielte genau darauf: «nothing lit on /auswerten». Das war kein Wackler, sondern eine Folge von #1305. Ein anderer PR hat der Zeile inzwischen einen «Wo»-Satz gegeben (auf main); dieser PR ändert die News-Datei nicht.

- **Dritter Punkt (Teil 26, einmal «lit but not on screen», auf dem zweiten Versuch grün):** Der Test las die Lage des leuchtenden Ortes nach genau 1 s. Läuft das Scrollen auf einem langsamen Rechner noch, stand der Ort kurz ausserhalb. Jetzt wartet der Test bis zu 1,2 s länger (immer noch innerhalb der 3 s Glanz) und liest dann. Ein Ort, der nie auf den Bildschirm kommt, bleibt ein Fund.

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
