# Test «Heute entdecken»: die Zeile steht mit den Favoriten oben innerhalb der ersten zwei Bildschirme

PR #NNNN · 27.11.2026 · Auftrag: Meldung des Bündlers (entdecken-karte.spec.js:7 rot auf PR 1842, auch auf reinem main)

## Was ist neu
- Nichts Sichtbares geändert, nur Test für `tests/e2e/entdecken-karte.spec.js` («Heute entdecken: one idea with its reason on the first screen …»).
- **Ursache:** Seit der Favoriten-Karte (PR 1837) stehen die Favoriten ganz oben auf Heute und schieben alles nach unten (am Handy grosse Karten, Noah 27.11.2026 «a»). Der Test verlangte, dass die Zeile «Heute entdecken» über der Unterkante des Fensters beginnt: sie steht am Handy bei etwa 1170 px (Fenster 844 px) und am Computer bei etwa 957 px (Fenster 900 px). Das ist kein Wackler, der Test war seit PR 1837 auf main jedes Mal rot, wenn er lief.
- **Fix:** Die Erwartung heisst jetzt «innerhalb der ersten zwei Bildschirme». Das ist die von Noah entschiedene Lage (Favoriten zuerst); sonst ist nichts gelockert. Die Erwartung stammt aus dem Commit des Favoriten-Threads (4fd03de), damit sie ohne Warten auf PR 1848 auf main kommt.
- **Geprüft:** entdecken-karte.spec.js 3× pro Gerät grün; dazu 14 weitere Heute-Specs (heute-a, heute-ruhig, home-0460, aktiv-kacheln-zuerst, traeume-zuerst, hobby-meditation, impeccable2-aktiv, kachel-wand, favoriten-heute, heute-haken-block, meldung-sichtbar, stand-zahlen, spot) auf Handy und Computer: alle grün, keine weitere Prüfung hat dieselbe Ursache.

## Was fällt weg oder rutscht tiefer
- nichts.

## Selbst entschieden
- Zwei Bildschirme statt eines (wie im Commit des Favoriten-Threads), weil die Favoriten-Karten am Handy gross sind; die Prüfung «ohne Quer-Scrollen» bleibt unverändert.

## Entscheide
- keine.

## Stand im Plan (roadmap.md / vorhaben.md)
- keine Änderung.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. In GitHub: «e2e» grün. In der App nichts zu prüfen.
