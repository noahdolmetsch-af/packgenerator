# Der Abgleich prüft sich selbst

PR folgt · 21.11.2026 · Auftrag: Noah «Abhaken zwischen Computer und Handy funktioniert nicht … keine Daten dürfen verloren gehen»

## Was ist neu
- **Server von vorn erkannt** (`src/lib/sync/engine.js`): Meldet der Server eine niedrigere Nummer, als dieses Gerät schon gesehen hat, ist sein Speicher geleert oder neu. Bisher fragte das Gerät danach nie mehr nach Neuem und sagte trotzdem jedes Mal «Fertig». Jetzt vergleicht es wie bei einer Kopplung alles neu (zuerst holen, dann alles Eigene senden). Im Test nachgestellt: vorher kam ein Haken vom Computer nie am Handy an.
- **Zähl-Probe nach jeder Runde**: Das Gerät zählt seine Einträge und fragt den Server (`step=status`, neues Feld `count`, ein Redis-Befehl, nur auf Nachfrage), wie viele er hat. Gleich viele heisst: nichts fehlt. Sonst sucht die App den Unterschied (`compare.js`) und ergänzt von selbst, nur hinzufügend: was dem Server fehlt, geht hin, was dem Gerät fehlt, kommt her. Gefragt wird nur, wenn sich in der Runde etwas bewegt hat oder die letzte Probe über 30 Minuten alt ist. Ein älterer Server ohne `count` stört nicht.
- **Anzeige** in Ich › Daten und Backup, unter der Zeile «Ein · zuletzt abgeglichen»: «Geprüft …: Dieses Gerät und der Server haben gleich viele Einträge (N)» oder der Unterschied, plus «Von selbst ergänzt …».

## Was fällt weg oder rutscht tiefer
- nichts

## Selbst entschieden
- Ergänzt wird nur hinzufügend (wie «Fehlendes ergänzen»): nichts wird gelöscht oder überschrieben. Auch keine Löschung eines anderen Geräts wird zurückgeholt.
- Eine Zähl-Probe, die einen Unterschied findet und nicht beheben kann (zum Beispiel Einträge einer neueren App-Version), versucht es erst nach 6 Stunden wieder oder wenn sich die Zahlen ändern, damit der Server nicht belastet wird.
- Anzeige nur dort, wo der Abgleich sonst auch steht; eine Anzeige ausserhalb (Heute, Kopfzeile) wartet auf Noahs Antwort.

## Entscheide (für decisions.md)
- keine neuen

## Stand im Plan (roadmap.md / vorhaben.md)
- Ziel «Eine App, die mich im Alltag unterstützt»: Verlässlichkeit der Daten. Weitere Absicherungen (Anzeige ausserhalb von Ich, Zwei-Geräte-Test auf der echten Seite, Warnung bei Nicht-Abgleich) stehen als Fragen bei Noah.

## Prüfschritte (nach dem Merge auf der echten Seite)
Der Server «packgen» wird nach dem Merge neu ausgeliefert (`api/sync.js` hat das neue Feld `count`).
1. Auf Computer und Handy: Ich › Daten und Backup › «Jetzt abgleichen».
2. Unter «Ein · zuletzt abgeglichen» steht «Geprüft …: … gleich viele Einträge» mit derselben Zahl auf beiden Geräten.
3. Am Computer auf Aktiv einen Haken setzen; am Handy Aktiv öffnen: der Haken ist nach wenigen Sekunden da.
