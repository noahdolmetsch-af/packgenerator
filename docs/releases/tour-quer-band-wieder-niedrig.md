# Tour quer am Handy: das Band ist wieder niedrig

PR #1783 · 24.11.2026 · Auftrag: Regel 3 (Thread «Wackel-Tests zuverlässig machen»; Hinweis vom Velos-Thread; `landscape.spec.js:69`, Prüfung D6)

## Was ist neu
- Wenn das Handy quer gehalten wird (844×390 und ähnlich), war das Tour-Band (Name, Fakten, Schritte) 16 Pixel höher als vorgesehen. Auslöser: die Änderung «Velos: ruhiger Werkstatt-Knopf, Gehört-zu und Hilfe in einer Zeile» packte die Hilfezeile «Was du hier tun kannst» in eine Reihe (`.si-row`). Quer ist die Zeile ausgeblendet, ihre leere Reihe blieb aber als eigene Zeile im Band stehen (zusätzlicher Zeilenabstand).
- Jetzt wird die Reihe quer mitausgeblendet, wenn nur diese Zeile darin ist (`SeitenInhalt.svelte`). Die Reihe mit «Gehört zu …» (Velos am Handy) bleibt, wie sie ist.
- Aufrecht am Handy und am Computer ändert sich nichts.

## Was fällt weg oder rutscht tiefer
- nichts.

## Selbst entschieden
- Eine Zeile CSS statt Umbau der Reihe, damit die Velos-Seite unverändert bleibt.
- Kein «Was ist neu»-Eintrag: es stellt den früheren Stand wieder her (Patch-Nummer).

## Entscheide
- keine.

## Stand im Plan (roadmap.md / vorhaben.md)
- keine Änderung.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Handy quer halten, eine Tour öffnen: das Band mit Name, Fakten und den fünf Schritten ist niedrig, die Seite beginnt gleich darunter.
