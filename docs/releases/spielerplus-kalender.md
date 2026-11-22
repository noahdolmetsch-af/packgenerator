# Spielerplus-Kalender

PR (Nummer folgt) · 06.11.2026 · Auftrag: Noah «1a 2a 3a 4a 5a» und «diesen ebenfalls (anderes Eishockey Team)» (Thread «Planen: Kalender abonnieren und Training anmelden»)

## Was ist neu
- Ich › Verbindungen hat die Karte «Spielerplus-Kalender»: den Kalender-Link eines Teams einfügen, «Testen und hinzufügen», dem Team einen Namen geben. Mehrere Teams gehen. Jedes Team lässt sich umbenennen, ausschalten, neu abrufen und entfernen (mit Rückgängig), und es wählt die Sportseite, auf der es erscheint (Vorgabe Eishockey).
- Die Termine stehen in Planen › Woche (eigene Farbe, Wort «Spielerplus», Teamname, «Anmelden ›»), auf Heute unter «Heute fällig» (nur Termine des Tages) und auf der Sportseite Eishockey (nächste 6 Termine, Knopf «In Spielerplus anmelden ›»).
- Die App holt die Termine beim Öffnen und beim Zurückkommen, höchstens alle 30 Minuten pro Team. Schlägt es fehl, bleiben die alten Termine und die Karte nennt den Grund.
- Neuer Server-Teil in `api/linkcheck.js` (POST `?a=spielerplus`, Vercel «packgen»; der Gratis-Plan erlaubt nur 12 Funktionen, darum keine eigene Datei; Logik in `api/_lib/spielerplus.js`): POST mit dem Link im Body, erlaubt nur `spielerplus.de/events/ics` mit beiden Schlüsseln (kein offener Proxy), folgt keiner Weiterleitung, speichert und loggt nichts, 8 s, höchstens 1,5 MB. Tageslimit 300.

## Was fällt weg oder rutscht tiefer
- nichts

## Selbst entschieden
- Der Link ist ein Gerätewert (`DEVICE_SETTINGS`, Frage 5a): nicht im Backup, nicht im Abgleich; auf Handy und Computer je einmal einfügen. Auf dem Bildschirm steht er verborgen (`••••••`).
- Anmelden aus der App ist nicht gebaut (keine offene Schnittstelle, Login über unseren Server abgelehnt): der Knopf öffnet die Seite des Termins in Spielerplus (steht eine Adresse im Kalender) sonst den Kalender dieses Tages, in einem neuen Tab.
- «Eishockey» statt «Tennis» (Noahs Antwort): jedes Team wählt seine Sportseite, Vorgabe Eishockey. Das Eishockey-Feld erscheint nur, wenn ein Team dort hängt oder noch gar keins eingerichtet ist (dann mit leerem Zustand und Sprung zu Verbindungen).
- Heute zeigt nur Termine des heutigen Tages (Kasten heisst «Heute fällig»); morgen und später stehen in der Woche und auf der Sportseite.
- Wiederkehrende Termine (RRULE) liest die App nicht; Spielerplus liefert nach Wissen der Planung einzelne Termine. Zeigt der erste echte Abruf etwas anderes, folgt ein kleiner PR.
- `parseIcs` liegt jetzt in `src/lib/icsparse.js` (icsio.js führt es weiter aus), damit der Start nicht den Kalender-Schreiber lädt; es liest zusätzlich die Zeile `URL:` eines Termins.
- Fertig-Regel: Seite (Katalog, Handbuch, So geht's), Absprung («Passt hier» bei Woche planen), Gut zu wissen (Planen), leerer Zustand (Sportseite), nächster Schritt («Als Nächstes: die Woche planen»), App-Stand (Verbindungen) sind alle dabei.

## Entscheide (für decisions.md)
- 06.11.2026: Spielerplus-Termine nur lesen, Anmeldung als Sprung zu Spielerplus; Link nur auf dem Gerät (Noah «1a 2a 3a 4a 5a»).

## Stand im Plan (roadmap.md / vorhaben.md)
- Planen: Kalender von aussen als Abo (Spielerplus) steht; weitere Abos (andere ICS-Quellen) wären derselbe Weg mit einer erweiterten Liste erlaubter Hosts.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Vercel «packgen» von Hand neu deployen (api/ geändert), dann Ich › Verbindungen › Spielerplus-Kalender öffnen.
2. Link des ersten Teams einfügen, einen Namen geben, «Testen und hinzufügen»: «Fertig: N Team-Termine gefunden».
3. Zweiten Link (anderes Team) genauso einfügen.
4. Planen › Woche: die Termine stehen mit «Spielerplus · Teamname · Anmelden ›»; ein Tipp öffnet Spielerplus.
5. Am Tag eines Trainings: Heute zeigt es unter «Heute fällig».
