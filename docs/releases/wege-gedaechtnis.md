# Wege-Gedächtnis

PR (Nummer folgt) · 07.11.2026 · Auftrag: Noah «4a 5a» (Thread «Verbessern: Routing und Navigation»)

## Was ist neu
- Nach einer Fahrt zeigt «Deine Fahrt» die Fahrt in Stücken von etwa 3 km (bei langen Fahrten längere, höchstens 14), jedes mit Daumen hoch und Daumen runter, dazu die Form der Fahrt in den Farben der Markierungen. Nichts ist Pflicht; ein zweiter Tipp auf denselben Daumen nimmt die Markierung zurück. Fahrten unter 1,5 km haben nichts zu bewerten.
- Ein Stück mit Daumen runter wird gemieden, wenn die App einen neuen Weg plant («Neu planen zu …», auch der neue Weg zum Ziel, wenn du davon abkommst): BRouter bekommt Kreise von 50 m um das Stück (`nogos`, höchstens 60 pro Anfrage, nur Stücke bis 2 km neben dem geplanten Weg). Das Fenster sagt «1 Stück, das du als schlecht markiert hast, wird auf dem Weg gemieden». Findet der Router so keinen Weg, fragt die App nochmals ohne die Kreise.
- Ein Stück mit Daumen hoch zeigt nur ein Zeichen auf der Live-Karte (in der Mitte des Stücks, unter «Meine Punkte»), es ändert nichts am Planen.
- «Optionen › Gemerkte Wege» auf der Live-Karte listet alle Markierungen: umbenennen, Daumen ändern, löschen (fragt zuerst, mit Rückgängig).
- Neu in `src/lib/live/wegegedaechtnis.js`, `WayRating.svelte`, `WayMemory.svelte`; `reroute.js` (`brouterUrl` mit `nogos`, `planDetour` mit `avoid`). Getestet in `tests/wegegedaechtnis.test.js` und `tests/e2e/wege-gedaechtnis.spec.js`.

## Was fällt weg oder rutscht tiefer
- nichts

## Selbst entschieden
- Gespeichert wird in einer Zeile der Einstellungen (`pg-way-memory`), keine neue Tabelle, also keine Änderung am Dexie-Schema und am Backup-Format (die Zeile ist Teil der Einstellungen im Backup).
- Stücke von etwa 3 km, Kreise von 50 m alle etwa 100 m: das trifft die Strasse, ohne ein ganzes Quartier zu sperren. Zahlen sind Annahmen (`SECTION_KM`, `AVOID_RADIUS_M`).
- Die Reserve-Router (Valhalla, OSRM) kennen die Kreise nicht; antworten sie, wird nichts gemieden und das Fenster zählt es nicht.
- Das Zeichen für gute Stücke nutzt das Kartenzeichen «Aussicht», es gibt kein eigenes Daumen-Zeichen auf der Karte.
- Gemieden wird nur beim Planen von «Neu planen zu …» und beim neuen Weg zum Ziel, nicht bei der automatischen Rückkehr auf die Route, der Überraschungsrunde und der Runde durch einen Ort.
- Keine neue Funktion im Sinn der Fertig-Regel (Erweiterung von «Deine Fahrt», der Live-Karte und «Neu planen zu …»): kein Eintrag in `features.js`; `docs/app-stand.md` nennt es in der Zeile «Live-Karte».

## Entscheide (für decisions.md)
- 07.11.2026: Wege-Gedächtnis: Bewerten nach der Fahrt pro Stück (4a), schlechte beim Planen meiden mit BRouter-Kreisen, gute nur als Zeichen auf der Karte (5a).

## Stand im Plan (roadmap.md / vorhaben.md)
- Routing und Navigation: Wetter-Ausweichen und Wege-Gedächtnis gebaut; offen bleiben der Funkloch-Notausstieg (1b) und der Test der BRouter-Android-App (1c).

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Live › Fahrt starten, ein paar km fahren, beenden: in «Deine Fahrt» unter «Wie waren die Stücke?» einen Daumen tippen.
2. Live › Optionen › «Gemerkte Wege»: die Markierungen stehen da; eine umbenennen, eine löschen (fragt zuerst).
3. Neu planen zu …: bei einem Stück mit Daumen runter in der Nähe steht «… wird auf dem Weg gemieden».
