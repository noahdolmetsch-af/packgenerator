# Nachtlicht auf der Live-Karte

PR (diese Änderung) · 03.11.2026 · Auftrag: Noah «b» (Paket D, Idee 20 «Licht in der Nacht»; Thread «Durchgehen: offene Fragen einzeln»); Ziel 5 «Alltag»

## Was ist neu
- Auf der Live-Karte (Vollansicht während einer Fahrt) wird nach Sonnenuntergang der Rand dunkler, und vor dir liegt ein warmer Lichtkegel wie von der Frontlampe (`src/lib/live/NightLight.svelte`, Rechnung in `nightlight.js`). Die Spitze des Kegels sitzt auf deiner Position, er zeigt, wohin du fährst (nach oben, wenn die Karte mit dir dreht; sonst in deine Fahrtrichtung).
- Es wird über eine halbe Stunde nach Sonnenuntergang stärker und vor Sonnenaufgang über die letzte halbe Stunde schwächer (Sonnenzeiten aus `lightLeft`, wie bei «Licht noch …» im Panel).
- Eigener Schalter in den Fahrt-Einstellungen: «Nachtlicht» (Standard: an). Nicht mit dem Stromsparen, nicht auf Datenseiten. Die Karte bleibt bedienbar (der Rand fängt keine Berührung ab), die Hinweise (Abbiegen, Warnungen) liegen darüber.

## Was fällt weg oder rutscht tiefer
- nichts. Am Tag sieht die Karte aus wie bisher; nachts ist sie dunkler (mit dem Schalter wieder hell).

## Selbst entschieden
- Standard an, weil es nur nachts wirkt und die Karte nicht verdeckt; mit eigenem Schalter, damit es abschaltbar bleibt.
- Der Kegel sitzt in der Mitte der Karte (dort liegt deine Position beim Folgen); wenn du die Karte wegschiebst, bleibt er mittig.
- Eine Animation gibt es nur im Einblenden und beim Drehen des Kegels; bei «Bewegung reduzieren» steht alles still (das Abdunkeln selbst bleibt).
- Zusammen mit dem Live-Navigation-Thread abgestimmt: Änderungen in `Live.svelte` klein und rein zusätzlich.
- `docs/app-stand.md` ist noch nicht auf `main` (PR #742 offen); die Zeile folgt nach dessen Merge.

## Entscheide (für decisions.md)
- keine neuen

## Stand im Plan (roadmap.md / vorhaben.md)
- Paket D «Laden, Leere und Wetter»: Idee 20 gebaut (alle fünf Ideen sind jetzt als eigene PRs offen: 14 #776, 19 #780, 15 #782, 10 #787).

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Abends nach Sonnenuntergang eine Fahrt starten (oder die Beispielfahrt unter Rennen öffnen): der Rand der Live-Karte ist dunkler, vor dir liegt ein warmer Lichtkegel.
2. Fahrt-Einstellungen › «Nachtlicht» ausschalten: die Karte ist wieder hell.
3. Am Tag: nichts Neues zu sehen.
