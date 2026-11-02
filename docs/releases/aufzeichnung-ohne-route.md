# Aufzeichnung ohne Route funktioniert

PR (diese Änderung) · 01.11.2026 · Fix-Release nach Noahs Fragerunde «1a 2a 3a 4a 5a» (Fehlerbild 1.11. ca. 20:40–21:13)

## Was ist neu
- Der Bildschirm bleibt während der Aufzeichnung an. Verliert das Handy die Sperre, holt die App sie wieder (sichtbar: sofort; abgelehnt: alle 20 s).
- Eine GPS-Lücke gilt nicht mehr als Stillstand. Davor zählte «kein Punkt seit 15 s» als Tempo 0, und nach einer Lücke kam «25 Min. gestanden» obwohl gefahren wurde.
- Ein Start ohne Route vergisst alte Routen (gemerktes GPX einer freien Fahrt, wenn es älter als 12 h ist; alter Weg zu einem Ziel, wenn er älter als 2 h ist).
- Ohne Route kommt die Distanz nur aus der eigenen Spur; weil eine alte Route nicht mehr hängen bleibt, zeigt «Distanz» keinen Ort einer fremden Route mehr.
- «Fahrt-Protokoll» im Panel der Live-Karte: GPS-Punkte, Lücken ab 60 s, Neustarts, App im Hintergrund, Bildschirmsperre, mit «Protokoll schicken».

## Was fällt weg oder rutscht tiefer
- nichts. Die Auto-Pause pausierte früher auch, wenn das GPS ausfiel; jetzt pausiert sie nur bei langsamen GPS-Punkten.

## Selbst entschieden
- Eine freie Fahrt hat keine eigene Nummer; darum gilt ein GPX von vor mehr als 12 h als alt. Ein eben geladenes GPX bleibt.
- Das Protokoll hat nur Zeiten und Zahlen, keine Orte und Namen.

## Entscheide (für decisions.md)
- «Aufzeichnung ohne Route» (Noah 1a–5a), siehe decisions.md.

## Stand im Plan (roadmap.md / vorhaben.md)
- Fix vor allem anderen (Noah 5a); die Live-Navigation (Schritt 6 Offline) wartet.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Live-Karte ohne Route starten und 10 Minuten fahren: Distanz und Zeit laufen, keine alte Route, kein «gestanden».
2. Panel › «Fahrt-Protokoll» öffnen und «Protokoll schicken» tippen.
