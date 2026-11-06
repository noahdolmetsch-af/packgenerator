# Bereit zur Abfahrt? Vier Zeilen vor der Tour

PR (Touren 3a) · 05.11.2026 · Auftrag: Noah «3a» aus «Ideen für alle Bereiche» (Thread «Bauen: Touren 3a und 3b»)

## Was ist neu
- In Packen steht bei einer geplanten Tour unter dem Tourkopf die Karte «Bereit zur Abfahrt?». Zu ist sie nur eine Zeile mit vier kleinen Zeichen und dem Wort («Fast bereit»); ein Tipp klappt sie auf zu vier Zeilen: Gepackt (in Prozent), Wetter (passt die Vorhersage zur Liste?), Velo (was ist fällig oder offen?) und Geräte (wie viele sind geladen?).
- Jede Zeile hat ein Zeichen und ein Wort, nicht nur eine Farbe: grün «OK», gelb «Zu tun», rot «Bald dran», grau «Keine Daten».
- Eine offene Zeile ist antippbar: Gepackt und Wetter führen zum Packtag, Velo öffnet «Vor der Tour», Geräte öffnen die Ladeliste.
- Die Überschrift fasst zusammen: «Bereit», «Fast bereit» oder «Noch nicht bereit».
- Regeln und Tests: `src/lib/trip/ampel.js`, `tests/ampel.test.js`; Karte: `src/lib/trip/TourAmpel.svelte`.

## Was fällt weg oder rutscht tiefer
- Nichts. Die Karte kommt dazu; alle bisherigen Karten und «Vor der Tour» bleiben, wo sie waren.

## Selbst entschieden
- Die Karte ist am Anfang zu, damit die Packen-Seite nicht länger wird und «GPX-Route hinzufügen» im Handy-Wächter (heimat-Test, 2,5 Bildschirme) wieder rechtzeitig kommt. Offen war sie in den Bildern, die du freigegeben hast; die Zeilen sind dieselben, nur ein Tipp mehr. Wenn du sie lieber offen willst, sag es, dann bauen wir stattdessen die Seite darüber kürzer.
- Rot gibt es nur, wenn die Tour in höchstens zwei Tagen startet und weniger als 70 % gepackt sind; weiter weg bleibt es gelb, damit eine ferne Tour nicht schreit.
- Die Karte erscheint nur bei einer geplanten Tour, die noch nicht begonnen hat und schon etwas auf der Liste hat. Nach der Tour oder bei «Nicht fahren» ist sie weg.
- Keine Vorhersage = graue Zeile «Noch keine Vorhersage», nie rot.
- Das Velo zählt Fälliges aus der Velopflege und offene Aufgaben «Vor der Tour»; es heisst bewusst «nichts fällig», nicht «geprüft», weil die App keine Prüfung erzwingt.
- Ohne Velo (Wandern, Ski) fällt die Velozeile weg; ohne Ladeliste fällt die Geräte-Zeile weg.
- Keine eigene Funktionsseite: die Karte gehört zur Packliste (`docs/app-stand.md`, Zeile «Packliste» ergänzt). Ein Absprung-Eintrag und ein «Gut zu wissen»-Text folgen, wenn Noah die Karte behält.

## Entscheide (für decisions.md)
- 05.11.2026: Die Tour-Ampel ist nur eine Beobachtung und sperrt nie etwas.

## Stand im Plan (roadmap.md / vorhaben.md)
- Ideen für alle Bereiche, Touren 3a: gebaut. 3b (Rückblick in 30 Sekunden) folgt als eigener PR.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Öffne in Packen eine geplante Tour: unter dem Tourkopf steht «Bereit zur Abfahrt?» mit vier Zeichen. Tippe darauf: die Zeilen klappen auf.
2. Tippe auf eine gelbe Zeile, zum Beispiel «Gepackt 60 %»: du kommst zum Packtag.
3. Hake alles ab: die Zeile wird grün, die Überschrift heisst «Bereit».
