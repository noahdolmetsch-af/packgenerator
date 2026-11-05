# Kuhglocken am Logo

PR (diese Änderung) · 04.11.2026 · Noah 03.11. «H1 H2 H6 H7 H8 H9» (Thread «Sammeln: Geheimmenü-Ideen fürs Logo»), H1 «Kuhglocken bimmeln (Ton nur, wenn du ihn einschaltest)»; Ziel 5 «Alltag», Entscheid 26.10. «Bewegung überall sanft»

Baut auf der Zufallswahl `src/lib/logo/surprises.js` (H6) auf.

## Was ist neu
- Fünfmal schnell auf «PG» tippen kann jetzt zwei Kuhglocken schwingen lassen, mit «Bimmel, bammel, bimmel!» (etwa vier Sekunden).
- Der Ton kommt nur, wenn du ihn einschaltest: neuer Schalter «Kuhglocken» unter Ich › Darstellung › Bedienung, von Anfang an aus. Aus: nur das Bild, dazu eine Zeile, wo man den Ton einschaltet.
- Der Ton: zwei Glocken (eine tiefere, eine höhere) läuten abwechselnd und klingen leise aus, rund zwei Sekunden, leise wie der sanfte Ton von «Zeit zu essen». Gezeichnet mit dem Browser selbst, keine Tondatei.
- Mit «Bewegung reduzieren» hängen die Glocken still (der Ton richtet sich nur nach dem Schalter).

## Was fällt weg oder rutscht tiefer
- nichts. Die anderen Überraschungen kommen etwas seltener, weil die Glocken mitwählen.

## Selbst entschieden
- Die Überraschung kommt auch bei ausgeschaltetem Ton (als stummes Bild mit Hinweis), damit man sie finden und den Schalter entdecken kann. Der Ton selbst ist nie von allein an.
- In der Nachtruhe (22 bis 6 Uhr, solange «Nachtruhe» an ist) bleibt der Ton aus, auch mit Schalter.
- Neuer Schalter in `OPS` (`src/lib/bedienung.js`) mit Name, Text und Deutsch; der Test `bedienung.test.js` prüft beides.
- Keine neue Seite, deshalb keine Zeile in `docs/app-stand.md`; nicht im Funktionskatalog (wie das Velo: ein Geheimnis), verraten nur im «Neu»-Eintrag und im Schalter.
- Beim allerersten Fund (neues Logo, Idee 30) erscheint bei den Glocken die Zeile «Neues Logo gefunden» nicht; das Logo wechselt aber sichtbar.

## Entscheide (für decisions.md)
- keine neuen.

## Stand im Plan (roadmap.md / vorhaben.md)
- `vorhaben-liste.md`: H7 «online», H1 «gebaut (PR)».

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Auf Heute oben links fünfmal schnell auf «PG» tippen, mehrmals: manchmal schwingen zwei Glocken, ohne Ton, mit einer Zeile «Willst du es hören? …».
2. Ich › Darstellung › Bedienung: «Kuhglocken» einschalten, wieder tippen, bis die Glocken kommen: sie läuten (Handy nicht auf lautlos).
3. «Kuhglocken» wieder ausschalten: still.
