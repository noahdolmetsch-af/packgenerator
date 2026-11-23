# Dein Körper heute in einem Band (Schritt 2: Schritte, Draussen, Heute)

Auftrag: Noah «1-4a» (23.11.2026, Thread «Körper-Banner auf Heute bauen»)

## Was ist neu
- Schritte: der Wert von heute neben «gestern bis jetzt …» (die Stunden von gestern bis zur jetzigen Stunde, aus den 24 Stunden der Uhr, `stepsByNow` in `src/lib/home/body.js`); ohne Stunden steht «gestern ganz …». Ab 15 % Abstand ein kleiner Pfeil.
- Draussen: die Minuten von heute mit Balken gegen das Tagesziel, solange die Challenge «Draussen» läuft; sonst fehlt das Feld. Tipp (Computer) öffnet «Heute abhaken».
- Heute: die Stufe aus Form und Erholung (Ruhe, locker, normal, bereit), dieselbe Antwort wie auf der Seite «Form und Erholung». Die grosse Rechnung wird erst geladen, wenn Heute offen ist und Fitbit-Tage da sind (nicht beim Start). Tipp (Computer) öffnet Form und Erholung.
- Das Fenster «Details» (Handy) hat einen Ring für die Schritte.
- Handy: vier Felder pro Zeile, sieben Felder in zwei Zeilen.

## Was fällt weg oder rutscht tiefer
- nichts

## Selbst entschieden
- Die Karte «Draussen» (Minuten eintragen) bleibt wie sie ist; das Feld im Band zeigt nur den Stand.
- Fehlt die Stufe (zu wenig Daten) oder die Challenge, fehlt das Feld, es steht kein Strich.
- Am Handy öffnet ein Tipp auf das Band wie bisher das Fenster «Details»; Draussen und Heute haben dort keinen Ring.

## Entscheide (eigene Datei `docs/decisions/koerper-banner.md`)
- keine neuen (gilt: 23.11.2026, 1–4 a)

## Stand im Plan (roadmap.md / vorhaben.md)
- Körper-Banner: Schritt 2 von 3 gebaut.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Heute › «Dein Körper heute»: sieben Felder; unter den Schritten «gestern bis jetzt …».
2. Läuft deine Challenge «Draussen»: ein Feld «Draussen» mit Balken.
3. Das Feld «Heute» nennt die Stufe; am Computer öffnet ein Tipp darauf Form und Erholung.
