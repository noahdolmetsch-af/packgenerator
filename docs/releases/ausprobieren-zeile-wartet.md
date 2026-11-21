# Ausprobieren-Test: jede Zeile wartet auf ihre eigene «Neu hier»-Zeile

PR #<Nummer> · 21.11.2026 · Auftrag: Hinweis aus dem Thread «Training erfassen» (PR 1345 blieb dreimal an `ausprobieren.spec.js` «part 15» hängen), Thread «Wackel-Tests auf main reparieren»

## Was ist neu
- Nichts in der App; nur Testcode (`tests/e2e/ausprobieren.spec.js`).
- **Ursache:** Der Test tippt viele Zeilen von «Was ist neu» nacheinander in einer Seite. Zwischen den Zeilen wechselt nur der Teil nach `#` der Adresse, die Seite bleibt dieselbe. Die Zeile «Neu hier: …» (`.spot-note`) bleibt aber 8 Sekunden stehen. So bestand die nächste Zeile den Test sofort, mit der Zeile der vorigen. Bei den drei «Beat your ghost»-Zeilen sucht die App zuerst die Fahrten in der Datenbank und öffnet dann Training. Das ging dann noch während der nächsten Zeile und holte die Seite zu Training, kurz nachdem der Test nach «Was ist neu» gegangen war: «nothing lit on …» oder das Suchfeld kam nie. Auf einem langsamen Rechner (GitHub) trifft das öfter und an wechselnden Stellen, je nachdem wo ein Teil beginnt (ein PR mit News-Datei schiebt alle Zeilen um eine Stelle).
- **Fix:** Vor jedem Tippen entfernt der Test eine stehengebliebene «Neu hier»-Zeile. Jede Zeile muss ihre eigene Zeile oder ihren eigenen Glanz zeigen, wie es der Test immer sagen wollte. Nichts wird gelockert.

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
