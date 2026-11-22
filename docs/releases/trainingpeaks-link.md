# TrainingPeaks-Link: Weiterleitungen, klare Antwort, Kalender-Datei als Ausweg

Auftrag: Noah 21.11.2026 («Die Form passt, aber der Server meldet «TrainingPeaks liefert für diesen Link (nicht mehr) einen Kalender»»), Thread «Bauen: TrainingPeaks-Plan und Zwift». Nachbesserung zu P1/P2 (#1296, #1301). Das ist `api/`: Einzelfreigabe, danach Vercel «packgen» prüfen.

## Was ist neu
- Server (`api/_lib/trainingpeaks.js`): folgt Weiterleitungen von Hand, höchstens 3, nur auf https, nur auf Hosts von `trainingpeaks.com` (auch Unterdomänen), ohne Benutzer und ohne Port. Alles andere (anderer Host, http, Port, mehr als 3) wird nicht gefolgt: so bleibt es kein offener Proxy.
- Der Server unterscheidet jetzt: 401, 404, 410 `link_invalid` (der Link gilt nicht mehr); 403 `refused` (TrainingPeaks lässt den Server nicht herein); Weiterleitung woandershin `redirect_other`; mehr als 3 `redirect_loop`; sonstiger Fehler `page_error`. Jede Antwort trägt die Zahl (`status`), nie den Link oder den Schlüssel.
- Karte «TrainingPeaks-Plan» (Ich › Verbindungen): neue Meldungen, beim Testen mit «(Antwort 403)» dahinter; ein neuer Block «Geht der Link nicht? Kalender-Datei einlesen»: eine `.ics`-Datei vom Gerät wählen, sie wird wie der Link einmal gelesen (`importIcs` in `src/lib/trainingpeaks.js`), die Einheiten stehen mit «TP» in Training › Meine Woche.

## Was fällt weg oder rutscht tiefer
- nichts

## Selbst entschieden
- Die Datei wird einmal gelesen und nicht erneuert; ohne Link gibt es kein «Entfernen» der Einheiten als Ganzes (einzeln in Meine Woche löschen geht).
- Datei über 1,5 MB wird wie beim Server abgelehnt.
- Die Hilfe sagt «Öffne den Kalender-Link im Browser auf einem Computer: er lädt meist eine Datei .ics». Ob TrainingPeaks genau so antwortet, ist nicht geprüft (aus der Cloud erreichbar ist trainingpeaks.com nicht). Klappt das nicht, braucht es eine andere Anleitung.
- Der echte Schlüssel steht nirgends im Repo, in Tests, Logs oder Meldungen; Tests nutzen erfundene Links.

## Entscheide (für decisions.md)
- 21.11.2026: Weiterleitungen von trainingpeaks.com werden gefolgt (höchstens 3, nur https auf trainingpeaks.com); bei 403 bleibt die Datei als Ausweg (Noah, Thread-Meldung 21.11.).

## Stand im Plan (roadmap.md / vorhaben.md)
- TrainingPeaks-Plan und Zwift: P1 bis P4 online; dieser PR bessert den Abruf nach, bis Noahs echter Link geht.
