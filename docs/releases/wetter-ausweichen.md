# Wetter-Ausweichen

PR #1045 · 07.11.2026 · Auftrag: Noah «1b 2a 3a» (Thread «Verbessern: Routing und Navigation»)

## Was ist neu
- Die Gewitter-Warnung der Live-Karte warnt jetzt auch vor Starkregen in den nächsten 2 Stunden («Starkregen möglich um km 40 ab 15:30»). Gewitter hat Vorrang. Die Option heisst «Gewitter- und Starkregen-Warnung» und ist wie bisher ausgeschaltet, bis du sie einschaltest.
- Unter der Zeile steht eine Karte «Nächstes Dach: Unterstand Waldrand, 1,2 km entfernt» mit «Dorthin planen» und «Jetzt nicht». «Dorthin planen» öffnet «Neu planen zu …» mit diesem Ort; geplant wird erst mit deinem Tipp auf «Planen». Nichts geschieht von selbst.
- Das Dach kommt aus den Stopps, die die Karte schon hat, und einer frischen Suche um dich herum (Unterstand, Hütte, Wartehalle, Bushaltestelle mit Dach, Bahnhof, Café, Laden; bis 3 km). Ohne Internet zählen nur die bekannten Stopps.
- Neu in `src/lib/live/unterstand.js` und `live-lib.js` (`rainAhead`, `skyAhead`), getestet in `tests/unterstand.test.js` und `tests/e2e/wetter-ausweichen.spec.js`.

## Was fällt weg oder rutscht tiefer
- nichts (der Schalter hat einen neuen Namen: «Gewitter-Warnung» → «Gewitter- und Starkregen-Warnung»).

## Selbst entschieden
- Starkregen = Wettercode «starker Regen» (65, 67, 82) oder ab 5 mm in einer Stunde (Annahme, in `HEAVY_RAIN_MM` änderbar).
- Der Umweg «um den Sturm herum» (Frage 2b) wird nicht gebaut; es gibt nur das Dach.
- Ein Café oder Laden zählt wie 500 m weiter weg, weil es geschlossen sein kann; Unterstand und Bahnhof zählen genau.
- Das Dach wird neu gesucht, wenn du dich mehr als 1,5 km bewegt hast; «Jetzt nicht» gilt, bis das Wetter vorbei ist.
- Keine neue Funktion im Sinn der Fertig-Regel (Erweiterung der Live-Karte), darum kein Eintrag in `features.js`; `docs/app-stand.md` nennt die Warnung in der Zeile «Live-Karte».

## Entscheide (für decisions.md)
- 07.11.2026: Wetter-Ausweichen mit Gewitter und Starkregen (1b), nächstes Dach als Vorschlag «Neu planen zu …» (2a), Karte mit Tipp, nie automatisch (3a).

## Stand im Plan (roadmap.md / vorhaben.md)
- Routing und Navigation: Wetter-Ausweichen gebaut; als Nächstes das Wege-Gedächtnis.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Live › «Optionen» › «Gewitter- und Starkregen-Warnung» einschalten, Fahrt starten.
2. Bei Gewitter oder Starkregen in den nächsten 2 Stunden: eine rote Zeile und darunter «Nächstes Dach …».
3. «Dorthin planen» öffnet «Neu planen zu …» mit dem Ort; «Jetzt nicht» blendet die Karte aus.
