# Router-Sicherheitsnetz

PR # · 05.11.2026 · Auftrag: Noah «ok bauen» nach «1b 2a und b 3a 4a 5b» (Thread «Verbessern: Routing und Navigation»)

## Was ist neu
- Der Velo-Router (BRouter, brouter.de) hat ein **Zeitlimit von 15 Sekunden**. Vorher drehte die App bei Strecken, auf die der Server nicht antwortet (gemessen: Zürich bis Wien), endlos.
- **Ein zweiter Versuch** nach einem schnellen Fehler (keine Verbindung, 502, 504) nach 1,5 Sekunden. «Ausgelastet» (429, 503) und ein Zeitlimit werden nie wiederholt (faire Nutzung des freien Servers).
- **Kurzes Gedächtnis:** dieselbe Frage (gleiche Punkte, Profil, Weg) innerhalb von 10 Minuten wird ohne Server beantwortet, auch ohne Internet. Höchstens 30 Antworten.
- **Zu weit:** ein Teilstück über 200 km Luftlinie wird gar nicht erst gefragt (gemessen: 110 km gehen in 6 s, Wien nicht).
- **Klare Worte** für jeden Fehler an einer Stelle (`routerMsg` in `src/lib/reroute.js`): ausgelastet, kein Weg, zu weit, zu langsam, offline, keine Antwort. Umweg-Fenster, Live-Karte, Überraschungsrunde und Runde durch einen Ort sagen jetzt dasselbe.
- **Hinweistext zum Standort** (`RouterNote.svelte`): die App sagt, dass Standort und Ziel an brouter.de gehen und der Dienst solche Anfragen zwei Wochen aufbewahrt (laut seiner Datenschutzerklärung). Steht im Umweg-Fenster und bei beiden Runden.
- Die Überraschungsrunde fragt jetzt über dieselbe Tür (`askRouter`) wie der Umweg; vorher hatte sie eine eigene Kopie des Codes.

## Was fällt weg oder rutscht tiefer
- nichts. Der alte Text «Fragt einmal den kostenlosen Velo-Router (BRouter). Nichts sonst verlässt das Gerät.» wird durch den genaueren Hinweistext ersetzt.

## Selbst entschieden
- Zeitlimit 15 s (gemessen längste Antwort 6 s für 110 km). Grenze 200 km Luftlinie ist eine Annahme zwischen 110 km (geht) und 600 km (geht nicht); der Server hat dazwischen keine veröffentlichte Regel.
- Das Gedächtnis hilft vor allem beim Zurückgehen im Fenster «Wege zur Auswahl» und beim zweimaligen Antippen; ein bewegter Standort fragt nie zweimal dasselbe. Es ist klein gehalten und liegt nur im Arbeitsspeicher, nicht auf der Platte.
- Kein Router-Check beim Start der Fahrt in diesem PR (stand als Idee im Dokument): ein Check wäre eine zusätzliche Anfrage an den freien Server.
- Keine neue Funktion im Sinn der Fertig-Regel (kein Eintrag in `features.js`, keine neue Seite): die Texte stehen dort, wo die App den Router fragt.

## Entscheide (für decisions.md)
- 05.11.2026: Routing: Sicherheitsnetz zuerst, danach Reserve-Router (Valhalla, dann OSRM, nur nach Ausfall), «Wie fährst du?» mit MTB und Gravel, Belag und Schwierigkeit. Die Tourenvorschläge bauen ihre eigene BRouter-Schicht (Noah «5b»).

## Stand im Plan (roadmap.md / vorhaben.md)
- Routing und Navigation (Ziel «Eine App, die mich im Alltag unterstützt»): Schritt 1 von 4 gebaut; geplant sind Reserve-Router, Profile, Belag.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Live › «⋯ › Neu planen zu …»: unter der Liste steht, was der Router bekommt (brouter.de, zwei Wochen).
2. Internet ausschalten, «Planen» tippen: sofort «Offline: Ein neuer Weg braucht Internet».
3. Heute › «Überraschungsrunde»: derselbe Hinweis steht unter dem Knopf «Runde vorschlagen».
