# Weg zum Ziel: Reicht die Zeit?

Auftrag: Noah «2b» (Weg zum Ziel, 05.11.2026), Thread «Entwerfen Weg zum grossen Ziel»

## Was ist neu
- Unter dem Kopf eines Weges mit Starttag steht die Karte «Reicht die Zeit?»: ein Balken «Der Plan braucht X von Y Wochen» und eine Zeile «Y Wochen bis zum Start · der Plan braucht X · Z Wochen Luft».
- Drei Stufen: «Ja, die Zeit reicht.» (2 oder mehr Wochen Luft), «Es ist knapp, aber es geht.» (0 bis 1 Woche), «Die Zeit ist knapp bemessen.» (der Plan braucht mehr Wochen, als bis zum Start bleiben).
- Bei knapper Zeit schlägt die Karte einen späteren Starttag vor («Start Mo 14.06. setzen»); ein Tipp setzt ihn. Der Starttag bleibt im «…» des Weges jederzeit änderbar.
- `planWeeks(goal)` und `timeCheck(goal, today)` in `src/lib/weg/weg.js` (rein, getestet in `tests/weg.test.js`; `timeBuffer` gab es schon).

## Was fällt weg oder rutscht tiefer
- nichts

## Selbst entschieden
- Der Plan braucht so viele Wochen wie der früheste offene Schritt, der dem Starttag folgt (Abstand zum Start, aufgerundet). Erledigte Schritte und Schritte, die du auf einen eigenen Tag gelegt hast, zählen nicht.
- Die Karte erscheint nur bei einem Starttag, der noch nicht vorbei ist, und mit mindestens einem solchen Schritt. Sie ist eine Beobachtung und fragt nichts; es gibt kein «Nein danke».
- Die Karte zeigt immer die Stufe (auch «reicht»), damit man sieht, dass die App gerechnet hat.
- Daten: keine Änderung (nichts Neues gespeichert).
- «Gut zu wissen» entfällt (Seite ohne Karte «Was du hier tun kannst»).

## Entscheide (für decisions.md)
- keine neuen

## Stand im Plan (roadmap.md / vorhaben.md)
- Idee G, Zeitpuffer 2b: gebaut. Offen: Heute-Zeile (#1201).

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Touren › Weg zum Ziel, Weg mit Starttag in einigen Monaten: Karte «Reicht die Zeit?» sagt «Ja, die Zeit reicht.».
2. Im «…» den Starttag auf nächste Woche setzen: die Karte sagt «Die Zeit ist knapp bemessen.» und bietet einen späteren Starttag an. Tippen: «Es ist knapp, aber es geht.».
