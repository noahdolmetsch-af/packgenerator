# Nachttemperatur am Abend (Push)

PR · 06.11.2026 · Auftrag: Noah «1a und c 2a 3a 4a 5a» (Abend-Push später) und «push ja» (Thread «Planen: Nachttemperatur beim Wetter zeigen»)

Dritter von drei kleinen PRs. PR 1 (Karte auf der Wetterseite) und PR 2 (Zeile auf Heute) sind online. Die Orte-Liste (Noah «2a») folgt, sobald die Höhen-Karte (#924) auf `main` ist. Dieser PR fasst `api/` an: Einzelfreigabe, danach den Vercel-Server «packgen» prüfen.

## Was ist neu
- Eine Push-Nachricht jeden Abend um 19:00 für den Wohnort: «Heute Nacht bis 1 °C.» Dazu höchstens ein Wort: unter 0 °C «Frost möglich (unter 0 °C).», sonst bei 2° oder mehr Unterschied «2° wärmer als letzte Nacht.» bzw. «… kälter …».
- Eigener Schalter «Nachttemperatur am Abend» unter Ich › Push-Erinnerungen, ganz unten in der Liste. Standard aus (wie fast alle Schalter, Noah «2b» aus dem Push-Auftrag); braucht den Wohnort.
- Tippen auf die Nachricht öffnet die Wetterseite (Karte «Nachttemperatur»).
- Der Server rechnet die Nacht mit derselben Regel wie die App: tiefster Wert von 18 bis 8 Uhr, in ganzen Grad, mindestens 10 von 14 Stunden. `tests/push-night.test.js` hält beide gleich.

## Was fällt weg oder rutscht tiefer
- nichts. Die Liste der Push-Schalter hat einen Schalter mehr am Ende.

## Selbst entschieden
- Die Nachricht kommt jeden Abend, das ganze Jahr (Frost ist im Frühling und Herbst wichtig, im Sommer schaltet man sie einfach aus). Die nächsten 7 Abende werden vorgeplant, wie bei Glätte und Nebel.
- Ein Hinweis pro Nachricht, damit sie kurz bleibt: Frost geht vor der Veränderung zu letzter Nacht (wie die Zeile auf Heute).
- «Letzte Nacht» = die Nacht, die heute früh endete; so heisst sie auch in der App.
- Die Zeiten der Nacht liest der Server in der Ortszeit des Wohnorts (`timezone=auto`), der Versand um 19:00 folgt der Uhr des Handys.
- Das Limit von 20 Wetterprüfungen pro Handy auf dem Server steigt auf 40: Nebel (7) + Glätte (7) + Nacht (7) + Touren hätten das alte Limit überschritten und die Nacht wäre abgeschnitten worden.
- Neues in `api/_lib/push.js` und `api/push.js` (bestehende Dateien, keine neue unter `api/`): nach dem Merge den Vercel-Server «packgen» auf READY prüfen.
- Keine neue Funktion in `features.js` (gehört zu den Push-Erinnerungen), nur Suchwörter.

## Entscheide (für decisions.md)
- 06.11.2026: Nachttemperatur am Abend als Push mit Schalter, Standard aus (Noah «5a», «push ja»).

## Stand im Plan (roadmap.md / vorhaben.md)
- Wetter: Nachttemperatur als Push umgesetzt. Offen: Orte-Liste (nach #924).

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Ich › Push-Erinnerungen: ganz unten steht «Nachttemperatur am Abend», aus.
2. Einschalten, Seite neu laden: der Schalter bleibt an.
3. Am Abend um 19:00 kommt «Heute Nacht bis … °C.» (Push muss an sein, Wohnort gesetzt). Tipp auf die Nachricht öffnet das Wetter.
