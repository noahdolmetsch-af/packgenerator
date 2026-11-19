# TrainingPeaks-Link: der Server kann ihn lesen

Auftrag: Noah «1a 2b 3a 4a 5b» (Thread «Bauen: TrainingPeaks-Plan und Zwift»), Schritt P1. Einzelfreigabe wegen `api/`.

## Was ist neu
- Der kleine Server (`api/linkcheck.js`, Weg `POST ?a=trainingpeaks`) kann den privaten Kalenderlink von TrainingPeaks lesen und gibt die Kalenderdatei an die App zurück. Der Browser darf das nicht selbst.
- Erlaubt ist nur `https://(www.)trainingpeaks.com/ical/<Schlüssel>.ics`. Alles andere wird abgelehnt, ohne dass der Server etwas abruft (kein offener Proxy).
- Der Link steht nur im Body (nie in der Adresse), es wird nichts gespeichert und nichts geloggt, kein Redirect, höchstens 8 Sekunden und 1,5 MB.
- Eigene Tagesgrenze `trainingpeaks` (300 Aufrufe), getrennt von Spielerplus.
- In der App ist noch nichts zu sehen: die Karte «TrainingPeaks-Plan» (Ich › Verbindungen) folgt als nächster PR (P2).

## Was fällt weg oder rutscht tiefer
- nichts

## Selbst entschieden
- Die genaue Form von Noahs echtem Link ist nicht geprüft. Die Prüfung ist so locker wie sicher: fester Host, Pfad `/ical/….ics`, Schlüssel aus Buchstaben, Zahlen, `-`, `_` (3 bis 128 Zeichen), ein angehängter Teil nach `?` bis 200 Zeichen. Passt der echte Link nicht, ist das ein kleiner Folge-PR.
- Kein neues Top-Level-File in `api/` (12-Funktionen-Grenze): der Weg läuft über `linkcheck.js`, der Code liegt in `api/_lib/trainingpeaks.js`.
- Kein Bild und keine News-Datei: nichts Sichtbares.

## Entscheide (für decisions.md)
- 19.11.2026: TrainingPeaks-Link direkt in der App über den Server, wie bei Spielerplus (Noah «2b»); Zwift über Strava (Noah «3a»).

## Stand im Plan (roadmap.md / vorhaben.md)
- TrainingPeaks-Plan und Zwift: P1 Server fertig, P2 Karte und geplante Einheiten, P3 Zwift/Indoor, P4 Plan gegen Fahrt folgen.

## Prüfschritte (nach dem Merge)
1. Vercel «packgen»: neuer Stand READY.
2. Kein Schritt in der App möglich, bis P2 online ist. Echter Test = Noahs erster Abruf mit dem eigenen Link in der App.
